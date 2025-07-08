# Smart Office Backend

This repository contains the backend microservices for the Smart Office application. It is a polyglot project demonstrating a microservices architecture using Node.js/TypeScript and Python, with various AWS services.

## Architecture Overview

The project consists of five microservices:

1.  **Authentication Service (Node.js/TypeScript, Express.js, DynamoDB):** Handles user registration and login, issuing JWTs with RBAC roles.
2.  **Meeting Room Booking Service (Node.js/TypeScript, Express.js, DynamoDB):** Manages CRUD operations for meeting room bookings. Publishes events to SNS.
3.  **Desk Booking Service (Node.js/TypeScript, Express.js, DynamoDB):** Manages CRUD operations for desk bookings. Publishes events to SNS.
4.  **Notification Service (Node.js/TypeScript):** A stateless service that listens for booking events from an SQS queue and logs notifications.
5.  **Analytics Service (Python, FastAPI, PostgreSQL):** Consumes booking events from a separate SQS queue, stores them in a relational format, and provides analytics endpoints.

![Architecture Diagram](https://i.imgur.com/your-diagram-image.png) <!-- You can create and link a diagram here -->

## Prerequisites

*   [Docker](https://www.docker.com/get-started) and Docker Compose
*   [AWS CLI](https://aws.amazon.com/cli/), configured with your credentials
*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [Python](https://www.python.org/downloads/) (v3.9 or later)

## Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Anish-mydev/smart-office
    cd smart-office
    ```

2.  **Create Environment Files:**
    Each service in the `services/` directory contains a `.env.example` file. Copy these to a `.env` file in the same directory and populate them with your local or AWS configuration. For local development, the `docker-compose.yml` file provides default values.

3.  **Run the environment:**
    This command will start all 5 microservices, along with local DynamoDB and PostgreSQL containers.
    ```bash
    docker-compose up --build
    ```

    *   Authentication Service: `http://localhost:3001`
    *   Room Booking Service: `http://localhost:3002`
    *   Desk Booking Service: `http://localhost:3003`
    *   Notification Service: (Runs in the background)
    *   Analytics Service: `http://localhost:8000`

## Provisioning AWS Infrastructure

The project includes a script to provision the necessary AWS resources.

**Important:** This script will create resources in your AWS account and may incur costs.

1.  **Review the script:**
    Inspect `scripts/provision-aws-infra.sh` to understand the resources it will create.

2.  **Ensure your AWS CLI is configured:**
    ```bash
    aws sts get-caller-identity
    ```

3.  **Run the script:**
    ```bash
    bash scripts/provision-aws-infra.sh
    ```
    This will create:
    *   Two DynamoDB tables (`Users`, `Bookings`)
    *   An SNS Topic for booking events
    *   Two SQS Queues subscribed to the SNS topic (one for notifications, one for analytics)

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/ci-cd.yml`.

The pipeline triggers on every push to the `main` branch and performs the following steps:
1.  **Lint & Test:** Runs linters and unit tests for each service.
2.  **Build Docker Images:** Builds a Docker image for each service.
3.  **Push to Docker Hub:** Tags the images and pushes them to your Docker Hub repository (`Anish025`).
4.  **Deploy (Placeholder):** Contains placeholder steps for deploying the services to a cloud environment like AWS ECS or EKS.

