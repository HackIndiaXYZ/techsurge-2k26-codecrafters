import test from 'node:test';
import assert from 'node:assert';
import { handleVoiceDiagnosis } from '../src/controllers/diagnose.controller.js';
import { classifier } from '../src/ai/classifier.js';

test('Voice Endpoint AI Classifier Checks', async (t) => {
  // Mocking the classifier object
  const originalClassify = classifier.classifyTranscript;

  const mockReq = (body) => ({
    body,
    _piiRejection: { requestHash: 'test-hash' }
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
    classifier.classifyTranscript = originalClassify;
  });

  await t.test('Valid classifier JSON routes to deterministic engine', async () => {
    classifier.classifyTranscript = async () => ({
      cause: 'BIOMETRIC_MISMATCH',
      attempts: 3,
      ageBand: '65_PLUS',
      confidence: 0.95
    });

    const req = mockReq({ transcript: 'My biometric failed three times and I am an old man.' });
    const res = mockRes();
    await handleVoiceDiagnosis(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.detectedCause, 'BIOMETRIC_MISMATCH');
    assert.strictEqual(res.body.ruleId, 'R-BIO-001'); // 3 attempts + 65_PLUS -> BIO-001
    assert.strictEqual(res.body.confidence, 0.95);
  });

  await t.test('PII scrub before classifier is guaranteed', async () => {
    let capturedTranscript = '';
    classifier.classifyTranscript = async (text) => {
      capturedTranscript = text;
      return { cause: 'UNKNOWN', attempts: 0, ageBand: 'UNKNOWN', confidence: 0 };
    };

    const req = mockReq({ transcript: 'My phone is 9876543210 and aadhaar is 1234 5678 9012' });
    const res = mockRes();
    await handleVoiceDiagnosis(req, res, (err) => { throw err; });

    assert.ok(capturedTranscript.includes('[REDACTED_PHONE]'));
    assert.ok(capturedTranscript.includes('[REDACTED_NUM]'));
  });

  await t.test('Unknown cause defaults cleanly', async () => {
    classifier.classifyTranscript = async () => ({
      cause: 'UNKNOWN',
      attempts: 0,
      ageBand: 'UNKNOWN',
      confidence: 0
    });

    const req = mockReq({ transcript: 'Random text.' });
    const res = mockRes();
    await handleVoiceDiagnosis(req, res, (err) => { throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.ruleId, 'R-ESC-000');
  });
});

