/**
 * @fileoverview Setu Deterministic Rules Engine
 *
 * ★ INVARIANT I1: This file has ZERO LLM imports.
 * ★ This is a PURE FUNCTION. No I/O, no DB, no network, no randomness.
 * ★ Fully unit-testable. Confidence is always 1.0 (deterministic).
 *
 * PRECEDENCE ORDER (documented — do not change without architecture authorization):
 *
 *  1. BIOMETRIC_QUALITY_POOR → R-BIO-004 (poor quality must be resolved before mismatch logic)
 *  2. BIOMETRIC_MISMATCH + attempts >= 3 + age >= 65 → R-BIO-001 (age priority)
 *  3. BIOMETRIC_MISMATCH + attempts >= 3 + hasRegisteredMobile → R-BIO-002
 *  4. BIOMETRIC_MISMATCH + attempts >= 3 → R-BIO-003 (generic fallback for mismatch)
 *  5. CONNECTIVITY_FAILURE → R-CON-001
 *  6. DEVICE_FAILURE → R-DEV-001
 *  7. SEEDING_NOT_DONE | DEMOGRAPHIC_MISMATCH → R-SEED-001
 *  8. Everything else (UNKNOWN, BENEFICIARY_ABSENT, no match) → R-ESC-000
 *
 * Rules at higher precedence take priority. There is NO overlap between active branches
 * — each input maps to exactly one output. Repeated calls with identical inputs always
 * return identical outputs.
 */

import { createRequire } from 'module';
import { validateRuleRegistry } from './ruleSchema.js';

const require = createRequire(import.meta.url);

// Load and validate the registry at module load time.
// If invalid, the entire module fails to load — which prevents a broken server from starting.
const rawRegistry = require('./rules.json');
const RULES = validateRuleRegistry(rawRegistry);

/**
 * Returns a rule from the validated registry by ruleId.
 * Throws if the ruleId does not exist — a missing rule is a code bug, not a runtime condition.
 *
 * @param {string} ruleId
 * @returns {import('./ruleSchema.js').RuleSchema}
 */
function getRule(ruleId) {
  const rule = RULES.find((r) => r.ruleId === ruleId);
  if (!rule) {
    throw new Error(`[rulesEngine] Rule "${ruleId}" not found in registry. This is a code bug.`);
  }
  return rule;
}

/**
 * Formats a matched rule into the standard response shape.
 *
 * @param {ReturnType<typeof getRule>} rule
 * @returns {{
 *   ruleId: string,
 *   fallback: string,
 *   steps: { en: string[], hi: string[], te: string[] },
 *   citation: string,
 *   sourceUrl: string | null,
 *   verificationStatus: string,
 *   escalationPath: string,
 *   confidence: number
 * }}
 */
function formatResult(rule) {
  return {
    ruleId: rule.ruleId,
    fallback: rule.fallback,
    steps: rule.steps,
    citation: rule.citation,
    sourceUrl: rule.sourceUrl,
    verificationStatus: rule.verificationStatus,
    escalationPath: rule.escalationPath,
    confidence: 1.0,
  };
}

/**
 * Resolves the applicable fallback procedure for a given authentication failure.
 *
 * PURE FUNCTION — No I/O, no LLM, no side effects, no randomness.
 * The deterministic rule engine is the sole authority for fallback decisions.
 * The LLM may classify input INTO this function, but NEVER bypasses it.
 *
 * @param {{
 *   cause: string,
 *   attempts?: number,
 *   age?: number,
 *   hasRegisteredMobile?: boolean,
 *   isSeeded?: boolean,
 *   connectivity?: boolean,
 *   deviceOk?: boolean
 * }} input
 *
 * @returns {{
 *   ruleId: string,
 *   fallback: string,
 *   steps: { en: string[], hi: string[], te: string[] },
 *   citation: string,
 *   sourceUrl: string | null,
 *   verificationStatus: string,
 *   escalationPath: string,
 *   confidence: number
 * }}
 */
export function resolveFallback({
  cause = 'UNKNOWN',
  attempts = 0,
  age = 0,
  hasRegisteredMobile = false,
  isSeeded = true,
  connectivity = true,
  deviceOk = true,
}) {
  // ── Precedence 1 ───────────────────────────────────────────────────────────
  // Poor biometric quality is resolved independently of mismatch logic.
  // A dealer must clean/dry the finger before worrying about mismatch conditions.
  if (cause === 'BIOMETRIC_QUALITY_POOR') {
    return formatResult(getRule('R-BIO-004'));
  }

  // ── Precedence 2 ───────────────────────────────────────────────────────────
  // Biometric mismatch after 3+ attempts for elderly beneficiaries (age >= 65).
  // Face authentication is the recommended fallback for elderly with worn ridges.
  // This branch takes priority over mobile-OTP because face auth is non-destructive
  // and does not require the beneficiary to have a phone.
  if (cause === 'BIOMETRIC_MISMATCH' && attempts >= 3 && age >= 65) {
    return formatResult(getRule('R-BIO-001'));
  }

  // ── Precedence 3 ───────────────────────────────────────────────────────────
  // Biometric mismatch after 3+ attempts with a registered mobile number.
  // OTP authentication is possible if mobile is seeded.
  if (cause === 'BIOMETRIC_MISMATCH' && attempts >= 3 && hasRegisteredMobile) {
    return formatResult(getRule('R-BIO-002'));
  }

  // ── Precedence 4 ───────────────────────────────────────────────────────────
  // Biometric mismatch after 3+ attempts, no mobile, no face-auth device.
  // Exception register + dealer attestation is the documented path.
  if (cause === 'BIOMETRIC_MISMATCH' && attempts >= 3) {
    return formatResult(getRule('R-BIO-003'));
  }

  // ── Precedence 5 ───────────────────────────────────────────────────────────
  // Connectivity failure — entirely separate cause from biometric.
  if (cause === 'CONNECTIVITY_FAILURE' || !connectivity) {
    return formatResult(getRule('R-CON-001'));
  }

  // ── Precedence 6 ───────────────────────────────────────────────────────────
  // Device hardware failure — separate cause.
  if (cause === 'DEVICE_FAILURE' || !deviceOk) {
    return formatResult(getRule('R-DEV-001'));
  }

  // ── Precedence 7 ───────────────────────────────────────────────────────────
  // Aadhaar not seeded to ration card, or demographic mismatch (name/DOB error).
  if (cause === 'SEEDING_NOT_DONE' || cause === 'DEMOGRAPHIC_MISMATCH' || !isSeeded) {
    return formatResult(getRule('R-SEED-001'));
  }

  // ── Precedence 8 — universal escalation fallback ───────────────────────────
  // Covers: UNKNOWN, BENEFICIARY_ABSENT, any unmatched combination.
  // NEVER return null. NEVER invent a fallback.
  return formatResult(getRule('R-ESC-000'));
}

/**
 * Returns the full validated rule registry (read-only view).
 * Used by tests and diagnostics only.
 *
 * @returns {readonly object[]}
 */
export function getRuleRegistry() {
  return RULES;
}
