# This script builds, pushes, and deploys the Smart Office services to AWS using PowerShell.

# Stop script on error
$ErrorActionPreference = "Stop"

# Configuration
$AWS_REGION = "us-east-1"
$AWS_ACCOUNT_ID = "155452520827"
$DOCKER_USERNAME = "Anish025"

# --- Step 1: Initial CDK Deploy to Create Repositories ---
Write-Host "Deploying CDK stack to create infrastructure (including ECR repos)..."
Set-Location -Path ./cdk

# Ensure dependencies are installed
Write-Host "Installing CDK dependencies..."
npm install

Write-Host "Running initial cdk deploy..."
cdk deploy --require-approval never

Set-Location -Path ..
Write-Host "Initial infrastructure deployment complete."

# --- Step 2: Log in to AWS ECR ---
Write-Host "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$($AWS_ACCOUNT_ID).dkr.ecr.$($AWS_REGION).amazonaws.com"

# --- Step 3: Build and Push Docker Images ---
Write-Host "Pruning Docker build cache..."
docker builder prune -f

$SERVICES = @("1-auth-service", "2-room-booking-service", "3-desk-booking-service", "4-notification-service", "5-analytics-service")

$IMAGE_TAG = (Get-Date -Format "yyyyMMddHHmmss")

foreach ($service in $SERVICES) {
  Write-Host "Building and pushing $service..."
  $IMAGE_NAME = "smart-office-$service"
  $IMAGE_URI = "$($AWS_ACCOUNT_ID).dkr.ecr.$($AWS_REGION).amazonaws.com/$($IMAGE_NAME):$IMAGE_TAG"
  
  # Build the Docker image directly with the unique tag
  docker build -t $IMAGE_URI ./services/$service
  
  # Push the image to ECR
  docker push $IMAGE_URI
}

# --- Step 4: Final CDK Deploy to Update Services ---
Write-Host "Deploying CDK stack again to update services with the new images..."
Set-Location -Path ./cdk
cdk deploy --require-approval never --context imageTag=$IMAGE_TAG
Set-Location -Path ..

Write-Host "Deployment complete!"