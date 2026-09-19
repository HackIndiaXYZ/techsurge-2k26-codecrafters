import test from 'node:test';
import assert from 'node:assert';
import { aggregateBiometricResult } from '../src/services/authService.js';

test('Biometric Aggregation Pure Function', async (t) => {
  await t.test('1. SUCCESS + SUCCESS + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'AUTHENTICATED',
      exceptionEligible: false,
      nextAction: 'PROCEED'
    });
  });

  await t.test('2. FAILURE + SUCCESS + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('3. SUCCESS + FAILURE + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'FAILURE', failureReason: 'POOR_QUALITY' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('4. SUCCESS + SUCCESS + FAILURE', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'FAILURE', failureReason: 'TIMEOUT' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('5. FAILURE + FAILURE + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' },
      face: { outcome: 'FAILURE', failureReason: 'POOR_QUALITY' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('6. UNAVAILABLE + SUCCESS + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'UNAVAILABLE', failureReason: 'TIMEOUT' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_UNAVAILABLE',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('7. SUCCESS + UNAVAILABLE + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'UNAVAILABLE', failureReason: 'TIMEOUT' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_UNAVAILABLE',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('8. SUCCESS + SUCCESS + UNAVAILABLE', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'UNAVAILABLE', failureReason: 'UNKNOWN' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_UNAVAILABLE',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });

  await t.test('9. FAILURE + UNAVAILABLE + SUCCESS', () => {
    const res = aggregateBiometricResult({
      fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' },
      face: { outcome: 'UNAVAILABLE', failureReason: 'TIMEOUT' },
      iris: { outcome: 'SUCCESS' }
    });
    assert.deepStrictEqual(res, {
      status: 'BIOMETRIC_FAILED',
      exceptionEligible: true,
      nextAction: 'OTP_EXCEPTION'
    });
  });
});
