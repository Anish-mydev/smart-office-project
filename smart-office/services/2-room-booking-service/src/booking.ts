import { Request, Response } from 'express';
import { ddbDocClient } from './database';
import { PutCommand, ScanCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { publishBookingCreatedEvent } from './sns';

const BOOKINGS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Bookings';

// Extend Express Request type to include user from JWT
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
    const { roomId, startTime, endTime } = req.body;
    const userId = req.user?.userId;

    if (!roomId || !startTime || !endTime || !userId) {
        return res.status(400).json({ message: 'Room ID, start time, end time, and user ID are required' });
    }

    const bookingId = uuidv4();
    const bookingType = 'ROOM';

    const params = {
        TableName: BOOKINGS_TABLE,
        Item: {
            bookingId,
            userId,
            resourceId: roomId,
            bookingType,
            startTime,
            endTime,
            createdAt: new Date().toISOString(),
        },
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        
        // Publish event to SNS
        await publishBookingCreatedEvent(params.Item);

        res.status(201).json({ message: 'Booking created successfully', bookingId });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
    const params = {
        TableName: BOOKINGS_TABLE,
        FilterExpression: 'bookingType = :type',
        ExpressionAttributeValues: {
            ':type': 'ROOM'
        }
    };

    try {
        const { Items } = await ddbDocClient.send(new ScanCommand(params));
        res.status(200).json(Items);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteBooking = async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;
    const user = req.user;

    if (!user) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        // First, get the booking to check ownership
        const { Item } = await ddbDocClient.send(new GetCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));

        if (!Item) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // RBAC: Admin can delete any booking, Employee can only delete their own
        if (user.role !== 'Admin' && Item.userId !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own bookings.' });
        }

        await ddbDocClient.send(new DeleteCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
