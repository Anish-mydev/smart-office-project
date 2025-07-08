import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBooking, getBookings, deleteBooking } from './booking';
import { authenticateToken, authorizeRole } from './middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.status(200).send('OK'));
app.post('/bookings', authenticateToken, createBooking);
app.get('/bookings', authenticateToken, getBookings);
app.delete('/bookings/:bookingId', authenticateToken, deleteBooking);

app.listen(port, () => {
  console.log(`Room booking service listening at http://localhost:${port}`);
});
