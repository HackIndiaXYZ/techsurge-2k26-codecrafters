/**
 * @fileoverview Unit tests for the Verhoeff validator.
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 *
 * Run: node --test services/api/tests/verhoeff.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verhoeffValidate } from '../src/middleware/verhoeff.js';

// ── Known valid Verhoeff 12-digit numbers ────────────────────────────────────
// These are synthetically constructed numbers that satisfy the Verhoeff
// algorithm. They are NOT real Aadhaar identities.
// Source: computed using the Verhoeff algorithm tables in verhoeff.js.

// Verified valid: 100000000004 computed by brute-force against verhoeff.js tables.
// This is a synthetic number for algorithm testing — NOT a real Aadhaar identity.
test('known valid Verhoeff candidate passes', () => {
  const result = verhoeffValidate('100000000004');
  assert.equal(result.valid, true, `Expected valid but got: ${result.reason}`);
  assert.ok(result.disclaimer, 'disclaimer must be present on valid result');
});

// ── Invalid checksum ─────────────────────────────────────────────────────────
test('12-digit number with invalid checksum fails', () => {
  // 100000000005 — last digit mutated from valid 100000000004
  const result = verhoeffValidate('100000000005');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'CHECKSUM_INVALID');
});

test('all-zeros 12-digit number fails checksum', () => {
  const result = verhoeffValidate('000000000000');
  assert.equal(result.valid, false);
});

// ── Malformed input ──────────────────────────────────────────────────────────
test('non-string input returns NOT_STRING', () => {
  // @ts-ignore — intentionally passing wrong type
  const result = verhoeffValidate(123456789012);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_STRING');
});

test('empty string returns NOT_12_DIGITS', () => {
  const result = verhoeffValidate('');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_12_DIGITS');
});

test('null-like string returns NOT_12_DIGITS', () => {
  const result = verhoeffValidate('null');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_12_DIGITS');
});

// ── Spaces normalisation ─────────────────────────────────────────────────────
test('valid candidate with spaces is normalised and validated', () => {
  // 1000 0000 0004 — valid with group spaces
  const result = verhoeffValidate('1000 0000 0004');
  assert.equal(result.valid, true);
});

test('invalid candidate with spaces normalises and fails checksum', () => {
  const result = verhoeffValidate('1000 0000 0005');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'CHECKSUM_INVALID');
});

// ── Non-12-digit values ──────────────────────────────────────────────────────
test('11-digit number fails NOT_12_DIGITS', () => {
  const result = verhoeffValidate('49911873910');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_12_DIGITS');
});

test('13-digit number fails NOT_12_DIGITS', () => {
  const result = verhoeffValidate('4991187391070');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_12_DIGITS');
});

test('alphanumeric string returns NOT_12_DIGITS', () => {
  const result = verhoeffValidate('4991AB739107');
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'NOT_12_DIGITS');
});
