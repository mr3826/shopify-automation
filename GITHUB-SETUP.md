# GitHub Repository Setup Guide

## 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Repository name: `shopify-automation`
4. Description: `Production-ready Shopify automation system with serverless architecture`
5. Select "Public" or "Private" as needed
6. Do NOT initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## 2. Push to GitHub

After creating the repository, run these commands:

```bash
# Update the remote URL with your actual GitHub username
git remote set-url origin https://github.com/YOUR_USERNAME/shopify-automation.git

# Push to GitHub
git push -u origin main
```

## 3. Configure GitHub Secrets

Go to your repository Settings > Secrets and variables > Actions and add these secrets:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### Optional Services
- `SLACK_WEBHOOK_URL`: Slack webhook for deployment notifications
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for dashboard

### API Keys
- `SHOPIFY_API_KEY`: Shopify API key
- `SHOPIFY_API_SECRET`: Shopify API secret
- `OPENAI_API_KEY`: OpenAI API key for chatbot

## 4. Enable GitHub Actions

1. Go to Settings > Actions > General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Click Save

## 5. Test CI/CD Pipeline

Once pushed to GitHub, the CI/CD pipeline will automatically run:

1. **On push to `main`**: Full deployment to production
2. **On push to `develop`**: Deployment to development environment
3. **On pull requests**: CI checks only

## 6. Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches

## 7. Development Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create pull request
git push origin feature/new-feature
```

## 8. Monitoring

- Check Actions tab for CI/CD status
- Monitor deployments through GitHub Actions logs
- Set up Slack notifications for deployment status

## 9. AWS Setup Required

Before the CI/CD pipeline can deploy, ensure you have:

1. **AWS Resources Created**:
   - DynamoDB tables (run `scripts/create-dynamodb-tables.sh`)
   - Lambda functions deployed
   - IAM roles with proper permissions

2. **Elastic Beanstalk Application**:
   ```bash
   eb init shopify-automation-api --platform "Node.js 18" --region ap-south-1
   eb create shopify-automation-api-env
   ```

3. **S3 Buckets**:
   - `shopify-automation-deployments`: For API deployments
   - `shopify-automation-dashboard`: For dashboard files
   - `shopify-automation-dashboard-dev`: For dev dashboard

## 10. Environment Variables

Update the repository URL in package.json:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/shopify-automation.git"
  }
}
```

## 11. Next Steps

1. Create the GitHub repository
2. Push the code
3. Configure secrets
4. Test the CI/CD pipeline
5. Monitor first deployment

Your Shopify Automation System is now ready for automated deployments!
