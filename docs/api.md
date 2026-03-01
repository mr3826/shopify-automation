# API Documentation

## Overview

The Shopify Automation System provides RESTful APIs for dashboard functionality, external integrations, and system management.

## Base URL

```
Production: https://api.yourstore.com
Development: http://localhost:3001
```

## Authentication

All API requests require authentication via JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Dashboard APIs

### GET /api/dashboard/stats

Get dashboard statistics and metrics.

**Response:**
```json
{
  "totalOrders": 1524,
  "ordersChange": 12.5,
  "ordersChangeType": "increase",
  "revenue": 45678.90,
  "revenueChange": 8.3,
  "revenueChangeType": "increase",
  "lowStockItems": 23,
  "lowStockChange": -5.2,
  "lowStockChangeType": "decrease",
  "supportTickets": 67,
  "supportTicketsChange": -2.1,
  "supportTicketsChangeType": "decrease",
  "criticalAlerts": [
    "Inventory sync failure for Amazon",
    "High error rate in order processing"
  ],
  "ordersChart": [
    {"date": "2024-01-14", "orders": 145},
    {"date": "2024-01-15", "orders": 167},
    // ... more data points
  ],
  "systemHealth": {
    "overall": "healthy",
    "services": [
      {
        "name": "order-router",
        "status": "healthy",
        "responseTime": 245,
        "lastCheck": "2 minutes ago"
      }
      // ... more services
    ]
  },
  "recentOrders": [
    {
      "id": 1234,
      "orderNumber": "1001",
      "customerEmail": "john@example.com",
      "status": "fulfilled",
      "totalPrice": 89.99,
      "createdAt": "2024-01-20T09:15:00Z"
    }
    // ... more orders
  ]
}
```

### GET /api/dashboard/orders-chart

Get order volume chart data.

**Query Parameters:**
- `range` (string): Time range - `7d`, `30d`, `90d` (default: `7d`)

**Response:**
```json
{
  "data": [
    {"date": "2024-01-14", "orders": 145, "revenue": 3456.78},
    {"date": "2024-01-15", "orders": 167, "revenue": 4234.56}
  ]
}
```

### GET /api/dashboard/system-health

Get system health status.

**Response:**
```json
{
  "overall": "healthy",
  "services": [
    {
      "name": "order-router",
      "status": "healthy",
      "responseTime": 245,
      "lastCheck": "2024-01-20T10:28:00Z",
      "description": "Order processing webhook handler"
    },
    {
      "name": "inventory-sync",
      "status": "warning",
      "responseTime": 1200,
      "lastCheck": "2024-01-20T10:27:00Z",
      "description": "Multi-channel inventory synchronization",
      "error": "Amazon API rate limit exceeded"
    }
  ],
  "metrics": {
    "uptime": 99.9,
    "avgResponseTime": 342,
    "errorRate": 0.02,
    "requestsPerMinute": 45
  },
  "recentLogs": [
    {
      "id": 1001,
      "scenario": "order-router",
      "status": "success",
      "message": "Order #1002 processed successfully",
      "executionTime": 1250,
      "createdAt": "2024-01-20T10:25:00Z"
    }
  ]
}
```

## Orders APIs

### GET /api/orders

Get orders with filtering and pagination.

**Query Parameters:**
- `search` (string): Search by order number or customer email
- `status` (string): Filter by status - `pending`, `processing`, `fulfilled`, `refunded`, `cancelled`
- `dateRange` (string): Date range - `7days`, `30days`, `90days`
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 25, max: 100)

**Response:**
```json
{
  "orders": [
    {
      "id": 1234,
      "shopifyId": 5001,
      "orderNumber": "1001",
      "customerEmail": "john@example.com",
      "customerFirstName": "John",
      "customerLastName": "Doe",
      "status": "fulfilled",
      "financialStatus": "paid",
      "fulfillmentStatus": "fulfilled",
      "totalPrice": 89.99,
      "subtotalPrice": 79.99,
      "taxPrice": 5.00,
      "shippingPrice": 5.00,
      "currency": "USD",
      "itemCount": 2,
      "createdAt": "2024-01-20T09:15:00Z",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1524,
    "totalPages": 61
  },
  "stats": {
    "total": 1524,
    "pending": 45,
    "fulfilled": 1400,
    "refunded": 79,
    "revenue": 45678.90
  }
}
```

### GET /api/orders/:id

Get order details by ID.

**Response:**
```json
{
  "id": 1234,
  "shopifyId": 5001,
  "orderNumber": "1001",
  "customerEmail": "john@example.com",
  "customerFirstName": "John",
  "customerLastName": "Doe",
  "status": "fulfilled",
  "financialStatus": "paid",
  "fulfillmentStatus": "fulfilled",
  "totalPrice": 89.99,
  "subtotalPrice": 79.99,
  "taxPrice": 5.00,
  "shippingPrice": 5.00,
  "currency": "USD",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "province": "NY",
    "country": "US",
    "zip": "10001"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "province": "NY",
    "country": "US",
    "zip": "10001"
  },
  "notes": "Gift wrap requested",
  "tags": ["new-customer", "gift-wrap"],
  "items": [
    {
      "id": 5678,
      "shopifyProductId": 1001,
      "shopifyVariantId": 2001,
      "sku": "TSHIRT-BLK-M",
      "productTitle": "Classic T-Shirt",
      "variantTitle": "Medium",
      "quantity": 2,
      "unitPrice": 39.99,
      "totalPrice": 79.98,
      "productType": "Apparel",
      "vendor": "Premium Apparel Co."
    }
  ],
  "fulfillments": [
    {
      "id": 901,
      "shopifyFulfillmentId": 9001,
      "trackingCompany": "UPS",
      "trackingNumber": "1Z999AA10123456784",
      "trackingUrl": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
      "status": "delivered",
      "shippedAt": "2024-01-15T10:30:00Z",
      "deliveredAt": "2024-01-17T16:45:00Z"
    }
  ],
  "createdAt": "2024-01-20T09:15:00Z",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

### PATCH /api/orders/:id/status

Update order status.

**Request Body:**
```json
{
  "status": "processing",
  "note": "Order is being prepared for shipment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "status": "processing",
    "updatedAt": "2024-01-20T15:45:00Z"
  }
}
```

## Inventory APIs

### GET /api/inventory

Get inventory items with filtering and pagination.

**Query Parameters:**
- `search` (string): Search by SKU or product name
- `stockStatus` (string): Filter by stock status - `in_stock`, `low_stock`, `out_of_stock`
- `category` (string): Filter by product category
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 24, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "sku": "TSHIRT-BLK-M",
      "productName": "Classic Black T-Shirt",
      "productTitle": "Classic T-Shirt",
      "variantTitle": "Medium",
      "stockQuantity": 150,
      "reorderPoint": 20,
      "maxStock": 1000,
      "costPrice": 8.50,
      "retailPrice": 19.99,
      "weight": 0.25,
      "productType": "Apparel",
      "vendor": "Premium Apparel Co.",
      "stockStatus": "in_stock",
      "lastSyncedAt": "2024-01-20T10:15:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 487,
    "totalPages": 21
  },
  "stats": {
    "totalProducts": 487,
    "inStock": 420,
    "lowStock": 45,
    "outOfStock": 22
  },
  "syncStatus": {
    "shopify": "2 min ago",
    "amazon": "5 min ago",
    "ebay": "15 min ago"
  }
}
```

### GET /api/inventory/:sku

Get inventory item details by SKU.

**Response:**
```json
{
  "id": 1,
  "sku": "TSHIRT-BLK-M",
  "productName": "Classic Black T-Shirt",
  "productTitle": "Classic T-Shirt",
  "variantTitle": "Medium",
  "stockQuantity": 150,
  "reorderPoint": 20,
  "maxStock": 1000,
  "costPrice": 8.50,
  "retailPrice": 19.99,
  "weight": 0.25,
  "productType": "Apparel",
  "vendor": "Premium Apparel Co.",
  "stockStatus": "in_stock",
  "levels": [
    {
      "channel": "shopify",
      "locationId": "primary",
      "available": 150,
      "reserved": 5,
      "incoming": 20,
      "lastSyncedAt": "2024-01-20T10:15:00Z"
    },
    {
      "channel": "amazon",
      "locationId": "US-WEST",
      "available": 80,
      "reserved": 3,
      "incoming": 15,
      "lastSyncedAt": "2024-01-20T10:10:00Z"
    },
    {
      "channel": "ebay",
      "locationId": "US",
      "available": 25,
      "reserved": 1,
      "incoming": 8,
      "lastSyncedAt": "2024-01-20T09:45:00Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-20T10:15:00Z"
}
```

### PUT /api/inventory/:sku

Update inventory item.

**Request Body:**
```json
{
  "stockQuantity": 200,
  "reorderPoint": 25,
  "retailPrice": 21.99,
  "maxStock": 1200
}
```

### POST /api/inventory/:sku/sync

Manually trigger inventory sync for a specific SKU.

**Response:**
```json
{
  "success": true,
  "data": {
    "sku": "TSHIRT-BLK-M",
    "syncStarted": "2024-01-20T15:30:00Z",
    "channels": ["shopify", "amazon", "ebay"]
  }
}
```

## Support APIs

### GET /api/support/conversations

Get support conversations with filtering and pagination.

**Query Parameters:**
- `status` (string): Filter by status - `active`, `resolved`, `escalated`
- `assignedTo` (string): Filter by assigned agent
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "conversations": [
    {
      "id": 123,
      "conversationUuid": "550e8400-e29b-41d4-a716-446655440000",
      "customerEmail": "john@example.com",
      "customerName": "John Doe",
      "sessionId": "sess_001",
      "status": "active",
      "aiConfidenceScore": 0.95,
      "escalatedToHuman": false,
      "messageCount": 5,
      "lastMessageAt": "2024-01-20T14:30:00Z",
      "createdAt": "2024-01-20T10:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 67,
    "totalPages": 4
  },
  "stats": {
    "active": 12,
    "resolved": 45,
    "escalated": 10,
    "aiResolved": 55,
    "avgResponseTime": "1.2s"
  },
  "aiPerformance": {
    "resolutionRate": 89.5,
    "avgConfidence": 0.87,
    "totalConversations": 234,
    "escalationRate": 10.5
  }
}
```

### GET /api/support/conversations/:id

Get conversation details by ID.

**Response:**
```json
{
  "id": 123,
  "conversationUuid": "550e8400-e29b-41d4-a716-446655440000",
  "customerEmail": "john@example.com",
  "customerName": "John Doe",
  "sessionId": "sess_001",
  "status": "resolved",
  "aiConfidenceScore": 0.95,
  "escalatedToHuman": false,
  "resolvedAt": "2024-01-20T14:45:00Z",
  "createdAt": "2024-01-20T10:15:00Z",
  "updatedAt": "2024-01-20T14:45:00Z",
  "messages": [
    {
      "id": 1001,
      "messageType": "user",
      "content": "What is the status of my order #1001?",
      "metadata": {
        "timestamp": "2024-01-20T10:15:00Z"
      },
      "createdAt": "2024-01-20T10:15:00Z"
    },
    {
      "id": 1002,
      "messageType": "bot",
      "content": "Your order #1001 has been delivered! It was shipped via UPS with tracking number 1Z999AA10123456784 and delivered on January 15th at 10:30 AM.",
      "metadata": {
        "aiConfidence": 0.95,
        "responseTime": 450
      },
      "createdAt": "2024-01-20T10:16:00Z"
    }
  ]
}
```

### POST /api/support/conversations/:id/messages

Send a message in a conversation.

**Request Body:**
```json
{
  "message": "Thank you for the update!",
  "isHuman": false
}
```

### POST /api/support/conversations/:id/escalate

Escalate conversation to human agent.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "escalatedAt": "2024-01-20T15:00:00Z",
    "notificationSent": true
  }
}
```

## Health APIs

### GET /api/health

Get overall system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00Z",
  "uptime": 99.9,
  "services": [
    {
      "name": "order-router",
      "status": "healthy",
      "responseTime": 245,
      "lastCheck": "2024-01-20T15:28:00Z",
      "description": "Order processing webhook handler"
    }
  ],
  "metrics": {
    "uptime": 99.9,
    "avgResponseTime": 342,
    "errorRate": 0.02,
    "requestsPerMinute": 45
  }
}
```

### GET /api/health/logs/:service

Get logs for a specific service.

**Query Parameters:**
- `limit` (integer): Number of log entries (default: 50, max: 200)
- `level` (string): Filter by log level - `error`, `warn`, `info`, `debug`

**Response:**
```json
{
  "logs": [
    {
      "id": 1001,
      "scenario": "order-router",
      "status": "success",
      "message": "Order #1002 processed successfully",
      "executionTime": 1250,
      "correlationId": "corr_001",
      "createdAt": "2024-01-20T15:25:00Z"
    }
  ]
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| VALIDATION_ERROR | Invalid input parameters | 400 |
| UNAUTHORIZED | Invalid or missing authentication | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| CONFLICT | Resource conflict | 409 |
| RATE_LIMITED | Too many requests | 429 |
| INTERNAL_ERROR | Internal server error | 500 |
| SERVICE_UNAVAILABLE | Service temporarily unavailable | 503 |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Dashboard endpoints**: 60 requests per minute
- **Webhook endpoints**: 1000 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @shopify-automation/sdk
```

```javascript
import { ShopifyAutomationAPI } from '@shopify-automation/sdk';

const client = new ShopifyAutomationAPI({
  baseURL: 'https://api.yourstore.com',
  apiKey: 'your-api-key'
});

const orders = await client.orders.list({ status: 'fulfilled' });
```

### Python
```bash
pip install shopify-automation-sdk
```

```python
from shopify_automation import ShopifyAutomationAPI

client = ShopifyAutomationAPI(
    base_url='https://api.yourstore.com',
    api_key='your-api-key'
)

orders = client.orders.list(status='fulfilled')
```

## Webhooks

### Order Webhooks

**Endpoints:**
- `POST /webhooks/orders/create`
- `POST /webhooks/orders/update`
- `POST /webhooks/orders/refund`

**Headers:**
```http
X-Shopify-Topic: orders/create
X-Shopify-Hmac-Sha256: <signature>
Content-Type: application/json
```

### Inventory Webhooks

**Endpoints:**
- `POST /webhooks/inventory/update`

**Headers:**
```http
X-Shopify-Topic: inventory_levels/update
X-Shopify-Hmac-Sha256: <signature>
Content-Type: application/json
```

### Chatbot Webhooks

**Endpoints:**
- `POST /webhooks/chatbot/message`

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "customerEmail": "john@example.com",
  "customerName": "John Doe",
  "message": "What is my order status?",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

For more detailed information, see the implementation examples in the repository.
