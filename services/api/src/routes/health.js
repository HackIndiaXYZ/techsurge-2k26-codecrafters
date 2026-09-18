/**
 * @fileoverview Health route.
 * GET /api/v1/health — does not require database connectivity.
 */

import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'setu-api',
    note: 'PROTOTYPE — Synthetic Data Only. No live UIDAI/ePoS integration.',
  });
});

export default router;
