import asyncio
from fastapi import FastAPI, Depends, HTTPException
from . import database, models, sqs, middleware

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # Start the SQS polling in the background
    asyncio.create_task(sqs.poll_sqs_queue())

@app.get("/reports/occupancy", dependencies=[Depends(middleware.get_current_admin_user)])
def get_occupancy_report():
    """
    A protected endpoint to get an occupancy report.
    Only users with the 'Admin' role can access this.
    """
    response = database.table.scan(
        Select='COUNT'
    )
    return {"total_bookings_logged": response.get('Count', 0)}

@app.get("/")
def read_root():
    return {"message": "Analytics Service is running."}
