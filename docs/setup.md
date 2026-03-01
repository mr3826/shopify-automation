# Shopify Automation System Setup Guide

This guide will walk you through setting up the complete Shopify Automation System from scratch.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- AWS account with Lambda and RDS access
- Shopify Partner account
- Make.com account
- SendGrid account (for emails)
- OpenAI API key (for chatbot)
- ShipStation account (for fulfillment)

## Quick Start

### 1. Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopify-automation
   ```

2. **Install dependencies**
   ```bash
   # Install Lambda dependencies
   cd lambda/shared && npm install
   cd ../order-router && npm install
   cd ../inventory-sync && npm install
   cd ../chatbot && npm install
   
   # Install dashboard dependencies
   cd ../../dashboard && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

### 2. Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE shopify_automation;
   ```

2. **Run schema migration**
   ```bash
   psql -h localhost -U your_user -d shopify_automation -f database/schema.sql
   ```

3. **Load sample data (optional)**
   ```bash
   psql -h localhost -U your_user -d shopify_automation -f database/seed.sql
   ```

### 3. AWS Lambda Deployment

1. **Package Lambda functions**
   ```bash
   cd lambda/order-router
   npm run package
   
   cd ../inventory-sync
   npm run package
   
   cd ../chatbot
   npm run package
   ```

2. **Deploy to AWS**
   ```bash
   # Using AWS CLI
   aws lambda create-function \
     --function-name shopify-order-router \
     --runtime nodejs18.x \
     --handler handler.handler \
     --zip-file fileb://order-router.zip \
     --role <your-lambda-role>
   
   # Repeat for other functions
   ```

3. **Configure environment variables**
   ```bash
   aws lambda update-function-configuration \
     --function-name shopify-order-router \
     --environment Variables="{DATABASE_URL=your_db_url,SHOPIFY_WEBHOOK_SECRET=your_secret}"
   ```

### 4. Shopify Setup

1. **Create Shopify App**
   - Go to Shopify Partners dashboard
   - Create new app
   - Configure webhooks for:
     - `orders/create`
     - `orders/updated`
     - `inventory_levels/update`
     - `refunds/create`

2. **Set webhook endpoints**
   - Order webhooks: `https://your-lambda-url/order-router`
   - Inventory webhooks: `https://your-lambda-url/inventory-sync`

3. **Install app on development store**

### 5. Make.com Integration

1. **Import workflows**
   - Go to Make.com dashboard
   - Import JSON files from `make-workflows/` directory:
     - `order-capture.json`
     - `inventory-sync.json`
     - `email-automation.json`
     - `low-stock-alerts.json`

2. **Configure connections**
   - Shopify API
   - SendGrid
   - Slack
   - Email providers

3. **Set up webhooks**
   - Configure Make.com to receive webhooks from Lambda functions

### 6. Dashboard Setup

1. **Start the dashboard**
   ```bash
   cd dashboard
   npm run dev
   ```

2. **Configure API endpoints**
   - Update `src/api/dashboard.js` with your API URL
   - Set up CORS on your API server

### 7. Testing

1. **Test order processing**
   - Create a test order in your Shopify store
   - Check dashboard for order appearance
   - Verify email notifications

2. **Test inventory sync**
   - Update inventory in Shopify
   - Verify sync to Amazon/eBay (if configured)
   - Check dashboard for inventory updates

3. **Test chatbot**
   - Access chat widget on storefront
   - Test various customer queries
   - Verify escalation to human agents

## Configuration Details

### Environment Variables

Required environment variables:

```env
# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_API_PASSWORD=your_private_app_password

# Database
DATABASE_URL=postgresql://user:password@host:5432/shopify_automation

# OpenAI (Chatbot)
OPENAI_API_KEY=sk-your-openai-key

# ShipStation
SHIPSTATION_API_KEY=your_shipstation_key
SHIPSTATION_API_SECRET=your_shipstation_secret
SHIPSTATION_API_URL=https://ssapi.shipstation.com

# Email (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_key
FROM_EMAIL=orders@yourstore.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

# Amazon API (if using)
AMAZON_API_KEY=your_amazon_key
AMAZON_API_SECRET=your_amazon_secret
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER

# eBay API (if using)
EBAY_API_KEY=your_ebay_key
EBAY_API_SECRET=your_ebay_secret
EBAY_APP_ID=your_ebay_app_id

# Dashboard
DASHBOARD_URL=https://your-dashboard-url.com
API_URL=https://your-api-url.com

# Make.com
MAKE_API_KEY=your_make_api_key

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_char_encryption_key
```

### AWS IAM Permissions

Required IAM permissions for Lambda functions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:Connect",
        "rds:Describe*"
      ],
      "Resource": "arn:aws:rds:*:*:db/shopify-automation-db"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:*:*:key/your-kms-key"
    }
  ]
}
```

## Monitoring & Troubleshooting

### Health Checks

- **Dashboard Health Page**: Monitor system status at `/health`
- **CloudWatch Logs**: Check Lambda function logs
- **Database Monitoring**: Monitor connection pool usage
- **Make.com Logs**: Check workflow execution history

### Common Issues

1. **Webhook Validation Errors**
   - Verify `SHOPIFY_WEBHOOK_SECRET` is correct
   - Check webhook URL is accessible
   - Ensure HTTPS is properly configured

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Check security group allows Lambda access
   - Monitor connection pool exhaustion

3. **Email Delivery Failures**
   - Verify SendGrid API key
   - Check sender email is verified
   - Monitor email bounce rates

4. **Chatbot Issues**
   - Verify OpenAI API key and credits
   - Check system prompt configuration
   - Monitor conversation logs

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Monitor slow queries
   - Consider read replicas for dashboard

2. **Lambda Optimization**
   - Configure appropriate memory allocation
   - Use provisioned concurrency for high-traffic functions
   - Implement dead letter queues

3. **Caching Strategy**
   - Cache frequently accessed data
   - Use Redis for session storage
   - Implement CDN for static assets

## Security Considerations

1. **API Security**
   - Use HTTPS everywhere
   - Implement rate limiting
   - Validate all input data

2. **Database Security**
   - Use parameterized queries
   - Implement connection encryption
   - Regular security updates

3. **Secret Management**
   - Use AWS Secrets Manager
   - Rotate API keys regularly
   - Never commit secrets to git

## Scaling Guidelines

1. **Horizontal Scaling**
   - Add more Lambda functions
   - Use load balancers
   - Implement microservices architecture

2. **Database Scaling**
   - Read replicas for dashboard queries
   - Partition large tables
   - Consider managed database services

3. **Monitoring Scaling**
   - Set up automated alerts
   - Implement performance dashboards
   - Regular capacity planning

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Check Make.com workflow execution history
4. Consult the architecture documentation
5. Contact the development team

## Next Steps

After setup is complete:

1. Configure additional sales channels
2. Set up advanced analytics
3. Implement custom business rules
4. Add more automation workflows
5. Set up disaster recovery procedures
