import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBooking, getBookings, deleteBooking, createRoomHandler, getRoomHandler, updateRoomHandler, deleteRoomHandler } from './booking';
import { authenticateToken, adminOnly } from './middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/rooms/health', (req, res) => res.status(200).send('OK'));

// Room booking routes
app.post('/rooms/bookings', authenticateToken, createBooking);
app.get('/rooms/bookings', authenticateToken, getBookings);
app.delete('/rooms/bookings/:bookingId', authenticateToken, deleteBooking);

// Admin routes for managing rooms
app.post('/rooms', authenticateToken, adminOnly, createRoomHandler);
app.get('/rooms', authenticateToken, getRoomHandler);
app.put('/rooms/:roomId', authenticateToken, adminOnly, updateRoomHandler);
app.delete('/rooms/:roomId', authenticateToken, adminOnly, deleteRoomHandler);

app.listen(port, () => {
  console.log(`Room booking service listening at http://localhost:${port}`);
});
