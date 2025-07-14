#!/bin/bash

# Wait for LocalStack to be ready
until awslocal s3 ls &> /dev/null; do
  echo "Waiting for LocalStack to be ready..."
  sleep 2
done

# Create DynamoDB tables
awslocal dynamodb create-table --table-name Users --attribute-definitions AttributeName=email,AttributeType=S --key-schema AttributeName=email,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
awslocal dynamodb create-table --table-name Rooms --attribute-definitions AttributeName=roomId,AttributeType=S --key-schema AttributeName=roomId,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
awslocal dynamodb create-table --table-name Desks --attribute-definitions AttributeName=deskId,AttributeType=S --key-schema AttributeName=deskId,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
awslocal dynamodb create-table --table-name Bookings --attribute-definitions AttributeName=bookingId,AttributeType=S --key-schema AttributeName=bookingId,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Create SNS topic
awslocal sns create-topic --name SmartOfficeBookingEvents_Local

# Create SQS queue
awslocal sqs create-queue --queue-name NotificationQueue_Local

# Subscribe SQS queue to SNS topic
SNS_TOPIC_ARN=$(awslocal sns list-topics --query 'Topics[?contains(TopicArn, "SmartOfficeBookingEvents_Local")].TopicArn' --output text)
SQS_QUEUE_URL=$(awslocal sqs get-queue-url --queue-name NotificationQueue_Local --query 'QueueUrl' --output text)
awslocal sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol sqs --notification-endpoint $SQS_QUEUE_URL

echo "Local infrastructure created successfully."
