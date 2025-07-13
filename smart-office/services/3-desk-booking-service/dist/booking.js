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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDeskHandler = exports.updateDeskHandler = exports.getDesksHandler = exports.createDeskHandler = exports.deleteBooking = exports.getBookings = exports.createBooking = void 0;
const database_1 = require("./database");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const sns_1 = require("./sns");
const BOOKINGS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Bookings';
// --- Desk Booking Functions ---
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { deskId, date } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!deskId || !date || !userId) {
        return res.status(400).json({ message: 'Desk ID, date, and user ID are required' });
    }
    try {
        // 1. Resource Existence Check
        const desk = yield (0, database_1.getDeskById)(deskId);
        if (!desk) {
            return res.status(400).json({ message: 'A desk with this ID does not exist.' });
        }
        // 2. Availability Check
        const existingBooking = yield (0, database_1.getExistingBookingForDate)(deskId, date);
        if (existingBooking && existingBooking.length > 0) {
            return res.status(409).json({ message: 'This desk is already booked for the requested date.' });
        }
        const bookingId = (0, uuid_1.v4)();
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
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        yield (0, sns_1.publishBookingCreatedEvent)(params.Item);
        res.status(201).json({ message: 'Desk booking created successfully', bookingId });
    }
    catch (error) {
        console.error('Error creating desk booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createBooking = createBooking;
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: BOOKINGS_TABLE,
        FilterExpression: 'bookingType = :type',
        ExpressionAttributeValues: {
            ':type': 'DESK'
        }
    };
    try {
        const { Items } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.ScanCommand(params));
        res.status(200).json(Items);
    }
    catch (error) {
        console.error('Error fetching desk bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getBookings = getBookings;
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId } = req.params;
    const user = req.user;
    if (!user) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const { Item } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.GetCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));
        if (!Item) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (user.role !== 'Admin' && Item.userId !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own bookings.' });
        }
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));
        res.status(200).json({ message: 'Desk booking deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting desk booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteBooking = deleteBooking;
// --- Desk Management (Admin Only) ---
const createDeskHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { location, features } = req.body;
    if (!location) {
        return res.status(400).json({ message: 'Location is required' });
    }
    const deskId = (0, uuid_1.v4)();
    const desk = { deskId, location, features: features || [] };
    try {
        yield (0, database_1.createDesk)(desk);
        res.status(201).json({ message: 'Desk created successfully', desk });
    }
    catch (error) {
        console.error('Error creating desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createDeskHandler = createDeskHandler;
const getDesksHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const desks = yield (0, database_1.getDesks)();
        res.status(200).json(desks);
    }
    catch (error) {
        console.error('Error fetching desks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getDesksHandler = getDesksHandler;
const updateDeskHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deskId } = req.params;
    const { location, features } = req.body;
    if (!location) {
        return res.status(400).json({ message: 'Location is required' });
    }
    try {
        const updatedDesk = yield (0, database_1.updateDesk)(deskId, { location, features: features || [] });
        if (!updatedDesk) {
            return res.status(404).json({ message: 'Desk not found' });
        }
        res.status(200).json({ message: 'Desk updated successfully', desk: updatedDesk });
    }
    catch (error) {
        console.error('Error updating desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateDeskHandler = updateDeskHandler;
const deleteDeskHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deskId } = req.params;
    try {
        const desk = yield (0, database_1.getDeskById)(deskId);
        if (!desk) {
            return res.status(404).json({ message: 'Desk not found' });
        }
        yield (0, database_1.deleteDesk)(deskId);
        res.status(200).json({ message: 'Desk deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting desk:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteDeskHandler = deleteDeskHandler;
