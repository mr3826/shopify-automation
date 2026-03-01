-- Shopify Automation System Database Schema
-- PostgreSQL 13+

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Orders table - stores normalized order data from Shopify
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    shopify_id BIGINT UNIQUE NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100),
    customer_last_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    financial_status VARCHAR(50),
    fulfillment_status VARCHAR(50),
    total_price NUMERIC(10,2) NOT NULL,
    subtotal_price NUMERIC(10,2),
    tax_price NUMERIC(10,2),
    shipping_price NUMERIC(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    tags TEXT[],
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Line Items table - stores individual items in each order
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    shopify_product_id BIGINT,
    shopify_variant_id BIGINT,
    sku VARCHAR(100) NOT NULL,
    product_title VARCHAR(255),
    variant_title VARCHAR(255),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    product_type VARCHAR(100),
    vendor VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table - master inventory across all channels
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_title VARCHAR(255),
    variant_title VARCHAR(255),
    shopify_product_id BIGINT,
    shopify_variant_id BIGINT,
    stock_quantity INT DEFAULT 0,
    reorder_point INT DEFAULT 10,
    max_stock INT DEFAULT 1000,
    cost_price NUMERIC(10,2),
    retail_price NUMERIC(10,2),
    weight DECIMAL(8,2),
    product_type VARCHAR(100),
    vendor VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    last_synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Multi-channel inventory levels
CREATE TABLE inventory_levels (
    id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- 'shopify', 'amazon', 'ebay'
    location_id VARCHAR(100),
    available INT DEFAULT 0,
    reserved INT DEFAULT 0,
    incoming INT DEFAULT 0,
    last_synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(inventory_id, channel, location_id)
);

-- Automation Logs table - tracks all automation executions
CREATE TABLE automation_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    scenario VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50), -- 'webhook', 'scheduled', 'manual'
    trigger_data JSONB,
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'warning', 'retry'
    message TEXT,
    error_details JSONB,
    execution_time_ms INT,
    retry_count INT DEFAULT 0,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fulfillment tracking table
CREATE TABLE fulfillments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    shopify_fulfillment_id BIGINT UNIQUE,
    tracking_company VARCHAR(100),
    tracking_number VARCHAR(100),
    tracking_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer support conversations
CREATE TABLE support_conversations (
    id SERIAL PRIMARY KEY,
    conversation_uuid UUID DEFAULT uuid_generate_v4(),
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    session_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'escalated'
    ai_confidence_score DECIMAL(3,2),
    escalated_to_human BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Support messages within conversations
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES support_conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- 'user', 'bot', 'human'
    content TEXT NOT NULL,
    metadata JSONB, -- stores AI confidence, response time, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Email tracking
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'order_confirmation', 'shipping_update', 'follow_up'
    template_name VARCHAR(100),
    subject VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
    provider VARCHAR(50), -- 'sendgrid', 'mailgun'
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

-- System health and metrics
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_orders_shopify_id ON orders(shopify_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_levels_inventory_id ON inventory_levels(inventory_id);
CREATE INDEX idx_inventory_levels_channel ON inventory_levels(channel);
CREATE INDEX idx_automation_logs_scenario ON automation_logs(scenario);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);
CREATE INDEX idx_automation_logs_created_at ON automation_logs(created_at);
CREATE INDEX idx_automation_logs_correlation_id ON automation_logs(correlation_id);
CREATE INDEX idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_tracking_number ON fulfillments(tracking_number);
CREATE INDEX idx_support_conversations_customer_email ON support_conversations(customer_email);
CREATE INDEX idx_support_conversations_status ON support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON support_messages(conversation_id);
CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_customer_email ON email_logs(customer_email);
CREATE INDEX idx_system_metrics_name_recorded ON system_metrics(metric_name, recorded_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_levels_updated_at BEFORE UPDATE ON inventory_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fulfillments_updated_at BEFORE UPDATE ON fulfillments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_conversations_updated_at BEFORE UPDATE ON support_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for order summary
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.shopify_id,
    o.order_number,
    o.customer_email,
    o.status,
    o.financial_status,
    o.fulfillment_status,
    o.total_price,
    o.created_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.id
GROUP BY o.id, o.shopify_id, o.order_number, o.customer_email, o.status, o.financial_status, o.fulfillment_status, o.total_price, o.created_at;

-- Create view for inventory summary
CREATE VIEW inventory_summary AS
SELECT 
    i.id,
    i.sku,
    i.product_name,
    i.stock_quantity,
    i.reorder_point,
    i.last_synced_at,
    COALESCE(SUM(il.available), 0) as total_available,
    COALESCE(SUM(il.reserved), 0) as total_reserved,
    CASE 
        WHEN i.stock_quantity <= i.reorder_point THEN 'low_stock'
        WHEN i.stock_quantity = 0 THEN 'out_of_stock'
        ELSE 'in_stock'
    END as stock_status
FROM inventory i
LEFT JOIN inventory_levels il ON i.id = il.inventory_id
GROUP BY i.id, i.sku, i.product_name, i.stock_quantity, i.reorder_point, i.last_synced_at;
