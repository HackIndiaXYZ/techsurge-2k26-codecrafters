/**
 * @fileoverview PII Firewall middleware — ARCHITECTURE.md §6
 *
 * ★ INVARIANT I2: No raw PII is stored, logged, or transmitted.
 *
 * Position in middleware chain: POSITION 3 (after helmet, cors, json body parser).
 * MUST be registered before any route handler.
 *
 * Strategy (per ARCHITECTURE.md §6):
 *
 *   Layer 0 — Non-collection (UI design, not code — documented here for completeness)
 *   Layer 1 — piiFirewall.js: detect → REJECT on high-confidence; redact on low-confidence
 *   Layer 2 — pseudonymiser.js: hash-and-discard (separate middleware)
 *   Layer 3 — Schema starvation (Mongoose strict:true, implemented in models)
 *   Layer 4 — Egress scrub (ASR transcript, implemented in integrations/bhashini.js)
 *   Layer 5 — Log redaction (pino config, implemented in utils/logger.js)
 *
 * Detection rules (applied to every string value in req.body, req.query, req.params):
 *
 *   1. 12-digit Aadhaar candidate (/\b\d{4}\s?\d{4}\s?\d{4}\b/)
 *      → Pass through Verhoeff:
 *        PASSES  → hard 422 rejection (high-confidence PII)
 *        FAILS   → redact to '[REDACTED_NUM]' (low-confidence, harmless number)
 *   2. Indian phone number (/\b[6-9]\d{9}\b/) → redact
 *   3. Email address → redact
 *   4. PAN-like value (/[A-Z]{5}\d{4}[A-Z]/) → redact
 *   5. Forbidden key names → hard 422 rejection
 *
 * On rejection:
 *   - HTTP 422
 *   - Body: { code: 'PII_DETECTED', field, hint }
 *   - The original value is NEVER included in the response body.
 *   - The original value is NEVER logged.
 *
 * On redaction:
 *   - The string value is replaced with '[REDACTED_NUM]' or '[REDACTED]'.
 *   - Processing continues normally.
 */

import crypto from 'crypto';
import { verhoeffValidate } from './verhoeff.js';

/**
 * Forbidden field names that must never appear in any request.
 * @type {Set<string>}
 */
const FORBIDDEN_KEYS = new Set([
  'aadhaar', 'uid', 'name', 'phone', 'mobile',
  'address', 'biometric', 'fingerprint', 'photo',
]);

/**
 * Regex patterns for PII detection (applied to string values only).
 */
const PATTERNS = {
  /** Matches 12-digit groups (with optional spaces between groups of 4) */
  AADHAAR_CANDIDATE: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  /** Indian mobile numbers (starts 6-9, 10 digits) */
  PHONE: /\b[6-9]\d{9}\b/g,
  /** Email addresses */
  EMAIL: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
  /** PAN card format */
  PAN: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
};

/**
 * Computes a SHA-256 hash of the raw request body string for audit logging.
 * The hash identifies the request without retaining its content.
 *
 * @param {string} bodyStr
 * @returns {string}
 */
function hashBody(bodyStr) {
  return crypto.createHash('sha256').update(bodyStr).digest('hex').slice(0, 16);
}

/**
 * Recursively walks an object and applies the redaction/rejection logic
 * to every string value.
 *
 * @param {unknown} node - The value to inspect
 * @param {string} path - Dot-notation path to this node (for error reporting)
 * @returns {{ rejected: boolean, field?: string, hint?: string, value?: unknown }}
 */
function deepScan(node, path) {
  if (typeof node === 'string') {
    return scanString(node, path);
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const result = deepScan(node[i], `${path}[${i}]`);
      if (result.rejected) return result;
      node[i] = result.value;
    }
    return { rejected: false, value: node };
  }

  if (node !== null && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      // Check for forbidden key names (case-insensitive)
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
        return {
          rejected: true,
          field: `${path}.${key}`,
          hint: `Field "${key}" must not be submitted to this system. This system does not collect or process PII.`,
        };
      }

      const result = deepScan(node[key], `${path}.${key}`);
      if (result.rejected) return result;
      node[key] = result.value;
    }
    return { rejected: false, value: node };
  }

  // Primitive non-string (number, boolean, null) — pass through
  return { rejected: false, value: node };
}

/**
 * Scans a single string value for PII patterns.
 * Mutates-by-replacement for redaction; returns rejection signal for high-confidence PII.
 *
 * @param {string} str
 * @param {string} path
 * @returns {{ rejected: boolean, field?: string, hint?: string, value?: string }}
 */
function scanString(str, path) {
  let value = str;

  // ── Step 1: Aadhaar candidate detection ────────────────────────────────────
  const aadhaarMatches = [...str.matchAll(PATTERNS.AADHAAR_CANDIDATE)];
  for (const match of aadhaarMatches) {
    const candidate = match[0].replace(/\s/g, '');
    const checkResult = verhoeffValidate(candidate);

    if (checkResult.valid) {
      // High-confidence Aadhaar candidate — hard reject.
      // Do NOT include the candidate value in any response or log.
      return {
        rejected: true,
        field: path,
        hint: 'Please do not enter Aadhaar numbers. This system does not need them and cannot accept them.',
      };
    } else {
      // Low-confidence — random 12-digit number, redact and continue.
      value = value.replace(match[0], '[REDACTED_NUM]');
    }
  }

  // ── Step 2: Phone number detection → redact ────────────────────────────────
  value = value.replace(PATTERNS.PHONE, '[REDACTED_PHONE]');

  // ── Step 3: Email detection → redact ──────────────────────────────────────
  value = value.replace(PATTERNS.EMAIL, '[REDACTED_EMAIL]');

  // ── Step 4: PAN-like detection → redact ───────────────────────────────────
  value = value.replace(PATTERNS.PAN, '[REDACTED_PAN]');

  return { rejected: false, value };
}

/**
 * Exported scrubber for use outside of the Express middleware chain (e.g., ASR transcripts).
 * It runs the same redaction rules but ignores high-confidence rejection logic, favoring
 * total redaction for transcripts since we want to recover whatever non-PII text remains.
 * @param {string} text 
 * @returns {string} 
 */
export function scrubText(text) {
  if (!text || typeof text !== 'string') return text;
  
  let value = text;

  // Step 1: Aadhaar candidate detection → redact everything (no hard rejection in transcript)
  const aadhaarMatches = [...value.matchAll(PATTERNS.AADHAAR_CANDIDATE)];
  for (const match of aadhaarMatches) {
    value = value.replace(match[0], '[REDACTED_NUM]');
  }

  // Step 2, 3, 4
  value = value.replace(PATTERNS.PHONE, '[REDACTED_PHONE]');
  value = value.replace(PATTERNS.EMAIL, '[REDACTED_EMAIL]');
  value = value.replace(PATTERNS.PAN, '[REDACTED_PAN]');

  return value;
}

export { scanString };


/**
 * Express middleware: PII Firewall.
 * Must be registered at position 3 in the middleware chain (see ARCHITECTURE.md §6).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function piiFirewall(req, res, next) {
  // Compute a request hash for audit purposes (never stores body content)
  const requestHash = hashBody(JSON.stringify(req.body ?? '') + JSON.stringify(req.query ?? ''));

  // Scan body
  const bodyResult = deepScan(req.body, 'body');
  if (bodyResult.rejected) {
    // Audit: record rejection reason and request hash — NEVER the value
    // (auditLogger is a separate middleware; we attach metadata to req for it)
    req._piiRejection = {
      piiRejectionReason: bodyResult.hint,
      requestHash,
    };
    return res.status(422).json({
      code: 'PII_DETECTED',
      field: bodyResult.field,
      hint: bodyResult.hint,
    });
  }
  req.body = bodyResult.value ?? req.body;

  // Scan query params
  const queryResult = deepScan(req.query, 'query');
  if (queryResult.rejected) {
    req._piiRejection = {
      piiRejectionReason: queryResult.hint,
      requestHash,
    };
    return res.status(422).json({
      code: 'PII_DETECTED',
      field: queryResult.field,
      hint: queryResult.hint,
    });
  }
  req.query = queryResult.value ?? req.query;

  // Scan route params (read-only — we note but don't mutate Express's params object)
  if (req.params) {
    const paramsResult = deepScan({ ...req.params }, 'params');
    if (paramsResult.rejected) {
      req._piiRejection = {
        piiRejectionReason: paramsResult.hint,
        requestHash,
      };
      return res.status(422).json({
        code: 'PII_DETECTED',
        field: paramsResult.field,
        hint: paramsResult.hint,
      });
    }
  }

  next();
}
