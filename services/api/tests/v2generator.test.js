import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateV2Dataset } from '../scripts/seedV2Data.js';
import { BiometricVerificationEvent } from '../src/models/BiometricVerificationEvent.js';
import { ExceptionAuthorization } from '../src/models/ExceptionAuthorization.js';
import { InvestigationCase } from '../src/models/InvestigationCase.js';
import { RationTransaction } from '../src/models/RationTransaction.js';

describe('Synthetic Dataset Generator Tests (v2.0)', () => {
  const dataset = generateV2Dataset();
  
  test('1. Expected number of transactions generated', () => {
    assert.equal(dataset.rationTransactions.length, 20);
  });

  test('2. All transaction IDs are unique', () => {
    const ids = dataset.rationTransactions.map(t => t.transactionId);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });

  test('3. All biometric event IDs are unique', () => {
    const ids = dataset.biometricEvents.map(e => e.eventId);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });

  test('4. All generated subject references are synthetic', () => {
    dataset.rationTransactions.forEach(t => {
      assert.ok(t.subjectRef.startsWith('SUBJ-SYN-'));
    });
  });

  test('5. No PII fields exist in generated records', () => {
    const forbidden = ['aadhaar', 'mobile', 'name', 'phone', 'otp'];
    const checkNoPII = (records) => {
      records.forEach(r => {
        const obj = r.toObject();
        forbidden.forEach(f => {
          assert.equal(obj[f], undefined, `Found PII field: ${f}`);
        });
      });
    };
    checkNoPII(dataset.biometricEvents);
    checkNoPII(dataset.exceptionAuths);
    checkNoPII(dataset.investigationCases);
    checkNoPII(dataset.rationTransactions);
  });

  test('6. No raw biometric fields exist in generated records', () => {
    const forbidden = ['fingerprint', 'faceImage', 'irisImage', 'biometricTemplate', 'rawBiometric'];
    dataset.biometricEvents.forEach(e => {
      const obj = e.toObject();
      forbidden.forEach(f => {
        assert.equal(obj[f], undefined, `Found raw biometric field: ${f}`);
      });
      // Ensure synthetic identifier is present
      assert.ok(obj.syntheticTemplateHash.startsWith('hash-'));
    });
  });

  test('7. All modalities are valid', () => {
    const validModalities = ['FINGERPRINT', 'FACE', 'IRIS'];
    dataset.biometricEvents.forEach(e => {
      assert.ok(validModalities.includes(e.modality), `Invalid modality: ${e.modality}`);
    });
  });

  test('8. All outcomes are valid', () => {
    const validOutcomes = ['SUCCESS', 'FAILURE', 'UNAVAILABLE'];
    dataset.biometricEvents.forEach(e => {
      assert.ok(validOutcomes.includes(e.outcome), `Invalid outcome: ${e.outcome}`);
    });
  });

  test('9. OTP records contain no OTP value', () => {
    dataset.exceptionAuths.forEach(a => {
      const obj = a.toObject();
      assert.equal(obj.otp, undefined);
      assert.equal(obj.otpValue, undefined);
      assert.equal(obj.password, undefined);
    });
  });

  test('10. Successful OTP corresponds to a completed transaction', () => {
    // Scenario B, C, E successful OTPs should lead to COMPLETED txns
    const verifiedAuths = dataset.exceptionAuths.filter(a => a.outcome === 'VERIFIED');
    verifiedAuths.forEach(auth => {
      const txn = dataset.rationTransactions.find(t => t.transactionId === auth.transactionRef);
      assert.ok(txn, 'Transaction not found');
      assert.equal(txn.status, 'COMPLETED');
    });
  });

  test('11. Failed OTP does not produce a completed transaction', () => {
    const failedAuths = dataset.exceptionAuths.filter(a => a.outcome === 'FAILED');
    assert.ok(failedAuths.length > 0, 'No failed OTPs in dataset');
    failedAuths.forEach(auth => {
      const txn = dataset.rationTransactions.find(t => t.transactionId === auth.transactionRef);
      assert.notEqual(txn.status, 'COMPLETED');
    });
  });

  test('12. Successful re-verification does not create an investigation', () => {
    const successReverifications = dataset.biometricEvents.filter(e => e.stage === 'POST_TRANSACTION_REVERIFICATION' && e.outcome === 'SUCCESS');
    assert.ok(successReverifications.length > 0, 'No successful reverifications in dataset');
    successReverifications.forEach(rev => {
      const caseExists = dataset.investigationCases.some(c => c.verificationEventRef === rev.eventId);
      assert.equal(caseExists, false, 'Investigation case wrongly created for successful re-verification');
    });
  });

  test('13. Mismatch re-verification creates SUSPECTED_IMPERSONATION', () => {
    const mismatchReverifications = dataset.biometricEvents.filter(e => e.stage === 'POST_TRANSACTION_REVERIFICATION' && e.failureReason === 'MISMATCH');
    assert.ok(mismatchReverifications.length > 0, 'No mismatch reverifications in dataset');
    mismatchReverifications.forEach(rev => {
      const invCase = dataset.investigationCases.find(c => c.verificationEventRef === rev.eventId);
      assert.ok(invCase, 'Investigation case missing for mismatch');
      assert.equal(invCase.reason, 'SUSPECTED_IMPERSONATION');
    });
  });

  test('14. Mismatch investigation starts with PENDING_AUTHORIZATION', () => {
    dataset.investigationCases.forEach(c => {
      assert.equal(c.referralStatus, 'PENDING_AUTHORIZATION');
    });
  });

  test('15. No generated investigation case claims guilt/conviction', () => {
    dataset.investigationCases.forEach(c => {
      const obj = c.toObject();
      const forbidden = ['guilty', 'criminal', 'convicted'];
      forbidden.forEach(f => {
        assert.equal(obj[f], undefined);
      });
      assert.notEqual(obj.reason, 'GUILTY');
    });
  });

  test('16. Generator is deterministic/reproducible', () => {
    const ds1 = generateV2Dataset();
    const ds2 = generateV2Dataset();
    
    const stripIds = (obj) => {
      const copy = JSON.parse(JSON.stringify(obj));
      Object.keys(copy).forEach(key => {
        copy[key].forEach(item => delete item._id);
      });
      return copy;
    };
    
    assert.equal(JSON.stringify(stripIds(ds1)), JSON.stringify(stripIds(ds2)), 'Generators are not deterministic');
  });
});
