/**
 * @fileoverview AuditLog Mongoose Model.
 *
 * Append-only log for tracking rules engine application and PII firewall rejections.
 * No raw payloads, no request bodies, no PII.
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    ts: { type: Date, default: Date.now, index: true },
    action: {
      type: String,
      enum: ['DIAGNOSE_FORM', 'DIAGNOSE_VOICE', 'PII_REJECTED'],
      required: true,
    },
    ruleId: { type: String, required: false },
    outcome: { type: String, required: true }, // e.g., 'SUCCESS', 'REJECTED'
    piiRejectionReason: { type: String, required: false }, // Only set on PII rejection
    requestHash: { type: String, required: false }, // Ties to the req without storing body
  },
  {
    timestamps: false, // Using custom 'ts' field
    strict: true,
    strictQuery: true,
    capped: { size: 5242880, max: 10000 }, // Capped collection: auto-rotated, max 5MB/10k logs (good for hackathon)
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
