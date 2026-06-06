# EVChamp RUL Model - Team Handover Documentation

> **Welcome to the Team! 👋**
>
> This documentation has been prepared to help you understand and deploy the RUL (Remaining Useful Life) Model service. 
> 
> **Start here** and follow the guides in order. You should be able to deploy the service to AWS within 2-3 hours.

---

## 📚 Documentation Structure

### 1. **Start Here: QUICK_START.md** ⭐ (30-45 minutes)
**Best for:** Getting up and running quickly

- Local environment setup
- Running service with Docker Compose
- Testing the API locally
- Common troubleshooting

**When to read:** First thing after cloning the repo

---

### 2. **AWS_INFRASTRUCTURE_SETUP.md** (60-90 minutes)
**Best for:** Setting up AWS infrastructure

- One-time infrastructure setup
- IAM roles & policies
- Secrets Manager
- CloudWatch
- ECR repository
- ECS cluster & service
- Auto-scaling (optional)

**When to read:** After getting comfortable with local deployment

---

### 3. **RUL_MODEL_DEPLOYMENT.md** (Comprehensive Reference)
**Best for:** Understanding the complete architecture

- RUL model overview
- System architecture diagrams
- Detailed deployment procedures
- API endpoints
- Monitoring & maintenance
- Full troubleshooting guide
- Reference commands

**When to read:** For deep understanding and troubleshooting

---

### 4. **Configuration Files** (Use for deployment)

#### `docker-compose.yml`
- Local development environment
- Defines services, networks, volumes
- Used with `docker-compose up`

#### `aws/ecs-task-definition.json`
- ECS task configuration
- Container settings, environment variables
- Updated by deployment script

#### `aws/deploy.sh`
- Automated deployment script
- Builds image → Pushes to ECR → Deploys to ECS
- Run with: `./aws/deploy.sh latest`

---

## 🚀 Quick Path to Deployment

```
Day 1: Local Setup
├─ Read: QUICK_START.md
├─ Run: docker-compose up
└─ Test: curl http://localhost:5000/api/health
         ✅ You're running locally!

Day 2: AWS Setup (once)
├─ Read: AWS_INFRASTRUCTURE_SETUP.md
├─ Create: IAM roles, Secrets, CloudWatch, ECR, ECS
└─ Verify: All resources created
         ✅ Infrastructure is ready!

Day 2/3: Deploy to AWS
├─ Build image: docker build -f server/Dockerfile -t evchamp-rul-service .
├─ Deploy: ./aws/deploy.sh latest
└─ Check: aws logs tail /ecs/evchamp-rul-service --follow
         ✅ Service is live on AWS!
```

---

## 📋 What is RUL Model Service?

**RUL = Remaining Useful Life**

It's a machine learning service that:
- 🔋 Predicts battery health/lifespan
- 📊 Analyzes battery audit data
- 🤖 Uses trained ML models (scikit-learn)
- 🌐 Serves predictions via REST API
- 🐳 Runs in Docker containers
- ☁️ Deployed on AWS ECS

**Stack:**
- Backend: Node.js + Express
- ML: Python + scikit-learn
- Database: Neon PostgreSQL
- Deployment: Docker + AWS ECS/ECR
- Monitoring: CloudWatch

---

## 🎯 Key Files & Directories

```
EVChamp/
├─ server/                          # Node.js server & Python ML service
│  ├─ index.js                      # REST API endpoints
│  ├─ rul_service.py                # ML model inference
│  ├─ Dockerfile                    # Multi-stage Docker build
│  ├─ package.json                  # Node.js dependencies
│  ├─ requirements.txt               # Python dependencies
│  └─ .env                          # 🔒 Environment variables (not in git)
│
├─ models/                          # Pre-trained ML models
│  └─ rul/trained_models/           # Pickle files for inference
│
├─ aws/                             # AWS deployment files
│  ├─ ecs-task-definition.json      # ECS task configuration
│  └─ deploy.sh                     # Deployment automation script
│
├─ docker-compose.yml               # Local dev environment
├─ QUICK_START.md                   # 👈 Read this first
├─ AWS_INFRASTRUCTURE_SETUP.md      # Infrastructure setup guide
├─ RUL_MODEL_DEPLOYMENT.md          # Comprehensive reference
└─ .env.example                     # Template for environment variables
```

---

## ⚠️ Important: Get These from Team

Before you start, ask your team for:

- [ ] **AWS Account ID** - For AWS setup
- [ ] **AWS Access Keys** - For CLI authentication
- [ ] **PostgreSQL/Neon URL** - Database connection
  - Format: `postgresql://user:pass@host:5432/evchamp`
- [ ] **Clerk Secret Key** - Authentication
  - Starts with: `sk_live_...`
- [ ] **Clerk Publishable Keys** - Client-side auth
  - Format: `pk_test_...` and `pk_live_...`

These go in:
1. `server/.env` (local development)
2. AWS Secrets Manager (production)

---

## 📝 Step-by-Step Getting Started

### Step 1: Clone Repo (2 minutes)

```bash
git clone https://github.com/Siddhantp08/EvChamp.git
cd EvChamp
```

### Step 2: Read QUICK_START.md (10 minutes)

This file walks through everything you need to:
- Install prerequisites
- Create `.env` file
- Run locally with Docker
- Test the API

### Step 3: Get Running Locally (15 minutes)

```bash
# Copy environment template
cp server/.env.example server/.env

# Add credentials from your team
nano server/.env

# Start everything
docker-compose up --build

# In another terminal, test it
curl http://localhost:5000/api/health
```

### Step 4: Read AWS_INFRASTRUCTURE_SETUP.md (60 minutes)

This walks through one-time AWS setup:
- IAM roles
- Secrets Manager
- CloudWatch
- ECR
- ECS cluster

### Step 5: Deploy to AWS (30 minutes)

```bash
# Build and push image to ECR
./aws/deploy.sh latest

# Or manually:
docker build -f server/Dockerfile -t evchamp-rul-service .
aws ecr get-login-password | docker login --username AWS --password-stdin [ECR_URL]
docker push [ECR_URL]/evchamp-rul-service:latest
```

### Step 6: Monitor & Verify (10 minutes)

```bash
# Watch logs
aws logs tail /ecs/evchamp-rul-service --follow

# Check service status
aws ecs describe-services \
  --cluster evchamp-cluster \
  --services evchamp-rul-service
```

---

## 🔍 Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Your Changes / Deployments          │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ (docker build)
        ┌──────────────────────┐
        │   Docker Image       │
        │  (Node.js + Python)  │
        └──────────┬───────────┘
                   │
                   ↓ (docker push)
        ┌──────────────────────┐
        │   AWS ECR            │
        │  (Image Registry)    │
        └──────────┬───────────┘
                   │
                   ↓ (aws ecs update-service)
        ┌──────────────────────┐
        │   AWS ECS            │
        │  (Orchestration)     │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
    ┌────────┐            ┌────────┐
    │ Task 1 │            │ Task 2 │
    │(Port   │            │(Port   │
    │ 5000)  │            │ 5000)  │
    └─┬──────┘            └─┬──────┘
      │                     │
      └──────────┬──────────┘
                 ↓
        ┌──────────────────────┐
        │  Load Balancer       │
        │  (or Security Group) │
        └──────────┬───────────┘
                   │
                   ↓
           🌍 Internet / Clients
```

---

## ✅ Success Checklist

After you complete this handover:

- [ ] Read QUICK_START.md
- [ ] Service running locally with `docker-compose up`
- [ ] API responding to `curl http://localhost:5000/api/health`
- [ ] AWS infrastructure set up (IAM, Secrets, ECR, ECS)
- [ ] Image built and pushed to ECR
- [ ] Service deployed to AWS ECS
- [ ] Logs visible in CloudWatch
- [ ] API responding from AWS deployment
- [ ] Understood the architecture
- [ ] Able to deploy changes using `./aws/deploy.sh`

---

## 🐛 When Something Goes Wrong

### 1. Check Documentation First
- **Local issues**: See "Common Issues" in QUICK_START.md
- **AWS issues**: See "Troubleshooting" in RUL_MODEL_DEPLOYMENT.md
- **Infrastructure issues**: See "Troubleshooting" in AWS_INFRASTRUCTURE_SETUP.md

### 2. Check Logs
```bash
# Local logs
docker-compose logs -f

# AWS logs
aws logs tail /ecs/evchamp-rul-service --follow

# Specific error pattern
aws logs filter-log-events \
  --log-group-name /ecs/evchamp-rul-service \
  --filter-pattern "ERROR"
```

### 3. Verify Resources Exist
```bash
# ECS service running?
aws ecs describe-services --cluster evchamp-cluster --services evchamp-rul-service

# Image in ECR?
aws ecr list-images --repository-name evchamp-rul-service

# Secrets configured?
aws secretsmanager list-secrets

# Database reachable?
psql $DATABASE_URL -c "SELECT 1"
```

---

## 📞 Quick Reference

### Useful Commands

```bash
# Local development
docker-compose up               # Start everything
docker-compose down             # Stop everything
docker-compose logs -f          # Watch logs

# AWS ECR
aws ecr describe-repositories
aws ecr list-images --repository-name evchamp-rul-service

# AWS ECS
aws ecs list-services --cluster evchamp-cluster
aws ecs describe-services --cluster evchamp-cluster --services evchamp-rul-service
aws ecs update-service --cluster evchamp-cluster --service evchamp-rul-service --force-new-deployment

# AWS Logs
aws logs tail /ecs/evchamp-rul-service --follow
aws logs filter-log-events --log-group-name /ecs/evchamp-rul-service --filter-pattern "ERROR"

# Deployment
./aws/deploy.sh latest          # Build → Push → Deploy (all at once)
```

---

## 🎓 Learning Path

**After you're comfortable:**

1. **Deep dive into ML model** - How the RUL predictions work
2. **Database schema** - Understanding the PostgreSQL tables
3. **API integration** - How the frontend calls these endpoints
4. **Monitoring** - Setup CloudWatch dashboards
5. **Auto-scaling** - Configure ECS auto-scaling policies
6. **Cost optimization** - Monitor AWS spending

---

## 📞 Getting Help

If you're stuck:

1. **Search the documentation** - Most issues are documented
2. **Check the logs** - `aws logs tail /ecs/evchamp-rul-service --follow`
3. **Ask team members** - They're expecting questions
4. **Review the troubleshooting sections** - Specific guides for common issues

---

## 🎉 You're Ready!

**Next action:** 
1. Read `QUICK_START.md`
2. Run `docker-compose up`
3. Test `curl http://localhost:5000/api/health`

That's it for day 1! Day 2 you'll set up AWS infrastructure.

---

## Document Map

| Document | Time | Best For | When |
|----------|------|----------|------|
| **QUICK_START.md** | 30-45 min | Getting running fast | Day 1 - First thing |
| **AWS_INFRASTRUCTURE_SETUP.md** | 60-90 min | AWS setup (one-time) | Day 2 - After local works |
| **RUL_MODEL_DEPLOYMENT.md** | Reference | Deep understanding | Anytime for details |
| **Dockerfile** | 5 min | Understanding containerization | When curious |
| **ecs-task-definition.json** | 5 min | Understanding ECS config | When deploying |
| **deploy.sh** | 5 min | Understanding deployment | When running deployment |

---

**Created with ❤️ for a smooth handover**

Good luck! You've got this! 🚀
