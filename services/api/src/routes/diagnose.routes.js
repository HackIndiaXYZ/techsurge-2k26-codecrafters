/**
 * @fileoverview Routes for diagnosis.
 */

import { Router } from 'express';
import { handleFormDiagnosis } from '../controllers/diagnose.controller.js';

const router = Router();

// POST /api/v1/diagnose/form
router.post('/form', handleFormDiagnosis);

export default router;
