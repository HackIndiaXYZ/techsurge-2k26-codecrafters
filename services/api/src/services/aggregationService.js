/**
 * @fileoverview Aggregation Service for Officer Dashboard.
 * 
 * Enforces I6 k-anonymity: any geographic or specific group with count < 5 is suppressed.
 * Strictly deterministic, operates only on existing FailureEvent data.
 */
import { FailureEvent } from '../models/FailureEvent.js';
import { ExceptionAuthorization } from '../models/ExceptionAuthorization.js';
import { InvestigationCase } from '../models/InvestigationCase.js';
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
 * Helper to build common match filters for V2 collections which use 'timestamp' or 'createdAt' differently.
 */
function buildV2MatchStage(filters, dateField = 'timestamp') {
  const match = {};
  if (filters.from || filters.to) {
    match[dateField] = {};
    if (filters.from) match[dateField].$gte = new Date(filters.from);
    if (filters.to) match[dateField].$lte = new Date(filters.to);
  }
  return match;
}

/**
 * Returns geographic hotspots of failures, enforcing k-anonymity.
 */
export async function getHotspots(filters = {}) {
  const matchStage = buildMatchStage(filters);

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

  return {
    shops: shops.slice(0, 50),
    suppressedShops
  };
}

/**
 * Returns aggregate summary metrics for the Officer Dashboard.
 * Integrates data from FailureEvent, ExceptionAuthorization, and InvestigationCase.
 */
export async function getSummary(filters = {}) {
  const matchStage = buildMatchStage(filters);
  const v2MatchStageTimestamp = buildV2MatchStage(filters, 'timestamp');
  const v2MatchStageCreatedAt = buildV2MatchStage(filters, 'createdAt');

  // 1. Total Failures
  const totalFailures = await FailureEvent.countDocuments(matchStage);

  // 2. Top Cause
  const causesPipeline = [
    { $match: matchStage },
    { $group: { _id: '$failureCause', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ];
  const topCauseResult = await FailureEvent.aggregate(causesPipeline);
  const topCause = topCauseResult.length > 0 ? topCauseResult[0]._id : null;

  // 3. Active Hotspots & Suppressed Buckets
  const hotspotsData = await getHotspots(filters);
  const activeHotspots = hotspotsData.buckets.length;
  const suppressedBuckets = hotspotsData.suppressedBuckets;

  // 4. Total Exceptions (from ExceptionAuthorization)
  const totalExceptions = await ExceptionAuthorization.countDocuments(v2MatchStageTimestamp);

  // 5. Open Investigations (from InvestigationCase where status is OPEN or UNDER_REVIEW)
  const openInvestigations = await InvestigationCase.countDocuments({
    ...v2MatchStageCreatedAt,
    status: { $in: ['OPEN', 'UNDER_REVIEW'] }
  });

  return {
    totalFailures,
    topCause,
    activeHotspots,
    suppressedBuckets,
    totalExceptions,
    openInvestigations
  };
}
