import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerUser, loginUser } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.status(200).send('OK'));
app.post('/register', registerUser);
app.post('/login', loginUser);

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
