import { z } from 'zod';
import { processBiometricAuth } from '../services/authService.js';

// Define the schema for a single modality
const modalitySchema = z.object({
  outcome: z.enum(['SUCCESS', 'FAILURE', 'UNAVAILABLE'], {
    errorMap: () => ({ message: 'Invalid outcome' }),
  }),
  failureReason: z.enum(['TIMEOUT', 'POOR_QUALITY', 'MISMATCH', 'UNKNOWN']).nullable().optional()
}).refine(data => {
  // If SUCCESS or UNAVAILABLE, failureReason should ideally be null/omitted or specific,
  // but architecture says FAILURE takes precedence over UNAVAILABLE.
  // Actually, we should just strictly accept the enums. 
  // Let's enforce that if outcome is SUCCESS, failureReason must be null/undefined.
  if (data.outcome === 'SUCCESS' && data.failureReason != null) {
    return false;
  }
  return true;
}, {
  message: "failureReason must be null when outcome is SUCCESS"
});

// Define the main request schema
const biometricAuthSchema = z.object({
  transactionRef: z.string().min(1, 'transactionRef is required'),
  fingerprint: modalitySchema,
  face: modalitySchema,
  iris: modalitySchema
}).strict(); // Reject unknown fields

export async function handleBiometricAuth(req, res, next) {
  try {
    const parsed = biometricAuthSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const result = await processBiometricAuth(parsed.data);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// -----------------------------------------------------------------------------
// OTP Exception Implementation
// -----------------------------------------------------------------------------

const otpExceptionSchema = z.object({
  transactionRef: z.string().min(1, 'transactionRef is required'),
  otp: z.string().min(1, 'otp is required'),
  ruleId: z.string().min(1, 'ruleId is required')
}).strict(); // Reject unknown fields, no mobile, no aadhaar

export async function handleOtpException(req, res, next) {
  try {
    const parsed = otpExceptionSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const { processOtpException } = await import('../services/authService.js');
    const result = await processOtpException(parsed.data);
    
    // According to contract, SUCCESS and FAILURE both return 200 with differing outcomes,
    // unless the transaction is unknown or ineligible (which throw or return 400).
    res.status(200).json(result);
  } catch (error) {
    // If we throw explicit errors for unknown/ineligible, we can catch them here or in errorHandler.
    // For simplicity, if error.code is specified, we return 400.
    if (error.code) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    next(error);
  }
}

// -----------------------------------------------------------------------------
// Post-Transaction Reverification Implementation
// -----------------------------------------------------------------------------

export async function handleReverification(req, res, next) {
  try {
    // Reverification takes the exact same structured biometric payload
    const parsed = biometricAuthSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const { processReverification } = await import('../services/authService.js');
    const result = await processReverification(parsed.data);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.code) {
      return res.status(400).json({ code: error.code, message: error.message });
    }
    next(error);
  }
}
