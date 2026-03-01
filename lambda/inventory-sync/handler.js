const { 
  Logger, 
  DatabaseHelper, 
  ErrorHandler, 
  RetryHelper, 
  Sanitizer, 
  ResponseHelper, 
  ApiClient,
  PerformanceMonitor,
  generateCorrelationId,
  validateShopifyWebhook 
} = require('../shared/utils');

/**
 * AWS Lambda handler for Shopify inventory webhooks
 * Syncs inventory across Shopify, Amazon, eBay, and internal systems
 */

class InventorySyncProcessor {
  constructor(correlationId) {
    this.logger = new Logger(correlationId);
    this.shopifyClient = new ShopifyApiClient();
    this.amazonClient = new AmazonApiClient();
    this.ebayClient = new EbayApiClient();
  }

  /**
   * Process inventory level update from Shopify
   */
  async processInventoryUpdate(inventoryData) {
    this.logger.info('Processing inventory update', { 
      inventoryItemId: inventoryData.inventory_item_id,
      locationId: inventoryData.location_id,
      available: inventoryData.available 
    });

    return await DatabaseHelper.transaction(async (client) => {
      // Get or create inventory record
      let inventoryRecord = await this.getOrCreateInventory(client, inventoryData);
      
      // Update inventory quantity
      await this.updateInventoryQuantity(client, inventoryRecord.id, inventoryData.available);
      
      // Sync to all channels
      const syncResults = await this.syncToAllChannels(inventoryRecord, inventoryData.available);
      
      // Check for low stock alerts
      await this.checkLowStockAlerts(inventoryRecord, inventoryData.available);

      this.logger.info('Inventory sync completed', {
        inventoryId: inventoryRecord.id,
        sku: inventoryRecord.sku,
        newQuantity: inventoryData.available,
        syncResults
      });

      return {
        inventoryId: inventoryRecord.id,
        sku: inventoryRecord.sku,
        quantity: inventoryData.available,
        syncResults
      };
    });
  }

  /**
   * Get existing inventory record or create new one
   */
  async getOrCreateInventory(client, inventoryData) {
    // Try to find existing record by Shopify inventory item ID
    let result = await client.query(
      'SELECT * FROM inventory WHERE shopify_variant_id = $1',
      [inventoryData.inventory_item_id]
    );

    if (result.rows.length === 0) {
      // Fetch product details from Shopify
      const productDetails = await this.shopifyClient.getInventoryItem(inventoryData.inventory_item_id);
      
      // Create new inventory record
      const insertQuery = `
        INSERT INTO inventory (
          sku, product_name, product_title, variant_title,
          shopify_product_id, shopify_variant_id, stock_quantity,
          cost_price, retail_price, weight, product_type, vendor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        Sanitizer.sanitizeString(productDetails.sku),
        Sanitizer.sanitizeString(productDetails.product_title),
        Sanitizer.sanitizeString(productDetails.product_title),
        Sanitizer.sanitizeString(productDetails.variant_title),
        productDetails.product_id,
        productDetails.variant_id,
        inventoryData.available,
        Sanitizer.sanitizeNumber(productDetails.cost),
        Sanitizer.sanitizeNumber(productDetails.price),
        Sanitizer.sanitizeNumber(productDetails.weight),
        Sanitizer.sanitizeString(productDetails.product_type),
        Sanitizer.sanitizeString(productDetails.vendor)
      ];

      result = await client.query(insertQuery, values);
    }

    return result.rows[0];
  }

  /**
   * Update inventory quantity in master table
   */
  async updateInventoryQuantity(client, inventoryId, newQuantity) {
    await client.query(
      'UPDATE inventory SET stock_quantity = $1, last_synced_at = NOW() WHERE id = $2',
      [newQuantity, inventoryId]
    );
  }

  /**
   * Sync inventory to all channels
   */
  async syncToAllChannels(inventoryRecord, quantity) {
    const syncResults = {};

    try {
      // Sync to Shopify (already done, but update other locations)
      syncResults.shopify = await this.syncToShopify(inventoryRecord, quantity);
    } catch (error) {
      this.logger.error('Failed to sync to Shopify', { error: error.message });
      syncResults.shopify = { success: false, error: error.message };
    }

    try {
      // Sync to Amazon
      syncResults.amazon = await this.syncToAmazon(inventoryRecord, quantity);
    } catch (error) {
      this.logger.error('Failed to sync to Amazon', { error: error.message });
      syncResults.amazon = { success: false, error: error.message };
    }

    try {
      // Sync to eBay
      syncResults.ebay = await this.syncToEbay(inventoryRecord, quantity);
    } catch (error) {
      this.logger.error('Failed to sync to eBay', { error: error.message });
      syncResults.ebay = { success: false, error: error.message };
    }

    return syncResults;
  }

  /**
   * Sync inventory to Shopify
   */
  async syncToShopify(inventoryRecord, quantity) {
    // Update inventory levels table
    await DatabaseHelper.query(`
      INSERT INTO inventory_levels (inventory_id, channel, location_id, available, last_synced_at)
      VALUES ($1, 'shopify', 'primary', $2, NOW())
      ON CONFLICT (inventory_id, channel, location_id)
      DO UPDATE SET available = $2, last_synced_at = NOW()
    `, [inventoryRecord.id, quantity]);

    return { success: true, quantity };
  }

  /**
   * Sync inventory to Amazon
   */
  async syncToAmazon(inventoryRecord, quantity) {
    if (!inventoryRecord.sku) {
      throw new Error('SKU required for Amazon sync');
    }

    const result = await this.amazonClient.updateInventory(inventoryRecord.sku, quantity);
    
    // Update inventory levels table
    await DatabaseHelper.query(`
      INSERT INTO inventory_levels (inventory_id, channel, location_id, available, last_synced_at)
      VALUES ($1, 'amazon', 'US-WEST', $2, NOW())
      ON CONFLICT (inventory_id, channel, location_id)
      DO UPDATE SET available = $2, last_synced_at = NOW()
    `, [inventoryRecord.id, quantity]);

    return { success: true, quantity, amazonResponse: result };
  }

  /**
   * Sync inventory to eBay
   */
  async syncToEbay(inventoryRecord, quantity) {
    if (!inventoryRecord.sku) {
      throw new Error('SKU required for eBay sync');
    }

    const result = await this.ebayClient.updateInventory(inventoryRecord.sku, quantity);
    
    // Update inventory levels table
    await DatabaseHelper.query(`
      INSERT INTO inventory_levels (inventory_id, channel, location_id, available, last_synced_at)
      VALUES ($1, 'ebay', 'US', $2, NOW())
      ON CONFLICT (inventory_id, channel, location_id)
      DO UPDATE SET available = $2, last_synced_at = NOW()
    `, [inventoryRecord.id, quantity]);

    return { success: true, quantity, ebayResponse: result };
  }

  /**
   * Check for low stock and send alerts
   */
  async checkLowStockAlerts(inventoryRecord, quantity) {
    if (quantity <= inventoryRecord.reorder_point) {
      await this.sendLowStockAlert(inventoryRecord, quantity);
    }
  }

  /**
   * Send low stock alert via Slack
   */
  async sendLowStockAlert(inventoryRecord, quantity) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
      return;
    }

    const alertMessage = {
      text: '🚨 Low Stock Alert',
      attachments: [{
        color: 'warning',
        fields: [
          { title: 'SKU', value: inventoryRecord.sku, short: true },
          { title: 'Product', value: inventoryRecord.product_name, short: true },
          { title: 'Current Stock', value: quantity.toString(), short: true },
          { title: 'Reorder Point', value: inventoryRecord.reorder_point.toString(), short: true },
          { title: 'Vendor', value: inventoryRecord.vendor || 'N/A', short: true }
        ],
        actions: [{
          type: 'button',
          text: 'View Inventory',
          url: `${process.env.DASHBOARD_URL}/inventory?sku=${inventoryRecord.sku}`
        }]
      }]
    };

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertMessage)
    });

    this.logger.info('Low stock alert sent', { 
      sku: inventoryRecord.sku, 
      quantity, 
      reorderPoint: inventoryRecord.reorder_point 
    });
  }
}

/**
 * Shopify API Client
 */
class ShopifyApiClient extends ApiClient {
  constructor() {
    super({
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_API_PASSWORD,
        'Content-Type': 'application/json'
      }
    });
  }

  async getInventoryItem(inventoryItemId) {
    const url = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10/inventory_items/${inventoryItemId}.json`;
    const response = await this.makeRequest(url);
    return response.inventory_item;
  }
}

/**
 * Amazon API Client (Mock implementation)
 */
class AmazonApiClient extends ApiClient {
  async updateInventory(sku, quantity) {
    // Mock Amazon API call
    this.logger.info('Mock: Updating Amazon inventory', { sku, quantity });
    return { sku, quantity, success: true };
  }
}

/**
 * eBay API Client (Mock implementation)
 */
class EbayApiClient extends ApiClient {
  async updateInventory(sku, quantity) {
    // Mock eBay API call
    this.logger.info('Mock: Updating eBay inventory', { sku, quantity });
    return { sku, quantity, success: true };
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  const correlationId = generateCorrelationId();
  const logger = new Logger(correlationId);
  
  try {
    logger.info('Inventory sync lambda invoked', { 
      requestId: context.awsRequestId 
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
    
    logger.info('Inventory webhook received', { 
      topic: shopifyTopic,
      inventoryItemId: webhookData.inventory_item_id 
    });

    const processor = new InventorySyncProcessor(correlationId);
    let result;

    // Process based on webhook topic
    switch (shopifyTopic) {
      case 'inventory_levels/update':
        result = await PerformanceMonitor.measureAsync(
          () => processor.processInventoryUpdate(webhookData),
          'inventory_sync_processing'
        );
        break;

      default:
        logger.warn('Unsupported webhook topic', { topic: shopifyTopic });
        return ResponseHelper.error(`Unsupported webhook topic: ${shopifyTopic}`, 400);
    }

    // Log successful automation
    await DatabaseHelper.logAutomation(
      'inventory-sync',
      'webhook',
      { topic: shopifyTopic, inventoryItemId: webhookData.inventory_item_id },
      'success',
      `Successfully processed ${shopifyTopic} webhook`,
      Date.now() - context.getRemainingTimeInMillis() + context.getRemainingTimeInMillis(),
      correlationId
    );

    logger.info('Inventory webhook processed successfully', result);
    return ResponseHelper.success(result);

  } catch (error) {
    logger.error('Error processing inventory webhook', { 
      error: error.message,
      stack: error.stack 
    });

    // Log failed automation
    try {
      await DatabaseHelper.logAutomation(
        'inventory-sync',
        'webhook',
        { error: error.message },
        'error',
        `Failed to process inventory webhook: ${error.message}`,
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
