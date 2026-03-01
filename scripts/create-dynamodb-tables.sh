#!/bin/bash

# Create DynamoDB tables for Shopify Automation Demo
REGION="ap-south-1"

echo "Creating DynamoDB tables in $REGION..."

# Create Orders table
echo "Creating shopify_orders table..."
aws dynamodb create-table \
  --table-name shopify_orders \
  --attribute-definitions \
    AttributeName=orderId,AttributeType=S \
    AttributeName=orderNumber,AttributeType=S \
  --key-schema \
    AttributeName=orderId,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "OrderNumberIndex",
        "KeySchema": [
          {"AttributeName":"orderNumber","KeyType":"HASH"}
        ],
        "Projection":{"ProjectionType":"ALL"},
        "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
      }
    ]' \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

# Create Inventory table
echo "Creating shopify_inventory table..."
aws dynamodb create-table \
  --table-name shopify_inventory \
  --attribute-definitions \
    AttributeName=sku,AttributeType=S \
  --key-schema \
    AttributeName=sku,KeyType=HASH \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

# Create Activity table for live feed
echo "Creating shopify_activity table..."
aws dynamodb create-table \
  --table-name shopify_activity \
  --attribute-definitions \
    AttributeName=activityId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=activityId,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "TimestampIndex",
        "KeySchema": [
          {"AttributeName":"timestamp","KeyType":"HASH"}
        ],
        "Projection":{"ProjectionType":"ALL"},
        "ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}
      }
    ]' \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $REGION

echo "Waiting for tables to become active..."
aws dynamodb wait table-exists --table-name shopify_orders --region $REGION
aws dynamodb wait table-exists --table-name shopify_inventory --region $REGION
aws dynamodb wait table-exists --table-name shopify_activity --region $REGION

echo "✅ All DynamoDB tables created successfully!"
