#!/bin/bash

# Deploy chatbot Lambda function
REGION="ap-south-1"
FUNCTION_NAME="shopify-chatbot"
ROLE_NAME="shopify-lambda-execution-role"

echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $REGION)
echo "Account ID: $ACCOUNT_ID"

echo "Creating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME \
  --handler handler.chatbot \
  --zip-file fileb://lambda/chatbot.zip \
  --timeout 30 \
  --memory-size 1024 \
  --environment Variables="{NODE_ENV=production}" \
  --region $REGION

echo "✅ Chatbot Lambda deployed successfully!"
