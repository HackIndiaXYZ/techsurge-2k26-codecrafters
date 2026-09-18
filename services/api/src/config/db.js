/**
 * @fileoverview MongoDB connection setup.
 *
 * Requirements from PROMPT 4:
 * - Connect when MONGODB_URI is configured.
 * - Fail gracefully if MongoDB is unavailable.
 * - Do not crash the health endpoint.
 * - Expose connection state.
 * - Never log credentials.
 * - Do not retry indefinitely.
 */

import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDB() {
  if (!env.MONGODB_URI) {
    console.warn('[setu-api] No MONGODB_URI provided. Running without database persistence.');
    return;
  }

  try {
    // Only try once to connect, so we don't block server startup indefinitely if DB is down
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[setu-api] MongoDB connected successfully to ${conn.connection.host}`);
  } catch (error) {
    console.error('[setu-api] MongoDB connection failed:', error.message);
    console.warn('[setu-api] Running in degraded mode: No events will be persisted to DB.');
    isConnected = false;
  }
}

export function getDbStatus() {
  return isConnected;
}
