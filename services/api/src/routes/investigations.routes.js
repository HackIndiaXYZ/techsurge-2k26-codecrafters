import { Router } from 'express';
import { handleCreateCase, handleGetCases, handleUpdateCase } from '../controllers/investigations.controller.js';

const router = Router();

// POST /api/v1/investigations
router.post('/', handleCreateCase);

// GET /api/v1/investigations
router.get('/', handleGetCases);

// PATCH /api/v1/investigations/:caseId
router.patch('/:caseId', handleUpdateCase);

export default router;
