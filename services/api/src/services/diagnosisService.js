/**
 * @fileoverview Diagnosis Orchestration Service.
 *
 * Orchestrates the deterministic form flow.
 * - Validates input structurally.
 * - Passes to the deterministic rules engine.
 * - Persists to MongoDB (if available).
 * - Constructs the strictly formatted response.
 */

import crypto from 'crypto';
import { resolveFallback } from '../engine/rulesEngine.js';
import { FailureEvent } from '../models/FailureEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { getDbStatus } from '../config/db.js';

/**
 * Handles a deterministic form-based diagnosis request.
 *
 * @param {object} input - Zod-validated input from the controller.
 * @param {object} reqMeta - Metadata about the request (e.g. hash).
 * @returns {Promise<object>} The standard diagnosis response.
 */
export async function diagnoseForm(input, reqMeta) {
  // 1. Resolve fallback using pure deterministic engine
  const decision = resolveFallback({
    cause: input.cause,
    attempts: input.attempts,
    age: input.age,
    hasRegisteredMobile: input.hasRegisteredMobile,
    isSeeded: input.isSeeded,
    connectivity: input.connectivity,
    deviceOk: input.deviceOk,
  });

  // 2. Generate unique event ID
  const eventId = `EVT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  // 3. Persist if database is available
  if (getDbStatus()) {
    try {
      // Build geographic coordinate (Jittered centroid of the ward)
      // Since it's synthetic for the prototype, we default to a central coord in Kurnool if none provided
      // In this Phase, the client might not send precise geo, so we use dummy coords.
      const coordinates = input.geo && Array.isArray(input.geo.coordinates) 
        ? input.geo.coordinates 
        : [78.0322, 15.8281]; // Kurnool, AP default

      const event = new FailureEvent({
        eventId,
        failureCause: input.cause,
        confidence: decision.confidence,
        ruleApplied: decision.ruleId,
        resolutionOffered: decision.fallback,
        shopCode: input.shopCode || 'UNKNOWN-SHOP',
        district: 'Kurnool', // Default synthetic district
        state: 'Andhra Pradesh',
        geo: {
          type: 'Point',
          coordinates,
        },
        language: input.language || 'en',
        inputMode: 'FORM',
      });

      await event.save();

      // Log success audit
      await AuditLog.create({
        action: 'DIAGNOSE_FORM',
        ruleId: decision.ruleId,
        outcome: 'SUCCESS',
        requestHash: reqMeta.requestHash,
      });
    } catch (err) {
      console.error('[diagnosisService] Failed to persist event to DB:', err.message);
      // We do not fail the request if persistence fails. The dealer still needs the guidance.
    }
  }

  // 4. Return standard architecture response
  return {
    eventId,
    detectedCause: input.cause,
    confidence: decision.confidence,
    ruleId: decision.ruleId,
    fallback: decision.fallback,
    steps: decision.steps,
    citation: decision.citation,
    sourceUrl: decision.sourceUrl,
    verificationStatus: decision.verificationStatus,
    ttsUrl: null, // Voice not implemented in this phase
    escalationPath: decision.escalationPath,
  };
}
