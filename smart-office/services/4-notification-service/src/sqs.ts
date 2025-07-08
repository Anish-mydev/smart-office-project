import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import dotenv from 'dotenv';

dotenv.config();

const sqsClient = new SQSClient({ 
    region: process.env.AWS_REGION,
    // endpoint is needed for localstack or similar, remove for AWS
});
const queueUrl = process.env.SQS_QUEUE_URL;

const handleMessage = (message: Message) => {
    console.log('--- New Notification ---');
    if (message.Body) {
        try {
            const body = JSON.parse(message.Body);
            const event = JSON.parse(body.Message); // Message from SNS is a stringified JSON
            const booking = event.payload;
            
            console.log(`Received booking confirmation for User: ${booking.userId}`);
            console.log(`Resource Type: ${booking.bookingType}`);
            console.log(`Resource ID: ${booking.resourceId}`);
            console.log('------------------------');

        } catch (e) {
            console.error("Failed to parse message body:", e);
            console.log("Raw message body:", message.Body);
        }
    }
};

export const pollSqsQueue = async () => {
    if (!queueUrl) {
        console.error('SQS_QUEUE_URL is not defined. Stopping poller.');
        return;
    }

    while (true) {
        try {
            const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20, // Long polling
            }));

            if (Messages && Messages.length > 0) {
                for (const message of Messages) {
                    handleMessage(message);
                    // Delete the message from the queue
                    await sqsClient.send(new DeleteMessageCommand({
                        QueueUrl: queueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                    }));
                }
            }
        } catch (error) {
            console.error('Error polling SQS:', error);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};
