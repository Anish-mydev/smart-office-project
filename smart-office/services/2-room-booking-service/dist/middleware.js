"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth Header:', authHeader);
    console.log('Token:', token);
    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.sendStatus(403); // Forbidden
        }
        req.user = user;
        console.log('Decoded JWT User:', req.user);
        next();
    });
};
exports.authenticateToken = authenticateToken;
const adminOnly = (req, res, next) => {
    var _a, _b;
    console.log('Admin Only Check - User Role:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
};
exports.adminOnly = adminOnly;
