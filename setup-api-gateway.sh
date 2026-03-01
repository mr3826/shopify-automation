#!/bin/bash

# Set up API Gateway for Shopify webhooks
REGION="ap-south-1"
API_NAME="shopify-automation-api"

echo "Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
  --name $API_NAME \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="*",MaxAge=300 \
  --query 'ApiId' \
  --output text \
  --region $REGION)

echo "API ID: $API_ID"

# Get Lambda function ARNs
echo "Getting Lambda function ARNs..."
ORDER_ROUTER_ARN=$(aws lambda get-function --function-name shopify-automation-order-router --query 'Configuration.FunctionArn' --output text --region $REGION)
INVENTORY_SYNC_ARN=$(aws lambda get-function --function-name shopify-inventory-sync --query 'Configuration.FunctionArn' --output text --region $REGION)
CHATBOT_ARN=$(aws lambda get-function --function-name shopify-chatbot --query 'Configuration.FunctionArn' --output text --region $REGION)

echo "Order Router ARN: $ORDER_ROUTER_ARN"
echo "Inventory Sync ARN: $INVENTORY_SYNC_ARN"
echo "Chatbot ARN: $CHATBOT_ARN"

# Create integrations
echo "Creating integrations..."
ORDER_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $ORDER_ROUTER_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' \
  --output text \
  --region $REGION)

INVENTORY_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $INVENTORY_SYNC_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' \
  --output text \
  --region $REGION)

CHATBOT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $CHATBOT_ARN \
  --payload-format-version 2.0 \
  --query 'IntegrationId' \
  --output text \
  --region $REGION)

echo "Creating routes..."
# Create routes
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /webhooks/shopify" \
  --target integrations/$ORDER_INTEGRATION_ID \
  --region $REGION

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /inventory/sync" \
  --target integrations/$INVENTORY_INTEGRATION_ID \
  --region $REGION

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /chatbot" \
  --target integrations/$CHATBOT_INTEGRATION_ID \
  --region $REGION

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "GET /health" \
  --target integrations/$ORDER_INTEGRATION_ID \
  --region $REGION

# Grant API Gateway permission to invoke Lambdas
echo "Setting permissions..."
aws lambda add-permission \
  --function-name shopify-automation-order-router \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:661975750665:$API_ID/*/*"

aws lambda add-permission \
  --function-name shopify-inventory-sync \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:661975750665:$API_ID/*/*"

aws lambda add-permission \
  --function-name shopify-chatbot \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:661975750665:$API_ID/*/*"

# Create and deploy stage
echo "Creating stage..."
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name production \
  --auto-deploy \
  --default-route-settings ThrottlingBurstLimit=5000,ThrottlingRateLimit=2000 \
  --region $REGION

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text --region $REGION)
echo "✅ API Gateway setup complete!"
echo "📍 API Endpoint: $API_ENDPOINT"
echo "🔗 Shopify Webhook URL: $API_ENDPOINT/production/webhooks/shopify"
echo "🔗 Inventory Sync URL: $API_ENDPOINT/production/inventory/sync"
echo "🔗 Chatbot URL: $API_ENDPOINT/production/chatbot"
echo "🔗 Health Check URL: $API_ENDPOINT/production/health"
