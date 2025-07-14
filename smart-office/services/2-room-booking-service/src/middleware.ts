import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth Header:', authHeader);
    console.log('Token:', token);

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        console.log('Decoded JWT User:', req.user);
        next();
    });
};

export const adminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('Admin Only Check - User Role:', req.user?.role);
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
};
