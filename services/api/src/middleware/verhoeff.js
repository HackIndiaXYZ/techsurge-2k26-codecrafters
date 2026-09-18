/**
 * @fileoverview Verhoeff checksum validator.
 *
 * The Verhoeff algorithm is the checksum scheme used for Aadhaar numbers.
 * A string that passes this check is a CANDIDATE that may be an Aadhaar number.
 *
 * IMPORTANT DISCLAIMER: A passing Verhoeff checksum does NOT prove that a number
 * is a real Aadhaar identity. It is one signal used by the PII detection layer.
 * ~1 in 10 random 12-digit numbers will pass by chance.
 *
 * This module is:
 *   - a pure function
 *   - no I/O
 *   - no logging (NEVER log the tested value — it may be PII)
 *   - no network
 *   - no side effects
 *
 * References:
 *   Verhoeff, J. (1969). Error Detecting Decimal Codes.
 *   Mathematical Centre Tracts, 29. Amsterdam.
 */

/**
 * Verhoeff multiplication table (D5 dihedral group).
 * @type {number[][]}
 */
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

/**
 * Verhoeff permutation table.
 * @type {number[][]}
 */
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Verhoeff inverse table.
 * @type {number[]}
 */
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a string as a Verhoeff-valid 12-digit sequence.
 *
 * @param {string} input - The value to test. Spaces are normalised before testing.
 * @returns {{ valid: boolean, reason: string }} Result object.
 *   valid = true means the checksum passes for a 12-digit normalised number.
 *   This does NOT confirm it is a real Aadhaar identity.
 */
export function verhoeffValidate(input) {
  if (typeof input !== 'string') {
    return { valid: false, reason: 'NOT_STRING' };
  }

  // Normalise: remove spaces only
  const normalised = input.replace(/\s/g, '');

  // Must be exactly 12 digits
  if (!/^\d{12}$/.test(normalised)) {
    return { valid: false, reason: 'NOT_12_DIGITS' };
  }

  // Run the Verhoeff algorithm
  let c = 0;
  const digits = normalised.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = D[c][P[i % 8][digits[i]]];
  }

  if (c !== 0) {
    return { valid: false, reason: 'CHECKSUM_INVALID' };
  }

  return {
    valid: true,
    reason: 'CHECKSUM_PASSES',
    // Explicit disclaimer to prevent misuse of this result:
    disclaimer:
      'Verhoeff checksum passes. This does NOT confirm a real Aadhaar identity. ' +
      'Used only as a PII detection signal.',
  };
}
