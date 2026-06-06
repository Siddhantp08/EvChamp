# AWS Infrastructure Setup Guide

> **For:** New Team Member - Infrastructure Setup Phase  
> **Time to Complete:** 60-90 minutes  
> **Difficulty:** Intermediate

---

## Overview

This guide walks through setting up all AWS resources needed for the RUL Service. You only need to do this **once** when setting up a new environment.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Application Layer                    │
├─────────────────────────────────────────────────────────────┤
│  API Requests → Application Load Balancer (Port 80/443)     │
│                          ↓                                  │
│  ECS Cluster (evchamp-cluster)                             │
│  ├─ ECS Service (evchamp-rul-service)                      │
│  ├─ Task Definition (evchamp-rul-service)                  │
│  └─ Containers running RUL inference                       │
│                          ↓                                  │
│  ┌──────────────────────────────────────────┐             │
│  │ Container:                               │             │
│  │  - Node.js server (port 5000)           │             │
│  │  - Python ML model (inference)          │             │
│  │  - Health checks                        │             │
│  └──────────────────────────────────────────┘             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Data & Storage Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Neon PostgreSQL (Serverless)                              │
│  └─ Tables: cell_audits, users, etc.                       │
│                                                             │
│  Secrets Manager                                           │
│  └─ DATABASE_URL, CLERK_SECRET_KEY, etc.                  │
│                                                             │
│  CloudWatch Logs                                           │
│  └─ Application logs from containers                       │
│                                                             │
│  ECR (Elastic Container Registry)                          │
│  └─ Docker images for deployment                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. AWS Account Setup

```bash
# You need:
# 1. AWS account access
# 2. Admin or appropriate IAM permissions
# 3. AWS CLI installed (v2.x or higher)
# 4. Configured credentials (aws configure)

# Verify setup
aws sts get-caller-identity
# Output should show your account info
```

### 2. Get Required Information

Ask your team lead for:
- [ ] AWS Account ID
- [ ] PostgreSQL/Neon connection details
- [ ] Clerk API keys (secret & publishable)
- [ ] AWS Region (default: us-east-1)

---

## Phase 1: IAM Roles & Policies (5 minutes)

IAM roles allow ECS to:
- Pull images from ECR
- Write logs to CloudWatch
- Access Secrets Manager

### Create ECS Task Execution Role

```bash
# Create trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach AWS managed policy for ECS task execution
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add policy for Secrets Manager access
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": "arn:aws:secretsmanager:*:*:secret:evchamp/*"
      },
      {
        "Effect": "Allow",
        "Action": "kms:Decrypt",
        "Resource": "*"
      }
    ]
  }'

# Verify
aws iam get-role --role-name ecsTaskExecutionRole
```

### Create ECS Task Role

```bash
# Create the role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://trust-policy.json

# Add policy for application permissions (adjust as needed)
aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name ApplicationPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:*"
      },
      {
        "Effect": "Allow",
        "Action": "s3:*",
        "Resource": "arn:aws:s3:::evchamp-*"
      }
    ]
  }'

# Verify
aws iam get-role --role-name ecsTaskRole
```

---

## Phase 2: Secrets Manager Setup (5 minutes)

Store sensitive data securely instead of in .env files.

### Create Secrets

```bash
# Database connection
aws secretsmanager create-secret \
  --name evchamp/database-url \
  --secret-string 'postgresql://user:pass@host:5432/evchamp' \
  --region us-east-1

# Clerk Secret Key
aws secretsmanager create-secret \
  --name evchamp/clerk-secret-key \
  --secret-string 'sk_live_xxxxxxxxxxxxxxxxxxxxxxx' \
  --region us-east-1

# Clerk Publishable Key
aws secretsmanager create-secret \
  --name evchamp/clerk-publishable-key \
  --secret-string 'pk_test_xxxxxxxxxxxxxxxxxxxxxxx' \
  --region us-east-1

# Clerk Next Publishable Key
aws secretsmanager create-secret \
  --name evchamp/next-clerk-publishable-key \
  --secret-string 'pk_live_xxxxxxxxxxxxxxxxxxxxxxx' \
  --region us-east-1
```

### Verify Secrets

```bash
# List all secrets
aws secretsmanager list-secrets --query 'SecretList[*].Name'

# View a specific secret
aws secretsmanager get-secret-value --secret-id evchamp/database-url

# Update a secret
aws secretsmanager update-secret \
  --secret-id evchamp/database-url \
  --secret-string 'postgresql://new-user:new-pass@new-host:5432/evchamp'
```

---

## Phase 3: CloudWatch Setup (5 minutes)

CloudWatch stores logs from your containers.

### Create Log Group

```bash
# Create log group for ECS
aws logs create-log-group \
  --log-group-name /ecs/evchamp-rul-service \
  --region us-east-1

# Set retention policy (keep logs for 30 days)
aws logs put-retention-policy \
  --log-group-name /ecs/evchamp-rul-service \
  --retention-in-days 30 \
  --region us-east-1

# Verify
aws logs describe-log-groups --query 'logGroups[?logGroupName==`/ecs/evchamp-rul-service`]'
```

### Create Metric Alarms (Optional)

```bash
# Alarm if no tasks are running
aws cloudwatch put-metric-alarm \
  --alarm-name evchamp-rul-service-running-tasks \
  --alarm-description "Alert if RUL service has no running tasks" \
  --metric-name RunningCount \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ClusterName,Value=evchamp-cluster Name=ServiceName,Value=evchamp-rul-service
```

---

## Phase 4: ECR Repository Setup (5 minutes)

ECR is where Docker images are stored.

### Create Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name evchamp-rul-service \
  --encryption-configuration encryptionType=AES \
  --image-scan-on-push \
  --region us-east-1

# Output will show the repository URL:
# [AWS_ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/evchamp-rul-service

# Save this URL - you'll need it
export ECR_REPO_URL=$(aws ecr describe-repositories \
  --repository-names evchamp-rul-service \
  --region us-east-1 \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo $ECR_REPO_URL
```

### Setup Lifecycle Policy (Optional - Auto-clean old images)

```bash
# Keep last 10 images, delete older ones
aws ecr put-lifecycle-policy \
  --repository-name evchamp-rul-service \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 10 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }' \
  --region us-east-1
```

---

## Phase 5: VPC & Networking Setup (10 minutes)

ECS needs a VPC to run tasks.

### Check Default VPC

```bash
# List VPCs
aws ec2 describe-vpcs \
  --query 'Vpcs[].{VpcId:VpcId,IsDefault:IsDefault}' \
  --region us-east-1

# If default VPC exists, use it. If not, you need to create one.
# Most AWS accounts have a default VPC already.
```

### Get VPC & Subnet Information

```bash
# Get default VPC ID
export VPC_ID=$(aws ec2 describe-vpcs \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' \
  --output text \
  --region us-east-1)

echo "VPC ID: $VPC_ID"

# Get public subnets
aws ec2 describe-subnets \
  --filters Name=vpc-id,Values=$VPC_ID \
  --query 'Subnets[].{SubnetId:SubnetId,AvailabilityZone:AvailabilityZone,CidrBlock:CidrBlock}' \
  --region us-east-1

# Save subnet IDs (you'll need these)
export SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters Name=vpc-id,Values=$VPC_ID \
  --query 'Subnets[0:2].SubnetId' \
  --output text \
  --region us-east-1)

echo "Subnet IDs: $SUBNET_IDS"
```

### Create Security Group

```bash
# Create security group for ECS
export SG_ID=$(aws ec2 create-security-group \
  --group-name evchamp-rul-service-sg \
  --description "Security group for EVChamp RUL service" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Allow inbound traffic on port 5000
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow from load balancer (if using one)
# aws ec2 authorize-security-group-ingress \
#   --group-id $SG_ID \
#   --protocol tcp \
#   --port 5000 \
#   --source-group [LOAD_BALANCER_SECURITY_GROUP] \
#   --region us-east-1

# Verify
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --region us-east-1
```

---

## Phase 6: ECS Cluster Setup (10 minutes)

The ECS cluster is where your services run.

### Create Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name evchamp-cluster \
  --region us-east-1

# Verify
aws ecs describe-clusters \
  --clusters evchamp-cluster \
  --region us-east-1
```

### Enable CloudWatch Container Insights (Optional but Recommended)

```bash
# Enable for better monitoring
aws ecs put-cluster-capacity-providers \
  --cluster evchamp-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region us-east-1

# Enable Container Insights
aws ecs update-cluster-settings \
  --cluster evchamp-cluster \
  --settings name=containerInsights,value=enabled \
  --region us-east-1
```

---

## Phase 7: Register Task Definition (5 minutes)

Task definition is like a Docker Compose file for ECS.

### Prepare Task Definition

Update `aws/ecs-task-definition.json`:

```bash
# Replace account ID placeholder
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

sed -i.bak "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" aws/ecs-task-definition.json
```

### Register Task Definition

```bash
# Register the task definition
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-definition.json \
  --region us-east-1

# Verify
aws ecs describe-task-definition \
  --task-definition evchamp-rul-service \
  --region us-east-1
```

---

## Phase 8: Create ECS Service (10 minutes)

Service manages running tasks and auto-scaling.

### Create Service

```bash
# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create service
aws ecs create-service \
  --cluster evchamp-cluster \
  --service-name evchamp-rul-service \
  --task-definition evchamp-rul-service:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS// /,}],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --region us-east-1

# Verify
aws ecs describe-services \
  --cluster evchamp-cluster \
  --services evchamp-rul-service \
  --region us-east-1
```

### (Optional) Setup Auto-scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/evchamp-cluster/evchamp-rul-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 5 \
  --region us-east-1

# Create scaling policy (scale out if CPU > 70%)
aws application-autoscaling put-scaling-policy \
  --policy-name evchamp-rul-service-scale-out \
  --service-namespace ecs \
  --resource-id service/evchamp-cluster/evchamp-rul-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region us-east-1
```

---

## Phase 9: Verify Setup (5 minutes)

### Check All Resources

```bash
# Check IAM roles exist
aws iam get-role --role-name ecsTaskExecutionRole
aws iam get-role --role-name ecsTaskRole

# Check secrets exist
aws secretsmanager list-secrets --query 'SecretList[?name.starts_with(Name, `evchamp`)].Name'

# Check CloudWatch log group
aws logs describe-log-groups --query 'logGroups[?logGroupName==`/ecs/evchamp-rul-service`]'

# Check ECR repository
aws ecr describe-repositories --repository-names evchamp-rul-service

# Check ECS cluster
aws ecs describe-clusters --clusters evchamp-cluster

# Check ECS service
aws ecs describe-services --cluster evchamp-cluster --services evchamp-rul-service
```

### Full Status Summary

```bash
#!/bin/bash
echo "=== EVChamp Infrastructure Status ==="
echo ""
echo "IAM Roles:"
aws iam get-role --role-name ecsTaskExecutionRole --query 'Role.RoleName' 2>/dev/null || echo "❌ ecsTaskExecutionRole not found"
aws iam get-role --role-name ecsTaskRole --query 'Role.RoleName' 2>/dev/null || echo "❌ ecsTaskRole not found"

echo ""
echo "Secrets Manager:"
aws secretsmanager list-secrets --region us-east-1 --query 'SecretList[?name.starts_with(Name, `evchamp`)].Name' --output text

echo ""
echo "CloudWatch Logs:"
aws logs describe-log-groups --region us-east-1 | grep "evchamp-rul-service" && echo "✅ Log group exists"

echo ""
echo "ECR Repository:"
aws ecr describe-repositories --repository-names evchamp-rul-service --region us-east-1 --query 'repositories[0].repositoryUri' --output text

echo ""
echo "ECS Cluster & Service:"
aws ecs describe-services --cluster evchamp-cluster --services evchamp-rul-service --region us-east-1 --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}'

echo ""
echo "✅ Infrastructure setup complete!"
```

---

## Save This Information

Create a file to reference later:

```bash
cat > aws-setup-info.sh << 'EOF'
# EVChamp AWS Configuration

export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID="YOUR_ACCOUNT_ID"
export ECR_REPOSITORY="evchamp-rul-service"
export ECS_CLUSTER="evchamp-cluster"
export ECS_SERVICE="evchamp-rul-service"
export VPC_ID="vpc-xxxxxxxx"
export SUBNET_IDS="subnet-xxxxxxxx subnet-xxxxxxxx"
export SECURITY_GROUP_ID="sg-xxxxxxxx"
export LOG_GROUP="/ecs/evchamp-rul-service"

# Useful commands
# Source this file: source aws-setup-info.sh
EOF
```

---

## Troubleshooting

### Task Won't Start

```bash
# View task events and errors
aws ecs list-tasks --cluster evchamp-cluster --service-name evchamp-rul-service --region us-east-1

# Get task details
TASK_ARN=$(aws ecs list-tasks --cluster evchamp-cluster --service-name evchamp-rul-service --region us-east-1 --query 'taskArns[0]' --output text)

aws ecs describe-tasks --cluster evchamp-cluster --tasks $TASK_ARN --region us-east-1

# Check logs
aws logs tail /ecs/evchamp-rul-service --follow
```

### Image Not Found in ECR

```bash
# Verify image was pushed
aws ecr describe-images --repository-name evchamp-rul-service --region us-east-1

# If empty, build and push:
./aws/deploy.sh latest
```

### Secrets Not Accessible

```bash
# Verify IAM role has permission
aws iam get-role-policy --role-name ecsTaskExecutionRole --policy-name SecretsManagerAccess

# Verify secret exists
aws secretsmanager get-secret-value --secret-id evchamp/database-url --region us-east-1
```

---

## Next Steps

1. **Deploy Application**: Run `./aws/deploy.sh` to deploy your first image
2. **Monitor**: Watch CloudWatch logs: `aws logs tail /ecs/evchamp-rul-service --follow`
3. **Scale**: Increase desired count: `aws ecs update-service --cluster evchamp-cluster --service evchamp-rul-service --desired-count 2`
4. **Setup Domain**: Configure Route53 + ACM for HTTPS

---

## Quick Ref: All Commands in One

```bash
# 1. Setup IAM
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# 2. Setup Secrets
aws secretsmanager create-secret --name evchamp/database-url --secret-string 'postgresql://...'

# 3. Setup CloudWatch
aws logs create-log-group --log-group-name /ecs/evchamp-rul-service

# 4. Setup ECR
aws ecr create-repository --repository-name evchamp-rul-service --image-scan-on-push

# 5. Setup ECS Cluster
aws ecs create-cluster --cluster-name evchamp-cluster

# 6. Register Task Definition
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json

# 7. Create Service
aws ecs create-service --cluster evchamp-cluster --service-name evchamp-rul-service --task-definition evchamp-rul-service:1 --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[...],securityGroups=[...]}"
```

---

✅ **Infrastructure Setup Complete!**

You're now ready to deploy the RUL Service. See `QUICK_START.md` for deployment instructions.
