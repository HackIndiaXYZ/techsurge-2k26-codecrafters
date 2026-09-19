/**
 * @fileoverview Setu API — Express server entry point.
 *
 * Prototype — Synthetic Data Only.
 * No live UIDAI/ePoS integration.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { piiFirewall } from './middleware/piiFirewall.js';
import healthRouter from './routes/health.js';
import diagnoseRouter from './routes/diagnose.routes.js';
import insightsRouter from './routes/insights.routes.js';
import authRouter from './routes/auth.routes.js';
import investigationsRouter from './routes/investigations.routes.js';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    return callback(new Error('CORS_REJECTED'), false);
  }
}));
app.use(express.json());

// ── PII Firewall (Position 3) ────────────────────────────────────────────────
app.use(piiFirewall);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', healthRouter);
app.use('/api/v1/diagnose', diagnoseRouter);
app.use('/api/v1/insights', insightsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/investigations', investigationsRouter);

// ── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`[setu-api] Server running on http://localhost:${PORT}`);
    console.log('[setu-api] PROTOTYPE — Synthetic Data Only. No live UIDAI/ePoS integration.');
    await connectDB();
  });
}

export default app;
