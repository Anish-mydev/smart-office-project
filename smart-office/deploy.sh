#!/bin/bash

# This script builds, pushes, and deploys the Smart Office services to AWS.

# Exit on error
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="155452520827"
DOCKER_USERNAME="Anish025"

# --- Step 1: Log in to AWS ECR ---
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# --- Step 2: Build and Push Docker Images ---
SERVICES=("1-auth-service" "2-room-booking-service" "3-desk-booking-service" "4-notification-service" "5-analytics-service")

for service in "${SERVICES[@]}"
do
  echo "Building and pushing $service..."
  IMAGE_NAME="smart-office-$service"
  IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:latest"
  
  # Build the Docker image
  docker build -t $IMAGE_NAME ./services/$service
  
  # Tag the image for ECR
  docker tag $IMAGE_NAME:latest $IMAGE_URI
  
  # Push the image to ECR
  docker push $IMAGE_URI
done

# --- Step 3: Deploy the CDK Stack ---
echo "Deploying CDK stack..."
cd cdk
npm install
cdk deploy --require-approval never

echo "Deployment complete!"
