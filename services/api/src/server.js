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
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── PII Firewall (Position 3) ────────────────────────────────────────────────
app.use(piiFirewall);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', healthRouter);
app.use('/api/v1/diagnose', diagnoseRouter);
app.use('/api/v1/insights', insightsRouter);

// ── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[setu-api] Server running on http://localhost:${PORT}`);
  console.log('[setu-api] PROTOTYPE — Synthetic Data Only. No live UIDAI/ePoS integration.');
  await connectDB();
});

export default app;
