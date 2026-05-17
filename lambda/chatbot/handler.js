const { 
  Logger, 
  DatabaseHelper, 
  ErrorHandler, 
  Sanitizer, 
  ResponseHelper, 
  ApiClient,
  PerformanceMonitor,
  generateCorrelationId 
} = require('../shared/utils');

/**
 * AWS Lambda handler for ChatGPT-powered customer support chatbot
 * Handles customer queries via web interface and provides automated responses
 */

class ChatbotProcessor {
  constructor(correlationId) {
    this.logger = new Logger(correlationId);
    this.openaiClient = new OpenAIClient();
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Process customer chat message
   */
  async processMessage(conversationData) {
    const { sessionId, customerEmail, customerName, message, conversationId } = conversationData;
    
    this.logger.info('Processing chatbot message', { 
      sessionId, 
      customerEmail, 
      conversationId,
      messageLength: message?.length 
    });

    return await DatabaseHelper.transaction(async (client) => {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(client, conversationId, sessionId, customerEmail, customerName);
      
      // Store user message
      await this.storeMessage(client, conversation.id, 'user', message);
      
      // Get conversation history for context
      const history = await this.getConversationHistory(client, conversation.id);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(message, history, conversation);
      
      // Store AI response
      await this.storeMessage(client, conversation.id, 'bot', aiResponse.content, {
        confidence: aiResponse.confidence,
        responseTime: aiResponse.responseTime,
        model: aiResponse.model
      });
      
      // Check if escalation is needed
      const shouldEscalate = this.shouldEscalateToHuman(aiResponse, conversation);
      
      if (shouldEscalate) {
        await this.escalateToHuman(conversation, message, aiResponse);
      }

      this.logger.info('Chatbot response generated', {
        conversationId: conversation.id,
        confidence: aiResponse.confidence,
        escalated: shouldEscalate,
        responseTime: aiResponse.responseTime
      });

      return {
        conversationId: conversation.conversation_uuid,
        response: aiResponse.content,
        confidence: aiResponse.confidence,
        escalated: shouldEscalate,
        suggestions: aiResponse.suggestions
      };
    });
  }

  /**
   * Get or create conversation record
   */
  async getOrCreateConversation(client, conversationId, sessionId, customerEmail, customerName) {
    if (conversationId) {
      // Try to find existing conversation
      const result = await client.query(
        'SELECT * FROM support_conversations WHERE conversation_uuid = $1',
        [conversationId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    }

    // Create new conversation
    const insertQuery = `
      INSERT INTO support_conversations (customer_email, customer_name, session_id, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `;

    const values = [
      Sanitizer.sanitizeEmail(customerEmail),
      Sanitizer.sanitizeString(customerName),
      Sanitizer.sanitizeString(sessionId)
    ];

    const result = await client.query(insertQuery, values);
    return result.rows[0];
  }

  /**
   * Store message in conversation
   */
  async storeMessage(client, conversationId, messageType, content, metadata = null) {
    const query = `
      INSERT INTO support_messages (conversation_id, message_type, content, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `;

    const values = [
      conversationId,
      messageType,
      Sanitizer.sanitizeString(content, 2000),
      metadata ? JSON.stringify(metadata) : null
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(client, conversationId, limit = 10) {
    const query = `
      SELECT message_type, content, created_at
      FROM support_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `;

    const result = await client.query(query, [conversationId, limit]);
    return result.rows;
  }

  /**
   * Generate AI response using OpenAI
   */
  async generateAIResponse(message, history, conversation) {
    const startTime = Date.now();
    
    try {
      // Build conversation context for OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...history.map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Call OpenAI API
      const response = await this.openaiClient.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const aiContent = response.choices[0].message.content;
      const responseTime = Date.now() - startTime;
      
      // Calculate confidence based on response characteristics
      const confidence = this.calculateConfidence(aiContent, response, responseTime);

      // Extract suggestions if any
      const suggestions = this.extractSuggestions(aiContent);

      return {
        content: aiContent,
        confidence,
        responseTime,
        model: response.model,
        suggestions
      };

    } catch (error) {
      this.logger.error('OpenAI API error', { error: error.message });
      
      return {
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team directly.',
        confidence: 0.1,
        responseTime: Date.now() - startTime,
        model: 'fallback',
        suggestions: ['Contact support team', 'Try again later']
      };
    }
  }

  /**
   * Build system prompt for ChatGPT
   */
  buildSystemPrompt() {
    return `You are a helpful customer support assistant for a Shopify store. Your role is to help customers with:

1. Order status and tracking information
2. Product information, availability, and specifications
3. Return and refund policies
4. Shipping and delivery questions
5. General store policies

Guidelines:
- Be friendly, professional, and concise
- If you don't know something, admit it and offer to connect the customer with a human agent
- For order status, ask for the order number or customer email
- For product questions, provide accurate information based on the catalog
- For complex issues or complaints, offer to escalate to a human agent
- Never make up information about orders or products
- Always maintain customer privacy and security

Available actions:
- Check order status (requires order number or email)
- Look up product information (requires product name or SKU)
- Process return requests (escalate to human)
- Handle shipping inquiries
- Answer policy questions

If a customer seems frustrated, upset, or has a complex issue that requires human intervention, politely offer to connect them with a human agent.`;
  }

  /**
   * Calculate confidence score for AI response
   */
  calculateConfidence(content, response, responseTime) {
    let confidence = 0.5; // Base confidence

    // Factor in response completion
    if (response.choices[0].finish_reason === 'stop') {
      confidence += 0.2;
    }

    // Factor in response time (faster is better up to a point)
    if (responseTime < 2000) {
      confidence += 0.1;
    } else if (responseTime > 5000) {
      confidence -= 0.1;
    }

    // Factor in content indicators
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('i don\'t know') || lowerContent.includes('i\'m not sure')) {
      confidence -= 0.3;
    }

    if (lowerContent.includes('let me connect you') || lowerContent.includes('human agent')) {
      confidence -= 0.2; // Escalation indicates lower confidence
    }

    if (lowerContent.includes('your order') || lowerContent.includes('order number')) {
      confidence += 0.1; // Specific order information
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract actionable suggestions from response
   */
  extractSuggestions(content) {
    const suggestions = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('order number')) {
      suggestions.push('Provide order number');
    }

    if (lowerContent.includes('email address')) {
      suggestions.push('Provide email address');
    }

    if (lowerContent.includes('human agent') || lowerContent.includes('connect you')) {
      suggestions.push('Connect with human agent');
    }

    if (lowerContent.includes('return') || lowerContent.includes('refund')) {
      suggestions.push('Start return process');
    }

    return suggestions;
  }

  /**
   * Determine if escalation to human is needed
   */
  shouldEscalateToHuman(aiResponse, conversation) {
    // Escalate if confidence is low
    if (aiResponse.confidence < 0.6) {
      return true;
    }

    // Escalate if already escalated before
    if (conversation.escalated_to_human) {
      return true;
    }

    // Escalate if conversation has many messages (indicates complexity)
    if (conversation.retry_count && conversation.retry_count > 3) {
      return true;
    }

    return false;
  }

  /**
   * Escalate conversation to human agent
   */
  async escalateToHuman(conversation, userMessage, aiResponse) {
    // Update conversation status
    await DatabaseHelper.query(
      'UPDATE support_conversations SET escalated_to_human = true, escalated_at = NOW(), status = $1 WHERE id = $2',
      ['escalated', conversation.id]
    );

    // Send notification to Slack
    await this.sendEscalationNotification(conversation, userMessage, aiResponse);
  }

  /**
   * Send escalation notification to Slack
   */
  async sendEscalationNotification(conversation, userMessage, aiResponse) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL not configured, skipping escalation notification');
      return;
    }

    const notification = {
      text: '🤖 Chatbot Escalation Required',
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Customer', value: `${conversation.customer_name} (${conversation.customer_email})`, short: true },
          { title: 'Session ID', value: conversation.session_id, short: true },
          { title: 'AI Confidence', value: (aiResponse.confidence * 100).toFixed(1) + '%', short: true },
          { title: 'Response Time', value: aiResponse.responseTime + 'ms', short: true }
        ],
        text: `*Customer Message:* ${userMessage}`,
        actions: [{
          type: 'button',
          text: 'Take Over Conversation',
          url: `${process.env.DASHBOARD_URL}/support/${conversation.conversation_uuid}`
        }]
      }]
    };

    try {
      // Use shared ApiClient retry/timeout behavior via a small wrapper
      const webhookClient = new ApiClient({ timeout: 5000, retries: 2, headers: { 'Content-Type': 'application/json' } });
      await webhookClient.makeRequest(slackWebhookUrl, {
        method: 'POST',
        body: JSON.stringify(notification),
        headers: { 'Content-Type': 'application/json' }
      });

      this.logger.info('Escalation notification sent', { 
        conversationId: conversation.id,
        // Do not log raw customer email in success path to avoid PII leakage
        customerEmailHash: conversation.customer_email ? conversation.customer_email.replace(/(.{2}).+(@.+)/, "$1***$2") : null
      });
    } catch (notifyErr) {
      this.logger.warn('Failed to send escalation notification', { error: notifyErr.message });
    }
  }
}

/**
 * OpenAI API Client
 */
class OpenAIClient extends ApiClient {
  constructor() {
    super({
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!process.env.OPENAI_API_KEY) {
      // Fail fast - OpenAI key required for production
      console.warn('OPENAI_API_KEY not set. OpenAI calls will fail.');
    }
  }

  async createChatCompletion(params) {
    const url = 'https://api.openai.com/v1/chat/completions';
    return await this.makeRequest(url, {
      method: 'POST',
      headers: this.config.headers,
      body: JSON.stringify(params),
      timeout: this.config.timeout,
      retries: this.config.retries
    });
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  const correlationId = generateCorrelationId();
  const logger = new Logger(correlationId);
  
  try {
    logger.info('Chatbot lambda invoked', { 
      requestId: context.awsRequestId,
      httpMethod: event.httpMethod 
    });

    // Parse request body
    let requestBody;
    if (typeof event.body === 'string') {
      requestBody = JSON.parse(event.body);
    } else {
      requestBody = event.body;
    }

    const { sessionId, customerEmail, customerName, message, conversationId } = requestBody;

    // Validate required fields
    if (!message || !sessionId) {
      return ResponseHelper.error('Message and sessionId are required', 400);
    }

    const processor = new ChatbotProcessor(correlationId);
    
    const handlerStart = Date.now();
    const result = await PerformanceMonitor.measureAsync(
      () => processor.processMessage({
        sessionId,
        customerEmail,
        customerName,
        message,
        conversationId
      }),
      'chatbot_message_processing'
    );

    // Log successful automation
    const executionTimeMs = Date.now() - handlerStart;
    await DatabaseHelper.logAutomation(
      'chatbot',
      'webhook',
      { sessionId, conversationId, messageLength: message.length },
      'success',
      `Successfully processed chatbot message`,
      executionTimeMs,
      correlationId
    );

    logger.info('Chatbot message processed successfully', result);
    return ResponseHelper.success(result);

  } catch (error) {
    logger.error('Error processing chatbot message', { 
      error: error.message,
      stack: error.stack 
    });

    // Log failed automation
    try {
      await DatabaseHelper.logAutomation(
        'chatbot',
        'webhook',
        { error: error.message },
        'error',
        `Failed to process chatbot message: ${error.message}`,
        0,
        correlationId,
        ErrorHandler.classifyError(error)
      );
    } catch (logError) {
      logger.error('Failed to log automation error', { error: logError.message });
    }

    const errorResponse = ErrorHandler.createErrorResponse(error, correlationId);
    return ResponseHelper.error(
      errorResponse.error.message,
      errorResponse.error.type === 'validation' ? 400 : 500,
      errorResponse.error
    );
  }
};
