import { Request, Response } from 'express';
import { ddbDocClient } from './database';
import { PutCommand, ScanCommand, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { publishBookingCreatedEvent } from './sns';

const BOOKINGS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Bookings';
const DESKS_TABLE = process.env.DYNAMODB_DESKS_TABLE_NAME || 'Desks';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const createDeskHandler = async (req: Request, res: Response) => {
    const { location, capacity } = req.body;
    if (!location || !capacity) {
        return res.status(400).json({ message: 'Location and capacity are required' });
    }

    const deskId = uuidv4();
    const params = {
        TableName: DESKS_TABLE,
        Item: {
            deskId,
            location,
            capacity,
            isBooked: false, // Initially not booked
            createdAt: new Date().toISOString(),
        },
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        res.status(201).json({ message: 'Desk created successfully', deskId });
    } catch (error) {
        console.error('Error creating desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDesksHandler = async (req: Request, res: Response) => {
    try {
        const { Items } = await ddbDocClient.send(new ScanCommand({ TableName: DESKS_TABLE }));
        res.status(200).json(Items);
    } catch (error) {
        console.error('Error fetching desks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDeskHandler = async (req: Request, res: Response) => {
    const { deskId } = req.params;
    const { location, capacity } = req.body;

    const params = {
        TableName: DESKS_TABLE,
        Key: { deskId },
        UpdateExpression: 'set #loc = :loc, #cap = :cap',
        ExpressionAttributeNames: { '#loc': 'location', '#cap': 'capacity' },
        ExpressionAttributeValues: { ':loc': location, ':cap': capacity },
        ReturnValues: 'ALL_NEW' as ReturnValue,
    };

    try {
        const { Attributes } = await ddbDocClient.send(new UpdateCommand(params));
        res.status(200).json(Attributes);
    } catch (error) {
        console.error('Error updating desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDeskHandler = async (req: Request, res: Response) => {
    const { deskId } = req.params;

    try {
        await ddbDocClient.send(new DeleteCommand({ TableName: DESKS_TABLE, Key: { deskId } }));
        res.status(200).json({ message: 'Desk deleted successfully' });
    } catch (error) {
        console.error('Error deleting desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
    const { deskId, date } = req.body;
    const userId = req.user?.userId;

    if (!deskId || !date || !userId) {
        return res.status(400).json({ message: 'Desk ID, date, and user ID are required' });
    }

    try {
        // Check if the desk exists and is available
        const { Item: desk } = await ddbDocClient.send(new GetCommand({ TableName: DESKS_TABLE, Key: { deskId } }));

        if (!desk) {
            return res.status(404).json({ message: 'Desk not found' });
        }

        if (desk.isBooked) {
            return res.status(409).json({ message: 'Desk is already booked' });
        }

        const bookingId = uuidv4();
        const bookingType = 'DESK';

        const params = {
            TableName: BOOKINGS_TABLE,
            Item: {
                bookingId,
                userId,
                resourceId: deskId,
                bookingType,
                date,
                createdAt: new Date().toISOString(),
            },
        };

        await ddbDocClient.send(new PutCommand(params));

        // Update the desk's booking status
        await ddbDocClient.send(new UpdateCommand({
            TableName: DESKS_TABLE,
            Key: { deskId },
            UpdateExpression: 'set isBooked = :booked',
            ExpressionAttributeValues: { ':booked': true },
        }));

        await publishBookingCreatedEvent(params.Item);

        res.status(201).json({ message: 'Desk booking created successfully', bookingId });
    } catch (error) {
        console.error('Error creating desk booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
    const params = {
        TableName: BOOKINGS_TABLE,
        FilterExpression: 'bookingType = :type',
        ExpressionAttributeValues: {
            ':type': 'DESK'
        }
    };

    try {
        const { Items } = await ddbDocClient.send(new ScanCommand(params));
        res.status(200).json(Items);
    } catch (error) {
        console.error('Error fetching desk bookings:', error);
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
        const { Item } = await ddbDocClient.send(new GetCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));

        if (!Item) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (user.role !== 'Admin' && Item.userId !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own bookings.' });
        }

        await ddbDocClient.send(new DeleteCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));

        // Update the desk's booking status to not booked
        await ddbDocClient.send(new UpdateCommand({
            TableName: DESKS_TABLE,
            Key: { deskId: Item.resourceId },
            UpdateExpression: 'set isBooked = :booked',
            ExpressionAttributeValues: { ':booked': false },
        }));

        res.status(200).json({ message: 'Desk booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting desk booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
