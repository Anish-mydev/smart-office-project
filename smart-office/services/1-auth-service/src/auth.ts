import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ddbDocClient } from './database';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const USERS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Users';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

export const registerUser = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'Employee'; // Default role

    const params = {
        TableName: USERS_TABLE,
        Item: {
            email,
            password: hashedPassword,
            name,
            role,
        },
        ConditionExpression: 'attribute_not_exists(email)',
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const registerAdminUser = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'Admin'; // Assign Admin role

    const params = {
        TableName: USERS_TABLE,
        Item: {
            email,
            password: hashedPassword,
            name,
            role,
        },
        ConditionExpression: 'attribute_not_exists(email)',
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        res.status(201).json({ message: 'Admin user registered successfully' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        console.error('Error registering admin user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const params = {
        TableName: USERS_TABLE,
        Key: { email },
    };

    try {
        const { Item } = await ddbDocClient.send(new GetCommand(params));
        if (!Item) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, Item.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: Item.email, email: Item.email, role: Item.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
