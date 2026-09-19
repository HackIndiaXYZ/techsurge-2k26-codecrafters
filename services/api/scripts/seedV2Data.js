/**
 * @fileoverview Synthetic Dataset Generator for Setu v2.0
 * 
 * PROVENANCE:
 * - Fingerprint: NIST Special Database 301 (Research/reference source only)
 * - Face: NIST Special Database 301 (Research/reference source only)
 * - Iris: Public/research biometric dataset reference (Research/reference source only)
 * - Authentication events, OTP outcomes, Post-transaction re-verification: 
 *   Synthetic generator created by this project.
 * 
 * IMPORTANT: NIST datasets are reference sources only. 
 * The records generated here are entirely synthetic.
 */

import mongoose from 'mongoose';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';
import { ExceptionAuthorization } from '../src/models/ExceptionAuthorization.js';
import { InvestigationCase } from '../src/models/InvestigationCase.js';
import { RationTransaction } from '../src/models/RationTransaction.js';

export function generateV2Dataset() {
  const biometricEvents = [];
  const exceptionAuths = [];
  const investigationCases = [];
  const rationTransactions = [];

  let bioId = 1;
  let authId = 1;
  let caseId = 1;

  // Base timestamp for determinism
  const baseDate = new Date('2026-10-01T08:00:00Z').getTime();

  // Scenario A: Normal Success (10 transactions)
  for (let i = 1; i <= 10; i++) {
    const txnId = `TXN-SYN-${String(i).padStart(4, '0')}`;
    const subjId = `SUBJ-SYN-${String(i).padStart(4, '0')}`;
    
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: `BIO-SYN-${String(bioId++).padStart(4, '0')}`,
      transactionRef: txnId,
      modality: i % 2 === 0 ? 'FINGERPRINT' : 'FACE',
      stage: 'INITIAL',
      outcome: 'SUCCESS',
      syntheticTemplateHash: `hash-a-${i}`,
      confidenceScore: 0.9 + (i % 10) * 0.01,
      deviceRef: 'DEV-001',
      timestamp: new Date(baseDate + i * 1000)
    }));

    rationTransactions.push(new RationTransaction({
      transactionId: txnId,
      subjectRef: subjId,
      status: 'COMPLETED',
      timestamp: new Date(baseDate + i * 1000 + 5000)
    }));
  }

  // Scenario B: Biometric failure -> OTP -> later match (4 transactions)
  for (let i = 11; i <= 14; i++) {
    const txnId = `TXN-SYN-${String(i).padStart(4, '0')}`;
    const subjId = `SUBJ-SYN-${String(i).padStart(4, '0')}`;

    // 1. Initial Failure
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: `BIO-SYN-${String(bioId++).padStart(4, '0')}`,
      transactionRef: txnId,
      modality: 'FINGERPRINT',
      stage: 'INITIAL',
      outcome: 'FAILURE',
      failureReason: 'POOR_QUALITY',
      syntheticTemplateHash: `hash-b-fail-${i}`,
      confidenceScore: 0.3,
      deviceRef: 'DEV-001',
      timestamp: new Date(baseDate + i * 1000)
    }));

    // 2. OTP Success
    exceptionAuths.push(new ExceptionAuthorization({
      authorizationId: `AUTH-SYN-${String(authId++).padStart(4, '0')}`,
      transactionRef: txnId,
      method: 'OTP',
      ruleApplied: 'R-BIO-002',
      outcome: 'VERIFIED',
      timestamp: new Date(baseDate + i * 1000 + 60000)
    }));

    // 3. Completed Transaction
    rationTransactions.push(new RationTransaction({
      transactionId: txnId,
      subjectRef: subjId,
      status: 'COMPLETED',
      timestamp: new Date(baseDate + i * 1000 + 65000)
    }));

    // 4. Later match
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: `BIO-SYN-${String(bioId++).padStart(4, '0')}`,
      transactionRef: txnId,
      modality: 'FINGERPRINT',
      stage: 'POST_TRANSACTION_REVERIFICATION',
      outcome: 'SUCCESS',
      syntheticTemplateHash: `hash-b-succ-${i}`,
      confidenceScore: 0.95,
      deviceRef: 'DEV-002',
      timestamp: new Date(baseDate + i * 1000 + 86400000) // +1 day
    }));
  }

  // Scenario C: Biometric failure -> OTP -> later mismatch -> suspected impersonation (3 transactions)
  for (let i = 15; i <= 17; i++) {
    const txnId = `TXN-SYN-${String(i).padStart(4, '0')}`;
    const subjId = `SUBJ-SYN-${String(i).padStart(4, '0')}`;

    const failEventId1 = `BIO-SYN-${String(bioId++).padStart(4, '0')}`;
    // 1. Initial Failure
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: failEventId1,
      transactionRef: txnId,
      modality: 'FACE',
      stage: 'INITIAL',
      outcome: 'FAILURE',
      failureReason: 'MISMATCH',
      syntheticTemplateHash: `hash-c-fail-${i}`,
      confidenceScore: 0.1,
      deviceRef: 'DEV-001',
      timestamp: new Date(baseDate + i * 1000)
    }));

    const authIdStr = `AUTH-SYN-${String(authId++).padStart(4, '0')}`;
    // 2. OTP Success
    exceptionAuths.push(new ExceptionAuthorization({
      authorizationId: authIdStr,
      transactionRef: txnId,
      method: 'OTP',
      ruleApplied: 'R-BIO-002',
      outcome: 'VERIFIED',
      timestamp: new Date(baseDate + i * 1000 + 60000)
    }));

    // 3. Completed Transaction
    rationTransactions.push(new RationTransaction({
      transactionId: txnId,
      subjectRef: subjId,
      status: 'COMPLETED',
      timestamp: new Date(baseDate + i * 1000 + 65000)
    }));

    const failEventId2 = `BIO-SYN-${String(bioId++).padStart(4, '0')}`;
    // 4. Later mismatch
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: failEventId2,
      transactionRef: txnId,
      modality: 'FACE',
      stage: 'POST_TRANSACTION_REVERIFICATION',
      outcome: 'FAILURE',
      failureReason: 'MISMATCH',
      syntheticTemplateHash: `hash-c-mismatch-${i}`,
      confidenceScore: 0.05,
      deviceRef: 'DEV-002',
      timestamp: new Date(baseDate + i * 1000 + 86400000) // +1 day
    }));

    // 5. Investigation Case
    investigationCases.push(new InvestigationCase({
      caseId: `CASE-SYN-${String(caseId++).padStart(4, '0')}`,
      transactionRef: txnId,
      verificationEventRef: failEventId2,
      reason: 'SUSPECTED_IMPERSONATION',
      status: 'OPEN',
      evidenceRefs: [failEventId1, authIdStr, failEventId2],
      createdAt: new Date(baseDate + i * 1000 + 86400000 + 10000),
      referralStatus: 'PENDING_AUTHORIZATION'
    }));
  }

  // Scenario D: Biometric failure -> OTP failure (2 transactions)
  for (let i = 18; i <= 19; i++) {
    const txnId = `TXN-SYN-${String(i).padStart(4, '0')}`;
    const subjId = `SUBJ-SYN-${String(i).padStart(4, '0')}`;

    // 1. Initial Failure
    biometricEvents.push(new BiometricVerificationEvent({
      eventId: `BIO-SYN-${String(bioId++).padStart(4, '0')}`,
      transactionRef: txnId,
      modality: 'FINGERPRINT',
      stage: 'INITIAL',
      outcome: 'FAILURE',
      failureReason: 'TIMEOUT',
      syntheticTemplateHash: `hash-d-fail-${i}`,
      confidenceScore: 0.0,
      deviceRef: 'DEV-001',
      timestamp: new Date(baseDate + i * 1000)
    }));

    // 2. OTP Failure
    exceptionAuths.push(new ExceptionAuthorization({
      authorizationId: `AUTH-SYN-${String(authId++).padStart(4, '0')}`,
      transactionRef: txnId,
      method: 'OTP',
      ruleApplied: 'R-BIO-002',
      outcome: 'FAILED',
      timestamp: new Date(baseDate + i * 1000 + 60000)
    }));

    // 3. Flagged Transaction (Must not be COMPLETED)
    rationTransactions.push(new RationTransaction({
      transactionId: txnId,
      subjectRef: subjId,
      status: 'FLAGGED',
      timestamp: new Date(baseDate + i * 1000 + 65000)
    }));
  }

  // Scenario E: Biometric unavailable (1 transaction)
  {
    const i = 20;
    const txnId = `TXN-SYN-${String(i).padStart(4, '0')}`;
    const subjId = `SUBJ-SYN-${String(i).padStart(4, '0')}`;

    biometricEvents.push(new BiometricVerificationEvent({
      eventId: `BIO-SYN-${String(bioId++).padStart(4, '0')}`,
      transactionRef: txnId,
      modality: 'IRIS',
      stage: 'INITIAL',
      outcome: 'UNAVAILABLE',
      failureReason: 'UNKNOWN',
      syntheticTemplateHash: `hash-e-unavail-${i}`,
      confidenceScore: 0.0,
      deviceRef: 'DEV-001',
      timestamp: new Date(baseDate + i * 1000)
    }));

    // Simulating exception success after unavailability
    exceptionAuths.push(new ExceptionAuthorization({
      authorizationId: `AUTH-SYN-${String(authId++).padStart(4, '0')}`,
      transactionRef: txnId,
      method: 'OTP',
      ruleApplied: 'R-BIO-002',
      outcome: 'VERIFIED',
      timestamp: new Date(baseDate + i * 1000 + 60000)
    }));

    rationTransactions.push(new RationTransaction({
      transactionId: txnId,
      subjectRef: subjId,
      status: 'COMPLETED',
      timestamp: new Date(baseDate + i * 1000 + 65000)
    }));
  }

  return {
    biometricEvents,
    exceptionAuths,
    investigationCases,
    rationTransactions
  };
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  console.log('Clearing v2 data collections...');
  await BiometricVerificationEvent.deleteMany({});
  await ExceptionAuthorization.deleteMany({});
  await InvestigationCase.deleteMany({});
  await RationTransaction.deleteMany({});

  console.log('Generating synthetic dataset...');
  const dataset = generateV2Dataset();

  console.log('Inserting BiometricVerificationEvent records:', dataset.biometricEvents.length);
  await BiometricVerificationEvent.insertMany(dataset.biometricEvents);

  console.log('Inserting ExceptionAuthorization records:', dataset.exceptionAuths.length);
  await ExceptionAuthorization.insertMany(dataset.exceptionAuths);

  console.log('Inserting InvestigationCase records:', dataset.investigationCases.length);
  await InvestigationCase.insertMany(dataset.investigationCases);

  console.log('Inserting RationTransaction records:', dataset.rationTransactions.length);
  await RationTransaction.insertMany(dataset.rationTransactions);

  console.log('Seed v2 complete.');
  await mongoose.disconnect();
}

// Run seed if this file is executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
