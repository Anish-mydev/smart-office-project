import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION;
const endpoint = process.env.DYNAMODB_ENDPOINT;

const ddbClient = new DynamoDBClient({ 
    region,
    endpoint,
});

export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
