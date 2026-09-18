/**
 * @fileoverview Unit tests for Diagnose Controller & Service.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFormDiagnosis } from '../src/controllers/diagnose.controller.js';
import * as db from '../src/config/db.js';

// Mock req/res
function mockReqRes(body = {}) {
  const req = {
    body,
    _piiRejection: {},
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };
  const next = (err) => {
    statusCode = 500;
    responseData = err;
  };
  return { req, res, next, getResponse: () => ({ status: statusCode, data: responseData }) };
}

test('1. Valid form input accepted', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'BIOMETRIC_QUALITY_POOR',
    attempts: 2,
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-BIO-004'); // Rule for quality poor
});

test('2. Invalid cause rejected', async () => {
  const { req, res, next, getResponse } = mockReqRes({ cause: 'INVALID_CAUSE' });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 400);
  assert.equal(data.code, 'VALIDATION_ERROR');
  assert.ok(data.errors.cause);
});

test('3. Invalid attempts rejected', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'UNKNOWN',
    attempts: 'five', // not a number
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 400);
  assert.ok(data.errors.attempts);
});

test('4. Invalid boolean fields rejected', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'UNKNOWN',
    connectivity: 'yes', // not a boolean
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 400);
  assert.ok(data.errors.connectivity);
});

test('5. Biometric mismatch routes to deterministic engine', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'BIOMETRIC_MISMATCH',
    attempts: 4,
    hasRegisteredMobile: true,
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-BIO-002');
  assert.equal(data.fallback, 'OTP');
});

test('6. Connectivity routes to connectivity rule', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'CONNECTIVITY_FAILURE',
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-CON-001');
});

test('7. Device failure routes to device rule', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'DEVICE_FAILURE',
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-DEV-001');
});

test('8. Unknown input reaches R-ESC-000', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'UNKNOWN',
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-ESC-000');
});

test('9. Response contains ruleId', async () => {
  const { req, res, next, getResponse } = mockReqRes({ cause: 'UNKNOWN' });
  await handleFormDiagnosis(req, res, next);
  assert.ok(getResponse().data.ruleId);
});

test('10. Response contains verificationStatus', async () => {
  const { req, res, next, getResponse } = mockReqRes({ cause: 'UNKNOWN' });
  await handleFormDiagnosis(req, res, next);
  assert.ok(getResponse().data.verificationStatus);
});

test('11. Client cannot override fallback', async () => {
  const { req, res, next, getResponse } = mockReqRes({
    cause: 'UNKNOWN',
    fallback: 'GIVE_FREE_RATION',
    ruleId: 'R-FAKE-001',
  });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.ruleId, 'R-ESC-000'); // Validated rule, ignoring fake
  assert.equal(data.fallback, 'ESCALATE'); // Validated fallback, ignoring fake
});

test('12. ttsUrl is null in this phase', async () => {
  const { req, res, next, getResponse } = mockReqRes({ cause: 'UNKNOWN' });
  await handleFormDiagnosis(req, res, next);
  assert.equal(getResponse().data.ttsUrl, null);
});

test('16. Endpoint remains usable when MongoDB is unavailable', async () => {
  // DB is NOT connected in this test run environment, 
  // getDbStatus() will return false. The call should still succeed and return 200.
  const isConnected = db.getDbStatus();
  assert.equal(isConnected, false); // Confirm DB is not connected

  const { req, res, next, getResponse } = mockReqRes({ cause: 'BIOMETRIC_MISMATCH', attempts: 3 });
  await handleFormDiagnosis(req, res, next);
  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.ok(data.eventId);
  assert.equal(data.ruleId, 'R-BIO-003'); // defaults to generic mismatch
});
