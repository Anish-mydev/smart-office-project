import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBooking, getBookings, deleteBooking, createDeskHandler, getDesksHandler, updateDeskHandler, deleteDeskHandler } from './booking';
import { authenticateToken, adminOnly } from './middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/desks/health', (req, res) => res.status(200).send('OK'));

// Desk booking routes
app.post('/desks/bookings', authenticateToken, createBooking);
app.get('/desks/bookings', authenticateToken, getBookings);
app.delete('/desks/bookings/:bookingId', authenticateToken, deleteBooking);

// Admin routes for managing desks
app.post('/desks', authenticateToken, adminOnly, createDeskHandler);
app.get('/desks', authenticateToken, getDesksHandler);
app.put('/desks/:deskId', authenticateToken, adminOnly, updateDeskHandler);
app.delete('/desks/:deskId', authenticateToken, adminOnly, deleteDeskHandler);

app.listen(port, () => {
  console.log(`Desk booking service listening at http://localhost:${port}`);
});
