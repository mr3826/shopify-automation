# AWS Deployment Documentation

Complete production-grade deployment guide for the Shopify Automation System on AWS.

## 📚 Documentation Structure

### Main Guides

1. **[AWS Deployment Guide](aws-deployment-guide.md)** - Complete step-by-step deployment instructions
   - VPC and network architecture
   - RDS PostgreSQL setup
   - Secrets Manager configuration
   - Quick start automated deployment

2. **[IAM Policies](iam-policies.md)** - Security and access control
   - Lambda execution roles
   - API Gateway roles
   - CloudFront OAI policies
   - Least privilege configurations

3. **[Lambda Deployment](lambda-deployment.md)** - Serverless function deployment
   - Packaging instructions
   - API Gateway HTTP API setup
   - Route configuration
   - Permission management

4. **[S3 & CloudFront](s3-cloudfront-deployment.md)** - Frontend hosting
   - S3 static hosting setup
   - CloudFront distribution
   - Custom domain configuration
   - Cache invalidation

5. **[Security & Monitoring](security-monitoring.md)** - Production operations
   - Security hardening checklist
   - CloudWatch dashboards
   - Alarms and alerts
   - Cost estimation

6. **[Scaling & CI/CD](scaling-cicd.md)** - Growth and automation
   - Auto-scaling strategies
   - Performance optimization
   - GitHub Actions workflows
   - Rollback procedures

7. **[Deployment Checklist](deployment-checklist.md)** - Verification and troubleshooting
   - Pre-deployment checklist
   - Post-deployment verification
   - Troubleshooting guide
   - Emergency procedures

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Time:** ~20-25 minutes  
**Creates:** VPC, RDS, Lambda, API Gateway, S3, IAM roles, Security Groups

### Option 2: CloudFormation

```bash
# Deploy infrastructure
aws cloudformation create-stack \
  --stack-name shopify-automation \
  --template-body file://cloudformation-template.yaml \
  --parameters ParameterKey=DBPassword,ParameterValue=YOUR_SECURE_PASSWORD \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name shopify-automation
```

### Option 3: Manual Deployment

Follow the detailed guides in order:
1. [AWS Deployment Guide](aws-deployment-guide.md) - Sections 1-4
2. [IAM Policies](iam-policies.md) - Create roles
3. [Lambda Deployment](lambda-deployment.md) - Deploy functions
4. [S3 & CloudFront](s3-cloudfront-deployment.md) - Deploy dashboard
5. [Security & Monitoring](security-monitoring.md) - Set up monitoring

## 📋 Prerequisites

- AWS CLI installed and configured
- AWS Account with admin access
- Node.js 18.x
- PostgreSQL client (psql)
- Domain name (optional)

## 💰 Cost Estimate

### Moderate Traffic (100K requests/month)
- **Monthly:** $80-110
- **Annually:** ~$960-1,320

### High Traffic (1M requests/month)
- **Monthly:** $160-210
- **Annually:** ~$1,920-2,520

See [Security & Monitoring Guide](security-monitoring.md#12-cost-estimation) for detailed breakdown.

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  Shopify Store  │
└────────┬────────┘
         │ Webhooks
         ▼
┌─────────────────────────────────────────────────┐
│              API Gateway (HTTP API)              │
└────────┬────────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Lambda  │ │Lambda  │ │Lambda  │ │  SQS   │
│Order   │ │Inventory│ │Chatbot │ │ Queue  │
│Router  │ │  Sync  │ │        │ └────────┘
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┴──────────┴─────────┐
                                     ▼
                            ┌─────────────────┐
                            │  RDS PostgreSQL │
                            │   (Multi-AZ)    │
                            └─────────────────┘

┌─────────────────────────────────────────────────┐
│              CloudFront CDN                      │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   S3 Bucket     │
│ (React Dashboard)│
└─────────────────┘
```

## 🔒 Security Features

- ✅ VPC with private subnets
- ✅ RDS encryption at rest
- ✅ Secrets Manager for credentials
- ✅ Security groups with least privilege
- ✅ SSL/TLS everywhere
- ✅ Webhook signature verification
- ✅ API rate limiting
- ✅ CloudWatch logging
- ✅ Multi-AZ deployment

## 📊 Monitoring & Alerts

- CloudWatch Dashboards for real-time metrics
- Alarms for Lambda errors, RDS CPU, API 5XX errors
- SNS notifications for critical alerts
- Log aggregation with CloudWatch Logs Insights
- X-Ray tracing (optional)

## 🔄 CI/CD Pipeline

GitHub Actions workflows included:
- **Lambda Deployment** - Automated function updates
- **Dashboard Deployment** - S3 sync and CloudFront invalidation
- **Database Migrations** - Schema updates
- **Rollback** - Quick version rollback

See [Scaling & CI/CD Guide](scaling-cicd.md#15-cicd-pipeline-github-actions) for setup.

## 🛠️ Maintenance

### Daily
- Monitor CloudWatch dashboards
- Check error rates

### Weekly
- Review cost reports
- Check RDS performance
- Analyze slow queries

### Monthly
- Rotate secrets
- Update dependencies
- Optimize Lambda memory

### Quarterly
- Security audit
- Disaster recovery test
- Cost optimization review

## 📞 Support

### Troubleshooting
1. Check [Deployment Checklist](deployment-checklist.md#troubleshooting-guide)
2. Review CloudWatch Logs
3. Verify security group rules
4. Test connectivity

### Common Issues
- **Lambda timeout** → Increase timeout/memory
- **RDS connection** → Check security groups
- **CORS errors** → Verify API Gateway CORS config
- **502 errors** → Check Lambda response format

## 📖 Additional Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Shopify Webhook Documentation](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)

## 🎯 Next Steps After Deployment

1. **Configure Shopify Webhooks**
   - Add webhook URLs in Shopify Admin
   - Test webhook delivery

2. **Add Remaining Secrets**
   - Shopify API credentials
   - SendGrid API key
   - OpenAI API key
   - ShipStation credentials
   - Make.com webhook URL

3. **Initialize Database**
   ```bash
   psql -h <rds-endpoint> -U shopify_admin -d postgres -f database/schema.sql
   ```

4. **Deploy Dashboard**
   ```bash
   cd dashboard
   npm run build
   aws s3 sync dist/ s3://<bucket-name>/
   ```

5. **Set Up Monitoring**
   - Subscribe to SNS alerts
   - Configure Slack notifications
   - Set up budget alerts

6. **Test End-to-End**
   - Create test order in Shopify
   - Verify webhook processing
   - Check database records
   - Test chatbot functionality

## 📝 Files in This Directory

```
docs/
├── README.md                      # This file
├── aws-deployment-guide.md        # Main deployment guide
├── iam-policies.md                # IAM roles and policies
├── lambda-deployment.md           # Lambda and API Gateway
├── s3-cloudfront-deployment.md    # Frontend hosting
├── security-monitoring.md         # Security and monitoring
├── scaling-cicd.md                # Scaling and CI/CD
└── deployment-checklist.md        # Verification and troubleshooting

../
├── deploy.sh                      # Automated deployment script
└── cloudformation-template.yaml   # Infrastructure as Code
```

## ⚠️ Important Notes

- **Costs:** AWS resources incur charges. Monitor your usage.
- **Security:** Never commit secrets to version control.
- **Backups:** RDS automated backups are enabled (7-day retention).
- **Multi-AZ:** Production uses Multi-AZ for high availability.
- **Scaling:** Lambda auto-scales, RDS requires manual scaling.

## 🎉 Deployment Complete?

After successful deployment:
- ✅ All services running
- ✅ Webhooks configured
- ✅ Monitoring active
- ✅ Dashboard accessible
- ✅ Database initialized

**You're ready for production!** 🚀

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** DevOps Team
