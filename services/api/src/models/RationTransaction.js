/**
 * @fileoverview RationTransaction Mongoose Model (v2.0 Architecture).
 *
 * Implements ARCHITECTURE.md strictly:
 * - NO PII.
 * - strict: true, strictQuery: true
 */

import mongoose from 'mongoose';

const rationTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    subjectRef: { type: String, required: true, index: true }, // non-PII synthetic identifier
    status: {
      type: String,
      required: true,
      enum: ['PENDING_VERIFICATION', 'COMPLETED', 'FLAGGED'],
    },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: false,
    strict: true,
    strictQuery: true,
  }
);

export const RationTransaction = mongoose.model(
  'RationTransaction',
  rationTransactionSchema
);
