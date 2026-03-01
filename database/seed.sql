-- Sample data for development and testing
-- Run this after schema.sql to populate with test data

-- Sample inventory items
INSERT INTO inventory (sku, product_name, product_title, variant_title, shopify_product_id, shopify_variant_id, stock_quantity, reorder_point, cost_price, retail_price, weight, product_type, vendor) VALUES
('TSHIRT-BLK-M', 'Classic Black T-Shirt', 'Classic T-Shirt', 'Medium', 1001, 2001, 150, 20, 8.50, 19.99, 0.25, 'Apparel', 'Premium Apparel Co.'),
('TSHIRT-BLK-L', 'Classic Black T-Shirt', 'Classic T-Shirt', 'Large', 1001, 2002, 120, 20, 8.50, 19.99, 0.25, 'Apparel', 'Premium Apparel Co.'),
('JEANS-BLU-32', 'Classic Blue Jeans', 'Classic Jeans', '32x32', 1002, 2003, 75, 15, 25.00, 59.99, 0.75, 'Apparel', 'Denim Masters'),
('JEANS-BLU-34', 'Classic Blue Jeans', 'Classic Jeans', '34x32', 1002, 2004, 60, 15, 25.00, 59.99, 0.75, 'Apparel', 'Denim Masters'),
('HOODIE-GRY-L', 'Grey Hoodie', 'Comfort Hoodie', 'Large', 1003, 2005, 45, 10, 22.00, 49.99, 0.65, 'Apparel', 'Cozy Wear'),
('SNEAKER-WHT-9', 'White Sneakers', 'Classic Sneakers', 'Size 9', 1004, 2006, 30, 8, 35.00, 89.99, 1.20, 'Footwear', 'Step Right'),
('SNEAKER-WHT-10', 'White Sneakers', 'Classic Sneakers', 'Size 10', 1004, 2007, 25, 8, 35.00, 89.99, 1.20, 'Footwear', 'Step Right'),
('WATCH-BLK-ONE', 'Black Smart Watch', 'Smart Watch Pro', 'One Size', 1005, 2008, 15, 5, 75.00, 199.99, 0.15, 'Electronics', 'TechTime'),
('BACKPACK-BLK-ONE', 'Black Backpack', 'Urban Backpack', 'One Size', 1006, 2009, 40, 10, 30.00, 79.99, 0.85, 'Accessories', 'City Gear'),
('WALLET-BRN-ONE', 'Brown Leather Wallet', 'Leather Wallet', 'One Size', 1007, 2010, 85, 20, 15.00, 39.99, 0.10, 'Accessories', 'Leather Goods');

-- Sample inventory levels across channels
INSERT INTO inventory_levels (inventory_id, channel, location_id, available, reserved, incoming) VALUES
-- Shopify levels
(1, 'shopify', 'primary', 150, 5, 20),
(2, 'shopify', 'primary', 120, 3, 15),
(3, 'shopify', 'primary', 75, 2, 10),
(4, 'shopify', 'primary', 60, 4, 8),
(5, 'shopify', 'primary', 45, 1, 12),
(6, 'shopify', 'primary', 30, 2, 5),
(7, 'shopify', 'primary', 25, 1, 7),
(8, 'shopify', 'primary', 15, 1, 3),
(9, 'shopify', 'primary', 40, 2, 10),
(10, 'shopify', 'primary', 85, 3, 15),

-- Amazon levels
(1, 'amazon', 'US-WEST', 80, 3, 15),
(2, 'amazon', 'US-WEST', 70, 2, 10),
(3, 'amazon', 'US-WEST', 50, 1, 8),
(4, 'amazon', 'US-WEST', 45, 2, 6),
(5, 'amazon', 'US-WEST', 30, 1, 10),

-- eBay levels
(6, 'ebay', 'US', 20, 1, 5),
(7, 'ebay', 'US', 18, 1, 4),
(8, 'ebay', 'US', 10, 0, 3),
(9, 'ebay', 'US', 25, 1, 8);

-- Sample orders
INSERT INTO orders (shopify_id, order_number, customer_email, customer_first_name, customer_last_name, status, financial_status, fulfillment_status, total_price, subtotal_price, tax_price, shipping_price, currency, shipping_address, billing_address, notes, tags) VALUES
(5001, '1001', 'john.doe@email.com', 'John', 'Doe', 'fulfilled', 'paid', 'fulfilled', 79.98, 73.98, 5.88, 0.00, 'USD', 
 '{"first_name":"John","last_name":"Doe","address1":"123 Main St","city":"New York","province":"NY","country":"US","zip":"10001","phone":"555-0123"}',
 '{"first_name":"John","last_name":"Doe","address1":"123 Main St","city":"New York","province":"NY","country":"US","zip":"10001","phone":"555-0123"}',
 'Gift wrap requested', ARRAY['new-customer', 'gift-wrap']),

(5002, '1002', 'jane.smith@email.com', 'Jane', 'Smith', 'processing', 'paid', 'unfulfilled', 159.98, 149.98, 12.00, 0.00, 'USD',
 '{"first_name":"Jane","last_name":"Smith","address1":"456 Oak Ave","city":"Los Angeles","province":"CA","country":"US","zip":"90001","phone":"555-0124"}',
 '{"first_name":"Jane","last_name":"Smith","address1":"456 Oak Ave","city":"Los Angeles","province":"CA","country":"US","zip":"90001","phone":"555-0124"}',
 'Express shipping requested', ARRAY['express-shipping']),

(5003, '1003', 'mike.wilson@email.com', 'Mike', 'Wilson', 'pending', 'pending', 'unfulfilled', 239.97, 219.97, 16.00, 4.00, 'USD',
 '{"first_name":"Mike","last_name":"Wilson","address1":"789 Pine St","city":"Chicago","province":"IL","country":"US","zip":"60007","phone":"555-0125"}',
 '{"first_name":"Mike","last_name":"Wilson","address1":"789 Pine St","city":"Chicago","province":"IL","country":"US","zip":"60007","phone":"555-0125"}',
 NULL, ARRAY['pending-payment']),

(5004, '1004', 'sarah.jones@email.com', 'Sarah', 'Jones', 'fulfilled', 'paid', 'fulfilled', 99.99, 89.99, 8.00, 2.00, 'USD',
 '{"first_name":"Sarah","last_name":"Jones","address1":"321 Elm St","city":"Houston","province":"TX","country":"US","zip":"77001","phone":"555-0126"}',
 '{"first_name":"Sarah","last_name":"Jones","address1":"321 Elm St","city":"Houston","province":"TX","country":"US","zip":"77001","phone":"555-0126"}',
 'Customer requested signature confirmation', ARRAY['signature-required']),

(5005, '1005', 'david.brown@email.com', 'David', 'Brown', 'processing', 'paid', 'partial', 299.97, 279.97, 20.00, 0.00, 'USD',
 '{"first_name":"David","last_name":"Brown","address1":"654 Maple Dr","city":"Phoenix","province":"AZ","country":"US","zip":"85001","phone":"555-0127"}',
 '{"first_name":"David","last_name":"Brown","address1":"654 Maple Dr","city":"Phoenix","province":"AZ","country":"US","zip":"85001","phone":"555-0127"}',
 'Split shipment requested', ARRAY['split-shipment']);

-- Sample order items
INSERT INTO order_items (order_id, shopify_product_id, shopify_variant_id, sku, product_title, variant_title, quantity, unit_price, total_price, product_type, vendor) VALUES
-- Order 1001 items
(1, 1001, 2001, 'TSHIRT-BLK-M', 'Classic T-Shirt', 'Medium', 2, 19.99, 39.98, 'Apparel', 'Premium Apparel Co.'),
(1, 1002, 2003, 'JEANS-BLU-32', 'Classic Jeans', '32x32', 1, 59.99, 59.99, 'Apparel', 'Denim Masters'),

-- Order 1002 items
(2, 1003, 2005, 'HOODIE-GRY-L', 'Comfort Hoodie', 'Large', 1, 49.99, 49.99, 'Apparel', 'Cozy Wear'),
(2, 1004, 2006, 'SNEAKER-WHT-9', 'Classic Sneakers', 'Size 9', 1, 89.99, 89.99, 'Footwear', 'Step Right'),

-- Order 1003 items
(3, 1005, 2008, 'WATCH-BLK-ONE', 'Smart Watch Pro', 'One Size', 1, 199.99, 199.99, 'Electronics', 'TechTime'),
(3, 1006, 2009, 'BACKPACK-BLK-ONE', 'Urban Backpack', 'One Size', 1, 79.99, 79.99, 'Accessories', 'City Gear'),

-- Order 1004 items
(4, 1007, 2010, 'WALLET-BRN-ONE', 'Leather Wallet', 'One Size', 1, 39.99, 39.99, 'Accessories', 'Leather Goods'),
(4, 1001, 2002, 'TSHIRT-BLK-L', 'Classic T-Shirt', 'Large', 1, 19.99, 19.99, 'Apparel', 'Premium Apparel Co.'),
(4, 1002, 2004, 'JEANS-BLU-34', 'Classic Jeans', '34x32', 1, 59.99, 59.99, 'Apparel', 'Denim Masters'),

-- Order 1005 items
(5, 1003, 2005, 'HOODIE-GRY-L', 'Comfort Hoodie', 'Large', 2, 49.99, 99.98, 'Apparel', 'Cozy Wear'),
(5, 1004, 2007, 'SNEAKER-WHT-10', 'Classic Sneakers', 'Size 10', 1, 89.99, 89.99, 'Footwear', 'Step Right'),
(5, 1005, 2008, 'WATCH-BLK-ONE', 'Smart Watch Pro', 'One Size', 1, 199.99, 199.99, 'Electronics', 'TechTime');

-- Sample fulfillments
INSERT INTO fulfillments (order_id, shopify_fulfillment_id, tracking_company, tracking_number, tracking_url, status, shipped_at) VALUES
(1, 9001, 'UPS', '1Z999AA10123456784', 'https://www.ups.com/track?tracknum=1Z999AA10123456784', 'delivered', '2024-01-15 10:30:00'),
(4, 9002, 'FedEx', '781478057841', 'https://www.fedex.com/fedextrack/?trknbr=781478057841', 'shipped', '2024-01-18 14:20:00');

-- Sample automation logs
INSERT INTO automation_logs (scenario, trigger_type, trigger_data, status, message, execution_time_ms, correlation_id) VALUES
('order-router', 'webhook', '{"shopify_id": 5001, "event": "orders/create"}', 'success', 'Order processed successfully', 1250, 'corr_001'),
('inventory-sync', 'webhook', '{"sku": "TSHIRT-BLK-M", "event": "inventory_levels/update"}', 'success', 'Inventory synced across all channels', 2100, 'corr_002'),
('email-automation', 'webhook', '{"order_id": 1, "type": "order_confirmation"}', 'success', 'Order confirmation email sent', 800, 'corr_003'),
('low-stock-alert', 'scheduled', '{"check_time": "2024-01-20 06:00:00"}', 'success', 'Low stock alerts sent for 2 items', 1500, 'corr_004'),
('chatbot', 'webhook', '{"conversation_id": "conv_001", "query": "order status"}', 'success', 'Customer query resolved by AI', 650, 'corr_005');

-- Sample support conversations
INSERT INTO support_conversations (customer_email, customer_name, session_id, status, ai_confidence_score, escalated_to_human) VALUES
('john.doe@email.com', 'John Doe', 'sess_001', 'resolved', 0.95, false),
('jane.smith@email.com', 'Jane Smith', 'sess_002', 'escalated', 0.65, true);

-- Sample support messages
INSERT INTO support_messages (conversation_id, message_type, content, metadata) VALUES
(1, 'user', 'What is the status of my order #1001?', '{"timestamp": "2024-01-20 10:15:00"}'),
(1, 'bot', 'Your order #1001 has been delivered! It was shipped via UPS with tracking number 1Z999AA10123456784 and delivered on January 15th at 10:30 AM.', '{"ai_confidence": 0.95, "response_time_ms": 450}'),
(2, 'user', 'I want to return my order #1002', '{"timestamp": "2024-01-20 11:30:00"}'),
(2, 'bot', 'I understand you want to return order #1002. Let me connect you with a human agent who can help process your return request.', '{"ai_confidence": 0.65, "response_time_ms": 320, "escalation_reason": "return_request"}'),
(2, 'human', 'Hi Jane! I can help you with your return. Order #1002 contains a hoodie and sneakers. What would you like to return and why?', '{"agent_name": "Sarah", "timestamp": "2024-01-20 11:32:00"}');

-- Sample email logs
INSERT INTO email_logs (order_id, customer_email, email_type, template_name, subject, status, provider, provider_message_id, sent_at, delivered_at, opened_at) VALUES
(1, 'john.doe@email.com', 'order_confirmation', 'order_confirmation_v1', 'Order Confirmation #1001', 'delivered', 'sendgrid', 'sg_001', '2024-01-14 15:30:00', '2024-01-14 15:31:00', '2024-01-14 16:45:00'),
(1, 'john.doe@email.com', 'shipping_update', 'shipping_update_v1', 'Your Order #1001 Has Shipped!', 'delivered', 'sendgrid', 'sg_002', '2024-01-15 10:35:00', '2024-01-15 10:36:00', '2024-01-15 12:20:00'),
(2, 'jane.smith@email.com', 'order_confirmation', 'order_confirmation_v1', 'Order Confirmation #1002', 'sent', 'sendgrid', 'sg_003', '2024-01-18 14:25:00', NULL, NULL);

-- Sample system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, tags) VALUES
('orders_processed_total', 1524, 'count', '{"period": "24h"}'),
('inventory_sync_success_rate', 99.2, 'percent', '{"period": "24h"}'),
('chatbot_resolution_rate', 89.5, 'percent', '{"period": "24h"}'),
('average_order_processing_time', 1.8, 'minutes', '{"period": "24h"}'),
('email_delivery_rate', 98.7, 'percent', '{"period": "24h"}'),
('webhook_processing_success_rate', 99.8, 'percent', '{"period": "24h"}'),
('database_connection_pool_usage', 45.2, 'percent', '{"period": "current"}'),
('lambda_function_invocations', 8456, 'count', '{"period": "24h", "function": "order-router"}'),
('low_stock_alerts_sent', 23, 'count', '{"period": "24h"}'),
('support_tickets_automatically_resolved', 67, 'count', '{"period": "24h"}');
