/**
 * @fileoverview Setu shared constants.
 * Shared across dealer-pwa, officer-dashboard, and services/api.
 */

/** Synthetic data prefix — all demo identifiers must use these prefixes */
export const SYNTHETIC_PREFIXES = {
  BENEFICIARY: 'BEN-SYN',
  FPS: 'FPS-SYN',
  DISTRICT: 'DIST-SYN',
  EVENT: 'EVT-SYN',
};

/** Rule verification statuses */
export const VERIFICATION_STATUS = {
  VERIFIED: 'VERIFIED',
  RULE_REQUIRES_VERIFICATION: 'RULE_REQUIRES_VERIFICATION',
};

/** Resolution statuses for a failure event */
export const RESOLUTION_STATUS = {
  PENDING: 'PENDING',
  ACTIONED: 'ACTIONED',
  ESCALATED: 'ESCALATED',
  UNRESOLVED: 'UNRESOLVED',
};

/** API base paths */
export const API_PATHS = {
  HEALTH: '/api/v1/health',
  DIAGNOSE: '/api/v1/diagnose',
  EVENTS: '/api/v1/events',
  INSIGHTS: '/api/v1/insights',
  RECURRING_FAILURES: '/api/v1/insights/recurring-failures',
};

/** Minimum bucket size for k-anonymity suppression on the dashboard */
export const K_ANONYMITY_THRESHOLD = 5;
