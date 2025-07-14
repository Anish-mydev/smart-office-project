"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerAdminUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./database");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const USERS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Users';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
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
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.registerUser = registerUser;
const registerAdminUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
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
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        res.status(201).json({ message: 'Admin user registered successfully' });
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        console.error('Error registering admin user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.registerAdminUser = registerAdminUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const params = {
        TableName: USERS_TABLE,
        Key: { email },
    };
    try {
        const { Item } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.GetCommand(params));
        if (!Item) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, Item.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: Item.email, email: Item.email, role: Item.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.loginUser = loginUser;
