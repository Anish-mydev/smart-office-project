import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SmartOfficeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps & { imageTag?: string }) {
    super(scope, id, props);

    // --- VPC with Public Subnets only for cost savings ---
    const vpc = new ec2.Vpc(this, 'SmartOfficeVpc', {
        maxAzs: 2,
        natGateways: 0, // No NAT Gateway to save costs
        subnetConfiguration: [
            {
                cidrMask: 24,
                name: 'public-subnet',
                subnetType: ec2.SubnetType.PUBLIC,
            },
        ],
    });

    const cluster = new ecs.Cluster(this, 'SmartOfficeCluster', { vpc });

    // --- Look up existing resources ---
    const authServiceRepo = ecr.Repository.fromRepositoryName(this, 'AuthServiceRepoLookup', 'smart-office-1-auth-service');
    const roomBookingServiceRepo = ecr.Repository.fromRepositoryName(this, 'RoomBookingServiceRepoLookup', 'smart-office-2-room-booking-service');
    const deskBookingServiceRepo = ecr.Repository.fromRepositoryName(this, 'DeskBookingServiceRepoLookup', 'smart-office-3-desk-booking-service');
    const notificationServiceRepo = ecr.Repository.fromRepositoryName(this, 'NotificationServiceRepoLookup', 'smart-office-4-notification-service');

    

    // --- DynamoDB Tables ---
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
        tableName: 'Users',
        partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bookingsTable = new dynamodb.Table(this, 'BookingsTable', {
        tableName: 'Bookings',
        partitionKey: { name: 'bookingId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- SNS and SQS ---
    const bookingTopic = new sns.Topic(this, 'BookingTopic', { topicName: 'SmartOfficeBookingEvents' });
    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', { queueName: 'NotificationQueue' });

    bookingTopic.addSubscription(new cdk.aws_sns_subscriptions.SqsSubscription(notificationQueue));

    // --- Load Balancer ---
    const lb = new elbv2.ApplicationLoadBalancer(this, 'SmartOfficeLB', {
        vpc,
        internetFacing: true,
    });

    const listener = lb.addListener('Listener', { 
        port: 80,
        defaultAction: elbv2.ListenerAction.fixedResponse(404, {
            contentType: 'text/plain',
            messageBody: 'Cannot find requested resource'
        })
    });

    // --- ECS Services ---
    const publicSubnets = { subnetType: ec2.SubnetType.PUBLIC };

    // Create a security group for ECS services to allow outbound traffic
    const ecsServiceSecurityGroup = new ec2.SecurityGroup(this, 'EcsServiceSecurityGroup', {
        vpc,
        allowAllOutbound: true, // Allow all outbound traffic for demo purposes
    });

    // Auth Service
    const authExecutionRole = new iam.Role(this, 'AuthTaskExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    authExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    const authTaskDef = new ecs.FargateTaskDefinition(this, 'AuthTaskDef', {
        executionRole: authExecutionRole,
    });
    authServiceRepo.grantPull(authExecutionRole);
    authTaskDef.addContainer('AuthContainer', {
        image: ecs.ContainerImage.fromEcrRepository(authServiceRepo),
        environment: { DYNAMODB_TABLE_NAME: usersTable.tableName, JWT_SECRET: 'your-super-secret-key-for-local-dev' },
        portMappings: [{ containerPort: 3000 }],
    });
    usersTable.grantReadWriteData(authTaskDef.taskRole);
    const authService = new ecs.FargateService(this, 'AuthService', { 
        cluster, 
        taskDefinition: authTaskDef, 
        vpcSubnets: publicSubnets, 
        assignPublicIp: true,
        securityGroups: [ecsServiceSecurityGroup],
    });
    listener.addTargets('AuthTarget', {
        port: 80,
        targets: [authService],
        priority: 1,
        conditions: [elbv2.ListenerCondition.pathPatterns(['/auth/*'])],
        healthCheck: { path: '/auth/health' },
    });

    // Room Booking Service
    const roomBookingExecutionRole = new iam.Role(this, 'RoomBookingTaskExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    roomBookingExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    
    const roomBookingTaskDef = new ecs.FargateTaskDefinition(this, 'RoomBookingTaskDef', {
        executionRole: roomBookingExecutionRole,
    });
    roomBookingServiceRepo.grantPull(roomBookingExecutionRole);
    roomBookingTaskDef.addContainer('RoomBookingContainer', {
        image: ecs.ContainerImage.fromEcrRepository(roomBookingServiceRepo),
        environment: {
            DYNAMODB_TABLE_NAME: bookingsTable.tableName,
            SNS_TOPIC_ARN: bookingTopic.topicArn,
            JWT_SECRET: 'your-super-secret-key-for-local-dev',
        },
        portMappings: [{ containerPort: 3000 }],
    });
    bookingsTable.grantReadWriteData(roomBookingTaskDef.taskRole);
    bookingTopic.grantPublish(roomBookingTaskDef.taskRole);
    const roomBookingService = new ecs.FargateService(this, 'RoomBookingService', { 
        cluster, 
        taskDefinition: roomBookingTaskDef, 
        vpcSubnets: publicSubnets, 
        assignPublicIp: true,
        securityGroups: [ecsServiceSecurityGroup],
    });
    listener.addTargets('RoomTarget', {
        port: 80,
        targets: [roomBookingService],
        priority: 2,
        conditions: [elbv2.ListenerCondition.pathPatterns(['/rooms/*'])],
        healthCheck: { path: '/rooms/health' },
    });

    // Desk Booking Service
    const deskBookingExecutionRole = new iam.Role(this, 'DeskBookingTaskExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    deskBookingExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    
    const deskBookingTaskDef = new ecs.FargateTaskDefinition(this, 'DeskBookingTaskDef', {
        executionRole: deskBookingExecutionRole,
    });
    deskBookingServiceRepo.grantPull(deskBookingExecutionRole);
    deskBookingTaskDef.addContainer('DeskBookingContainer', {
        image: ecs.ContainerImage.fromEcrRepository(deskBookingServiceRepo),
        environment: {
            DYNAMODB_TABLE_NAME: bookingsTable.tableName,
            SNS_TOPIC_ARN: bookingTopic.topicArn,
            JWT_SECRET: 'your-super-secret-key-for-local-dev',
        },
        portMappings: [{ containerPort: 3000 }],
    });
    bookingsTable.grantReadWriteData(deskBookingTaskDef.taskRole);
    bookingTopic.grantPublish(deskBookingTaskDef.taskRole);
    const deskBookingService = new ecs.FargateService(this, 'DeskBookingService', { 
        cluster, 
        taskDefinition: deskBookingTaskDef, 
        vpcSubnets: publicSubnets, 
        assignPublicIp: true,
        securityGroups: [ecsServiceSecurityGroup],
    });
    listener.addTargets('DeskTarget', {
        port: 80,
        targets: [deskBookingService],
        priority: 3,
        conditions: [elbv2.ListenerCondition.pathPatterns(['/desks/*'])],
        healthCheck: { path: '/desks/health' },
    });

    // Notification Service
    const notificationExecutionRole = new iam.Role(this, 'NotificationTaskExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    notificationExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));
    
    const notificationTaskDef = new ecs.FargateTaskDefinition(this, 'NotificationTaskDef', {
        executionRole: notificationExecutionRole,
    });
    notificationServiceRepo.grantPull(notificationExecutionRole);
    new cdk.CfnOutput(this, 'NotificationExecutionRoleArn', { value: notificationExecutionRole.roleArn });
    notificationTaskDef.addContainer('NotificationContainer', {
        image: ecs.ContainerImage.fromEcrRepository(notificationServiceRepo),
        environment: { SQS_QUEUE_URL: notificationQueue.queueUrl },
    });
    notificationQueue.grantConsumeMessages(notificationTaskDef.taskRole);
    new ecs.FargateService(this, 'NotificationService', { 
        cluster, 
        taskDefinition: notificationTaskDef, 
        vpcSubnets: publicSubnets, 
        assignPublicIp: true,
        securityGroups: [ecsServiceSecurityGroup],
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName });
  }
}
