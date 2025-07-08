import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';

dotenv.config();

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.SNS_TOPIC_ARN;

export const publishBookingCreatedEvent = async (bookingDetails: any) => {
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
        await snsClient.send(new PublishCommand(params));
        console.log('Successfully published booking_created event to SNS.');
    } catch (error) {
        console.error('Error publishing to SNS:', error);
    }
};
