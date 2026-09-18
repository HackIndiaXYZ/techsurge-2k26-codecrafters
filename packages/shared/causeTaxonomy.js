/**
 * @fileoverview Setu failure cause taxonomy.
 *
 * This taxonomy defines the authoritative set of failure causes
 * that the deterministic rule engine operates on.
 *
 * IMPORTANT: Fallback logic lives ONLY in services/api/src/engine/rulesEngine.js.
 * Do NOT add fallback resolution logic here.
 */

/**
 * Enum of all recognized failure causes.
 * @readonly
 * @enum {string}
 */
export const FailureCause = Object.freeze({
  /** Biometric sample did not match the enrolled template */
  BIOMETRIC_MISMATCH: 'BIOMETRIC_MISMATCH',

  /** Biometric sample quality was too low to process */
  BIOMETRIC_QUALITY_POOR: 'BIOMETRIC_QUALITY_POOR',

  /** Network or connectivity issue prevented authentication */
  CONNECTIVITY_FAILURE: 'CONNECTIVITY_FAILURE',

  /** ePoS device or biometric reader hardware failure */
  DEVICE_FAILURE: 'DEVICE_FAILURE',

  /** Demographic details did not match records */
  DEMOGRAPHIC_MISMATCH: 'DEMOGRAPHIC_MISMATCH',

  /** Beneficiary's Aadhaar has not been seeded with the ration card */
  SEEDING_NOT_DONE: 'SEEDING_NOT_DONE',

  /** Beneficiary was not physically present for authentication */
  BENEFICIARY_ABSENT: 'BENEFICIARY_ABSENT',

  /** Cause could not be determined from available information */
  UNKNOWN: 'UNKNOWN',
});

/**
 * Human-readable display labels for each failure cause.
 * Used by UI components.
 * @type {Record<string, string>}
 */
export const CAUSE_LABELS = {
  [FailureCause.BIOMETRIC_MISMATCH]: 'Biometric Mismatch',
  [FailureCause.BIOMETRIC_QUALITY_POOR]: 'Poor Biometric Quality',
  [FailureCause.CONNECTIVITY_FAILURE]: 'Connectivity Failure',
  [FailureCause.DEVICE_FAILURE]: 'Device / Hardware Failure',
  [FailureCause.DEMOGRAPHIC_MISMATCH]: 'Demographic Mismatch',
  [FailureCause.SEEDING_NOT_DONE]: 'Aadhaar Seeding Not Done',
  [FailureCause.BENEFICIARY_ABSENT]: 'Beneficiary Absent',
  [FailureCause.UNKNOWN]: 'Unknown / Other',
};
