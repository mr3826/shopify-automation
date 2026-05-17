const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const secretsManager = require('./config/secrets');
const { supabase } = require('./config/database');

// Import middleware
const { authenticateToken, authorizeRole, login, verifyToken } = require('./middleware/auth');
const { generalLimiter, strictLimiter, orderLimiter, dashboardLimiter, webhookLimiter } = require('./middleware/rateLimit');
const { 
  validateLogin, 
  validateOrderCreation, 
  validateOrderStatusUpdate, 
  validateOrderQuery,
  validateCustomer,
  validateProduct,
  validateInventoryUpdate,
  validateAnalyticsQuery
} = require('./middleware/validation');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Initialize Supabase (replacing DynamoDB)
// const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
// const dynamoDb = DynamoDBDocumentClient.from(dynamoClient);

// Mock data generators
const generateMockStats = () => ({
  totalOrders: 1247,
  revenue: 48756.89,
  totalCustomers: 892,
  conversionRate: 3.2,
  ordersToday: 23,
  revenueToday: 1234.56,
  avgOrderValue: 39.12,
  topProducts: [
    { name: 'Premium Widget', sales: 234, revenue: 9360 },
    { name: 'Standard Gadget', sales: 189, revenue: 5670 },
    { name: 'Deluxe Doohickey', sales: 156, revenue: 7800 }
  ]
});

const generateMockOrdersChart = () => [
  { date: '2024-02-20', orders: 45 },
  { date: '2024-02-21', orders: 52 },
  { date: '2024-02-22', orders: 38 },
  { date: '2024-02-23', orders: 61 },
  { date: '2024-02-24', orders: 47 },
  { date: '2024-02-25', orders: 55 },
  { date: '2024-02-26', orders: 43 }
];

const generateMockSystemHealth = () => ({
  services: [
    { name: 'Order Router', status: 'healthy', responseTime: 45 },
    { name: 'Inventory Sync', status: 'healthy', responseTime: 78 },
    { name: 'Chatbot API', status: 'healthy', responseTime: 23 },
    { name: 'Database', status: 'healthy', responseTime: 12 },
    { name: 'Email Service', status: 'warning', responseTime: 156 }
  ],
  lastCheck: new Date().toISOString()
});

const generateMockRecentOrders = () => [
  {
    id: 'ORD-001',
    orderNumber: '#1001',
    customerEmail: 'john@example.com',
    customerName: 'John Doe',
    total: 89.99,
    status: 'processing',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'ORD-002',
    orderNumber: '#1002',
    customerEmail: 'jane@example.com',
    customerName: 'Jane Smith',
    total: 124.50,
    status: 'shipped',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'ORD-003',
    orderNumber: '#1003',
    customerEmail: 'bob@example.com',
    customerName: 'Bob Johnson',
    total: 45.00,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  }
];

const generateMockSystemMetrics = () => [
  { time: '00:00', cpu: 25, memory: 45, database: 12, responseTime: 45 },
  { time: '04:00', cpu: 18, memory: 42, database: 8, responseTime: 38 },
  { time: '08:00', cpu: 65, memory: 68, database: 35, responseTime: 78 },
  { time: '12:00', cpu: 78, memory: 72, database: 45, responseTime: 95 },
  { time: '16:00', cpu: 52, memory: 58, database: 28, responseTime: 62 },
  { time: '20:00', cpu: 35, memory: 48, database: 18, responseTime: 48 }
];

const generateMockSupportConversations = () => [
  {
    id: 'conv-001',
    customerName: 'Alice Wilson',
    customerEmail: 'alice@example.com',
    status: 'active',
    lastMessage: 'Where is my order #1001?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    priority: 'high'
  },
  {
    id: 'conv-002',
    customerName: 'Bob Martinez',
    customerEmail: 'bob@example.com',
    status: 'waiting',
    lastMessage: 'I need to return an item',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    priority: 'medium'
  }
];

const generateMockInventory = () => ({
  products: [
    { id: 'prod-001', name: 'Premium Widget', sku: 'PW-001', stock: 45, price: 39.99, lowStockThreshold: 10 },
    { id: 'prod-002', name: 'Standard Gadget', sku: 'SG-002', stock: 8, price: 24.99, lowStockThreshold: 10 },
    { id: 'prod-003', name: 'Deluxe Doohickey', sku: 'DD-003', stock: 67, price: 54.99, lowStockThreshold: 15 },
    { id: 'prod-004', name: 'Basic Widget', sku: 'BW-004', stock: 3, price: 14.99, lowStockThreshold: 10 },
    { id: 'prod-005', name: 'Pro Gadget', sku: 'PG-005', stock: 23, price: 89.99, lowStockThreshold: 20 }
  ],
  lowStock: [
    { id: 'prod-002', name: 'Standard Gadget', sku: 'SG-002', stock: 8, lowStockThreshold: 10 },
    { id: 'prod-004', name: 'Basic Widget', sku: 'BW-004', stock: 3, lowStockThreshold: 10 }
  ]
});

const generateMockAnalytics = (range = '7d') => ({
  chartData: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    orders: [45, 52, 38, 61, 47, 55, 43],
    revenue: [2340, 2890, 1876, 3567, 2456, 3234, 2543]
  },
  topProducts: [
    { name: 'Premium Widget', sales: 234, revenue: 9360 },
    { name: 'Standard Gadget', sales: 189, revenue: 5670 },
    { name: 'Deluxe Doohickey', sales: 156, revenue: 7800 }
  ],
  growthRate: 12.5,
  newCustomers: 47,
  avgOrderValue: 67.89,
  retentionRate: 78.3
});

const generateMockAutomationLogs = () => [
  {
    id: uuidv4(),
    scenario: 'order_processing',
    status: 'success',
    message: 'Order #1001 processed successfully',
    executionTimeMs: 234,
    correlationId: 'corr-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: uuidv4(),
    scenario: 'inventory_sync',
    status: 'warning',
    message: 'Inventory sync completed with 2 warnings',
    executionTimeMs: 567,
    correlationId: 'corr-002',
    retryCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: uuidv4(),
    scenario: 'email_notification',
    status: 'error',
    message: 'Failed to send shipping confirmation email',
    executionTimeMs: 1234,
    correlationId: 'corr-003',
    retryCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];

// API Routes

// Public routes (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes
app.post('/api/auth/login', strictLimiter, validateLogin, login);
app.get('/api/auth/verify', authenticateToken, verifyToken);

// Protected dashboard routes
app.get('/api/dashboard/stats', authenticateToken, dashboardLimiter, async (req, res) => {
  try {
    // Get real data from Supabase
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*');

    const { count: totalOrders, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError || inventoryError || countError) {
      console.error('Supabase error:', ordersError || inventoryError || countError);
      return res.json(generateMockStats());
    }

    // Calculate real stats
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
    const uniqueCustomers = new Set(orders?.map(order => order.customer_email)).size;
    const lowStockItems = inventory?.filter(item => item.stock_quantity < item.reorder_point).length || 0;

    const realStats = {
      totalOrders: totalOrders || 0,
      revenue: totalRevenue,
      totalCustomers: uniqueCustomers,
      conversionRate: uniqueCustomers > 0 ? ((totalOrders || 0) / uniqueCustomers * 100).toFixed(1) : 0,
      ordersToday: orders?.filter(order => {
        const today = new Date().toDateString();
        return new Date(order.created_at).toDateString() === today;
      }).length || 0,
      revenueToday: orders?.filter(order => {
        const today = new Date().toDateString();
        return new Date(order.created_at).toDateString() === today;
      }).reduce((sum, order) => sum + (order.total_price || 0), 0) || 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      lowStockAlerts: lowStockItems,
      recentActivity: orders || []
    };

    res.json(realStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json(generateMockStats());
  }
});

app.get('/api/dashboard/orders-chart', authenticateToken, dashboardLimiter, (req, res) => {
  const timeRange = req.query.range || '7d';
  res.json(generateMockOrdersChart());
});

app.get('/api/dashboard/system-health', authenticateToken, dashboardLimiter, (req, res) => {
  res.json(generateMockSystemHealth());
});

app.get('/api/dashboard/recent-orders', authenticateToken, dashboardLimiter, validateOrderQuery, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const orders = generateMockRecentOrders().slice(0, limit);
  res.json(orders);
});

// Order management routes
app.get('/api/orders', authenticateToken, dashboardLimiter, validateOrderQuery, async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 25 } = req.query;
    
    // Try to get real data from DynamoDB
    const params = {
      TableName: 'shopify_orders',
      Limit: parseInt(limit)
    };
    
    const result = await dynamoDb.scan(params).promise();
    
    // Return real data or mock data
    if (result.Items && result.Items.length > 0) {
      res.json({
        orders: result.Items,
        total: result.Count || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } else {
      const mockOrders = generateMockRecentOrders();
      res.json({
        orders: mockOrders,
        total: mockOrders.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    const mockOrders = generateMockRecentOrders();
    res.json({
      orders: mockOrders,
      total: mockOrders.length,
      page: 1,
      limit: 25
    });
  }
});

// Support conversations (admin only)
app.get('/api/support/conversations', authenticateToken, authorizeRole(['admin']), dashboardLimiter, (req, res) => {
  const { status = '', search = '' } = req.query;
  let conversations = generateMockSupportConversations();
  
  if (status) {
    conversations = conversations.filter(conv => conv.status === status);
  }
  
  if (search) {
    conversations = conversations.filter(conv => 
      conv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(conversations);
});

// New API endpoints for enhanced features

// Inventory Management
// Inventory Management
app.get('/api/inventory', authenticateToken, dashboardLimiter, (req, res) => {
  const data = generateMockInventory();
  res.json(data);
});

// Analytics
// Analytics
app.get('/api/analytics', authenticateToken, dashboardLimiter, validateAnalyticsQuery, (req, res) => {
  const { range = '7d' } = req.query;
  const data = generateMockAnalytics(range);
  res.json(data);
});

// Order Status Update
app.post('/api/orders/:orderId/status', authenticateToken, validateOrderStatusUpdate, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  // In a real implementation, this would update the database
  console.log(`Updating order ${orderId} to status: ${status}`);
  
  res.json({ 
    success: true, 
    message: `Order ${orderId} status updated to ${status}`,
    orderId,
    newStatus: status
  });
});

// Create new order
app.post('/api/orders', authenticateToken, orderLimiter, validateOrderCreation, (req, res) => {
  const newOrder = {
    id: 'ORD-' + Date.now(),
    orderNumber: '#' + (1000 + Math.floor(Math.random() * 9000)),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  console.log('Creating new order:', newOrder);
  
  res.json({ 
    success: true, 
    message: 'Order created successfully',
    order: newOrder
  });
});

// Products
// Products
app.get('/api/products', authenticateToken, dashboardLimiter, (req, res) => {
  const inventory = generateMockInventory();
  res.json(inventory.products);
});

// Customers
// Customers
app.get('/api/customers', authenticateToken, dashboardLimiter, (req, res) => {
  const mockCustomers = [
    {
      id: 'cust-001',
      name: 'John Doe',
      email: 'john@example.com',
      totalOrders: 5,
      totalSpent: 487.50,
      lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'active'
    },
    {
      id: 'cust-002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      totalOrders: 3,
      totalSpent: 234.99,
      lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      status: 'active'
    }
  ];
  res.json(mockCustomers);
});

// Automation logs (admin only)
app.get('/api/automation/logs', authenticateToken, authorizeRole(['admin']), dashboardLimiter, (req, res) => {
  const { status = '', scenario = '', limit = 50 } = req.query;
  let logs = generateMockAutomationLogs();
  
  if (status) {
    logs = logs.filter(log => log.status === status);
  }
  
  if (scenario) {
    logs = logs.filter(log => log.scenario === scenario);
  }
  
  res.json(logs.slice(0, parseInt(limit)));
});

// Webhook endpoints (for Shopify integration - no auth but with webhook limiter)
app.post('/api/webhooks/orders', webhookLimiter, async (req, res) => {
  try {
    // TODO: Implement Shopify webhook signature verification
    console.log('Shopify order webhook received:', req.body);
    
    // Send to n8n workflow for processing
    if (process.env.N8N_ORDER_WEBHOOK) {
      const n8nResponse = await fetch(process.env.N8N_ORDER_WEBHOOK, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-N8N-API-Key': process.env.N8N_API_KEY || ''
        },
        body: JSON.stringify(req.body)
      });
      
      console.log('Order sent to n8n workflow:', n8nResponse.status);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).json({ error: 'Failed to process order webhook' });
  }
});

app.post('/api/webhooks/inventory', webhookLimiter, async (req, res) => {
  try {
    // TODO: Implement Shopify webhook signature verification
    console.log('Shopify inventory webhook received:', req.body);
    
    // Send to n8n workflow for processing
    if (process.env.N8N_INVENTORY_WEBHOOK) {
      const n8nResponse = await fetch(process.env.N8N_INVENTORY_WEBHOOK, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-N8N-API-Key': process.env.N8N_API_KEY || ''
        },
        body: JSON.stringify(req.body)
      });
      
      console.log('Inventory sent to n8n workflow:', n8nResponse.status);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Inventory webhook error:', error);
    res.status(500).json({ error: 'Failed to process inventory webhook' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    message: isDevelopment ? error.stack : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}/api`);
});

// Startup validation for critical secrets in production/staging
(async function validateStartupSecrets() {
  if (process.env.NODE_ENV === 'development') return;

  try {
    const jwtSecret = await secretsManager.getJWTSecret();
    const openai = await secretsManager.getShopifyConfig(); // shopify config must exist too

    if (!jwtSecret) {
      console.error('Critical secret JWT not found. Aborting startup.');
      process.exit(1);
    }

    // Example: ensure Shopify config has apiKey
    if (!openai || (!openai.apiKey && !openai.api_key && !openai.apiKey)) {
      console.error('Shopify config not found or missing API key. Aborting startup.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error validating startup secrets:', err);
    process.exit(1);
  }
})();
