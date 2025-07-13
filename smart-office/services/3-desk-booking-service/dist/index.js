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
// Global Request Logger - Added for debugging
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
});
// Health check
app.get('/desks/health', (req, res) => res.status(200).send('OK'));
// Desk Booking Endpoints (for all authenticated users)
app.post('/desks/bookings', middleware_1.authenticateToken, booking_1.createBooking);
app.get('/desks/bookings', middleware_1.authenticateToken, booking_1.getBookings);
app.delete('/desks/bookings/:bookingId', middleware_1.authenticateToken, booking_1.deleteBooking);
// Desk Management Endpoints (Admin Only)
const adminOnly = [middleware_1.authenticateToken, (0, middleware_1.authorizeRole)(['Admin'])];
app.post('/desks', adminOnly, booking_1.createDeskHandler);
app.get('/desks', adminOnly, booking_1.getDesksHandler);
app.put('/desks/:deskId', adminOnly, booking_1.updateDeskHandler);
app.delete('/desks/:deskId', adminOnly, booking_1.deleteDeskHandler);
app.listen(port, () => {
    console.log(`Desk booking service listening at http://0.0.0.0:${port}`);
});
