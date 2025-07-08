import asyncio
import boto3
import os
import json
from . import database
from datetime import datetime

AWS_REGION = os.getenv("AWS_REGION")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")

sqs_client = boto3.client("sqs", region_name=AWS_REGION)

def save_booking_event(event_payload: dict):
    """Saves a booking event to the DynamoDB table."""
    try:
        database.table.put_item(
            Item={
                'booking_id': event_payload.get("bookingId"),
                'user_id': event_payload.get("userId"),
                'resource_id': event_payload.get("resourceId"),
                'booking_type': event_payload.get("bookingType"),
                'created_at': event_payload.get("createdAt")
            }
        )
        print(f"Successfully saved booking event {event_payload.get('bookingId')} to DynamoDB.")
    except Exception as e:
        print(f"Error saving to DynamoDB: {e}")

async def poll_sqs_queue():
    """Polls the SQS queue for messages and processes them."""
    if not SQS_QUEUE_URL:
        print("SQS_QUEUE_URL not set. SQS poller is disabled.")
        return

    print("Starting SQS poller for analytics...")

    while True:
        try:
            response = sqs_client.receive_message(
                QueueUrl=SQS_QUEUE_URL,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20
            )

            messages = response.get("Messages", [])
            if messages:
                for msg in messages:
                    try:
                        # SNS messages are nested inside the SQS message body
                        sns_msg = json.loads(msg["Body"])
                        event_payload = json.loads(sns_msg["Message"])["payload"]
                        
                        save_booking_event(event_payload)

                        # Delete message from queue
                        sqs_client.delete_message(
                            QueueUrl=SQS_QUEUE_URL,
                            ReceiptHandle=msg["ReceiptHandle"]
                        )
                    except Exception as e:
                        print(f"Error processing message: {e}")

        except Exception as e:
            print(f"Error polling SQS queue: {e}")
        
        await asyncio.sleep(5) # Wait before the next poll
