#!/bin/bash

# Deploy inventory-sync Lambda function
REGION="ap-south-1"
FUNCTION_NAME="shopify-inventory-sync"
ROLE_NAME="shopify-lambda-execution-role"

echo "Getting AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region $REGION)
echo "Account ID: $ACCOUNT_ID"

echo "Creating/updating IAM role..."
# Create role if it doesn't exist
aws iam create-role --role-name $ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' --region $REGION 2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region $REGION

aws iam attach-role-policy --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  --region $REGION

echo "Waiting for role to be ready..."
sleep 10

echo "Creating Lambda function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME \
  --handler handler.inventorySync \
  --zip-file fileb://lambda/inventory-sync.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{NODE_ENV=production}" \
  --region $REGION

echo "✅ Inventory-sync Lambda deployed successfully!"
