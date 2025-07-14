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
exports.deleteBooking = exports.getBookings = exports.createBooking = exports.deleteRoomHandler = exports.updateRoomHandler = exports.getRoomHandler = exports.createRoomHandler = void 0;
const database_1 = require("./database");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const sns_1 = require("./sns");
const BOOKINGS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Bookings';
const ROOMS_TABLE = process.env.DYNAMODB_ROOMS_TABLE_NAME || 'Rooms';
const createRoomHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomName, capacity } = req.body;
    if (!roomName || !capacity) {
        return res.status(400).json({ message: 'Room name and capacity are required' });
    }
    const roomId = (0, uuid_1.v4)();
    const params = {
        TableName: ROOMS_TABLE,
        Item: {
            roomId,
            roomName,
            capacity,
            createdAt: new Date().toISOString(),
        },
    };
    try {
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        res.status(201).json({ message: 'Room created successfully', roomId });
    }
    catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createRoomHandler = createRoomHandler;
const getRoomHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Items } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.ScanCommand({ TableName: ROOMS_TABLE }));
        res.status(200).json(Items);
    }
    catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getRoomHandler = getRoomHandler;
const updateRoomHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    const { roomName, capacity } = req.body;
    const params = {
        TableName: ROOMS_TABLE,
        Key: { roomId },
        UpdateExpression: 'set roomName = :name, #cap = :cap',
        ExpressionAttributeNames: { '#cap': 'capacity' },
        ExpressionAttributeValues: { ':name': roomName, ':cap': capacity },
        ReturnValues: 'ALL_NEW',
    };
    try {
        const { Attributes } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.UpdateCommand(params));
        res.status(200).json(Attributes);
    }
    catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateRoomHandler = updateRoomHandler;
const deleteRoomHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    try {
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({ TableName: ROOMS_TABLE, Key: { roomId } }));
        res.status(200).json({ message: 'Room deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteRoomHandler = deleteRoomHandler;
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { roomId, startTime, endTime } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!roomId || !startTime || !endTime || !userId) {
        return res.status(400).json({ message: 'Room ID, start time, end time, and user ID are required' });
    }
    const bookingId = (0, uuid_1.v4)();
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
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        // Publish event to SNS
        yield (0, sns_1.publishBookingCreatedEvent)(params.Item);
        res.status(201).json({ message: 'Booking created successfully', bookingId });
    }
    catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createBooking = createBooking;
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: BOOKINGS_TABLE,
        FilterExpression: 'bookingType = :type',
        ExpressionAttributeValues: {
            ':type': 'ROOM'
        }
    };
    try {
        const { Items } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.ScanCommand(params));
        res.status(200).json(Items);
    }
    catch (error) {
        console.error('Error fetching bookings:', error);
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
        // First, get the booking to check ownership
        const { Item } = yield database_1.ddbDocClient.send(new lib_dynamodb_1.GetCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));
        if (!Item) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // RBAC: Admin can delete any booking, Employee can only delete their own
        if (user.role !== 'Admin' && Item.userId !== user.userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own bookings.' });
        }
        yield database_1.ddbDocClient.send(new lib_dynamodb_1.DeleteCommand({ TableName: BOOKINGS_TABLE, Key: { bookingId } }));
        res.status(200).json({ message: 'Booking deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteBooking = deleteBooking;
