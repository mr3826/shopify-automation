const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AWS DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

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
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    id: 'conv-002',
    customerName: 'Bob Martinez',
    customerEmail: 'bob@example.com',
    status: 'resolved',
    lastMessage: 'Thank you for the help!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  }
];

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Try to get real data from DynamoDB
    const params = {
      TableName: 'shopify_activity',
      Limit: 100,
      ScanIndexForward: false
    };
    
    const result = await dynamoDb.scan(params).promise();
    
    // Return mock data enhanced with real activity count
    const mockStats = generateMockStats();
    mockStats.recentActivity = result.Items || [];
    
    res.json(mockStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json(generateMockStats());
  }
});

app.get('/api/dashboard/orders-chart', (req, res) => {
  const timeRange = req.query.range || '7d';
  res.json(generateMockOrdersChart());
});

app.get('/api/dashboard/system-health', (req, res) => {
  res.json(generateMockSystemHealth());
});

app.get('/api/dashboard/recent-orders', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const orders = generateMockRecentOrders().slice(0, limit);
  res.json(orders);
});

app.get('/api/orders', async (req, res) => {
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

app.get('/api/support/conversations', (req, res) => {
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

app.get('/api/automation/logs', (req, res) => {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}/api`);
});
