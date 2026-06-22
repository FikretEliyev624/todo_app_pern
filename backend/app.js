import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/auth.js';
import todoRoutes from './src/routes/todos.js';
import userRoutes from './src/routes/users.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env (or set it in your host).');
}

const app = express();

// CORS_ORIGIN can be a comma-separated list (e.g. "https://foo.vercel.app,https://bar.vercel.app").
const allowList = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || !allowList || allowList.includes('*') || allowList.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ error: 'not found', path: req.path }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'server error' });
});

export default app;
