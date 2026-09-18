/**
 * @fileoverview Routes for diagnosis.
 */

import { Router } from 'express';
import { handleFormDiagnosis, handleVoiceDiagnosis } from '../controllers/diagnose.controller.js';

const router = Router();

// POST /api/v1/diagnose/form
router.post('/form', handleFormDiagnosis);

// POST /api/v1/diagnose/voice
router.post('/voice', handleVoiceDiagnosis);

export default router;
