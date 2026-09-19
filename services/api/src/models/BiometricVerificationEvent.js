/**
 * @fileoverview BiometricVerificationEvent Mongoose Model (v2.0 Architecture).
 *
 * Implements ARCHITECTURE.md strictly:
 * - NO PII (no aadhaar, name, phone, address, biometric, etc.)
 * - NO RAW BIOMETRIC TEMPLATES. Uses syntheticTemplateHash only.
 * - strict: true, strictQuery: true
 */

import mongoose from 'mongoose';

const biometricVerificationEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    transactionRef: { type: String, required: true, index: true },
    modality: {
      type: String,
      required: true,
      enum: ['FINGERPRINT', 'FACE', 'IRIS'],
    },
    stage: {
      type: String,
      required: true,
      enum: ['INITIAL', 'POST_TRANSACTION_REVERIFICATION'],
    },
    outcome: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILURE', 'UNAVAILABLE'],
    },
    failureReason: {
      type: String,
      enum: ['TIMEOUT', 'POOR_QUALITY', 'MISMATCH', 'UNKNOWN'],
    },
    syntheticTemplateHash: { type: String, required: true, index: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    deviceRef: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: false,
    strict: true,
    strictQuery: true,
  }
);

export const BiometricVerificationEvent = mongoose.model(
  'BiometricVerificationEvent',
  biometricVerificationEventSchema
);
