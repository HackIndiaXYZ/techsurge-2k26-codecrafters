/**
 * @fileoverview Tests for v2.0 architecture mongoose schemas.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';
import { ExceptionAuthorization } from '../src/models/ExceptionAuthorization.js';
import { InvestigationCase } from '../src/models/InvestigationCase.js';
import { RationTransaction } from '../src/models/RationTransaction.js';

describe('BiometricVerificationEvent Model Tests', () => {
  test('A. Valid records are accepted', () => {
    const doc = new BiometricVerificationEvent({
      eventId: 'event-1',
      transactionRef: 'tx-1',
      modality: 'FINGERPRINT',
      stage: 'INITIAL',
      outcome: 'SUCCESS',
      syntheticTemplateHash: 'hash-abc',
      confidenceScore: 0.95,
      deviceRef: 'dev-1',
      timestamp: new Date()
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
  });

  test('B. Required fields are enforced', () => {
    const doc = new BiometricVerificationEvent({});
    const err = doc.validateSync();
    assert.ok(err.errors['eventId']);
    assert.ok(err.errors['modality']);
  });

  test('C. Invalid enum values are rejected', () => {
    const doc = new BiometricVerificationEvent({
      eventId: 'event-2',
      transactionRef: 'tx-2',
      modality: 'RETINA', // Invalid
      stage: 'INITIAL',
      outcome: 'SUCCESS',
      syntheticTemplateHash: 'hash-abc',
      confidenceScore: 0.95,
      deviceRef: 'dev-1',
      timestamp: new Date()
    });
    const err = doc.validateSync();
    assert.ok(err.errors['modality']);
  });

  test('D. Strict schemas reject unknown fields (Mongoose handles silently or error if strict: "throw", but we check the object)', () => {
    const doc = new BiometricVerificationEvent({
      eventId: 'event-3',
      transactionRef: 'tx-3',
      modality: 'FACE',
      stage: 'INITIAL',
      outcome: 'SUCCESS',
      syntheticTemplateHash: 'hash',
      confidenceScore: 0.9,
      deviceRef: 'dev',
      timestamp: new Date(),
      someUnknownField: 'value'
    });
    // With strict: true, Mongoose drops unknown fields before saving/validating
    assert.equal(doc.someUnknownField, undefined);
  });

  test('E/F/G. PII / Raw Biometric fields cannot be persisted', () => {
    const forbiddenFields = [
      'aadhaar', 'aadhaarNumber', 'mobile', 'phone', 'otp', 
      'biometricData', 'fingerprint', 'faceImage', 'irisImage', 'rawTemplate'
    ];
    const schemaPaths = Object.keys(BiometricVerificationEvent.schema.paths);
    for (const field of forbiddenFields) {
      assert.ok(!schemaPaths.includes(field), `Model must not contain PII/raw field: ${field}`);
    }
  });

  test('H. confidenceScore validation works', () => {
    const doc = new BiometricVerificationEvent({
      eventId: 'evt-4', transactionRef: 'tx', modality: 'IRIS', stage: 'INITIAL', outcome: 'SUCCESS',
      syntheticTemplateHash: 'hash', confidenceScore: 1.5, // > 1
      deviceRef: 'dev', timestamp: new Date()
    });
    const err = doc.validateSync();
    assert.ok(err.errors['confidenceScore']);
  });

  test('I. Invalid timestamps are rejected', () => {
    const doc = new BiometricVerificationEvent({
      eventId: 'evt-4', transactionRef: 'tx', modality: 'IRIS', stage: 'INITIAL', outcome: 'SUCCESS',
      syntheticTemplateHash: 'hash', confidenceScore: 0.5,
      deviceRef: 'dev', timestamp: 'not-a-date'
    });
    const err = doc.validateSync();
    assert.ok(err.errors['timestamp']);
  });
});

describe('ExceptionAuthorization Model Tests', () => {
  test('A. Valid records are accepted', () => {
    const doc = new ExceptionAuthorization({
      authorizationId: 'auth-1',
      transactionRef: 'tx-1',
      method: 'OTP',
      ruleApplied: 'R-BIO-002',
      outcome: 'VERIFIED',
      timestamp: new Date()
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
  });

  test('M. ExceptionAuthorization never stores OTP values', () => {
    const schemaPaths = Object.keys(ExceptionAuthorization.schema.paths);
    assert.ok(!schemaPaths.includes('otp'), 'Model must not contain OTP field');
    assert.ok(!schemaPaths.includes('mobile'), 'Model must not contain mobile field');
  });
});

describe('InvestigationCase Model Tests', () => {
  test('A. Valid records are accepted', () => {
    const doc = new InvestigationCase({
      caseId: 'case-1',
      transactionRef: 'tx-1',
      verificationEventRef: 'evt-1',
      reason: 'SUSPECTED_IMPERSONATION',
      status: 'OPEN',
      evidenceRefs: ['log-1', 'log-2'],
      referralStatus: 'NOT_REFERRED'
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
  });

  test('J. InvestigationCase cannot represent guilty/convicted fields', () => {
    const schemaPaths = Object.keys(InvestigationCase.schema.paths);
    const forbidden = ['culprit', 'guilty', 'criminal', 'convicted', 'isGuilty'];
    for (const field of forbidden) {
      assert.ok(!schemaPaths.includes(field), `Model must not contain guilt field: ${field}`);
    }
  });

  test('K. InvestigationCase reason/status validation works', () => {
    const doc = new InvestigationCase({
      caseId: 'case-2',
      transactionRef: 'tx-2',
      verificationEventRef: 'evt-2',
      reason: 'CRIMINAL_FRAUD', // invalid
      status: 'OPEN',
    });
    const err = doc.validateSync();
    assert.ok(err.errors['reason']);
  });
});

describe('RationTransaction Model Tests', () => {
  test('N. RationTransaction follows architecture contract', () => {
    const doc = new RationTransaction({
      transactionId: 'tx-1',
      subjectRef: 'subj-1',
      status: 'PENDING_VERIFICATION',
      timestamp: new Date()
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    
    // Test invalid status
    doc.status = 'APPROVED';
    const err2 = doc.validateSync();
    assert.ok(err2.errors['status']);
  });
});
