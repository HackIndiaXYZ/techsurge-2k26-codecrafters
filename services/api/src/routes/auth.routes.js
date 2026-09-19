import { Router } from 'express';
import { handleBiometricAuth, handleOtpException, handleReverification } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/v1/auth/biometric
router.post('/biometric', handleBiometricAuth);

// POST /api/v1/auth/exception/otp
router.post('/exception/otp', handleOtpException);

// POST /api/v1/auth/reverify
router.post('/reverify', handleReverification);

export default router;
