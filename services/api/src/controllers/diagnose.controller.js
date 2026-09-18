/**
 * @fileoverview Diagnosis Controller.
 * Handles Zod validation and HTTP responses for diagnosis endpoints.
 */

import { z } from 'zod';
import { diagnoseForm } from '../services/diagnosisService.js';
import { FailureCause } from '../../../../packages/shared/causeTaxonomy.js';

// Strict input validation per architecture rules
const formDiagnosisSchema = z.object({
  cause: z.nativeEnum(FailureCause, {
    errorMap: () => ({ message: 'Invalid or missing failure cause' }),
  }),
  attempts: z.number().int().min(0).default(0),
  age: z.number().int().min(0).default(0),
  hasRegisteredMobile: z.boolean().default(false),
  isSeeded: z.boolean().default(true),
  connectivity: z.boolean().default(true),
  deviceOk: z.boolean().default(true),
  shopCode: z.string().min(1).default('UNKNOWN-SHOP'),
  language: z.enum(['en', 'hi', 'te']).default('en'),
});

export async function handleFormDiagnosis(req, res, next) {
  try {
    // 1. Validate payload
    const parsed = formDiagnosisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const input = parsed.data;

    // We rely on the PII Firewall to have already intercepted Aadhaar/Phone details
    // and injected requestHash.
    const reqMeta = {
      requestHash: req._piiRejection?.requestHash || 'N/A',
    };

    // 2. Process
    const result = await diagnoseForm(input, reqMeta);

    // 3. Respond
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
