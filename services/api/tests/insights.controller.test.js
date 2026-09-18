import test from 'node:test';
import assert from 'node:assert';
import { FailureEvent } from '../src/models/FailureEvent.js';
import { FailureCause } from '../../../packages/shared/causeTaxonomy.js';
import {
  getHotspotsController,
  getCausesController,
  getRecurringFailuresController
} from '../src/controllers/insights.controller.js';

test('Insights Controller & Aggregation Service', async (t) => {
  const originalAggregate = FailureEvent.aggregate;

  const mockReq = (query) => ({
    query
  });

  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  t.afterEach(() => {
    FailureEvent.aggregate = originalAggregate;
  });

  await t.test('GET /api/v1/insights/hotspots enforces k-anonymity', async () => {
    FailureEvent.aggregate = async () => [
      { _id: 'SHOP-A', state: 'AP', district: 'Kurnool', geo: [78.0, 15.0], count: 5 }, // Keep
      { _id: 'SHOP-B', state: 'AP', district: 'Kurnool', geo: [78.1, 15.1], count: 3 }, // Suppress
      { _id: 'SHOP-C', state: 'AP', district: 'Anantapur', geo: [77.0, 14.0], count: 1 } // Suppress
    ];

    const req = mockReq({});
    const res = mockRes();
    
    await getHotspotsController(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.buckets));
    assert.strictEqual(res.body.buckets.length, 1); // Only SHOP-A
    assert.strictEqual(res.body.buckets[0].shopCode, 'SHOP-A');
    assert.strictEqual(res.body.buckets[0].count, 5);
    
    // 2 suppressed shops (SHOP-B and SHOP-C)
    assert.strictEqual(res.body.suppressedBuckets, 2);
  });

  await t.test('GET /api/v1/insights/causes returns correct breakdown', async () => {
    FailureEvent.aggregate = async () => [
      { _id: FailureCause.BIOMETRIC_MISMATCH, count: 5 },
      { _id: FailureCause.CONNECTIVITY_FAILURE, count: 3 },
      { _id: FailureCause.DEVICE_FAILURE, count: 1 }
    ];

    const req = mockReq({});
    const res = mockRes();
    await getCausesController(req, res, (err) => { throw err; });
    
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.causes));
    assert.strictEqual(res.body.causes.length, 3);
    const biomMismatch = res.body.causes.find(c => c.cause === FailureCause.BIOMETRIC_MISMATCH);
    assert.ok(biomMismatch);
    assert.strictEqual(biomMismatch.count, 5);
  });

  await t.test('GET /api/v1/insights/recurring-failures enforces k-anonymity', async () => {
    FailureEvent.aggregate = async () => [
      { _id: 'SHOP-A', state: 'AP', district: 'Kurnool', count: 5 }, // Keep
      { _id: 'SHOP-B', state: 'AP', district: 'Kurnool', count: 3 }, // Suppress
      { _id: 'SHOP-C', state: 'AP', district: 'Anantapur', count: 1 } // Suppress
    ];

    const req = mockReq({});
    const res = mockRes();
    await getRecurringFailuresController(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.shops));
    assert.strictEqual(res.body.shops.length, 1); // Only SHOP-A
    assert.strictEqual(res.body.shops[0].shopCode, 'SHOP-A');
    assert.strictEqual(res.body.shops[0].count, 5);
    
    // 2 suppressed shops
    assert.strictEqual(res.body.suppressedShops, 2);
  });

  await t.test('Filters work correctly', async () => {
    let capturedPipeline = null;
    FailureEvent.aggregate = async (pipeline) => {
      capturedPipeline = pipeline;
      return [];
    };

    const req = mockReq({ district: 'Anantapur', state: 'AP' });
    const res = mockRes();
    await getHotspotsController(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(capturedPipeline[0].$match.district, 'Anantapur');
    assert.strictEqual(capturedPipeline[0].$match.state, 'AP');
  });

  await t.test('Malformed query params return 400', async () => {
    const req = mockReq({ from: 'invalid-date' });
    const res = mockRes();
    await getHotspotsController(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Invalid query parameters');
  });
});
