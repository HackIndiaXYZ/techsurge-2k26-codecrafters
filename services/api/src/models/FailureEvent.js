/**
 * @fileoverview FailureEvent Mongoose Model.
 *
 * Implements ARCHITECTURE.md strictly:
 * - NO PII (no aadhaar, name, phone, address, biometric, etc.)
 * - strict: true, strictQuery: true
 */

import mongoose from 'mongoose';
import { FailureCause } from '../../../../packages/shared/causeTaxonomy.js';

const failureEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    subjectRef: { type: String, required: false }, // Optional HMAC pseudonym
    failureCause: {
      type: String,
      required: true,
      enum: Object.values(FailureCause),
    },
    confidence: { type: Number, required: true },
    ruleApplied: { type: String, required: true },
    resolutionOffered: {
      type: String,
      required: true,
    },
    resolutionOutcome: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'ESCALATED', 'ABANDONED'],
      default: 'PENDING',
    },
    shopCode: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    state: { type: String, required: true },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'te'],
      required: true,
    },
    inputMode: {
      type: String,
      enum: ['FORM', 'VOICE'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

// Basic geospatial index for the hotspot map
failureEventSchema.index({ geo: '2dsphere' });

export const FailureEvent = mongoose.model('FailureEvent', failureEventSchema);
