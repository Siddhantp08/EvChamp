# Quick Start Guide - RUL Model Deployment

> **For:** New Team Member  
> **Duration:** 30-45 minutes to get running locally  
> **Level:** Beginner to Intermediate

---

## What You're Setting Up

You'll be deploying the **RUL (Remaining Useful Life) Model** - a machine learning service that predicts battery lifespan. It runs in Docker containers on AWS and serves predictions via a REST API.

---

## Prerequisites (First Time Only)

### 1. Install Required Software

```bash
# macOS (using Homebrew)
brew install git docker awscli nodejs

# Windows (using Chocolatey)
choco install git docker docker-compose awscli nodejs

# Linux (Ubuntu/Debian)
sudo apt-get install git docker.io docker-compose aws-cli nodejs npm
```

### 2. Start Docker

```bash
# macOS
open -a Docker

# Windows
# Open Docker Desktop from Start menu

# Linux
sudo systemctl start docker
sudo usermod -a -G docker $USER
```

### 3. Configure AWS Credentials

```bash
# Get credentials from team (AWS Access Key & Secret)
aws configure

# Enter when prompted:
# AWS Access Key ID: [YOUR_KEY]
# AWS Secret Access Key: [YOUR_SECRET]
# Default region name: us-east-1
# Default output format: json
```

### 4. Clone Repository

```bash
git clone https://github.com/Siddhantp08/EvChamp.git
cd EvChamp
```

---

## Step 1: Local Development Setup (15 minutes)

### Create Environment File

```bash
# Copy template
cp server/.env.example server/.env

# Open and edit with your values
# You need these from the team:
# - DATABASE_URL (PostgreSQL connection)
# - CLERK_SECRET_KEY
# - Other API keys
```

**File: `server/.env`**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
PORT=5000
CLERK_SECRET_KEY=sk_live_xxxxx
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Install Dependencies

```bash
cd server
npm install
pip install -r requirements.txt
```

### Test Locally

```bash
# Option A: Direct Node (requires Python running separately)
npm start

# Option B: Docker Compose (recommended - everything in one command)
cd ..
docker-compose up --build
```

### Verify It's Working

```bash
# New terminal
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-06-06T10:30:00.000Z"}
```

✅ **Success!** You have the service running locally.

---

## Step 2: Push to AWS ECR (10 minutes)

### Build Docker Image

```bash
docker build -f server/Dockerfile -t evchamp-rul-service:latest .
```

### Push to AWS ECR

```bash
# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Authenticate Docker with AWS
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Tag the image
docker tag evchamp-rul-service:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/evchamp-rul-service:latest

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/evchamp-rul-service:latest
```

✅ **Success!** Image is now in AWS ECR.

---

## Step 3: Deploy to AWS ECS (10 minutes)

### Automated Deployment (Easy Way)

```bash
# Make script executable
chmod +x aws/deploy.sh

# Run deployment
./aws/deploy.sh latest

# This script will:
# - Build Docker image
# - Push to ECR
# - Update ECS task definition
# - Deploy to ECS service
# - Wait for deployment to complete
# - Show logs and status
```

### Manual Deployment (If Script Doesn't Work)

```bash
# 1. Update ECS service
aws ecs update-service \
  --cluster evchamp-cluster \
  --service evchamp-rul-service \
  --force-new-deployment \
  --region us-east-1

# 2. Wait for deployment
aws ecs wait services-stable \
  --cluster evchamp-cluster \
  --services evchamp-rul-service \
  --region us-east-1

# 3. Check status
aws ecs describe-services \
  --cluster evchamp-cluster \
  --services evchamp-rul-service \
  --region us-east-1
```

✅ **Success!** Service is deployed to AWS.

---

## Verify Deployment

### Check Service Health

```bash
# Get running tasks
aws ecs list-tasks \
  --cluster evchamp-cluster \
  --service-name evchamp-rul-service \
  --region us-east-1

# View logs
aws logs tail /ecs/evchamp-rul-service --follow
```

### Test API (If Public IP Available)

```bash
# Get load balancer IP or task public IP
curl http://[LOAD_BALANCER_OR_TASK_IP]:5000/api/health
```

---

## Common Issues & Fixes

### Issue 1: "Docker is not running"

```bash
# macOS
open -a Docker

# Windows
# Open Docker Desktop app

# Then retry: docker ps
```

### Issue 2: "Cannot connect to database"

```bash
# Verify .env file has correct DATABASE_URL
cat server/.env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue 3: "AWS credentials not configured"

```bash
# Reconfigure
aws configure

# Or set manually
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
aws sts get-caller-identity  # Test
```

### Issue 4: "ECR Repository does not exist"

```bash
# Create repository
aws ecr create-repository \
  --repository-name evchamp-rul-service \
  --region us-east-1
```

### Issue 5: "Port 5000 already in use"

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (macOS/Linux)
kill -9 [PID]

# Or use different port
PORT=5001 npm start
```

---

## Daily Workflow

### When You Want to Deploy Changes

```bash
# 1. Make your code changes
# 2. Commit to Git
git add .
git commit -m "Your changes"

# 3. Deploy to AWS
cd EvChamp
./aws/deploy.sh v2.0  # or any version tag

# 4. Monitor logs
aws logs tail /ecs/evchamp-rul-service --follow
```

### Checking Status

```bash
# Is service running?
aws ecs describe-services \
  --cluster evchamp-cluster \
  --services evchamp-rul-service \
  --region us-east-1 \
  --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}'

# Recent errors?
aws logs filter-log-events \
  --log-group-name /ecs/evchamp-rul-service \
  --filter-pattern "ERROR"

# Scaling up/down
aws ecs update-service \
  --cluster evchamp-cluster \
  --service evchamp-rul-service \
  --desired-count 3
```

---

## Useful Commands Cheat Sheet

```bash
# Local Testing
docker-compose up --build          # Start everything
docker-compose down                # Stop everything
docker-compose logs -f             # View logs

# Docker
docker build -f server/Dockerfile -t my-image:latest .
docker run -p 5000:5000 my-image:latest
docker exec -it [CONTAINER_ID] /bin/sh
docker logs [CONTAINER_ID]

# AWS ECR
aws ecr describe-repositories
aws ecr list-images --repository-name evchamp-rul-service
aws ecr batch-delete-image --repository-name evchamp-rul-service --image-ids imageTag=latest

# AWS ECS
aws ecs list-clusters
aws ecs list-services --cluster evchamp-cluster
aws ecs describe-services --cluster evchamp-cluster --services evchamp-rul-service
aws ecs update-service --cluster evchamp-cluster --service evchamp-rul-service --force-new-deployment

# AWS Logs
aws logs describe-log-groups
aws logs tail /ecs/evchamp-rul-service --follow
aws logs filter-log-events --log-group-name /ecs/evchamp-rul-service --filter-pattern "ERROR"
```

---

## What's Happening Behind the Scenes?

```
Your Code Changes
    ↓
[git commit]
    ↓
[docker build] - Creates container with your code
    ↓
[docker push to ECR] - Uploads image to AWS registry
    ↓
[aws ecs update-service] - Tells AWS to use new image
    ↓
[aws ecs launch new tasks] - Starts containers with new code
    ↓
✅ API is updated and live!
```

---

## Next: Learn More

Once you're comfortable with the basics:

1. **Read:** [RUL_MODEL_DEPLOYMENT.md](../RUL_MODEL_DEPLOYMENT.md) - Full documentation
2. **Understand:** How the RUL model makes predictions
3. **Monitor:** CloudWatch dashboards and metrics
4. **Scale:** Configure auto-scaling policies
5. **Optimize:** Performance tuning and cost optimization

---

## Ask for Help

If you get stuck:

1. **Check logs first:**
   ```bash
   aws logs tail /ecs/evchamp-rul-service --follow
   ```

2. **Review the full guide:**
   Open `RUL_MODEL_DEPLOYMENT.md` in the repo root

3. **Common issues section above:**
   Most problems are listed with solutions

4. **Ask the team:**
   Get Slack/email contacts for support

---

## You're Ready! 🚀

```bash
# One-liner to remember everything works:
docker-compose up && docker-compose exec rul-service curl http://localhost:5000/api/health
```

**Next Step:** Make a small change to the code, deploy it using `./aws/deploy.sh`, and watch it go live!

---

Good luck! Welcome to the team! 👋
