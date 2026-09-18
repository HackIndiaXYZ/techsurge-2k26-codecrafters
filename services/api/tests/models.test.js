/**
 * @fileoverview Tests for mongoose schemas.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FailureEvent } from '../src/models/FailureEvent.js';
import { AuditLog } from '../src/models/AuditLog.js';

test('17. No PII fields exist in FailureEvent schema', () => {
  const schemaPaths = Object.keys(FailureEvent.schema.paths);
  const forbidden = ['aadhaar', 'name', 'phone', 'address', 'biometricTemplate', 'rationCardNumber', 'photo', 'transcript', 'rawAudio', 'cardId'];
  
  for (const field of forbidden) {
    assert.ok(!schemaPaths.includes(field), `FailureEvent must not contain PII field: ${field}`);
  }
});

test('18. AuditLog schema contains no payload field', () => {
  const schemaPaths = Object.keys(AuditLog.schema.paths);
  assert.ok(!schemaPaths.includes('payload'), 'AuditLog must not contain payload field');
  assert.ok(!schemaPaths.includes('body'), 'AuditLog must not contain body field');
  assert.ok(!schemaPaths.includes('request'), 'AuditLog must not contain request field');
});

test('19. Ensure strict mode is enabled on models', () => {
  assert.equal(FailureEvent.schema.options.strict, true);
  assert.equal(AuditLog.schema.options.strict, true);
});
