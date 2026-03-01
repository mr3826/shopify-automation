const { 
  Logger, 
  DatabaseHelper, 
  ErrorHandler, 
  RetryHelper, 
  Sanitizer, 
  ResponseHelper, 
  PerformanceMonitor,
  generateCorrelationId,
  validateShopifyWebhook 
} = require('../shared/utils');

/**
 * AWS Lambda handler for Shopify order webhooks
 * Processes orders/create, orders/updated, and refunds/create events
 */

class OrderProcessor {
  constructor(correlationId) {
    this.logger = new Logger(correlationId);
  }

  /**
   * Process order creation webhook
   */
  async processOrderCreated(orderData) {
    this.logger.info('Processing order creation', { shopifyOrderId: orderData.id });

    return await DatabaseHelper.transaction(async (client) => {
      // Check for duplicate orders
      const existingOrder = await client.query(
        'SELECT id FROM orders WHERE shopify_id = $1',
        [orderData.id]
      );

      if (existingOrder.rows.length > 0) {
        this.logger.warn('Order already exists', { shopifyOrderId: orderData.id });
        throw new Error(`Order ${orderData.id} already exists`);
      }

      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          shopify_id, order_number, customer_email, customer_first_name, customer_last_name,
          status, financial_status, fulfillment_status, total_price, subtotal_price,
          tax_price, shipping_price, currency, shipping_address, billing_address,
          notes, tags, processed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
      `;

      const orderValues = [
        orderData.id,
        orderData.order_number || orderData.name,
        Sanitizer.sanitizeEmail(orderData.email),
        Sanitizer.sanitizeString(orderData.customer?.first_name),
        Sanitizer.sanitizeString(orderData.customer?.last_name),
        Sanitizer.sanitizeString(orderData.financial_status),
        Sanitizer.sanitizeString(orderData.financial_status),
        Sanitizer.sanitizeString(orderData.fulfillment_status),
        Sanitizer.sanitizeNumber(orderData.total_price),
        Sanitizer.sanitizeNumber(orderData.subtotal_price),
        Sanitizer.sanitizeNumber(orderData.total_tax),
        Sanitizer.sanitizeNumber(orderData.total_shipping_price_set?.shop_money?.amount),
        Sanitizer.sanitizeString(orderData.currency),
        Sanitizer.sanitizeJsonObject(orderData.shipping_address),
        Sanitizer.sanitizeJsonObject(orderData.billing_address),
        Sanitizer.sanitizeString(orderData.notes),
        orderData.tags ? orderData.tags.split(',').map(tag => tag.trim()) : [],
        orderData.processed_at ? new Date(orderData.processed_at) : null
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const orderId = orderResult.rows[0].id;

      // Insert order items
      if (orderData.line_items && orderData.line_items.length > 0) {
        for (const item of orderData.line_items) {
          const itemQuery = `
            INSERT INTO order_items (
              order_id, shopify_product_id, shopify_variant_id, sku, product_title,
              variant_title, quantity, unit_price, total_price, product_type, vendor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;

          const itemValues = [
            orderId,
            item.product_id,
            item.variant_id,
            Sanitizer.sanitizeString(item.sku),
            Sanitizer.sanitizeString(item.title),
            Sanitizer.sanitizeString(item.variant_title),
            Sanitizer.sanitizeNumber(item.quantity),
            Sanitizer.sanitizeNumber(item.price),
            Sanitizer.sanitizeNumber(item.total_discount || (item.price * item.quantity)),
            Sanitizer.sanitizeString(item.product_type),
            Sanitizer.sanitizeString(item.vendor)
          ];

          await client.query(itemQuery, itemValues);
        }
      }

      this.logger.info('Order processed successfully', { 
        orderId, 
        shopifyOrderId: orderData.id,
        itemCount: orderData.line_items?.length || 0 
      });

      return { orderId, shopifyOrderId: orderData.id };
    });
  }

  /**
   * Process order update webhook
   */
  async processOrderUpdated(orderData) {
    this.logger.info('Processing order update', { shopifyOrderId: orderData.id });

    const query = `
      UPDATE orders SET
        status = $1,
        financial_status = $2,
        fulfillment_status = $3,
        total_price = $4,
        notes = $5,
        tags = $6,
        updated_at = NOW()
      WHERE shopify_id = $7
      RETURNING id
    `;

    const values = [
      Sanitizer.sanitizeString(orderData.financial_status),
      Sanitizer.sanitizeString(orderData.financial_status),
      Sanitizer.sanitizeString(orderData.fulfillment_status),
      Sanitizer.sanitizeNumber(orderData.total_price),
      Sanitizer.sanitizeString(orderData.notes),
      orderData.tags ? orderData.tags.split(',').map(tag => tag.trim()) : [],
      orderData.id
    ];

    const result = await DatabaseHelper.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Order ${orderData.id} not found for update`);
    }

    this.logger.info('Order updated successfully', { 
      orderId: result.rows[0].id,
      shopifyOrderId: orderData.id 
    });

    return { orderId: result.rows[0].id, shopifyOrderId: orderData.id };
  }

  /**
   * Process refund creation webhook
   */
  async processRefundCreated(refundData) {
    this.logger.info('Processing refund creation', { 
      orderId: refundData.order_id,
      refundId: refundData.id 
    });

    // Update order status to reflect refund
    const query = `
      UPDATE orders SET
        status = 'refunded',
        updated_at = NOW()
      WHERE shopify_id = $1
      RETURNING id
    `;

    const result = await DatabaseHelper.query(query, [refundData.order_id]);

    if (result.rows.length === 0) {
      throw new Error(`Order ${refundData.order_id} not found for refund`);
    }

    this.logger.info('Refund processed successfully', { 
      orderId: result.rows[0].id,
      shopifyOrderId: refundData.order_id,
      refundId: refundData.id 
    });

    return { orderId: result.rows[0].id, shopifyOrderId: refundData.order_id };
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  const correlationId = generateCorrelationId();
  const logger = new Logger(correlationId);
  
  try {
    logger.info('Order router lambda invoked', { 
      requestId: context.awsRequestId,
      httpMethod: event.httpMethod,
      path: event.path
    });

    // Validate webhook signature
    const signature = event.headers['X-Shopify-Hmac-Sha256'] || event.headers['x-shopify-hmac-sha256'];
    if (!signature) {
      logger.error('Missing Shopify webhook signature');
      return ResponseHelper.error('Missing webhook signature', 401);
    }

    const body = event.body || '';
    if (!validateShopifyWebhook(body, signature)) {
      logger.error('Invalid webhook signature');
      return ResponseHelper.error('Invalid webhook signature', 401);
    }

    // Parse webhook data
    const webhookData = JSON.parse(body);
    const shopifyTopic = event.headers['X-Shopify-Topic'] || event.headers['x-shopify-topic'];
    
    logger.info('Webhook received', { 
      topic: shopifyTopic,
      shopifyId: webhookData.id 
    });

    const processor = new OrderProcessor(correlationId);
    let result;

    // Process based on webhook topic
    switch (shopifyTopic) {
      case 'orders/create':
        result = await PerformanceMonitor.measureAsync(
          () => processor.processOrderCreated(webhookData),
          'order_creation_processing'
        );
        break;

      case 'orders/updated':
        result = await PerformanceMonitor.measureAsync(
          () => processor.processOrderUpdated(webhookData),
          'order_update_processing'
        );
        break;

      case 'refunds/create':
        result = await PerformanceMonitor.measureAsync(
          () => processor.processRefundCreated(webhookData),
          'refund_creation_processing'
        );
        break;

      default:
        logger.warn('Unsupported webhook topic', { topic: shopifyTopic });
        return ResponseHelper.error(`Unsupported webhook topic: ${shopifyTopic}`, 400);
    }

    // Log successful automation
    await DatabaseHelper.logAutomation(
      'order-router',
      'webhook',
      { topic: shopifyTopic, shopifyId: webhookData.id },
      'success',
      `Successfully processed ${shopifyTopic} webhook`,
      Date.now() - context.getRemainingTimeInMillis() + context.getRemainingTimeInMillis(),
      correlationId
    );

    logger.info('Webhook processed successfully', result);
    return ResponseHelper.success(result);

  } catch (error) {
    logger.error('Error processing webhook', { 
      error: error.message,
      stack: error.stack 
    });

    // Log failed automation
    try {
      await DatabaseHelper.logAutomation(
        'order-router',
        'webhook',
        { error: error.message },
        'error',
        `Failed to process webhook: ${error.message}`,
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
