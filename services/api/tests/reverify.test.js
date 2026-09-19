import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';
import { RationTransaction } from '../src/models/RationTransaction.js';
import { InvestigationCase } from '../src/models/InvestigationCase.js';

process.env.NODE_ENV = 'test';

test('POST /api/v1/auth/reverify', async (t) => {
  const { default: app } = await import('../src/server.js');

  let insertedEvents = [];
  let mockTransactions = [];
  let mockExistingReverifications = [];
  let insertedCases = [];
  let mockExistingCases = [];

  const originalFindOneTx = RationTransaction.findOne;
  const originalFindOneBio = BiometricVerificationEvent.findOne;
  const originalInsertManyBio = BiometricVerificationEvent.insertMany;
  const originalFindOneCase = InvestigationCase.findOne;
  const originalSaveCase = InvestigationCase.prototype.save;
  const originalFindBio = BiometricVerificationEvent.find;

  t.before(() => {
    RationTransaction.findOne = async (query) => {
      return mockTransactions.find(t => t.transactionId === query.transactionId);
    };
    
    BiometricVerificationEvent.findOne = async (query) => {
      return mockExistingReverifications.find(e => 
        e.transactionRef === query.transactionRef &&
        e.stage === query.stage
      );
    };

    BiometricVerificationEvent.insertMany = async (events) => {
      insertedEvents.push(...events);
      // Let's actually run them through the Mongoose model to trigger validation (Test 20)
      for (const e of events) {
        const doc = new BiometricVerificationEvent(e);
        const err = doc.validateSync();
        if (err) throw err;
      }
      return events;
    };

    BiometricVerificationEvent.find = async (query) => {
      return insertedEvents.filter(e => 
        e.transactionRef === query.transactionRef &&
        e.stage === query.stage
      );
    };

    InvestigationCase.findOne = async (query) => {
      return mockExistingCases.find(c => c.transactionRef === query.transactionRef);
    };

    InvestigationCase.prototype.save = async function() {
      insertedCases.push(this.toObject());
      return this;
    };
  });

  t.after(() => {
    RationTransaction.findOne = originalFindOneTx;
    BiometricVerificationEvent.findOne = originalFindOneBio;
    BiometricVerificationEvent.insertMany = originalInsertManyBio;
    BiometricVerificationEvent.find = originalFindBio;
    InvestigationCase.findOne = originalFindOneCase;
    InvestigationCase.prototype.save = originalSaveCase;
  });

  t.beforeEach(() => {
    insertedEvents = [];
    mockTransactions = [];
    mockExistingReverifications = [];
    insertedCases = [];
    mockExistingCases = [];
  });

  const validPayload = (txnRef = 'TXN-001', modifications = {}) => {
    return {
      transactionRef: txnRef,
      fingerprint: { outcome: 'SUCCESS' },
      face: { outcome: 'SUCCESS' },
      iris: { outcome: 'SUCCESS' },
      ...modifications
    };
  };

  await t.test('1. Completed synthetic transaction + all 3 SUCCESS -> MATCH_CONFIRMED', async () => {
    mockTransactions = [{ transactionId: 'TXN-001', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-001'));

    if (res.status !== 200) console.log(res.body);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reverification.status, 'MATCH_CONFIRMED');
    assert.strictEqual(res.body.nextAction, 'CONFIRM_VERIFICATION');

    // 10. Three new POST_TRANSACTION_REVERIFICATION events are persisted
    assert.strictEqual(insertedEvents.length, 3);
    assert.ok(insertedEvents.every(e => e.stage === 'POST_TRANSACTION_REVERIFICATION'));
    
    // 11. No raw biometric data persisted
    assert.ok(insertedEvents.every(e => !e.rawImage && !e.base64 && !e.template));
  });

  await t.test('2. Completed transaction + one FAILURE -> MISMATCH_FLAGGED', async () => {
    mockTransactions = [{ transactionId: 'TXN-002', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-002', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));

    if (res.status !== 200) console.log(res.body);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reverification.status, 'MISMATCH_FLAGGED');
    
    // 17. Re-verification failure does NOT trigger OTP.
    assert.strictEqual(res.body.nextAction, 'REVIEW_REQUIRED'); // Not OTP_EXCEPTION
  });

  await t.test('3. Completed transaction + one UNAVAILABLE and no FAILURE -> REVERIFICATION_UNAVAILABLE', async () => {
    mockTransactions = [{ transactionId: 'TXN-003', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-003', { face: { outcome: 'UNAVAILABLE' } }));

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reverification.status, 'REVERIFICATION_UNAVAILABLE');
    
    // 18. Re-verification unavailable does NOT trigger OTP.
    assert.strictEqual(res.body.nextAction, 'REVIEW_REQUIRED'); // Not OTP_EXCEPTION
  });

  await t.test('4. FAILURE + UNAVAILABLE -> MISMATCH_FLAGGED', async () => {
    mockTransactions = [{ transactionId: 'TXN-004', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-004', { 
        face: { outcome: 'UNAVAILABLE' },
        fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } 
      }));

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reverification.status, 'MISMATCH_FLAGGED');
  });

  await t.test('5. Partial success is never treated as a match', async () => {
    mockTransactions = [{ transactionId: 'TXN-005', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-005', { face: { outcome: 'UNAVAILABLE' } }));

    assert.notStrictEqual(res.body.reverification.status, 'MATCH_CONFIRMED');
  });

  await t.test('6. Unknown transaction rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-006'));

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_TRANSACTION_STATE');
  });

  await t.test('7. Transaction not in an appropriate completed/authorized state rejected', async () => {
    mockTransactions = [{ transactionId: 'TXN-007', status: 'PENDING' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-007'));

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_TRANSACTION_STATE');
  });

  await t.test('8. Second successful re-verification rejected', async () => {
    mockTransactions = [{ transactionId: 'TXN-008', status: 'COMPLETED' }];
    mockExistingReverifications = [{ transactionRef: 'TXN-008', stage: 'POST_TRANSACTION_REVERIFICATION' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-008'));

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'REVERIFICATION_ALREADY_COMPLETED');
  });

  await t.test('9. Initial biometric events remain unchanged', async () => {
    // Asserted by ensuring we only insert POST_TRANSACTION_REVERIFICATION events
    mockTransactions = [{ transactionId: 'TXN-009', status: 'COMPLETED' }];

    await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-009'));

    assert.ok(insertedEvents.every(e => e.stage === 'POST_TRANSACTION_REVERIFICATION'));
    assert.ok(insertedEvents.every(e => e.stage !== 'INITIAL'));
  });

  await t.test('12. Aadhaar/mobile/phone payload rejected', async () => {
    const resAadhaar = await request(app)
      .post('/api/v1/auth/reverify')
      .send({ ...validPayload('TXN-012'), aadhaar: '123412341234' });
    assert.strictEqual(resAadhaar.status, 422);

    const resMobile = await request(app)
      .post('/api/v1/auth/reverify')
      .send({ ...validPayload('TXN-012'), mobile: '9876543210' });
    assert.strictEqual(resMobile.status, 422);
  });

  await t.test('13. Raw biometric string rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send({ transactionRef: 'TXN-013', fingerprint: 'raw_fingerprint_data', face: 'raw', iris: 'raw' });
    assert.strictEqual(res.status, 422); // Fails PII Firewall because structured object is required
  });

  await t.test('14. Base64/image/template payload rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-014', { fingerprint: { outcome: 'SUCCESS', base64: 'base64data' } }));
    assert.strictEqual(res.status, 422); // Fails PII Firewall because it contains unallowed keys like base64
  });

  await t.test('15. Nested forbidden PII rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send({ ...validPayload('TXN-015'), additional: { aadhaar: '123412341234' } });
    
    assert.strictEqual(res.status, 422);
  });

  await t.test('16. `photo` remains rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send({ ...validPayload('TXN-016'), photo: { outcome: 'SUCCESS' } });
    
    assert.strictEqual(res.status, 422);
  });

  await t.test('19. Response contains no legal-guilt determination', async () => {
    mockTransactions = [{ transactionId: 'TXN-019', status: 'COMPLETED' }];

    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-019', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));

    const resStr = JSON.stringify(res.body);
    assert.ok(!resStr.includes('GUILT'));
    assert.ok(!resStr.includes('CULPRIT'));
    assert.ok(!resStr.includes('CONVICTED'));
    assert.ok(!resStr.includes('FRAUDSTER'));
    assert.ok(!resStr.includes('CRIMINAL'));
  });
  
  await t.test('20. Full model/schema validation passes', async () => {
    // Asserted by insertMany override that calls validateSync
    mockTransactions = [{ transactionId: 'TXN-020', status: 'COMPLETED' }];
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-020'));
    
    assert.strictEqual(res.status, 200);
  });

  await t.test('TEST A: Re-verification MATCH_CONFIRMED -> no InvestigationCase created', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-A', status: 'COMPLETED' }];
    await request(app).post('/api/v1/auth/reverify').send(validPayload('TXN-TEST-A'));
    assert.strictEqual(insertedCases.length, 0);
  });

  await t.test('TEST B: Re-verification MISMATCH_FLAGGED -> exactly one InvestigationCase automatically created', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-B', status: 'COMPLETED' }];
    await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-TEST-B', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));
    assert.strictEqual(insertedCases.length, 1);
    assert.strictEqual(insertedCases[0].transactionRef, 'TXN-TEST-B');
    assert.strictEqual(insertedCases[0].status, 'OPEN');
  });

  await t.test('TEST C: Calling/repeating mismatch path -> does not create duplicate InvestigationCase records', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-C', status: 'COMPLETED' }];
    
    // Seed an existing case to simulate it was already created
    mockExistingCases = [{ transactionRef: 'TXN-TEST-C', caseId: 'CASE-ALREADY' }];
    
    const res = await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-TEST-C', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(insertedCases.length, 0); // No new cases should be pushed since it catches DUPLICATE_CASE
  });

  await t.test('TEST D: REVERIFICATION_UNAVAILABLE -> no InvestigationCase created', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-D', status: 'COMPLETED' }];
    await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-TEST-D', { face: { outcome: 'UNAVAILABLE' } }));
    assert.strictEqual(insertedCases.length, 0);
  });

  await t.test('TEST F: Automatically created case contains evidence references only', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-F', status: 'COMPLETED' }];
    await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-TEST-F', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));
    
    assert.strictEqual(insertedCases.length, 1);
    const theCase = insertedCases[0];
    assert.ok(Array.isArray(theCase.evidenceRefs));
    assert.ok(theCase.evidenceRefs.length > 0);
    assert.strictEqual(theCase.photo, undefined);
    assert.strictEqual(theCase.fingerprint, undefined);
    assert.strictEqual(theCase.mobile, undefined);
    assert.strictEqual(theCase.aadhaar, undefined);
  });

  await t.test('TEST G: Automatically created case starts in correct OPEN state and does NOT automatically become REFERRED_TO_LE', async () => {
    mockTransactions = [{ transactionId: 'TXN-TEST-G', status: 'COMPLETED' }];
    await request(app)
      .post('/api/v1/auth/reverify')
      .send(validPayload('TXN-TEST-G', { fingerprint: { outcome: 'FAILURE', failureReason: 'MISMATCH' } }));
    
    assert.strictEqual(insertedCases.length, 1);
    assert.strictEqual(insertedCases[0].status, 'OPEN');
    assert.notStrictEqual(insertedCases[0].referralStatus, 'REFERRED_TO_LE');
    assert.strictEqual(insertedCases[0].reason, 'SUSPECTED_IMPERSONATION');
  });

});
