/**
 * @fileoverview Environment Configuration Validation
 * Uses Zod to ensure the application fails fast if required environment variables are missing.
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  // MongoDB is required for the full app, but the API health endpoint must start without it.
  // We make it optional in Zod so the app boots, but the DB connection logic handles the absence.
  MONGODB_URI: z.string().optional(),
  
  GEMINI_API_KEY: z.string().optional(),
  BHASHINI_API_KEY: z.string().optional(),
  BHASHINI_USER_ID: z.string().optional(),
  HMAC_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
