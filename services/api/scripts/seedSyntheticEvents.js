/**
 * @fileoverview Synthetic Failure Event Seeder.
 * 
 * Generates ~2000 synthetic failure events across 3 districts to simulate
 * geographic hotspots for the officer dashboard.
 * 
 * IMPORTANT:
 * - NO real Aadhaar numbers, names, phone numbers, or addresses are generated.
 * - All data is purely synthetic.
 * 
 * Run: node services/api/scripts/seedSyntheticEvents.js
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import { FailureEvent } from '../src/models/FailureEvent.js';
import { FailureCause } from '../../../packages/shared/causeTaxonomy.js';
import { env } from '../src/config/env.js';

if (!env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required to run the seeder.');
  process.exit(1);
}

// ── Synthetic Geographic Clusters (Andhra Pradesh) ──────────────────────────
const CLUSTERS = [
  {
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    baseCoords: [78.0322, 15.8281], // Kurnool city centroid
    shopPrefix: 'AP-KNL',
    weight: 0.5, // 50% of events
  },
  {
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    baseCoords: [77.5946, 14.6819], // Anantapur city centroid
    shopPrefix: 'AP-ATP',
    weight: 0.3, // 30% of events
  },
  {
    district: 'Kadapa',
    state: 'Andhra Pradesh',
    baseCoords: [78.8232, 14.4673], // Kadapa city centroid
    shopPrefix: 'AP-KDP',
    weight: 0.2, // 20% of events
  }
];

// Helper to jitter coordinates by a small random amount (approx 0-5km)
function jitterCoordinate(coord) {
  const jitter = (Math.random() - 0.5) * 0.05;
  return coord + jitter;
}

// Generate random events
function generateSyntheticEvents(count) {
  const events = [];
  const causes = Object.values(FailureCause);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    // Pick cluster based on weights
    const rand = Math.random();
    let cluster = CLUSTERS[0];
    if (rand > 0.8) cluster = CLUSTERS[2];
    else if (rand > 0.5) cluster = CLUSTERS[1];

    // Pick random cause (weighted towards biometric mismatch)
    let cause = causes[Math.floor(Math.random() * causes.length)];
    if (Math.random() > 0.4) cause = FailureCause.BIOMETRIC_MISMATCH; // 60% chance

    // Dummy resolution mapping based on engine rules
    let ruleApplied = 'R-ESC-000';
    let resolutionOffered = 'ESCALATE';
    if (cause === FailureCause.BIOMETRIC_MISMATCH) {
      ruleApplied = Math.random() > 0.5 ? 'R-BIO-001' : 'R-BIO-002';
      resolutionOffered = ruleApplied === 'R-BIO-001' ? 'FACE_AUTH' : 'OTP';
    } else if (cause === FailureCause.CONNECTIVITY_FAILURE) {
      ruleApplied = 'R-CON-001';
      resolutionOffered = 'OFFLINE_MODE';
    } else if (cause === FailureCause.DEVICE_FAILURE) {
      ruleApplied = 'R-DEV-001';
      resolutionOffered = 'ALTERNATE_EPOS';
    }

    const eventId = `EVT-SYN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const shopCode = `${cluster.shopPrefix}-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`;
    
    // Spread createdAt over the last 30 days
    const pastOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    events.push({
      eventId,
      failureCause: cause,
      confidence: 1.0,
      ruleApplied,
      resolutionOffered,
      resolutionOutcome: Math.random() > 0.2 ? 'SUCCESS' : 'PENDING',
      shopCode,
      district: cluster.district,
      state: cluster.state,
      geo: {
        type: 'Point',
        coordinates: [
          jitterCoordinate(cluster.baseCoords[0]),
          jitterCoordinate(cluster.baseCoords[1]),
        ],
      },
      language: 'te',
      inputMode: 'FORM',
      createdAt: new Date(now - pastOffset),
    });
  }
  return events;
}

async function run() {
  console.log('[seeder] Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  
  console.log('[seeder] Clearing existing synthetic events...');
  await FailureEvent.deleteMany({ eventId: { $regex: /^EVT-SYN/ } });
  
  console.log('[seeder] Generating 2000 synthetic events...');
  const events = generateSyntheticEvents(2000);
  
  console.log('[seeder] Inserting into database...');
  await FailureEvent.insertMany(events);
  
  console.log('[seeder] ✅ Seeding complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seeder] Fatal error:', err);
  process.exit(1);
});
