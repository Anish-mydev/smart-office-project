"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const authenticateToken = (req, res, next) => {
    console.log('authenticateToken middleware hit');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.sendStatus(401); // Unauthorized
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed', err.message);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        console.log('Token verified, user:', req.user.userId, 'role:', req.user.role);
        next();
    });
};
exports.authenticateToken = authenticateToken;
const authorizeRole = (roles) => {
    return (req, res, next) => {
        console.log('authorizeRole middleware hit, expected roles:', roles);
        if (!req.user) {
            console.log('Authorization failed: User not authenticated (req.user is undefined)');
            return res.status(403).json({ message: 'Forbidden: User not authenticated' });
        }
        // Use non-null assertion (!) after the check to satisfy strict TypeScript compiler
        const user = req.user;
        console.log('user role:', user.role);
        if (!roles.includes(user.role)) {
            console.log('Authorization failed: Insufficient permissions');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        console.log('Authorization successful');
        next();
    };
};
exports.authorizeRole = authorizeRole;
