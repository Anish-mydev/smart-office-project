import { pollSqsQueue } from './sqs';

console.log('Notification service started. Polling for messages...');
pollSqsQueue();
