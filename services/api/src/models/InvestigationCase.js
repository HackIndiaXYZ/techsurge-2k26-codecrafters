/**
 * @fileoverview InvestigationCase Mongoose Model (v2.0 Architecture).
 *
 * Implements ARCHITECTURE.md strictly:
 * - NO PII.
 * - This model represents an investigation workflow, NOT guilt.
 * - strict: true, strictQuery: true
 */

import mongoose from 'mongoose';

const investigationCaseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    transactionRef: { type: String, required: true, index: true },
    verificationEventRef: { type: String, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['SUSPECTED_IMPERSONATION', 'REVIEW_REQUIRED'],
    },
    status: {
      type: String,
      required: true,
      enum: ['OPEN', 'UNDER_REVIEW', 'REFERRED_TO_LE', 'CLOSED'],
    },
    evidenceRefs: {
      type: [String],
      required: true,
      default: [],
    },
    reviewedAt: { type: Date },
    referralStatus: {
      type: String,
      enum: ['NOT_REFERRED', 'PENDING_AUTHORIZATION', 'REFERRED_TO_LE', 'ACKNOWLEDGED', 'CLOSED'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

export const InvestigationCase = mongoose.model(
  'InvestigationCase',
  investigationCaseSchema
);
