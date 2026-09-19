import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import request from 'supertest';
import { getDbStatus } from '../src/config/db.js';
import { FailureEvent } from '../src/models/FailureEvent.js';
import { ExceptionAuthorization } from '../src/models/ExceptionAuthorization.js';
import { InvestigationCase } from '../src/models/InvestigationCase.js';

process.env.NODE_ENV = 'test';

describe('Insights API V2 (Phase 7)', () => {
  let originalDbStatus;

  let app;
  before(async () => {
    const serverModule = await import('../src/server.js');
    app = serverModule.default;
    originalDbStatus = getDbStatus();

    // Use test database
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/setu_test_insights';
      await mongoose.connect(uri);
    }

    await FailureEvent.deleteMany({});
    await ExceptionAuthorization.deleteMany({});
    await InvestigationCase.deleteMany({});

    // Seed mock data for aggregation tests
    // 1. Failure Events for Hotspots / Causes
    const failureEvents = [
      { eventId: 'E1', failureCause: 'BIOMETRIC_MISMATCH', confidence: 0, ruleApplied: 'R-BIO-002', resolutionOffered: 'OTP', resolutionOutcome: 'SUCCESS', shopCode: 'SHOP-A', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78, 15] }, language: 'en', inputMode: 'FORM' },
      { eventId: 'E2', failureCause: 'BIOMETRIC_MISMATCH', confidence: 0, ruleApplied: 'R-BIO-002', resolutionOffered: 'OTP', resolutionOutcome: 'SUCCESS', shopCode: 'SHOP-A', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78, 15] }, language: 'en', inputMode: 'FORM' },
      { eventId: 'E3', failureCause: 'BIOMETRIC_MISMATCH', confidence: 0, ruleApplied: 'R-BIO-002', resolutionOffered: 'OTP', resolutionOutcome: 'SUCCESS', shopCode: 'SHOP-A', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78, 15] }, language: 'en', inputMode: 'FORM' },
      { eventId: 'E4', failureCause: 'BIOMETRIC_MISMATCH', confidence: 0, ruleApplied: 'R-BIO-002', resolutionOffered: 'OTP', resolutionOutcome: 'SUCCESS', shopCode: 'SHOP-A', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78, 15] }, language: 'en', inputMode: 'FORM' },
      { eventId: 'E5', failureCause: 'BIOMETRIC_MISMATCH', confidence: 0, ruleApplied: 'R-BIO-002', resolutionOffered: 'OTP', resolutionOutcome: 'SUCCESS', shopCode: 'SHOP-A', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78, 15] }, language: 'en', inputMode: 'FORM' }, // 5 makes it a hotspot
      
      { eventId: 'E6', failureCause: 'CONNECTIVITY_FAILURE', confidence: 0, ruleApplied: 'R-CON-001', resolutionOffered: 'STORE_FORWARD', resolutionOutcome: 'PENDING', shopCode: 'SHOP-B', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78.1, 15.1] }, language: 'en', inputMode: 'FORM' },
      { eventId: 'E7', failureCause: 'CONNECTIVITY_FAILURE', confidence: 0, ruleApplied: 'R-CON-001', resolutionOffered: 'STORE_FORWARD', resolutionOutcome: 'PENDING', shopCode: 'SHOP-B', district: 'Kurnool', state: 'AP', geo: { type: 'Point', coordinates: [78.1, 15.1] }, language: 'en', inputMode: 'FORM' } // 2 makes it suppressed
    ];
    await FailureEvent.insertMany(failureEvents);

    // 2. Exception Authorizations
    await ExceptionAuthorization.insertMany([
      { authorizationId: 'A1', transactionRef: 'T1', method: 'OTP', ruleApplied: 'R-BIO-002', outcome: 'VERIFIED', timestamp: new Date() },
      { authorizationId: 'A2', transactionRef: 'T2', method: 'OTP', ruleApplied: 'R-BIO-002', outcome: 'VERIFIED', timestamp: new Date() },
      { authorizationId: 'A3', transactionRef: 'T3', method: 'OTP', ruleApplied: 'R-BIO-002', outcome: 'FAILED', timestamp: new Date() },
    ]);

    // 3. Investigation Cases (2 open, 1 closed)
    await InvestigationCase.insertMany([
      { caseId: 'C1', transactionRef: 'T4', verificationEventRef: 'V1', reason: 'SUSPECTED_IMPERSONATION', status: 'OPEN', createdAt: new Date() },
      { caseId: 'C2', transactionRef: 'T5', verificationEventRef: 'V2', reason: 'REVIEW_REQUIRED', status: 'UNDER_REVIEW', createdAt: new Date() },
      { caseId: 'C3', transactionRef: 'T6', verificationEventRef: 'V3', reason: 'REVIEW_REQUIRED', status: 'CLOSED', createdAt: new Date() }
    ]);
  });

  after(async () => {
    await FailureEvent.deleteMany({});
    await ExceptionAuthorization.deleteMany({});
    await InvestigationCase.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('GET /api/v1/insights/summary returns correct aggregated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/insights/summary')
      .expect(200);

    // 7 failure events total
    assert.strictEqual(res.body.totalFailures, 7);
    
    // Top cause is BIOMETRIC_MISMATCH (5 count vs 2 for CONNECTIVITY_FAILURE)
    assert.strictEqual(res.body.topCause, 'BIOMETRIC_MISMATCH');
    
    // 1 hotspot (SHOP-A has 5), 1 suppressed (SHOP-B has 2)
    assert.strictEqual(res.body.activeHotspots, 1);
    assert.strictEqual(res.body.suppressedBuckets, 1);
    
    // 3 exception authorizations
    assert.strictEqual(res.body.totalExceptions, 3);
    
    // 2 open investigations (OPEN, UNDER_REVIEW)
    assert.strictEqual(res.body.openInvestigations, 2);

    // No PII validation (quick check keys)
    const piiKeys = ['name', 'aadhaar', 'phone', 'uid', 'mobile'];
    for (const key of Object.keys(res.body)) {
      assert.strictEqual(piiKeys.includes(key), false, `Response should not contain ${key}`);
    }
  });

  it('GET /api/v1/insights/summary works safely on empty database', async () => {
    await FailureEvent.deleteMany({});
    await ExceptionAuthorization.deleteMany({});
    await InvestigationCase.deleteMany({});

    const res = await request(app)
      .get('/api/v1/insights/summary')
      .expect(200);

    assert.strictEqual(res.body.totalFailures, 0);
    assert.strictEqual(res.body.topCause, null);
    assert.strictEqual(res.body.activeHotspots, 0);
    assert.strictEqual(res.body.suppressedBuckets, 0);
    assert.strictEqual(res.body.totalExceptions, 0);
    assert.strictEqual(res.body.openInvestigations, 0);
  });
});
