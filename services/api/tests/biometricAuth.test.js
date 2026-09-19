import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';

process.env.NODE_ENV = 'test';

test('POST /api/v1/auth/biometric', async (t) => {
  const { default: app } = await import('../src/server.js');

  let insertedEvents = [];
  const originalInsertMany = BiometricVerificationEvent.insertMany;
  const originalFind = BiometricVerificationEvent.find;

  t.before(async () => {
    BiometricVerificationEvent.insertMany = async (docs) => {
      insertedEvents.push(...docs);
      return docs;
    };
    BiometricVerificationEvent.find = async () => insertedEvents;
  });

  t.after(async () => {
    BiometricVerificationEvent.insertMany = originalInsertMany;
    BiometricVerificationEvent.find = originalFind;
  });

  t.beforeEach(async () => {
    insertedEvents = [];
  });

  await t.test('1. Valid all-success biometric request', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0001',
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app)
      .post('/api/v1/auth/biometric')
      .send(payload);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.transactionRef, 'TXN-API-SYN-0001');
    assert.deepStrictEqual(res.body.authentication, { status: 'AUTHENTICATED', exceptionEligible: false });
    assert.strictEqual(res.body.verificationStage, 'INITIAL');
    assert.strictEqual(res.body.nextAction, 'PROCEED');

    const events = await BiometricVerificationEvent.find({});
    assert.strictEqual(events.length, 3, 'Should create 3 biometric events');
    
    // Check correct modalities and stage
    const modalities = events.map(e => e.modality).sort();
    assert.deepStrictEqual(modalities, ['FACE', 'FINGERPRINT', 'IRIS']);
    
    events.forEach(e => {
      assert.strictEqual(e.outcome, 'SUCCESS');
      assert.strictEqual(e.stage, 'INITIAL');
      assert.ok(e.syntheticTemplateHash.startsWith('SYN-HASH-'));
      assert.strictEqual(e.transactionRef, 'TXN-API-SYN-0001');
      assert.strictEqual(e.failureReason, undefined);
    });
  });

  await t.test('2. Fingerprint failure', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0002',
      fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app)
      .post('/api/v1/auth/biometric')
      .send(payload);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.authentication, { status: 'BIOMETRIC_FAILED', exceptionEligible: true });
    assert.strictEqual(res.body.nextAction, 'OTP_EXCEPTION');

    const events = await BiometricVerificationEvent.find({});
    assert.strictEqual(events.length, 3);
  });

  await t.test('3. One UNAVAILABLE and no FAILURE', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0003',
      fingerprint: { outcome: 'UNAVAILABLE', failureReason: 'TIMEOUT' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app)
      .post('/api/v1/auth/biometric')
      .send(payload);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.authentication, { status: 'BIOMETRIC_UNAVAILABLE', exceptionEligible: true });
  });

  await t.test('4. Invalid modality outcome is rejected', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0004',
      fingerprint: { outcome: 'PARTIAL' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'VALIDATION_ERROR');
  });

  await t.test('5. Missing required transactionRef', async () => {
    const payload = {
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 400);
  });

  await t.test('6. Missing modality data is rejected', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0006',
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' }
      // missing iris
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 400);
  });

  await t.test('7. Unknown request fields are rejected', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0007',
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' },
      extraField: 'should fail' // Strict mode
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 400);
  });

  await t.test('8. Aadhaar-like PII is rejected by PII Firewall', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0008',
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' },
      aadhaar: '123456789012' // Will trigger PII firewall
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 422); // PII firewall returns 422
    assert.strictEqual(res.body.code, 'PII_DETECTED');
  });

  await t.test('9. SUCCESS with failureReason is rejected', async () => {
    const payload = {
      transactionRef: 'TXN-API-SYN-0009',
      fingerprint: { outcome: 'SUCCESS', failureReason: 'MISMATCH' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' }
    };

    const res = await request(app).post('/api/v1/auth/biometric').send(payload);
    assert.strictEqual(res.status, 400);
    assert.match(JSON.stringify(res.body.errors), /failureReason must be null/);
  });
});
