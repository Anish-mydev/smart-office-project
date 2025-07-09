#!/bin/bash

# This script provisions the necessary AWS infrastructure for the Smart Office project.
# It uses the AWS CLI and requires you to have it configured with appropriate permissions.

# Configuration - Replace with your values if needed
AWS_REGION="us-east-1"
ACCOUNT_ID="155452520827"
SNS_TOPIC_NAME="SmartOfficeBookingEvents"
NOTIFICATION_SQS_QUEUE_NAME="NotificationQueue"
USERS_TABLE_NAME="Users"
BOOKINGS_TABLE_NAME="Bookings"

# --- DynamoDB Tables ---

echo "Creating DynamoDB table: $USERS_TABLE_NAME..."
aws dynamodb create-table \
  --table-name $USERS_TABLE_NAME \
  --attribute-definitions \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=email,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $AWS_REGION

echo "Creating DynamoDB table: $BOOKINGS_TABLE_NAME..."
aws dynamodb create-table \
  --table-name $BOOKINGS_TABLE_NAME \
  --attribute-definitions \
    AttributeName=bookingId,AttributeType=S \
  --key-schema \
    AttributeName=bookingId,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $AWS_REGION

echo "Waiting for tables to become active..."
aws dynamodb wait table-exists --table-name $USERS_TABLE_NAME --region $AWS_REGION
aws dynamodb wait table-exists --table-name $BOOKINGS_TABLE_NAME --region $AWS_REGION
echo "DynamoDB tables created successfully."

# --- SNS Topic ---

echo "Creating SNS Topic: $SNS_TOPIC_NAME..."
SNS_TOPIC_ARN=$(aws sns create-topic --name $SNS_TOPIC_NAME --region $AWS_REGION --query 'TopicArn' --output text)
echo "SNS Topic ARN: $SNS_TOPIC_ARN"

# --- SQS Queues ---

echo "Creating SQS Queue: $NOTIFICATION_SQS_QUEUE_NAME..."
NOTIFICATION_QUEUE_URL=$(aws sqs create-queue --queue-name $NOTIFICATION_SQS_QUEUE_NAME --region $AWS_REGION --query 'QueueUrl' --output text)
NOTIFICATION_QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url $NOTIFICATION_QUEUE_URL --attribute-names QueueArn --region $AWS_REGION --query 'Attributes.QueueArn' --output text)
echo "Notification SQS Queue URL: $NOTIFICATION_QUEUE_URL"
echo "Notification SQS Queue ARN: $NOTIFICATION_QUEUE_ARN"

# --- SNS to SQS Subscriptions ---

echo "Subscribing Notification Queue to SNS Topic..."
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $NOTIFICATION_QUEUE_ARN \
  --region $AWS_REGION

# --- Set SQS Policy to allow SNS to send messages ---
# This policy allows the SNS topic to send messages to the SQS queue.

NOTIFICATION_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "sns.amazonaws.com" },
    "Action": "sqs:SendMessage",
    "Resource": "$NOTIFICATION_QUEUE_ARN",
    "Condition": {
      "ArnEquals": { "aws:SourceArn": "$SNS_TOPIC_ARN" }
    }
  }]
}
EOF
)

echo "Applying SQS policy for Notification Queue..."
aws sqs set-queue-attributes \
  --queue-url $NOTIFICATION_QUEUE_URL \
  --attributes Policy="$NOTIFICATION_POLICY" \
  --region $AWS_REGION


echo "AWS infrastructure provisioning complete!"
echo "----------------------------------------"
echo "Outputs:"
echo "SNS Topic ARN: $SNS_TOPIC_ARN"
echo "Notification SQS Queue URL: $NOTIFICATION_QUEUE_URL"
echo "Users DynamoDB Table: $USERS_TABLE_NAME"
echo "Bookings DynamoDB Table: $BOOKINGS_TABLE_NAME"
echo "----------------------------------------"
