/**
 * @fileoverview Aggregation Service for Officer Dashboard.
 * 
 * Enforces I6 k-anonymity: any geographic or specific group with count < 5 is suppressed.
 * Strictly deterministic, operates only on existing FailureEvent data.
 */
import { FailureEvent } from '../models/FailureEvent.js';
import { FailureCause } from '../../../../packages/shared/causeTaxonomy.js';

/**
 * Helper to build common match filters for all insights endpoints.
 */
function buildMatchStage(filters) {
  const match = {};
  if (filters.state) match.state = filters.state;
  if (filters.district) match.district = filters.district;
  
  if (filters.from || filters.to) {
    match.createdAt = {};
    if (filters.from) match.createdAt.$gte = new Date(filters.from);
    if (filters.to) match.createdAt.$lte = new Date(filters.to);
  }
  return match;
}

/**
 * Returns geographic hotspots of failures, enforcing k-anonymity.
 * 
 * @param {Object} filters - state, district, from, to
 * @returns {Promise<{ buckets: Array, suppressedBuckets: number }>}
 */
export async function getHotspots(filters = {}) {
  const matchStage = buildMatchStage(filters);

  // Group by shopCode (which maps to a specific jittered geo location)
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$shopCode',
        state: { $first: '$state' },
        district: { $first: '$district' },
        geo: { $first: '$geo.coordinates' }, // [lng, lat]
        count: { $sum: 1 },
      }
    },
    { $sort: { count: -1 } }
  ];

  const rawBuckets = await FailureEvent.aggregate(pipeline);

  const buckets = [];
  let suppressedBucketsCount = 0;

  for (const b of rawBuckets) {
    if (b.count >= 5) {
      buckets.push({
        shopCode: b._id,
        state: b.state,
        district: b.district,
        longitude: b.geo[0],
        latitude: b.geo[1],
        count: b.count
      });
    } else {
      suppressedBucketsCount++;
    }
  }

  return {
    buckets,
    suppressedBuckets: suppressedBucketsCount
  };
}

/**
 * Returns a breakdown of failure causes across the filtered dataset.
 * 
 * @param {Object} filters - state, district, from, to
 * @returns {Promise<{ causes: Array }>}
 */
export async function getCauses(filters = {}) {
  const matchStage = buildMatchStage(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$failureCause',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];

  const results = await FailureEvent.aggregate(pipeline);

  const causes = results.map(r => ({
    cause: r._id,
    count: r.count
  }));

  return { causes };
}

/**
 * Returns shops with high volumes of authentication failures (recurring failures).
 * Suppresses shops with < 5 failures to adhere to k-anonymity.
 * 
 * @param {Object} filters - state, district, from, to
 * @returns {Promise<{ shops: Array, suppressedShops: number }>}
 */
export async function getRecurringFailures(filters = {}) {
  const matchStage = buildMatchStage(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$shopCode',
        district: { $first: '$district' },
        state: { $first: '$state' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ];

  const rawShops = await FailureEvent.aggregate(pipeline);

  const shops = [];
  let suppressedShops = 0;

  for (const s of rawShops) {
    if (s.count >= 5) {
      shops.push({
        shopCode: s._id,
        district: s.district,
        state: s.state,
        count: s.count
      });
    } else {
      suppressedShops++;
    }
  }

  // Only return top 50 to avoid massive tables
  return {
    shops: shops.slice(0, 50),
    suppressedShops
  };
}
