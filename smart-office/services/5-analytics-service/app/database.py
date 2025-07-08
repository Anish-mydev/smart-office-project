import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
ANALYTICS_TABLE_NAME = os.getenv("ANALYTICS_TABLE_NAME", "AnalyticsEvents")

dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(ANALYTICS_TABLE_NAME)