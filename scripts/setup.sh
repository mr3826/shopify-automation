#!/bin/bash

# Complete setup script for Shopify Automation System
set -e

echo "🚀 Setting up Shopify Automation System..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd api-server && npm install && cd ..
cd dashboard && npm install && cd ..

# Setup DynamoDB tables
echo "🗄️  Setting up DynamoDB tables..."
bash scripts/create-dynamodb-tables.sh

# Deploy Lambda functions
echo "⚡ Deploying Lambda functions..."
bash scripts/deploy-lambdas.sh

# Setup API Gateway
echo "🌐 Setting up API Gateway..."
bash setup-api-gateway.sh

# Build dashboard
echo "🎨 Building dashboard..."
cd dashboard && npm run build && cd ..

echo "✅ Setup complete!"
echo ""
echo "📊 Dashboard: http://localhost:4173 (run 'cd dashboard && npm run preview')"
echo "🔧 API Server: http://localhost:3001 (run 'cd api-server && npm start')"
echo ""
echo "📝 Next steps:"
echo "1. Configure environment variables (.env file)"
echo "2. Set up Shopify webhooks"
echo "3. Configure API integrations"
echo "4. Deploy to production using GitHub Actions"
