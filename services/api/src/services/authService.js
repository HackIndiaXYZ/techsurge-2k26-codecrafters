import { BiometricVerificationEvent } from '../models/BiometricVerificationEvent.js';
import { ExceptionAuthorization } from '../models/ExceptionAuthorization.js';
import { RationTransaction } from '../models/RationTransaction.js';
import { getRuleRegistry } from '../engine/rulesEngine.js';
import crypto from 'crypto';

/**
 * Pure deterministic function to aggregate biometric results.
 * @param {Object} results - Modality outcomes { fingerprint: { outcome, failureReason }, face: ..., iris: ... }
 * @returns {Object} { status, exceptionEligible, nextAction }
 */
export function aggregateBiometricResult(results) {
  const modalities = Object.values(results);
  
  // Rule 2: ANY modality = FAILURE
  const hasFailure = modalities.some(m => m.outcome === 'FAILURE');
  if (hasFailure) {
    return {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    };
  }

  // Rule 3: No modality is FAILURE, but at least one is UNAVAILABLE
  const hasUnavailable = modalities.some(m => m.outcome === 'UNAVAILABLE');
  if (hasUnavailable) {
    return {
      status: 'BIOMETRIC_UNAVAILABLE',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    };
  }

  // Rule 1: FINGERPRINT = SUCCESS AND FACE = SUCCESS AND IRIS = SUCCESS
  const allSuccess = modalities.every(m => m.outcome === 'SUCCESS');
  if (allSuccess && modalities.length === 3) {
    return {
      status: 'AUTHENTICATED',
      exceptionEligible: false,
      nextAction: 'PROCEED'
    };
  }

  // Fallback (e.g., if array length is wrong) - should be caught by validation
  return {
    status: 'BIOMETRIC_FAILED',
    exceptionEligible: true,
    nextAction: 'OTP_EXCEPTION'
  };
}

/**
 * Handle biometric authentication persistence and aggregation.
 * @param {Object} input - { transactionRef, fingerprint, face, iris }
 * @returns {Object} API response
 */
export async function processBiometricAuth(input) {
  const { transactionRef, fingerprint, face, iris } = input;
  
  const results = { fingerprint, face, iris };
  
  const aggregate = aggregateBiometricResult(results);

  // Persist individual events
  const eventsToSave = [];
  
  for (const [modalityName, data] of Object.entries(results)) {
    eventsToSave.push({
      eventId: `BIO-API-SYN-${crypto.randomUUID()}`,
      transactionRef,
      modality: modalityName.toUpperCase(),
      stage: 'INITIAL',
      outcome: data.outcome,
      failureReason: data.failureReason || undefined,
      syntheticTemplateHash: `SYN-HASH-${crypto.randomBytes(8).toString('hex')}`,
      confidenceScore: data.outcome === 'SUCCESS' ? 0.95 : (data.outcome === 'FAILURE' ? 0.45 : 0.0),
      deviceRef: 'DEV-SYN-001',
      timestamp: new Date()
    });
  }

  await BiometricVerificationEvent.insertMany(eventsToSave);

  return {
    transactionRef,
    authentication: {
      status: aggregate.status,
      exceptionEligible: aggregate.exceptionEligible
    },
    modalities: {
      fingerprint,
      face,
      iris
    },
    verificationStage: 'INITIAL',
    nextAction: aggregate.nextAction
  };
}

/**
 * Handle synthetic OTP exception authorization.
 * @param {Object} input - { transactionRef, otp }
 * @returns {Object} API response
 */
export async function processOtpException(input) {
  const { transactionRef, otp, ruleId } = input;

  if (!ruleId) {
    const error = new Error('ruleId is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // 1. Fetch biometric events for this transaction
  const events = await BiometricVerificationEvent.find({
    transactionRef,
    stage: 'INITIAL'
  });

  if (!events || events.length === 0) {
    const error = new Error('Unknown transaction: no biometric events found');
    error.code = 'UNKNOWN_TRANSACTION';
    throw error;
  }

  // 2. Re-aggregate to ensure exception eligibility
  const results = {};
  for (const event of events) {
    results[event.modality.toLowerCase()] = {
      outcome: event.outcome,
      failureReason: event.failureReason
    };
  }

  const aggregate = aggregateBiometricResult(results);

  if (!aggregate.exceptionEligible) {
    const error = new Error('Transaction is not eligible for OTP exception');
    error.code = 'NOT_ELIGIBLE';
    throw error;
  }

  // 2b. Validate the provided ruleId against the registry
  const rules = getRuleRegistry();
  const rule = rules.find(r => r.ruleId === ruleId);
  
  if (!rule) {
    const error = new Error('Unknown ruleId');
    error.code = 'INVALID_RULE';
    throw error;
  }

  if (rule.fallback !== 'OTP') {
    const error = new Error('Provided rule does not permit OTP fallback');
    error.code = 'INVALID_RULE';
    throw error;
  }

  // Check if the rule is applicable to the current biometric events
  let actualCause = 'UNKNOWN';
  if (Object.values(results).some(m => m.failureReason === 'MISMATCH')) {
    actualCause = 'BIOMETRIC_MISMATCH';
  } else if (Object.values(results).some(m => m.outcome === 'UNAVAILABLE')) {
    actualCause = 'DEVICE_FAILURE'; // Just as an example mapping, though synthetic mostly handles MISMATCH
  }
  
  if (!rule.causeMatch.includes(actualCause)) {
    const error = new Error('Provided rule is not applicable to the transaction failure cause');
    error.code = 'INVALID_RULE';
    throw error;
  }

  // 3. Duplicate/replay protection: check if already VERIFIED
  const existingVerified = await ExceptionAuthorization.findOne({
    transactionRef,
    method: 'OTP',
    outcome: 'VERIFIED'
  });

  if (existingVerified) {
    const error = new Error('Transaction already has a verified exception authorization');
    error.code = 'DUPLICATE_AUTHORIZATION';
    throw error;
  }

  // 4. Synthetic OTP logic
  // Since this is a demo environment without real SMS integration,
  // we use a deterministic hardcoded synthetic OTP '123456'.
  const outcome = (otp === '123456') ? 'VERIFIED' : 'FAILED';
  const nextAction = (outcome === 'VERIFIED') ? 'PROCEED_TO_TRANSACTION' : 'DENY_EXCEPTION';

  // 5. Create Authorization Record
  const authRecord = new ExceptionAuthorization({
    authorizationId: `AUTH-SYN-${crypto.randomUUID()}`,
    transactionRef,
    method: 'OTP',
    ruleApplied: ruleId,
    outcome,
    timestamp: new Date()
  });

  await authRecord.save();

  // 6. Return response contract without exposing raw OTP
  return {
    transactionRef,
    exceptionAuthorization: {
      method: authRecord.method,
      outcome: authRecord.outcome,
      authorizationId: authRecord.authorizationId,
      ruleApplied: authRecord.ruleApplied
    },
    nextAction
  };
}

/**
 * Handle post-transaction biometric re-verification.
 * @param {Object} input - { transactionRef, fingerprint, face, iris }
 * @returns {Object} API response
 */
export async function processReverification(input) {
  const { transactionRef, fingerprint, face, iris } = input;

  // 1. Transaction must exist and be in a completed state
  const transaction = await RationTransaction.findOne({ transactionId: transactionRef });
  if (!transaction || transaction.status !== 'COMPLETED') {
    const error = new Error('Re-verification rejected: Transaction not found or not completed');
    error.code = 'INVALID_TRANSACTION_STATE';
    throw error;
  }

  // 2. Replay protection: check if re-verification already happened
  const existingReverification = await BiometricVerificationEvent.findOne({
    transactionRef,
    stage: 'POST_TRANSACTION_REVERIFICATION'
  });

  if (existingReverification) {
    const error = new Error('Re-verification already completed for this transaction');
    error.code = 'REVERIFICATION_ALREADY_COMPLETED';
    throw error;
  }

  // 3. Aggregate results (using same base aggregation but mapping to different statuses)
  const results = { fingerprint, face, iris };
  const aggregate = aggregateBiometricResult(results);
  
  let reverifyStatus;
  let nextAction;

  if (aggregate.status === 'AUTHENTICATED') {
    reverifyStatus = 'MATCH_CONFIRMED';
    nextAction = 'CONFIRM_VERIFICATION';
  } else if (aggregate.status === 'BIOMETRIC_FAILED') {
    reverifyStatus = 'MISMATCH_FLAGGED';
    nextAction = 'REVIEW_REQUIRED';
  } else {
    reverifyStatus = 'REVERIFICATION_UNAVAILABLE';
    nextAction = 'REVIEW_REQUIRED';
  }

  // 4. Persist individual re-verification events
  const eventsToSave = [];
  
  for (const [modalityName, data] of Object.entries(results)) {
    eventsToSave.push({
      eventId: `BIO-REVERIFY-${crypto.randomUUID()}`,
      transactionRef,
      modality: modalityName.toUpperCase(),
      stage: 'POST_TRANSACTION_REVERIFICATION',
      outcome: data.outcome,
      failureReason: data.failureReason || undefined,
      syntheticTemplateHash: `SYN-HASH-${crypto.randomBytes(8).toString('hex')}`,
      confidenceScore: data.outcome === 'SUCCESS' ? 0.95 : 0.45,
      deviceRef: 'DEV-REVERIFY-SYN-001',
      timestamp: new Date()
    });
  }

  await BiometricVerificationEvent.insertMany(eventsToSave);

  // 4b. Automatically create an InvestigationCase if MISMATCH_FLAGGED
  if (reverifyStatus === 'MISMATCH_FLAGGED') {
    const { createInvestigationCase } = await import('./investigationsService.js');
    try {
      await createInvestigationCase({ transactionRef });
    } catch (err) {
      // If a case already exists, createInvestigationCase throws DUPLICATE_CASE error which is acceptable.
      // Other eligibility errors should ideally not happen because we just validated and saved the events,
      // but if they do we let them throw up.
      if (err.code !== 'DUPLICATE_CASE') {
        throw err;
      }
    }
  }

  // 5. Return JSON contract response
  return {
    transactionRef,
    verificationStage: 'POST_TRANSACTION_REVERIFICATION',
    reverification: {
      status: reverifyStatus
    },
    nextAction
  };
}
