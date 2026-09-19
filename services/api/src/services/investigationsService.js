import { InvestigationCase } from '../models/InvestigationCase.js';
import { BiometricVerificationEvent } from '../models/BiometricVerificationEvent.js';
import { RationTransaction } from '../models/RationTransaction.js';
import { aggregateBiometricResult } from './authService.js';
import crypto from 'crypto';

export async function createInvestigationCase({ transactionRef }) {
  // 1. Transaction exists and completed
  const transaction = await RationTransaction.findOne({ transactionId: transactionRef });
  if (!transaction || transaction.status !== 'COMPLETED') {
    const error = new Error('Investigation rejected: Transaction not found or not completed');
    error.code = 'INVALID_TRANSACTION_STATE';
    throw error;
  }

  // 2. Has reverification events
  const reverifyEvents = await BiometricVerificationEvent.find({
    transactionRef,
    stage: 'POST_TRANSACTION_REVERIFICATION'
  });

  if (!reverifyEvents || reverifyEvents.length === 0) {
    const error = new Error('Investigation rejected: No re-verification events found');
    error.code = 'NO_REVERIFICATION_EVIDENCE';
    throw error;
  }

  // 3. Aggregate to verify mismatch
  const results = {};
  for (const event of reverifyEvents) {
    results[event.modality.toLowerCase()] = {
      outcome: event.outcome,
      failureReason: event.failureReason
    };
  }

  const aggregate = aggregateBiometricResult(results);

  // Re-verification matching semantics (from authService)
  // AUTHENTICATED -> MATCH_CONFIRMED (cannot create case)
  // BIOMETRIC_UNAVAILABLE -> REVERIFICATION_UNAVAILABLE (cannot create case)
  // BIOMETRIC_FAILED -> MISMATCH_FLAGGED (CAN create case)

  if (aggregate.status !== 'BIOMETRIC_FAILED') {
    const error = new Error('Investigation rejected: Only MISMATCH_FLAGGED reverifications are eligible');
    error.code = 'NOT_ELIGIBLE_FOR_INVESTIGATION';
    throw error;
  }

  // 4. Check for duplicates
  const existingCase = await InvestigationCase.findOne({ transactionRef });
  if (existingCase) {
    const error = new Error('Investigation case already exists for this transaction');
    error.code = 'DUPLICATE_CASE';
    throw error;
  }

  // 5. Create Case
  const evidenceRefs = reverifyEvents.map(e => e.eventId);
  const verificationEventRef = evidenceRefs[0] || 'NONE'; // Usually we'd refer to an overarching event, but we'll pick the first for now.

  const newCase = new InvestigationCase({
    caseId: `CASE-SYN-${crypto.randomUUID()}`,
    transactionRef,
    verificationEventRef,
    reason: 'SUSPECTED_IMPERSONATION',
    status: 'OPEN',
    evidenceRefs,
    referralStatus: 'NOT_REFERRED'
  });

  await newCase.save();
  return newCase;
}

export async function getInvestigations(filters) {
  return await InvestigationCase.find(filters).lean();
}

export async function updateInvestigationState(caseId, action) {
  const invCase = await InvestigationCase.findOne({ caseId });
  if (!invCase) {
    const error = new Error('Case not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  switch (action) {
    case 'START_REVIEW':
      if (invCase.status !== 'OPEN') {
        throwStateError(action, invCase.status);
      }
      invCase.status = 'UNDER_REVIEW';
      break;

    case 'REQUEST_AUTHORIZATION':
      if (invCase.status !== 'UNDER_REVIEW') {
        throwStateError(action, invCase.status);
      }
      invCase.referralStatus = 'PENDING_AUTHORIZATION';
      break;

    case 'AUTHORIZE_REFERRAL':
      if (invCase.referralStatus !== 'PENDING_AUTHORIZATION') {
        throwStateError(action, invCase.referralStatus);
      }
      // Explicit prototype action to authorize
      invCase.status = 'REFERRED_TO_LE';
      invCase.referralStatus = 'REFERRED_TO_LE';
      break;

    case 'ACKNOWLEDGE_REFERRAL':
      if (invCase.referralStatus !== 'REFERRED_TO_LE') {
        throwStateError(action, invCase.referralStatus);
      }
      invCase.referralStatus = 'ACKNOWLEDGED';
      break;

    case 'CLOSE_CASE':
      if (invCase.status === 'CLOSED') {
        throwStateError(action, invCase.status);
      }
      invCase.status = 'CLOSED';
      if (invCase.referralStatus !== 'NOT_REFERRED') {
        invCase.referralStatus = 'CLOSED';
      }
      break;

    default:
      const error = new Error('Invalid action');
      error.code = 'INVALID_ACTION';
      throw error;
  }

  await invCase.save();
  return invCase;
}

function throwStateError(action, currentState) {
  const error = new Error(`Action ${action} is not allowed from current state ${currentState}`);
  error.code = 'INVALID_STATE_TRANSITION';
  throw error;
}
