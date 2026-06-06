#!/bin/bash

################################################################################
# EVChamp RUL Service Deployment Script
# Automates Docker build, ECR push, and ECS deployment
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-}
ECR_REPOSITORY="evchamp-rul-service"
ECS_CLUSTER="evchamp-cluster"
ECS_SERVICE="evchamp-rul-service"
IMAGE_TAG="${1:-latest}"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${GREEN}==================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}==================================${NC}\n"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_required_tools() {
    print_header "Checking Required Tools"
    
    for tool in aws docker git; do
        if command -v $tool &> /dev/null; then
            print_success "$tool is installed"
        else
            print_error "$tool is not installed"
            exit 1
        fi
    done
}

get_aws_account_id() {
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    fi
    print_info "AWS Account ID: $AWS_ACCOUNT_ID"
}

verify_aws_credentials() {
    print_header "Verifying AWS Credentials"
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured or expired"
        exit 1
    fi
    
    print_success "AWS credentials verified"
}

check_ecr_repository() {
    print_header "Checking ECR Repository"
    
    if aws ecr describe-repositories \
        --repository-names "$ECR_REPOSITORY" \
        --region "$AWS_REGION" &> /dev/null; then
        print_success "ECR repository '$ECR_REPOSITORY' exists"
    else
        print_info "Creating ECR repository '$ECR_REPOSITORY'..."
        aws ecr create-repository \
            --repository-name "$ECR_REPOSITORY" \
            --region "$AWS_REGION" \
            --encryption-configuration encryptionType=AES
        print_success "ECR repository created"
    fi
}

check_ecs_cluster() {
    print_header "Checking ECS Cluster"
    
    if aws ecs describe-clusters \
        --clusters "$ECS_CLUSTER" \
        --region "$AWS_REGION" | grep -q "ACTIVE"; then
        print_success "ECS cluster '$ECS_CLUSTER' exists"
    else
        print_error "ECS cluster '$ECS_CLUSTER' not found or inactive"
        echo -e "\n${YELLOW}Create the cluster with:${NC}"
        echo "aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION"
        exit 1
    fi
}

build_docker_image() {
    print_header "Building Docker Image"
    
    docker build \
        -f server/Dockerfile \
        -t "$ECR_REPOSITORY:$IMAGE_TAG" \
        -t "$ECR_REPOSITORY:latest" \
        .
    
    print_success "Docker image built successfully"
}

login_to_ecr() {
    print_header "Authenticating Docker with ECR"
    
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin \
        "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    print_success "Docker authenticated with ECR"
}

push_to_ecr() {
    print_header "Pushing Image to ECR"
    
    local ecr_uri="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    local image_uri="${ecr_uri}/${ECR_REPOSITORY}"
    
    # Tag images for ECR
    docker tag "$ECR_REPOSITORY:$IMAGE_TAG" "${image_uri}:${IMAGE_TAG}"
    docker tag "$ECR_REPOSITORY:latest" "${image_uri}:latest"
    
    # Push images
    print_info "Pushing ${image_uri}:${IMAGE_TAG}..."
    docker push "${image_uri}:${IMAGE_TAG}"
    
    print_info "Pushing ${image_uri}:latest..."
    docker push "${image_uri}:latest"
    
    print_success "Image pushed to ECR successfully"
}

update_task_definition() {
    print_header "Updating Task Definition"
    
    local task_def_file="aws/ecs-task-definition.json"
    
    if [ ! -f "$task_def_file" ]; then
        print_error "Task definition file not found: $task_def_file"
        exit 1
    fi
    
    # Replace account ID in task definition
    local temp_file=$(mktemp)
    sed "s/YOUR_ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" "$task_def_file" > "$temp_file"
    
    # Register new task definition
    aws ecs register-task-definition \
        --cli-input-json file://"$temp_file" \
        --region "$AWS_REGION" > /dev/null
    
    rm "$temp_file"
    print_success "Task definition registered"
}

deploy_to_ecs() {
    print_header "Deploying to ECS"
    
    print_info "Updating ECS service with new task definition..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --force-new-deployment \
        --region "$AWS_REGION" > /dev/null
    
    print_success "ECS service update initiated"
}

wait_for_deployment() {
    print_header "Waiting for Deployment to Stabilize"
    
    print_info "This may take 2-5 minutes..."
    
    if aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --region "$AWS_REGION"; then
        print_success "Deployment completed and service is stable"
    else
        print_error "Deployment did not stabilize within timeout"
        print_info "Check ECS console for details"
        exit 1
    fi
}

check_deployment_status() {
    print_header "Checking Deployment Status"
    
    # Get service info
    local service_info=$(aws ecs describe-services \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --region "$AWS_REGION" \
        --query 'services[0]')
    
    local desired=$(echo "$service_info" | grep -o '"desiredCount": [0-9]*' | grep -o '[0-9]*')
    local running=$(echo "$service_info" | grep -o '"runningCount": [0-9]*' | grep -o '[0-9]*')
    local pending=$(echo "$service_info" | grep -o '"pendingCount": [0-9]*' | grep -o '[0-9]*')
    
    echo -e "\n${YELLOW}Service Status:${NC}"
    echo "  Desired Count: $desired"
    echo "  Running Count: $running"
    echo "  Pending Count: $pending"
    
    if [ "$desired" -eq "$running" ] && [ "$pending" -eq 0 ]; then
        print_success "All tasks are running"
    else
        print_info "Tasks are being launched. Check again in a moment."
    fi
    
    # Get task info
    local tasks=$(aws ecs list-tasks \
        --cluster "$ECS_CLUSTER" \
        --service-name "$ECS_SERVICE" \
        --region "$AWS_REGION" \
        --query 'taskArns' \
        --output text)
    
    if [ -n "$tasks" ]; then
        echo -e "\n${YELLOW}Running Tasks:${NC}"
        aws ecs describe-tasks \
            --cluster "$ECS_CLUSTER" \
            --tasks $tasks \
            --region "$AWS_REGION" \
            --query 'tasks[*].[taskArn,lastStatus]' \
            --output table
    fi
}

show_logs() {
    print_header "Recent Logs"
    
    echo -e "${YELLOW}Last 20 log entries:${NC}\n"
    aws logs tail "/ecs/$ECS_SERVICE" \
        --max-items 20 \
        --follow=false \
        --region "$AWS_REGION" 2>/dev/null || print_info "No logs available yet"
}

show_summary() {
    print_header "Deployment Summary"
    
    echo -e "${YELLOW}Configuration:${NC}"
    echo "  AWS Region: $AWS_REGION"
    echo "  AWS Account: $AWS_ACCOUNT_ID"
    echo "  ECR Repository: $ECR_REPOSITORY"
    echo "  Image Tag: $IMAGE_TAG"
    echo "  ECS Cluster: $ECS_CLUSTER"
    echo "  ECS Service: $ECS_SERVICE"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "  1. View live logs:"
    echo "     aws logs tail /ecs/$ECS_SERVICE --follow --region $AWS_REGION"
    echo ""
    echo "  2. Check service status:"
    echo "     aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
    echo ""
    echo "  3. Scale service:"
    echo "     aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --desired-count 3 --region $AWS_REGION"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    print_header "EVChamp RUL Service Deployment"
    
    echo -e "${YELLOW}Starting deployment process...${NC}\n"
    
    # Pre-deployment checks
    check_required_tools
    get_aws_account_id
    verify_aws_credentials
    check_ecr_repository
    check_ecs_cluster
    
    # Build and push
    build_docker_image
    login_to_ecr
    push_to_ecr
    
    # Deploy
    update_task_definition
    deploy_to_ecs
    wait_for_deployment
    
    # Post-deployment
    check_deployment_status
    show_logs
    show_summary
    
    print_header "Deployment Complete!"
    print_success "RUL Service has been successfully deployed"
}

# Handle errors
trap 'print_error "Deployment failed"; exit 1' ERR

# Run main function
main "$@"
