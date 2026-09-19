/**
 * @fileoverview ExceptionAuthorization Mongoose Model (v2.0 Architecture).
 *
 * Implements ARCHITECTURE.md strictly:
 * - NO PII (no aadhaar, mobile, otp, etc.)
 * - strict: true, strictQuery: true
 */

import mongoose from 'mongoose';

const exceptionAuthorizationSchema = new mongoose.Schema(
  {
    authorizationId: { type: String, required: true, unique: true, index: true },
    transactionRef: { type: String, required: true, index: true },
    method: {
      type: String,
      required: true,
      enum: ['OTP'],
    },
    ruleApplied: { type: String, required: true },
    outcome: {
      type: String,
      required: true,
      enum: ['VERIFIED', 'FAILED'],
    },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: false,
    strict: true,
    strictQuery: true,
  }
);

export const ExceptionAuthorization = mongoose.model(
  'ExceptionAuthorization',
  exceptionAuthorizationSchema
);
