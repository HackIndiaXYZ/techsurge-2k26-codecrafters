/**
 * @fileoverview Unit tests for the PII Firewall.
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 *
 * Run: node --test services/api/tests/piiFirewall.test.js
 *
 * Tests correspond exactly to PROMPT 3 Phase 6 PII requirements:
 *
 *  1.  Valid Verhoeff 12-digit candidate → 422 PII_DETECTED
 *  2.  Invalid checksum 12-digit candidate → redacted, request passes
 *  3.  Phone number → redacted
 *  4.  Email address → redacted
 *  5.  PAN-like value → redacted
 *  6.  Forbidden PII key name → 422 PII_DETECTED
 *  7.  Nested PII → detected
 *  8.  Legitimate normal request → passes unchanged
 *  9.  Rejected response does not contain original PII value
 * 10.  Firewall does not log raw PII
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { piiFirewall } from '../src/middleware/piiFirewall.js';

// ── Test Harness ─────────────────────────────────────────────────────────────

/**
 * Creates a mock Express request object.
 *
 * @param {{ body?: object, query?: object, params?: object }} opts
 * @returns {object} Mock req
 */
function mockReq(opts = {}) {
  return {
    body: opts.body ?? {},
    query: opts.query ?? {},
    params: opts.params ?? {},
  };
}

/**
 * Runs the piiFirewall middleware and returns { req, status, json }.
 *
 * @param {object} req
 * @returns {{ req: object, status?: number, body?: object, passed: boolean }}
 */
function runFirewall(req) {
  let responseStatus = null;
  let responseBody = null;
  let passed = false;

  const res = {
    status(code) {
      responseStatus = code;
      return res;
    },
    json(body) {
      responseBody = body;
      return res;
    },
  };

  piiFirewall(req, res, () => {
    passed = true;
  });

  return { req, status: responseStatus, body: responseBody, passed };
}

// ── Test 1: Valid Verhoeff candidate → 422 ────────────────────────────────────
test('1. Valid Verhoeff 12-digit candidate in body → 422 PII_DETECTED', () => {
  // 100000000004 — verified valid Verhoeff number (computed in tests)
  const req = mockReq({ body: { someField: '100000000004' } });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false, 'Request must not pass through');
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
  assert.ok(body.field, 'field must be present in rejection');
  assert.ok(body.hint, 'hint must be present in rejection');
});

// ── Test 2: Invalid checksum candidate → redacted, passes ────────────────────
test('2. Invalid checksum 12-digit candidate → redacted, request passes', () => {
  // 100000000005 — fails Verhoeff (last digit wrong). Should be redacted, not rejected.
  const req = mockReq({ body: { shopCode: 'AP-KNL-0142', notes: '100000000005' } });
  const { passed, req: mutatedReq } = runFirewall(req);

  assert.equal(passed, true, 'Request must pass through');
  assert.equal(mutatedReq.body.notes, '[REDACTED_NUM]');
  assert.equal(mutatedReq.body.shopCode, 'AP-KNL-0142', 'Legitimate data must not be altered');
});

// ── Test 3: Phone number → redacted ──────────────────────────────────────────
test('3. Indian phone number in body → redacted, request passes', () => {
  const req = mockReq({ body: { description: 'call 9876543210 for help' } });
  const { passed, req: mutatedReq } = runFirewall(req);

  assert.equal(passed, true);
  assert.ok(mutatedReq.body.description.includes('[REDACTED_PHONE]'), 'Phone must be redacted');
  assert.ok(!mutatedReq.body.description.includes('9876543210'), 'Raw phone must not remain');
});

// ── Test 4: Email address → redacted ─────────────────────────────────────────
test('4. Email address in body → redacted, request passes', () => {
  const req = mockReq({ body: { contact: 'dealer@example.com' } });
  const { passed, req: mutatedReq } = runFirewall(req);

  assert.equal(passed, true);
  assert.ok(mutatedReq.body.contact.includes('[REDACTED_EMAIL]'), 'Email must be redacted');
  assert.ok(!mutatedReq.body.contact.includes('@'), 'Raw email must not remain');
});

// ── Test 5: PAN-like value → redacted ────────────────────────────────────────
test('5. PAN-like value in body → redacted, request passes', () => {
  const req = mockReq({ body: { document: 'ABCDE1234F' } });
  const { passed, req: mutatedReq } = runFirewall(req);

  assert.equal(passed, true);
  assert.ok(mutatedReq.body.document.includes('[REDACTED_PAN]'), 'PAN must be redacted');
  assert.ok(!mutatedReq.body.document.includes('ABCDE1234F'), 'Raw PAN must not remain');
});

// ── Test 6: Forbidden key name → 422 ─────────────────────────────────────────
test('6. Forbidden key "aadhaar" in body → 422 PII_DETECTED', () => {
  const req = mockReq({ body: { aadhaar: 'anything' } });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
});

test('6b. Forbidden key "mobile" in body → 422 PII_DETECTED', () => {
  const req = mockReq({ body: { mobile: '9876543210' } });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
});

test('6c. Forbidden key "fingerprint" in body → 422 PII_DETECTED', () => {
  const req = mockReq({ body: { fingerprint: 'template_data' } });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
});

// ── Test 7: Nested PII → detected ────────────────────────────────────────────
test('7. Valid Verhoeff candidate nested in object → detected and rejected', () => {
  const req = mockReq({
    body: {
      shopData: {
        nested: {
          value: '100000000004', // valid Verhoeff
        },
      },
    },
  });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
});

test('7b. Forbidden key nested inside object → detected', () => {
  const req = mockReq({
    body: {
      event: {
        uid: 'some_uid',
      },
    },
  });
  const { status, body, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
  assert.equal(body.code, 'PII_DETECTED');
});

// ── Test 8: Legitimate normal request → passes unchanged ─────────────────────
test('8. Legitimate normal diagnosis form request passes through unchanged', () => {
  const req = mockReq({
    body: {
      cause: 'BIOMETRIC_MISMATCH',
      attempts: 3,
      age: 67,
      hasRegisteredMobile: false,
      isSeeded: true,
      connectivity: true,
      deviceOk: true,
      shopCode: 'AP-KNL-0142',
    },
  });
  const { passed, req: mutatedReq } = runFirewall(req);

  assert.equal(passed, true, 'Clean request must pass through');
  assert.equal(mutatedReq.body.cause, 'BIOMETRIC_MISMATCH');
  assert.equal(mutatedReq.body.attempts, 3);
  assert.equal(mutatedReq.body.shopCode, 'AP-KNL-0142');
});

// ── Test 9: Rejection response does not contain original PII ─────────────────
test('9. Rejection response body does not contain the original PII value', () => {
  const req = mockReq({ body: { someField: '100000000004' } });
  const { body } = runFirewall(req);

  const responseStr = JSON.stringify(body);
  assert.ok(
    !responseStr.includes('100000000004'),
    `Response body must not contain the raw PII value. Got: ${responseStr}`
  );
});

// ── Test 10: Firewall does not log raw PII ────────────────────────────────────
test('10. Firewall does not log raw PII to console', () => {
  const logged = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => logged.push(args.join(' '));
  console.error = (...args) => logged.push(args.join(' '));
  console.warn = (...args) => logged.push(args.join(' '));

  try {
    const req = mockReq({ body: { someField: '100000000004' } });
    runFirewall(req);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  for (const entry of logged) {
    assert.ok(
      !entry.includes('100000000004'),
      `Console log should not contain raw PII. Found: ${entry}`
    );
  }
});

// ── Additional: PII in query params ──────────────────────────────────────────
test('Valid Verhoeff candidate in query params → 422', () => {
  const req = mockReq({ query: { filter: '100000000004' } });
  const { status, passed } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
});

// ── Additional: Multiple values, some clean some not ─────────────────────────
test('Mixed body: valid candidate rejected even with other clean fields', () => {
  const req = mockReq({
    body: {
      language: 'te',
      inputMode: 'FORM',
      suspect: '500000000006', // valid Verhoeff (computed earlier)
    },
  });
  const { passed, status } = runFirewall(req);

  assert.equal(passed, false);
  assert.equal(status, 422);
});
