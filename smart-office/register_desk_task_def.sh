#!/bin/bash

# This script registers a new revision of the Desk Booking Service task definition.
# It explicitly points to the latest image digest to bypass ECS caching issues.

set -e

NEW_TASK_DEF_JSON='''
{
    "containerDefinitions": [
        {
            "name": "DeskBookingContainer",
            "image": "155452520827.dkr.ecr.us-east-1.amazonaws.com/smart-office-3-desk-booking-service@sha256:7eeb10d7c302dcf206c63445c5289db9f63e200aec8fb5606b0525deb2cb1c46",
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
                    "awslogs-group": "SmartOfficeStack-DeskBookingTaskDefDeskBookingContainerLogGroupDFE233BE-we13ayQglLaW",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "smart-office-desk-booking"
                },
                "secretOptions": []
            },
            "systemControls": [],
            "credentialSpecs": []
        }
    ],
    "family": "SmartOfficeStackDeskBookingTaskDef47E28BA6",
    "taskRoleArn": "arn:aws:iam::155452520827:role/SmartOfficeStack-DeskBookingTaskDefTaskRole9E2A1531-A2KptgVU3cGR",
    "executionRoleArn": "arn:aws:iam::155452520827:role/SmartOfficeStack-DeskBookingTaskExecutionRole4854A5-F3GYLqinNtwn",
    "networkMode": "awsvpc",
    "cpu": "256",
    "memory": "512",
    "requiresCompatibilities": [
        "FARGATE"
    ]
}
'''

aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF_JSON" --region us-east-1
