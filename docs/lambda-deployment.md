# Lambda Deployment Guide

## 5. Package and Deploy Lambda Functions

### Prepare Lambda Packages

```bash
cd lambda

# Package order-router
cd order-router
npm install --production
zip -r ../order-router.zip . -x "*.git*" "node_modules/aws-sdk/*"
cd ..

# Package inventory-sync
cd inventory-sync
npm install --production
zip -r ../inventory-sync.zip . -x "*.git*" "node_modules/aws-sdk/*"
cd ..

# Package chatbot
cd chatbot
npm install --production
zip -r ../chatbot.zip . -x "*.git*" "node_modules/aws-sdk/*"
cd ..
```

### Deploy Lambda Functions

#### Order Router Lambda

```bash
aws lambda create-function \
  --function-name shopify-order-router \
  --runtime nodejs18.x \
  --role $LAMBDA_ROLE_ARN \
  --handler handler.orderRouter \
  --zip-file fileb://order-router.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{NODE_ENV=production}" \
  --vpc-config SubnetIds=$PRIVATE_SUBNET_1A,$PRIVATE_SUBNET_1B,SecurityGroupIds=$LAMBDA_SG_ID \
  --tags Environment=production,Service=shopify-automation

export ORDER_ROUTER_ARN=$(aws lambda get-function \
  --function-name shopify-order-router \
  --query 'Configuration.FunctionArn' --output text)
```

#### Inventory Sync Lambda

```bash
aws lambda create-function \
  --function-name shopify-inventory-sync \
  --runtime nodejs18.x \
  --role $LAMBDA_ROLE_ARN \
  --handler handler.inventorySync \
  --zip-file fileb://inventory-sync.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{NODE_ENV=production}" \
  --vpc-config SubnetIds=$PRIVATE_SUBNET_1A,$PRIVATE_SUBNET_1B,SecurityGroupIds=$LAMBDA_SG_ID \
  --tags Environment=production,Service=shopify-automation

export INVENTORY_SYNC_ARN=$(aws lambda get-function \
  --function-name shopify-inventory-sync \
  --query 'Configuration.FunctionArn' --output text)
```

#### Chatbot Lambda

```bash
aws lambda create-function \
  --function-name shopify-chatbot \
  --runtime nodejs18.x \
  --role $LAMBDA_ROLE_ARN \
  --handler handler.chatbot \
  --zip-file fileb://chatbot.zip \
  --timeout 30 \
  --memory-size 1024 \
  --environment Variables="{NODE_ENV=production}" \
  --vpc-config SubnetIds=$PRIVATE_SUBNET_1A,$PRIVATE_SUBNET_1B,SecurityGroupIds=$LAMBDA_SG_ID \
  --tags Environment=production,Service=shopify-automation

export CHATBOT_ARN=$(aws lambda get-function \
  --function-name shopify-chatbot \
  --query 'Configuration.FunctionArn' --output text)
```

### Enable CloudWatch Logs Insights

```bash
# Create log groups with retention
aws logs create-log-group --log-group-name /aws/lambda/shopify-order-router
aws logs put-retention-policy --log-group-name /aws/lambda/shopify-order-router --retention-in-days 30

aws logs create-log-group --log-group-name /aws/lambda/shopify-inventory-sync
aws logs put-retention-policy --log-group-name /aws/lambda/shopify-inventory-sync --retention-in-days 30

aws logs create-log-group --log-group-name /aws/lambda/shopify-chatbot
aws logs put-retention-policy --log-group-name /aws/lambda/shopify-chatbot --retention-in-days 30
```

### Update Lambda Function (for future deployments)

```bash
# Update order-router
cd order-router
zip -r ../order-router.zip . -x "*.git*" "node_modules/aws-sdk/*"
aws lambda update-function-code \
  --function-name shopify-order-router \
  --zip-file fileb://../order-router.zip

# Update inventory-sync
cd ../inventory-sync
zip -r ../inventory-sync.zip . -x "*.git*" "node_modules/aws-sdk/*"
aws lambda update-function-code \
  --function-name shopify-inventory-sync \
  --zip-file fileb://../inventory-sync.zip

# Update chatbot
cd ../chatbot
zip -r ../chatbot.zip . -x "*.git*" "node_modules/aws-sdk/*"
aws lambda update-function-code \
  --function-name shopify-chatbot \
  --zip-file fileb://../chatbot.zip
```

---

## 6. API Gateway Configuration

### Create HTTP API

```bash
aws apigatewayv2 create-api \
  --name shopify-automation-api \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="*",MaxAge=300 \
  --tags Environment=production

export API_ID=$(aws apigatewayv2 get-apis \
  --query "Items[?Name=='shopify-automation-api'].ApiId" --output text)
```

### Create Lambda Integrations

```bash
# Order Router Integration
aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $ORDER_ROUTER_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' --output text

export ORDER_INTEGRATION_ID=<integration-id>

# Inventory Sync Integration
aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $INVENTORY_SYNC_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' --output text

export INVENTORY_INTEGRATION_ID=<integration-id>

# Chatbot Integration
aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $CHATBOT_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' --output text

export CHATBOT_INTEGRATION_ID=<integration-id>
```

### Create Routes

```bash
# Webhook route for Shopify
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /webhooks/shopify" \
  --target integrations/$ORDER_INTEGRATION_ID

# Inventory sync route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /inventory/sync" \
  --target integrations/$INVENTORY_INTEGRATION_ID

# Chatbot route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /chatbot" \
  --target integrations/$CHATBOT_INTEGRATION_ID

# Health check route
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "GET /health" \
  --target integrations/$ORDER_INTEGRATION_ID
```

### Grant API Gateway Permission to Invoke Lambda

```bash
aws lambda add-permission \
  --function-name shopify-order-router \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"

aws lambda add-permission \
  --function-name shopify-inventory-sync \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"

aws lambda add-permission \
  --function-name shopify-chatbot \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"
```

### Create and Deploy Stage

```bash
# Create production stage with logging
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name production \
  --auto-deploy \
  --access-log-settings DestinationArn=arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/aws/apigateway/shopify-automation,Format='$context.requestId $context.error.message $context.error.messageString' \
  --default-route-settings ThrottlingBurstLimit=5000,ThrottlingRateLimit=2000

# Get API endpoint
export API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text)
echo "API Endpoint: $API_ENDPOINT"
```

### Configure Custom Domain (Optional)

```bash
# Request ACM certificate (must be in us-east-1 for API Gateway)
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# After DNS validation, create custom domain
aws apigatewayv2 create-domain-name \
  --domain-name api.yourdomain.com \
  --domain-name-configurations CertificateArn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID

# Create API mapping
aws apigatewayv2 create-api-mapping \
  --domain-name api.yourdomain.com \
  --api-id $API_ID \
  --stage production
```

