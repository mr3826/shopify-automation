const crypto = require('crypto');
const { Pool } = require('pg');

/**
 * Utility functions for Shopify Automation Lambda functions
 */

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Structured logger with correlation ID tracking
 */
class Logger {
  constructor(correlationId = null) {
    this.correlationId = correlationId || generateCorrelationId();
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      ...metadata
    };
    
    console.log(JSON.stringify(logEntry));
  }

  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  error(message, metadata = {}) {
    this.log('ERROR', message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }
}

/**
 * Generate unique correlation ID for request tracking
 */
function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate Shopify webhook using HMAC
 */
function validateShopifyWebhook(body, signature) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('SHOPIFY_WEBHOOK_SECRET environment variable not set');
  }

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

/**
 * Database helper functions
 */
class DatabaseHelper {
  static async query(text, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async logAutomation(scenario, triggerType, triggerData, status, message, executionTimeMs, correlationId, errorDetails = null) {
    const query = `
      INSERT INTO automation_logs (scenario, trigger_type, trigger_data, status, message, execution_time_ms, correlation_id, error_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, uuid, created_at
    `;
    
    const params = [scenario, triggerType, JSON.stringify(triggerData), status, message, executionTimeMs, correlationId, errorDetails ? JSON.stringify(errorDetails) : null];
    
    try {
      const result = await this.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Failed to log automation:', error);
      throw error;
    }
  }
}

/**
 * Error classification and handling
 */
class ErrorHandler {
  static classifyError(error) {
    if (error.code === '23505') return { type: 'duplicate', retryable: false };
    if (error.code === '23503') return { type: 'foreign_key', retryable: false };
    if (error.code === 'ECONNREFUSED') return { type: 'connection', retryable: true };
    if (error.code === 'ETIMEDOUT') return { type: 'timeout', retryable: true };
    if (error.message?.includes('rate limit')) return { type: 'rate_limit', retryable: true };
    if (error.message?.includes('validation')) return { type: 'validation', retryable: false };
    
    return { type: 'unknown', retryable: true };
  }

  static createErrorResponse(error, correlationId) {
    const classification = this.classifyError(error);
    
    return {
      error: {
        message: error.message,
        type: classification.type,
        retryable: classification.retryable,
        correlationId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Retry mechanism with exponential backoff
 */
class RetryHelper {
  static async executeWithRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const classification = ErrorHandler.classifyError(error);
        
        if (!classification.retryable || attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

/**
 * Input sanitization
 */
class Sanitizer {
  static sanitizeEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email.toLowerCase().trim() : null;
  }

  static sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return null;
    return str.trim().substring(0, maxLength);
  }

  static sanitizeNumber(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = parseFloat(num);
    return (!isNaN(parsed) && parsed >= min && parsed <= max) ? parsed : null;
  }

  static sanitizeJsonObject(obj) {
    try {
      return typeof obj === 'object' && obj !== null ? obj : null;
    } catch {
      return null;
    }
  }
}

/**
 * HTTP response helpers
 */
class ResponseHelper {
  static success(data = {}, statusCode = 200) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      },
      body: JSON.stringify(data)
    };
  }

  static error(message, statusCode = 500, errorDetails = null) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      },
      body: JSON.stringify({
        error: message,
        timestamp: new Date().toISOString(),
        ...(errorDetails && { details: errorDetails })
      })
    };
  }
}

/**
 * API client base class with rate limiting
 */
class ApiClient {
  constructor(baseConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      rateLimitDelay: 1000,
      ...baseConfig
    };
  }

  async makeRequest(url, options = {}) {
    const config = { ...this.config, ...options };
    
    return RetryHelper.executeWithRetry(async () => {
      const response = await fetch(url, {
        timeout: config.timeout,
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }, config.retries, config.rateLimitDelay);
  }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  static startTimer(label) {
    return {
      label,
      startTime: Date.now(),
      end: function() {
        const duration = Date.now() - this.startTime;
        return { label, duration, startTime: this.startTime };
      }
    };
  }

  static async measureAsync(fn, label) {
    const timer = this.startTimer(label);
    try {
      const result = await fn();
      const metrics = timer.end();
      console.log(JSON.stringify({
        type: 'performance',
        ...metrics,
        success: true
      }));
      return result;
    } catch (error) {
      const metrics = timer.end();
      console.log(JSON.stringify({
        type: 'performance',
        ...metrics,
        success: false,
        error: error.message
      }));
      throw error;
    }
  }
}

module.exports = {
  Logger,
  DatabaseHelper,
  ErrorHandler,
  RetryHelper,
  Sanitizer,
  ResponseHelper,
  ApiClient,
  PerformanceMonitor,
  generateCorrelationId,
  validateShopifyWebhook,
  pool
};
