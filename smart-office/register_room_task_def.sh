#!/bin/bash

# This script registers a new revision of the Room Booking Service task definition.
# It explicitly points to the latest image digest to bypass ECS caching issues.

set -e

NEW_TASK_DEF_JSON='''
{
    "containerDefinitions": [
        {
            "name": "RoomBookingContainer",
            "image": "155452520827.dkr.ecr.us-east-1.amazonaws.com/smart-office-2-room-booking-service@sha256:8a309b9bc2f2844d2f6d2e826ffe2b3c7e72507b060e9e0dd5c96eb26b08ffc7",
            "cpu": 0,
            "links": [],
            "portMappings": [
                {
                    "containerPort": 3000,
                    "hostPort": 3000,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "entryPoint": [],
            "command": [],
            "environment": [
                {
                    "name": "DYNAMODB_TABLE_NAME",
                    "value": "Bookings"
                },
                {
                    "name": "JWT_SECRET",
                    "value": "your-super-secret-key-for-local-dev"
                },
                {
                    "name": "SNS_TOPIC_ARN",
                    "value": "arn:aws:sns:us-east-1:155452520827:SmartOfficeBookingEvents"
                }
            ],
            "environmentFiles": [],
            "mountPoints": [],
            "volumesFrom": [],
            "secrets": [],
            "dnsServers": [],
            "dnsSearchDomains": [],
            "extraHosts": [],
            "dockerSecurityOptions": [],
            "dockerLabels": {},
            "ulimits": [],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "SmartOfficeStack-RoomBookingTaskDefRoomBookingContainerLogGroup34A663C5-noLmisWECGA6",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "smart-office-room-booking"
                },
                "secretOptions": []
            },
            "systemControls": [],
            "credentialSpecs": []
        }
    ],
    "family": "SmartOfficeStackRoomBookingTaskDefD82142A0",
    "taskRoleArn": "arn:aws:iam::155452520827:role/SmartOfficeStack-RoomBookingTaskDefTaskRole4FEB5F6E-1UzU3gbNdqD1",
    "executionRoleArn": "arn:aws:iam::155452520827:role/SmartOfficeStack-RoomBookingTaskExecutionRoleB428AF-ORCtySKjQrBs",
    "networkMode": "awsvpc",
    "cpu": "256",
    "memory": "512",
    "requiresCompatibilities": [
        "FARGATE"
    ]
}
'''

aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF_JSON" --region us-east-1
