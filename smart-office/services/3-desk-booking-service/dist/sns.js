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
exports.publishBookingCreatedEvent = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const snsClient = new client_sns_1.SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.SNS_TOPIC_ARN;
const publishBookingCreatedEvent = (bookingDetails) => __awaiter(void 0, void 0, void 0, function* () {
    if (!topicArn) {
        console.error('SNS_TOPIC_ARN is not defined. Skipping event publication.');
        return;
    }
    const params = {
        TopicArn: topicArn,
        Message: JSON.stringify({
            type: 'booking_created',
            payload: bookingDetails,
        }),
        MessageAttributes: {
            bookingType: {
                DataType: 'String',
                StringValue: bookingDetails.bookingType,
            },
        },
    };
    try {
        yield snsClient.send(new client_sns_1.PublishCommand(params));
        console.log('Successfully published booking_created event to SNS.');
    }
    catch (error) {
        console.error('Error publishing to SNS:', error);
    }
});
exports.publishBookingCreatedEvent = publishBookingCreatedEvent;
