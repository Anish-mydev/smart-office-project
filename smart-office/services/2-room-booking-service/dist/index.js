"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const booking_1 = require("./booking");
const middleware_1 = require("./middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get('/rooms/health', (req, res) => res.status(200).send('OK'));
// Room booking routes
app.post('/rooms/bookings', middleware_1.authenticateToken, booking_1.createBooking);
app.get('/rooms/bookings', middleware_1.authenticateToken, booking_1.getBookings);
app.delete('/rooms/bookings/:bookingId', middleware_1.authenticateToken, booking_1.deleteBooking);
// Admin routes for managing rooms
app.post('/rooms', middleware_1.authenticateToken, middleware_1.adminOnly, booking_1.createRoomHandler);
app.get('/rooms', middleware_1.authenticateToken, middleware_1.adminOnly, booking_1.getRoomHandler);
app.put('/rooms/:roomId', middleware_1.authenticateToken, middleware_1.adminOnly, booking_1.updateRoomHandler);
app.delete('/rooms/:roomId', middleware_1.authenticateToken, middleware_1.adminOnly, booking_1.deleteRoomHandler);
app.listen(port, () => {
    console.log(`Room booking service listening at http://localhost:${port}`);
});
