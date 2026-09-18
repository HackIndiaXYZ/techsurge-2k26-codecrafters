/**
 * @fileoverview Diagnosis Controller.
 * Handles Zod validation and HTTP responses for diagnosis endpoints.
 */

import { z } from 'zod';
import { diagnoseForm } from '../services/diagnosisService.js';
import { FailureCause } from '../../../../packages/shared/causeTaxonomy.js';
import { classifier } from '../ai/classifier.js';
import { scrubText } from '../middleware/piiFirewall.js';

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

const voiceDiagnosisSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  language: z.enum(['en', 'hi', 'te']).default('en'),
});

export async function handleVoiceDiagnosis(req, res, next) {
  try {
    const parsed = voiceDiagnosisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parsed.error.format(),
      });
    }

    const { transcript, language } = parsed.data;

    // 1. Immediately scrub transcript. We do not use req.body directly because
    // the PII firewall already ran on it (redacting obvious things), but we want
    // to guarantee scrubText is called directly before classification.
    const scrubbedTranscript = scrubText(transcript);

    // 2. Classify
    const classification = await classifier.classifyTranscript(scrubbedTranscript);

    // 3. Convert classifier output to deterministic rule input
    const input = {
      cause: classification.cause,
      attempts: classification.attempts,
      age: classification.ageBand === '65_PLUS' ? 70 : (classification.ageBand === 'BELOW_65' ? 30 : 0),
      hasRegisteredMobile: false, // Default fail-safe
      isSeeded: true, // Default fail-safe
      connectivity: true, // Default fail-safe
      deviceOk: true, // Default fail-safe
      shopCode: 'PWA-VOICE',
      language,
    };

    const reqMeta = {
      requestHash: req._piiRejection?.requestHash || 'N/A',
    };

    // 4. Deterministic Engine
    const result = await diagnoseForm(input, reqMeta);
    
    // We add confidence from the classifier
    result.confidence = classification.confidence;

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
