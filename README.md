# Shopify Automation System

A production-ready, event-driven Shopify automation system with serverless architecture, real-time inventory sync, AI-powered support, and comprehensive monitoring.

## Architecture

```
Shopify Store
     │
     │ Webhook (order.created, inventory.update, etc.)
     ▼
AWS Lambda (Event Router)
     │
     ├──► Make.com Workflow Engine
     │         │
     │         ├──► PostgreSQL (Order & Inventory DB)
     │         ├──► ShipStation API (Fulfillment)
     │         ├──► Amazon / eBay APIs (Inventory Sync)
     │         ├──► Email Service (Customer Notifications)
     │         ├──► Slack (Team Alerts)
     │         └──► Supplier APIs (Auto-Reorder)
     │
     └──► ChatGPT API (Support Chatbot)
               │
               └──► Customer-Facing Chat Widget
```

## Features

- **Order Capture**: Automated ingestion via Shopify webhooks
- **Inventory Sync**: Real-time sync across Shopify, Amazon & eBay
- **Email Automation**: Order confirmation, shipping updates, follow-ups
- **Fulfillment Integration**: ShipStation API for automatic fulfillment
- **Low Stock Alerts**: Auto-reorder triggers sent to suppliers
- **AI Chatbot**: ChatGPT-powered support (90% query resolution)
- **Analytics Dashboard**: Real-time order, inventory & health metrics

## Tech Stack

| Layer | Technology |
|---|---|
| E-commerce | Shopify API & Webhooks |
| Workflow Orchestration | Make.com |
| Serverless Functions | AWS Lambda |
| Database | PostgreSQL |
| AI Support Bot | ChatGPT API (OpenAI) |
| Fulfillment | ShipStation API |
| Team Notifications | Slack |
| Frontend Dashboard | React |

## Performance Targets

| Metric | Target |
|---|---|
| Order processing time | < 2 minutes |
| Inventory sync delay | < 5 minutes across all channels |
| Support ticket deflection | 90% resolved by chatbot |
| System reliability | 99.9% uptime |

## Quick Start

1. **Set up environment variables** (see `.env.example`)
2. **Deploy database schema** from `database/schema.sql`
3. **Deploy Lambda functions** in `lambda/` directory
4. **Configure Make.com workflows** using exports in `make-workflows/`
5. **Run React dashboard** from `dashboard/` directory

## Project Structure

```
shopify-automation/
├── README.md
├── .env.example
├── lambda/
│   ├── order-router/
│   ├── inventory-sync/
│   └── chatbot/
├── dashboard/                  # React app
├── database/
│   ├── schema.sql
│   └── seed.sql
├── make-workflows/
└── docs/
```

## Documentation

- [Setup Guide](docs/setup.md)
- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)
