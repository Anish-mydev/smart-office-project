"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollSqsQueue = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sqsClient = new client_sqs_1.SQSClient({
    region: process.env.AWS_REGION,
    // endpoint is needed for localstack or similar, remove for AWS
});
const queueUrl = process.env.SQS_QUEUE_URL;
const handleMessage = (message) => {
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
        }
        catch (e) {
            console.error("Failed to parse message body:", e);
            console.log("Raw message body:", message.Body);
        }
    }
};
const pollSqsQueue = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!queueUrl) {
        console.error('SQS_QUEUE_URL is not defined. Stopping poller.');
        return;
    }
    while (true) {
        try {
            const { Messages } = yield sqsClient.send(new client_sqs_1.ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20, // Long polling
            }));
            if (Messages && Messages.length > 0) {
                for (const message of Messages) {
                    handleMessage(message);
                    // Delete the message from the queue
                    yield sqsClient.send(new client_sqs_1.DeleteMessageCommand({
                        QueueUrl: queueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                    }));
                }
            }
        }
        catch (error) {
            console.error('Error polling SQS:', error);
            // Wait before retrying
            yield new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
});
exports.pollSqsQueue = pollSqsQueue;
