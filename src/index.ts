import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { register, login } from './controllers/authController';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// Authentication System Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/status', (req, res) => {
  res.status(200).json({ 
    message: "Welcome to SavannaSMS API backend!",
    documentation: "https://github.com/Aliko2020/savannah_sms"
  });
});

app.listen(PORT, () => {
  console.log(`Server booting up on http://localhost:${PORT}`);
});