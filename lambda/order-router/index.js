const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });
const crypto = require('crypto');

exports.handler = async (event) => {
    console.log('Received webhook:', JSON.stringify(event, null, 2));
    
    try {
        // Basic webhook validation (simplified for demo)
        const shopifySignature = event.headers['X-Shopify-Hmac-Sha256'];
        const body = event.body;
        
        // For demo purposes, we'll skip HMAC validation
        // In production, you'd validate: crypto.createHmac('sha256', webhookSecret).update(body).digest('base64')
        
        let orderData;
        try {
            orderData = JSON.parse(body);
        } catch (error) {
            console.error('Invalid JSON in webhook body');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid JSON' })
            };
        }
        
        // Extract order information
        const orderId = orderData.id?.toString() || `order_${Date.now()}`;
        const orderNumber = orderData.order_number || `#${Math.floor(Math.random() * 10000)}`;
        const customerEmail = orderData.email || 'demo@example.com';
        const totalPrice = orderData.total_price || '0.00';
        const currency = orderData.currency || 'USD';
        const status = orderData.financial_status || 'pending';
        const createdAt = orderData.created_at || new Date().toISOString();
        
        // Store order in DynamoDB
        const orderItem = {
            orderId: orderId,
            orderNumber: orderNumber.toString(),
            customerEmail: customerEmail,
            totalPrice: parseFloat(totalPrice),
            currency: currency,
            status: status,
            createdAt: createdAt,
            processedAt: new Date().toISOString(),
            itemCount: orderData.line_items?.length || 1,
            customerName: orderData.customer?.first_name && orderData.customer?.last_name 
                ? `${orderData.customer.first_name} ${orderData.customer.last_name}`
                : 'Demo Customer'
        };
        
        const params = {
            TableName: 'shopify_orders',
            Item: orderItem
        };
        
        await dynamoDb.put(params).promise();
        
        // Add activity log
        const activityParams = {
            TableName: 'shopify_activity',
            Item: {
                activityId: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'order_received',
                message: `Order ${orderNumber} received from ${customerEmail}`,
                details: {
                    orderNumber: orderNumber,
                    customerEmail: customerEmail,
                    amount: `${currency} ${totalPrice}`
                },
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
            }
        };
        
        await dynamoDb.put(activityParams).promise();
        
        console.log(`Order ${orderNumber} processed successfully`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                orderId: orderId,
                orderNumber: orderNumber,
                message: 'Order processed successfully'
            })
        };
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
