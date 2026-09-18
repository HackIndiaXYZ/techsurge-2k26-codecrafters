/**
 * @fileoverview Unit tests for the Deterministic Rules Engine.
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 *
 * Run: node --test services/api/tests/rulesEngine.test.js
 *
 * These 10 tests correspond exactly to the requirements in ARCHITECTURE.md §9
 * and the PROMPT 3 specification:
 *
 *  1.  Biometric mismatch + attempts >= 3 + age >= 65  → R-BIO-001
 *  2.  Biometric mismatch + attempts >= 3 + mobile     → R-BIO-002
 *  3.  Biometric mismatch + attempts >= 3 + no mobile  → R-BIO-003
 *  4.  Poor biometric quality                          → R-BIO-004
 *  5.  Connectivity failure                            → R-CON-001
 *  6.  Device failure                                  → R-DEV-001
 *  7.  Seeding not done                                → R-SEED-001
 *  8.  Unknown/no match                                → R-ESC-000
 *  9.  Deterministic: repeated identical inputs        → identical outputs
 * 10.  Engine has no LLM import
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { resolveFallback, getRuleRegistry } from '../src/engine/rulesEngine.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Asserts that a result conforms to the standard response shape.
 * @param {object} result
 */
function assertResultShape(result) {
  assert.ok(result.ruleId, 'ruleId must be present');
  assert.ok(result.fallback, 'fallback must be present');
  assert.ok(result.steps, 'steps must be present');
  assert.ok(Array.isArray(result.steps.en), 'steps.en must be array');
  assert.ok(Array.isArray(result.steps.hi), 'steps.hi must be array');
  assert.ok(Array.isArray(result.steps.te), 'steps.te must be array');
  assert.ok(result.citation, 'citation must be present');
  assert.ok(result.verificationStatus, 'verificationStatus must be present');
  assert.ok(result.escalationPath, 'escalationPath must be present');
  assert.equal(result.confidence, 1.0, 'confidence must be 1.0');
  assert.notEqual(result.ruleId, null, 'ruleId must not be null');
}

// ── Test 1 ───────────────────────────────────────────────────────────────────
test('1. Biometric mismatch + attempts >= 3 + age >= 65 → R-BIO-001', () => {
  const result = resolveFallback({
    cause: 'BIOMETRIC_MISMATCH',
    attempts: 3,
    age: 65,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-BIO-001');
  assert.equal(result.fallback, 'FACE_AUTH');
});

// ── Test 2 ───────────────────────────────────────────────────────────────────
test('2. Biometric mismatch + attempts >= 3 + hasRegisteredMobile → R-BIO-002', () => {
  const result = resolveFallback({
    cause: 'BIOMETRIC_MISMATCH',
    attempts: 5,
    age: 40,
    hasRegisteredMobile: true,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-BIO-002');
  assert.equal(result.fallback, 'OTP');
});

// ── Test 3 ───────────────────────────────────────────────────────────────────
test('3. Biometric mismatch + attempts >= 3 + no mobile, no face device → R-BIO-003', () => {
  const result = resolveFallback({
    cause: 'BIOMETRIC_MISMATCH',
    attempts: 3,
    age: 35,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-BIO-003');
  assert.equal(result.fallback, 'EXCEPTION_REGISTER');
});

// ── Test 4 ───────────────────────────────────────────────────────────────────
test('4. Biometric quality poor → R-BIO-004 (takes precedence over mismatch logic)', () => {
  // Even with attempts >= 3 and age >= 65, quality-poor is resolved first.
  const result = resolveFallback({
    cause: 'BIOMETRIC_QUALITY_POOR',
    attempts: 3,
    age: 70,
    hasRegisteredMobile: true,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-BIO-004');
  assert.equal(result.fallback, 'CLEAN_RETRY');
});

// ── Test 5 ───────────────────────────────────────────────────────────────────
test('5. Connectivity failure → R-CON-001', () => {
  const result = resolveFallback({
    cause: 'CONNECTIVITY_FAILURE',
    attempts: 1,
    age: 30,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: false,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-CON-001');
  assert.equal(result.fallback, 'OFFLINE_MODE');
});

// ── Test 6 ───────────────────────────────────────────────────────────────────
test('6. Device failure → R-DEV-001', () => {
  const result = resolveFallback({
    cause: 'DEVICE_FAILURE',
    attempts: 0,
    age: 45,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: false,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-DEV-001');
  assert.equal(result.fallback, 'ALTERNATE_EPOS');
});

// ── Test 7 ───────────────────────────────────────────────────────────────────
test('7. Seeding not done → R-SEED-001', () => {
  const result = resolveFallback({
    cause: 'SEEDING_NOT_DONE',
    attempts: 1,
    age: 28,
    hasRegisteredMobile: false,
    isSeeded: false,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-SEED-001');
  assert.equal(result.fallback, 'SEEDING_REFERRAL');
});

test('7b. Demographic mismatch → R-SEED-001', () => {
  const result = resolveFallback({
    cause: 'DEMOGRAPHIC_MISMATCH',
    attempts: 1,
    age: 50,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-SEED-001');
});

// ── Test 8 ───────────────────────────────────────────────────────────────────
test('8. Unknown cause → R-ESC-000 (never returns null)', () => {
  const result = resolveFallback({
    cause: 'UNKNOWN',
    attempts: 0,
    age: 0,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-ESC-000');
  assert.equal(result.fallback, 'ESCALATE');
});

test('8b. Beneficiary absent → R-ESC-000', () => {
  const result = resolveFallback({
    cause: 'BENEFICIARY_ABSENT',
  });
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-ESC-000');
});

test('8c. Completely empty input (all defaults) → R-ESC-000, never null', () => {
  const result = resolveFallback({});
  assert.notEqual(result, null);
  assert.notEqual(result, undefined);
  assertResultShape(result);
  assert.equal(result.ruleId, 'R-ESC-000');
});

// ── Test 9 ───────────────────────────────────────────────────────────────────
test('9. Deterministic: identical inputs produce identical outputs on repeated calls', () => {
  const input = {
    cause: 'BIOMETRIC_MISMATCH',
    attempts: 3,
    age: 65,
    hasRegisteredMobile: false,
    isSeeded: true,
    connectivity: true,
    deviceOk: true,
  };

  const results = Array.from({ length: 5 }, () => resolveFallback(input));

  // All ruleIds must be identical
  const ruleIds = results.map((r) => r.ruleId);
  assert.ok(
    ruleIds.every((id) => id === ruleIds[0]),
    `Non-deterministic: got varying ruleIds: ${JSON.stringify(ruleIds)}`
  );

  // All citations must be identical
  const citations = results.map((r) => r.citation);
  assert.ok(
    citations.every((c) => c === citations[0]),
    'Non-deterministic: citations varied across calls'
  );

  // All confidence values must be 1.0
  results.forEach((r) => assert.equal(r.confidence, 1.0));
});

// ── Test 10 ──────────────────────────────────────────────────────────────────
test('10. Engine source file contains zero LLM/AI imports', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const engineSource = readFileSync(
    path.join(__dirname, '../src/engine/rulesEngine.js'),
    'utf8'
  );

  // None of these strings should appear as import sources in the engine
  const forbiddenPatterns = [
    'gemini', 'openai', 'anthropic', 'cohere', 'langchain',
    'bhashini', 'openrouter', 'vertex', '@google-cloud/aiplatform',
  ];

  for (const pattern of forbiddenPatterns) {
    const found = engineSource.toLowerCase().includes(pattern);
    assert.equal(
      found,
      false,
      `Engine source contains forbidden LLM reference: "${pattern}"`
    );
  }
});

// ── Test: Rule registry has required fields ───────────────────────────────────
test('Rule registry: all rules have ruleId, citation, and verificationStatus', () => {
  const registry = getRuleRegistry();
  assert.ok(registry.length >= 8, `Expected at least 8 rules, got ${registry.length}`);

  for (const rule of registry) {
    assert.ok(rule.ruleId, `Rule missing ruleId: ${JSON.stringify(rule)}`);
    assert.ok(rule.citation, `Rule ${rule.ruleId} missing citation`);
    assert.ok(
      rule.verificationStatus === 'VERIFIED' || rule.verificationStatus === 'RULE_REQUIRES_VERIFICATION',
      `Rule ${rule.ruleId} has invalid verificationStatus: ${rule.verificationStatus}`
    );
    // I3: sourceUrl must be present on VERIFIED rules
    if (rule.verificationStatus === 'VERIFIED') {
      assert.ok(rule.sourceUrl, `VERIFIED rule ${rule.ruleId} must have a sourceUrl`);
    }
  }
});
