#!/bin/bash

# Deploy all Lambda functions
set -e

REGION="ap-south-1"
FUNCTIONS=("shopify-automation-order-router" "shopify-inventory-sync" "shopify-chatbot")

echo "🚀 Deploying Lambda functions..."

for function in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $function..."
    
    case $function in
        "shopify-automation-order-router")
            cd lambda/order-router
            ;;
        "shopify-inventory-sync")
            cd lambda/inventory-sync
            ;;
        "shopify-chatbot")
            cd lambda/chatbot
            ;;
    esac
    
    # Install dependencies
    npm ci --only=production
    
    # Create deployment package
    zip -r ../${function#shopify-automation-}.zip . -x "*.git*" "node_modules/aws-sdk/*"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $function \
        --zip-file fileb://../${function#shopify-automation-}.zip \
        --region $REGION
    
    echo "✅ $function deployed successfully"
    cd ../..
done

echo "🎉 All Lambda functions deployed!"
