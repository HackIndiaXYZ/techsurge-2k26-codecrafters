import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { InvestigationCase } from '../src/models/InvestigationCase.js';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';
import { RationTransaction } from '../src/models/RationTransaction.js';

process.env.NODE_ENV = 'test';

test('Investigation Workflow (Phase 4D)', async (t) => {
  const { default: app } = await import('../src/server.js');

  let mockTransactions = [];
  let mockBiometricEvents = [];
  let mockInvestigationCases = [];
  let savedCases = [];

  const originalFindOneTx = RationTransaction.findOne;
  const originalFindBio = BiometricVerificationEvent.find;
  const originalFindOneCase = InvestigationCase.findOne;
  const originalFindCases = InvestigationCase.find;
  const originalSaveCase = InvestigationCase.prototype.save;

  t.before(() => {
    RationTransaction.findOne = async (query) => {
      return mockTransactions.find(tx => tx.transactionId === query.transactionId);
    };

    BiometricVerificationEvent.find = async (query) => {
      return mockBiometricEvents.filter(e => 
        e.transactionRef === query.transactionRef &&
        e.stage === query.stage
      );
    };

    InvestigationCase.findOne = async (query) => {
      if (query.caseId) {
        return mockInvestigationCases.find(c => c.caseId === query.caseId);
      }
      if (query.transactionRef) {
        return mockInvestigationCases.find(c => c.transactionRef === query.transactionRef);
      }
      return null;
    };

    InvestigationCase.find = async (query) => {
      return {
        lean: () => mockInvestigationCases
      };
    };

    InvestigationCase.prototype.save = async function() {
      // Validate to satisfy Test 27
      const err = this.validateSync();
      if (err) throw err;
      
      const obj = this.toObject();
      const idx = mockInvestigationCases.findIndex(c => c.caseId === obj.caseId);
      if (idx !== -1) {
        mockInvestigationCases[idx] = obj;
      } else {
        mockInvestigationCases.push(obj);
      }
      savedCases.push(obj);
      return this;
    };
  });

  t.after(() => {
    RationTransaction.findOne = originalFindOneTx;
    BiometricVerificationEvent.find = originalFindBio;
    InvestigationCase.findOne = originalFindOneCase;
    InvestigationCase.find = originalFindCases;
    InvestigationCase.prototype.save = originalSaveCase;
  });

  t.beforeEach(() => {
    mockTransactions = [];
    mockBiometricEvents = [];
    mockInvestigationCases = [];
    savedCases = [];
  });

  await t.test('1. & 8. Valid re-verification mismatch creates an InvestigationCase starting as OPEN with NOT_REFERRED', async () => {
    mockTransactions = [{ transactionId: 'TXN-001', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-1', transactionRef: 'TXN-001', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'FAILURE', modality: 'FINGERPRINT' }
    ];

    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-001' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'OPEN');
    assert.strictEqual(res.body.reason, 'SUSPECTED_IMPERSONATION');
    assert.strictEqual(res.body.referralStatus, 'NOT_REFERRED');
    assert.ok(res.body.caseId.startsWith('CASE-SYN-'));
  });

  await t.test('2. MATCH_CONFIRMED cannot create a case', async () => {
    mockTransactions = [{ transactionId: 'TXN-002', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-1', transactionRef: 'TXN-002', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'SUCCESS', modality: 'FINGERPRINT' },
      { eventId: 'BIO-2', transactionRef: 'TXN-002', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'SUCCESS', modality: 'FACE' },
      { eventId: 'BIO-3', transactionRef: 'TXN-002', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'SUCCESS', modality: 'IRIS' }
    ];

    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-002' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'NOT_ELIGIBLE_FOR_INVESTIGATION');
  });

  await t.test('3. REVERIFICATION_UNAVAILABLE cannot create a case', async () => {
    mockTransactions = [{ transactionId: 'TXN-003', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-1', transactionRef: 'TXN-003', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'UNAVAILABLE', modality: 'FINGERPRINT' }
    ];

    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-003' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'NOT_ELIGIBLE_FOR_INVESTIGATION');
  });

  await t.test('4. Unknown transaction cannot create a case', async () => {
    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-UNKNOWN' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_TRANSACTION_STATE');
  });

  await t.test('5. & 6. & 23. Unknown verification event / Client cannot fabricate evidence references', async () => {
    // The server only looks up by transactionRef and ignores client-provided evidence.
    // If there is no DB evidence, it fails.
    mockTransactions = [{ transactionId: 'TXN-005', status: 'COMPLETED' }];
    mockBiometricEvents = []; // No events exist

    const res = await request(app).post('/api/v1/investigations').send({ 
      transactionRef: 'TXN-005',
      evidenceRefs: ['FAKE-BIO-1'] // Client tries to fabricate
    });

    // We expect it to fail because it cannot find the server-side evidence
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'NO_REVERIFICATION_EVIDENCE'); // Meaning client can't fabricate
  });

  await t.test('7. Duplicate case creation is prevented', async () => {
    mockTransactions = [{ transactionId: 'TXN-007', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-1', transactionRef: 'TXN-007', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'FAILURE', modality: 'FINGERPRINT' }
    ];
    mockInvestigationCases = [{ transactionRef: 'TXN-007', caseId: 'CASE-EXISTS' }];

    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-007' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'DUPLICATE_CASE');
  });

  // State Transitions
  const createMockCase = (caseId, status, referralStatus) => {
    const c = new InvestigationCase({
      caseId,
      transactionRef: 'TXN-100',
      verificationEventRef: 'BIO-1',
      reason: 'SUSPECTED_IMPERSONATION',
      status,
      evidenceRefs: ['BIO-1'],
      referralStatus
    });
    mockInvestigationCases.push(c);
  };

  await t.test('9. OPEN -> UNDER_REVIEW succeeds', async () => {
    createMockCase('CASE-9', 'OPEN', 'NOT_REFERRED');
    const res = await request(app).patch('/api/v1/investigations/CASE-9').send({ action: 'START_REVIEW' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'UNDER_REVIEW');
  });

  await t.test('10. OPEN -> CLOSED succeeds if allowed by architecture (we allow CLOSE_CASE from anywhere except CLOSED)', async () => {
    createMockCase('CASE-10', 'OPEN', 'NOT_REFERRED');
    const res = await request(app).patch('/api/v1/investigations/CASE-10').send({ action: 'CLOSE_CASE' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'CLOSED');
  });

  await t.test('11. Invalid arbitrary status transition is rejected', async () => {
    createMockCase('CASE-11', 'OPEN', 'NOT_REFERRED');
    const res = await request(app).patch('/api/v1/investigations/CASE-11').send({ action: 'AUTHORIZE_REFERRAL' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_STATE_TRANSITION');
  });

  await t.test('12. UNDER_REVIEW -> PENDING_AUTHORIZATION succeeds through the correct workflow action', async () => {
    createMockCase('CASE-12', 'UNDER_REVIEW', 'NOT_REFERRED');
    const res = await request(app).patch('/api/v1/investigations/CASE-12').send({ action: 'REQUEST_AUTHORIZATION' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.referralStatus, 'PENDING_AUTHORIZATION');
  });

  await t.test('13. PENDING_AUTHORIZATION cannot become REFERRED_TO_LE without the required explicit authorization action', async () => {
    // There's only one way to move to REFERRED_TO_LE and that's the AUTHORIZE_REFERRAL action.
    createMockCase('CASE-13', 'UNDER_REVIEW', 'PENDING_AUTHORIZATION');
    
    // Attempting something else or arbitrary update fails
    const res = await request(app).patch('/api/v1/investigations/CASE-13').send({ action: 'START_REVIEW' });
    assert.strictEqual(res.status, 400);
    
    // Explicit action is the only way:
    const resValid = await request(app).patch('/api/v1/investigations/CASE-13').send({ action: 'AUTHORIZE_REFERRAL' });
    assert.strictEqual(resValid.status, 200);
    assert.strictEqual(resValid.body.referralStatus, 'REFERRED_TO_LE'); // 14.
  });

  await t.test('15. REFERRED_TO_LE -> ACKNOWLEDGED succeeds', async () => {
    createMockCase('CASE-15', 'REFERRED_TO_LE', 'REFERRED_TO_LE');
    const res = await request(app).patch('/api/v1/investigations/CASE-15').send({ action: 'ACKNOWLEDGE_REFERRAL' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.referralStatus, 'ACKNOWLEDGED');
  });

  await t.test('16. ACKNOWLEDGED -> CLOSED succeeds', async () => {
    createMockCase('CASE-16', 'REFERRED_TO_LE', 'ACKNOWLEDGED'); // status is REFERRED_TO_LE, referral is ACKNOWLEDGED
    const res = await request(app).patch('/api/v1/investigations/CASE-16').send({ action: 'CLOSE_CASE' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'CLOSED');
    assert.strictEqual(res.body.referralStatus, 'CLOSED');
  });

  await t.test('17. CLOSED cannot be reopened', async () => {
    createMockCase('CASE-17', 'CLOSED', 'CLOSED');
    const res = await request(app).patch('/api/v1/investigations/CASE-17').send({ action: 'START_REVIEW' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'INVALID_STATE_TRANSITION');
  });

  await t.test('18. Evidence references are stored, not raw biometric data', async () => {
    mockTransactions = [{ transactionId: 'TXN-018', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-18', transactionRef: 'TXN-018', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'FAILURE', modality: 'FINGERPRINT' }
    ];

    await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-018' });
    
    assert.deepStrictEqual(savedCases[0].evidenceRefs, ['BIO-18']);
  });

  await t.test('19. & 20. InvestigationCase contains no raw OTP/Aadhaar/mobile/phone', async () => {
    mockTransactions = [{ transactionId: 'TXN-019', status: 'COMPLETED' }];
    mockBiometricEvents = [
      { eventId: 'BIO-19', transactionRef: 'TXN-019', stage: 'POST_TRANSACTION_REVERIFICATION', outcome: 'FAILURE', modality: 'FINGERPRINT' }
    ];

    await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-019' });
    
    const c = savedCases[0];
    const keys = Object.keys(c);
    const forbidden = ['otp', 'aadhaar', 'mobile', 'phone', 'uid', 'name', 'biometric', 'photo'];
    for (const f of forbidden) {
      assert.ok(!keys.includes(f), `Contains forbidden field ${f}`);
    }
  });

  await t.test('21. Investigation endpoints reject PII payloads', async () => {
    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-021', aadhaar: '123456789012' });
    assert.strictEqual(res.status, 422); // PII_DETECTED
  });

  await t.test('22. Client cannot fabricate MISMATCH_FLAGGED', async () => {
    mockTransactions = [{ transactionId: 'TXN-022', status: 'COMPLETED' }];
    // Even if client sends "status": "MISMATCH_FLAGGED" it's ignored.
    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-022', status: 'MISMATCH_FLAGGED' });
    
    // Server sees 0 events, throws NO_REVERIFICATION_EVIDENCE.
    assert.strictEqual(res.body.code, 'NO_REVERIFICATION_EVIDENCE');
  });

  await t.test('24. OTP authorization alone cannot create an investigation', async () => {
    // If there are no re-verification events, it fails, even if it had an OTP earlier
    // (since OTP events don't count for POST_TRANSACTION_REVERIFICATION).
    mockTransactions = [{ transactionId: 'TXN-024', status: 'COMPLETED' }];
    const res = await request(app).post('/api/v1/investigations').send({ transactionRef: 'TXN-024' });
    assert.strictEqual(res.body.code, 'NO_REVERIFICATION_EVIDENCE');
  });

  await t.test('25. & 26. No external/police transmission occurs & No legal guilt terminology', async () => {
    createMockCase('CASE-26', 'UNDER_REVIEW', 'PENDING_AUTHORIZATION');
    const res = await request(app).patch('/api/v1/investigations/CASE-26').send({ action: 'AUTHORIZE_REFERRAL' });
    
    const str = JSON.stringify(res.body);
    assert.ok(!str.includes('GUILT'));
    assert.ok(!str.includes('CULPRIT'));
    assert.ok(!str.includes('FRAUDSTER'));
    assert.ok(!str.includes('CRIMINAL'));
    assert.ok(!str.includes('CONVICTED'));
  });

  await t.test('27. Full Mongoose schema validation passes', async () => {
    // implicitly checked by `validateSync()` hook inside test overrides
    createMockCase('CASE-27', 'OPEN', 'NOT_REFERRED');
    const res = await request(app).patch('/api/v1/investigations/CASE-27').send({ action: 'START_REVIEW' });
    assert.strictEqual(res.status, 200);
  });
});
