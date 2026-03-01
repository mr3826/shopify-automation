# Security, Monitoring & Operations

## 10. Security Hardening Checklist

### Network Security
- [x] VPC with private subnets for Lambda and RDS
- [x] Security groups with least privilege rules
- [x] RDS not publicly accessible
- [x] NAT Gateway for Lambda internet access
- [x] VPC Flow Logs enabled

```bash
# Enable VPC Flow Logs
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids $VPC_ID \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/shopify-automation \
  --deliver-logs-permission-arn arn:aws:iam::ACCOUNT_ID:role/flowlogsRole
```

### Data Security
- [x] RDS encryption at rest enabled
- [x] S3 bucket encryption enabled
- [x] Secrets Manager for credentials
- [x] SSL/TLS for all data in transit
- [x] Database backups enabled (7-day retention)

### Application Security
- [x] API Gateway throttling configured
- [x] Lambda execution role with minimal permissions
- [x] Environment variables not containing secrets
- [x] Webhook signature verification

### Webhook Signature Verification

Add to Lambda functions:

```javascript
const crypto = require('crypto');

function verifyShopifyWebhook(body, hmacHeader, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmacHeader;
}

// In handler
const hmac = event.headers['x-shopify-hmac-sha256'];
const isValid = verifyShopifyWebhook(event.body, hmac, WEBHOOK_SECRET);
if (!isValid) {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

### API Rate Limiting

```bash
# Update API Gateway stage settings
aws apigatewayv2 update-stage \
  --api-id $API_ID \
  --stage-name production \
  --default-route-settings '{
    "ThrottlingBurstLimit": 5000,
    "ThrottlingRateLimit": 2000
  }'
```

### WAF Protection (Optional but Recommended)

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name shopify-automation-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=shopifyAutomationWAF \
  --region us-east-1

# Associate with API Gateway
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:ACCOUNT_ID:regional/webacl/shopify-automation-waf/ID \
  --resource-arn arn:aws:apigateway:us-east-1::/restapis/$API_ID/stages/production
```

---

## 11. Monitoring & Alerting Setup

### CloudWatch Dashboards

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name shopify-automation-dashboard \
  --dashboard-body file://cloudwatch-dashboard.json
```

Save as `cloudwatch-dashboard.json`:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Total Invocations"}],
          [".", "Errors", {"stat": "Sum", "label": "Errors"}],
          [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          [".", "DatabaseConnections", {"stat": "Average"}],
          [".", "FreeableMemory", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", {"stat": "Sum"}],
          [".", "4XXError", {"stat": "Sum"}],
          [".", "5XXError", {"stat": "Sum"}],
          [".", "Latency", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Gateway Metrics"
      }
    }
  ]
}
```

### CloudWatch Alarms

```bash
# Lambda Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name shopify-lambda-high-errors \
  --alarm-description "Alert when Lambda error rate exceeds 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:shopify-alerts

# RDS CPU Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name shopify-rds-high-cpu \
  --alarm-description "Alert when RDS CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=shopify-automation-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:shopify-alerts

# RDS Connection Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name shopify-rds-high-connections \
  --alarm-description "Alert when RDS connections exceed 80" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=shopify-automation-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:shopify-alerts

# API Gateway 5XX Errors
aws cloudwatch put-metric-alarm \
  --alarm-name shopify-api-5xx-errors \
  --alarm-description "Alert on API Gateway 5XX errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiId,Value=$API_ID \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:shopify-alerts
```

### SNS Topic for Alerts

```bash
# Create SNS topic
aws sns create-topic --name shopify-alerts --query 'TopicArn' --output text

export SNS_TOPIC_ARN=<topic-arn>

# Subscribe email
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe Slack (requires Lambda integration)
# See: https://docs.aws.amazon.com/chatbot/latest/adminguide/slack-setup.html
```

### X-Ray Tracing (Optional)

```bash
# Enable X-Ray for Lambda
aws lambda update-function-configuration \
  --function-name shopify-order-router \
  --tracing-config Mode=Active

aws lambda update-function-configuration \
  --function-name shopify-inventory-sync \
  --tracing-config Mode=Active

aws lambda update-function-configuration \
  --function-name shopify-chatbot \
  --tracing-config Mode=Active

# Enable X-Ray for API Gateway
aws apigatewayv2 update-stage \
  --api-id $API_ID \
  --stage-name production \
  --default-route-settings '{"DetailedMetricsEnabled": true}'
```

### Log Insights Queries

Useful CloudWatch Logs Insights queries:

```sql
-- Find errors in Lambda logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- API latency analysis
fields @timestamp, @duration
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)

-- Count requests by status code
fields @timestamp, statusCode
| stats count() by statusCode

-- Find slow database queries
fields @timestamp, @message
| filter @message like /query took/
| parse @message "query took * ms" as duration
| filter duration > 1000
| sort duration desc
```

---

## 12. Cost Estimation

### Monthly Cost Breakdown (Moderate Traffic: 100K requests/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Lambda** | 3 functions, 512MB-1GB, 100K invocations, 2s avg | $5-10 |
| **API Gateway** | HTTP API, 100K requests | $0.10 |
| **RDS PostgreSQL** | db.t3.micro, Multi-AZ, 20GB storage | $30-40 |
| **S3** | 5GB storage, 10K requests | $0.50 |
| **CloudFront** | 10GB data transfer, 100K requests | $1-2 |
| **NAT Gateway** | 1 NAT Gateway, 10GB data transfer | $35-40 |
| **Secrets Manager** | 6 secrets | $2.40 |
| **CloudWatch Logs** | 5GB ingestion, 30-day retention | $2.50 |
| **Data Transfer** | Inter-AZ, outbound | $5-10 |
| **Total** | | **~$80-110/month** |

### High Traffic Scenario (1M requests/month)

| Service | Monthly Cost |
|---------|--------------|
| Lambda | $40-60 |
| API Gateway | $1 |
| RDS (db.t3.small) | $60-80 |
| NAT Gateway | $40-50 |
| Other services | $15-20 |
| **Total** | **~$160-210/month** |

### Cost Optimization Tips

1. **Use Lambda Reserved Concurrency** for predictable workloads
2. **RDS Reserved Instances** (save 30-60% with 1-year commitment)
3. **S3 Intelligent-Tiering** for dashboard assets
4. **CloudFront caching** to reduce origin requests
5. **VPC Endpoints** instead of NAT Gateway for AWS services ($7/month vs $35/month)
6. **CloudWatch Logs retention** - reduce to 7 days for non-critical logs

```bash
# Create VPC Endpoint for Secrets Manager (saves NAT Gateway costs)
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.us-east-1.secretsmanager \
  --subnet-ids $PRIVATE_SUBNET_1A $PRIVATE_SUBNET_1B \
  --security-group-ids $LAMBDA_SG_ID
```

