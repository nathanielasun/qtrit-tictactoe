import express from 'express';
import cors from 'cors';
import { gameRouter } from './routes/game.js';
import { trainingRouter } from './routes/training.js';

const app = express();
const PORT = 3001;

// CORS configuration - allow frontend dev server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Mount routes
app.use('/api/game', gameRouter);
app.use('/api/ai', trainingRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Quantum Qutrit Tic-Tac-Toe backend running on http://localhost:${PORT}`);
  console.log(`  Game API:     http://localhost:${PORT}/api/game`);
  console.log(`  AI API:       http://localhost:${PORT}/api/ai`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
});

export { app };
