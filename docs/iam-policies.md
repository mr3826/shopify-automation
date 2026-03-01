# IAM Policies and Roles

## Lambda Execution Role Policy

### Create Trust Policy

Save as `lambda-trust-policy.json`:

```json
{
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
}
```

### Lambda Execution Policy

Save as `lambda-execution-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Sid": "VPCAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:shopify-automation/*"
      ]
    },
    {
      "Sid": "KMSDecrypt",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": [
            "secretsmanager.us-east-1.amazonaws.com"
          ]
        }
      }
    }
  ]
}
```

### Create IAM Role

```bash
# Create role
aws iam create-role \
  --role-name shopify-lambda-execution-role \
  --assume-role-policy-document file://lambda-trust-policy.json \
  --description "Execution role for Shopify automation Lambda functions"

export LAMBDA_ROLE_ARN=$(aws iam get-role \
  --role-name shopify-lambda-execution-role \
  --query 'Role.Arn' --output text)

# Attach custom policy
aws iam put-role-policy \
  --role-name shopify-lambda-execution-role \
  --policy-name shopify-lambda-execution-policy \
  --policy-document file://lambda-execution-policy.json

# Wait for IAM role propagation
sleep 10
```

---

## API Gateway Execution Role (for CloudWatch Logs)

Save as `apigateway-cloudwatch-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

Save as `apigateway-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

```bash
# Create API Gateway role
aws iam create-role \
  --role-name shopify-apigateway-cloudwatch-role \
  --assume-role-policy-document file://apigateway-trust-policy.json

aws iam put-role-policy \
  --role-name shopify-apigateway-cloudwatch-role \
  --policy-name apigateway-cloudwatch-policy \
  --policy-document file://apigateway-cloudwatch-policy.json

export APIGW_ROLE_ARN=$(aws iam get-role \
  --role-name shopify-apigateway-cloudwatch-role \
  --query 'Role.Arn' --output text)
```

---

## CloudFront Origin Access Identity Policy

Save as `s3-cloudfront-policy.json` (replace BUCKET_NAME):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity EOAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

