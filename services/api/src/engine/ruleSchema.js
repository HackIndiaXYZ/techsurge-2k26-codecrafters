/**
 * @fileoverview Zod schema for validating rules.json at boot time.
 * If the registry fails validation, the server must not start.
 * This ensures the deterministic engine never operates on malformed rules.
 */

import { z } from 'zod';

const VERIFICATION_STATUSES = /** @type {const} */ (['VERIFIED', 'RULE_REQUIRES_VERIFICATION']);

const StepTranslationsSchema = z.object({
  en: z.array(z.string().min(1)),
  hi: z.array(z.string().min(1)),
  te: z.array(z.string().min(1)),
});

export const RuleSchema = z.object({
  ruleId: z.string().min(1),
  version: z.string().min(1),
  causeMatch: z.array(z.string().min(1)).min(1),
  conditions: z.record(z.unknown()),
  fallback: z.string().min(1),
  steps: StepTranslationsSchema,
  citation: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  verifiedAt: z.string().nullable(),
  escalationPath: z.string().min(1),
  active: z.boolean(),
});

export const RuleRegistrySchema = z.array(RuleSchema).min(1);

/**
 * Validates the rule registry and throws a descriptive error on failure.
 * Called once at server/test startup.
 *
 * @param {unknown} registry - The raw parsed JSON array from rules.json
 * @returns {import('zod').infer<typeof RuleRegistrySchema>} - Validated rules
 * @throws {Error} If registry is invalid
 */
export function validateRuleRegistry(registry) {
  const result = RuleRegistrySchema.safeParse(registry);
  if (!result.success) {
    throw new Error(
      `[ruleSchema] Rule registry validation failed:\n${result.error.toString()}`
    );
  }
  return result.data;
}
