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
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', healthRouter);

// ── Centralized Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[setu-api] Server running on http://localhost:${PORT}`);
  console.log('[setu-api] PROTOTYPE — Synthetic Data Only. No live UIDAI/ePoS integration.');
});

export default app;
