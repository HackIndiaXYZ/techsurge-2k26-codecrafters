import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore.js';
import { apiClient } from '../lib/apiClient.js';
import VoiceRecorder from './VoiceRecorder.jsx';
import FailurePicker from './FailurePicker.jsx';
import GuidanceCard from './GuidanceCard.jsx';

import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import te from '../i18n/te.json';
const translations = { en, hi, te };

export default function SyntheticVerificationFlow() {
  const store = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [inputMode, setInputMode] = useState('voice');

  const handleStartDemo = async (scenario) => {
    const txn = store.getNextDemoTransaction();
    if (!txn) {
      setLocalError('Demo transactions exhausted. Re-seed the synthetic dataset to continue.');
      return;
    }
    
    store.resetForm(); // resets states but we immediately override below
    store.setV2FlowActive(true);
    store.setTransactionRef(txn);
    store.setSelectedScenario(scenario);
    store.setVerificationState('BIOMETRIC_VERIFICATION');
    setLocalError(null);
    setOtpInput('');
  };

  const handleBiometricSubmit = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      let fingerprint, face, iris;
      
      // Setup payload based on chosen scenario
      if (store.selectedScenario === 'NORMAL_SUCCESS') {
        fingerprint = { outcome: 'SUCCESS' };
        face = { outcome: 'SUCCESS' };
        iris = { outcome: 'SUCCESS' };
      } else {
        // OTP_MATCH or OTP_MISMATCH have same initial biometric result
        fingerprint = { outcome: 'FAILURE', failureReason: 'MISMATCH' };
        face = { outcome: 'SUCCESS' };
        iris = { outcome: 'SUCCESS' };
      }

      const response = await apiClient.submitBiometric(store.transactionRef, fingerprint, face, iris);
      
      // Backend authority check
      store.setBiometricResult(response);
      if (response.authentication?.status === 'AUTHENTICATED') {
        store.setVerificationState('AUTHENTICATED');
      } else if (response.authentication?.status === 'BIOMETRIC_FAILED' && response.authentication?.exceptionEligible) {
        store.setVerificationState('EXCEPTION_REQUIRED');
      } else {
        setLocalError(`Unexpected authentication status: ${response.authentication?.status}`);
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const ruleId = store.currentDiagnosis?.ruleId;
      if (!ruleId) {
        throw new Error("Diagnosis ruleId is required for OTP authorization");
      }
      const response = await apiClient.submitOtp(store.transactionRef, otpInput, ruleId);
      store.setExceptionAuthorization(response);
      
      if (response.exceptionAuthorization?.outcome === 'VERIFIED') {
        store.setVerificationState('VERIFIED');
      } else {
        store.setVerificationState('FAILED');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = () => {
    // Purely local transition
    store.setVerificationState('RATION_DISPENSE');
  };

  const handleReverification = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      store.setVerificationState('REVERIFICATION_PENDING');
      
      let fingerprint, face, iris;
      if (store.selectedScenario === 'NORMAL_SUCCESS' || store.selectedScenario === 'OTP_MATCH') {
        fingerprint = { outcome: 'SUCCESS' };
        face = { outcome: 'SUCCESS' };
        iris = { outcome: 'SUCCESS' };
      } else if (store.selectedScenario === 'OTP_MISMATCH') {
        fingerprint = { outcome: 'FAILURE', failureReason: 'MISMATCH' };
        face = { outcome: 'SUCCESS' };
        iris = { outcome: 'SUCCESS' };
      }

      const response = await apiClient.submitReverification(store.transactionRef, fingerprint, face, iris);
      store.setReverifyResult(response);
      store.setVerificationState('REVERIFICATION_RESULT');
    } catch (err) {
      setLocalError(err.message);
      store.setVerificationState('REVERIFICATION_RESULT'); // Allow rendering error
    } finally {
      setLoading(false);
    }
  };

  const renderIdle = () => (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">Select Demo Scenario</h2>
      <p className="text-xs text-gray-500 mb-6">
        Prototype uses synthetic biometric descriptors.<br />
        No raw biometric images, Aadhaar numbers, or mobile numbers are stored.
      </p>
      
      <button onClick={() => handleStartDemo('NORMAL_SUCCESS')} className="w-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold py-3 px-4 rounded-xl shadow-sm transition">
        Scenario A — Normal Success
      </button>
      <button onClick={() => handleStartDemo('OTP_MATCH')} className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold py-3 px-4 rounded-xl shadow-sm transition">
        Scenario B — OTP Exception + Match
      </button>
      <button onClick={() => handleStartDemo('OTP_MISMATCH')} className="w-full bg-orange-100 text-orange-800 hover:bg-orange-200 font-bold py-3 px-4 rounded-xl shadow-sm transition">
        Scenario C — OTP Exception + Mismatch
      </button>
    </div>
  );

  const [showFacePopup, setShowFacePopup] = useState(false);

  const renderBiometric = () => (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">Synthetic Verification</h2>
      <p className="text-sm font-semibold text-gray-600">All three verification modes are required.</p>
      <div className="flex justify-center gap-4 my-4">
        <div className="p-3 bg-gray-100 rounded">Fingerprint</div>
        <div className="p-3 bg-blue-100 border border-blue-300 rounded shadow-sm text-blue-800 font-bold">Face</div>
        <div className="p-3 bg-gray-100 rounded">Iris</div>
      </div>
      
      {!showFacePopup ? (
        <button 
          onClick={() => setShowFacePopup(true)} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow transition"
        >
          📷 Capture Face Photo (Simulation)
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Face Authentication Module</span>
            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">CAPTURED</span>
          </div>
          <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-400">
             [ Camera Feed Placeholder ]
          </div>
          <p className="text-[10px] font-mono text-gray-600 break-all bg-white p-2 border rounded">
            <strong>BIOMETRIC_HASH:</strong><br/>
            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">Note: Photo processed locally. Only cryptographic hash is transmitted.</p>
          <button 
            onClick={handleBiometricSubmit} 
            disabled={loading}
            className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : 'Submit Synthetic Biometrics'}
          </button>
        </div>
      )}
    </div>
  );

  const renderAuthenticated = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-emerald-700">Authenticated</h2>
      <button onClick={handleDispense} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">
        Proceed to Dispense
      </button>
    </div>
  );

  const renderExceptionRequired = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h2 className="text-xl font-bold text-amber-700">Biometric Failed</h2>
      <p className="text-sm">Exception Eligible. Diagnosis required before proceeding.</p>
      <button onClick={() => store.setVerificationState('DIAGNOSIS_ENTRY')} className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl">
        Diagnose Failure
      </button>
    </div>
  );

  const renderDiagnosisEntry = () => {
    if (store.currentDiagnosis) {
      return <GuidanceCard />;
    }
    return inputMode === 'voice' ? (
      <VoiceRecorder onFallback={() => setInputMode('form')} />
    ) : (
      <div>
        <FailurePicker translations={translations[store.language] || translations.en} />
        <button 
          onClick={() => setInputMode('voice')}
          className="mt-4 w-full text-center text-sm font-semibold text-blue-600 underline"
        >
          Use Voice Diagnosis instead
        </button>
      </div>
    );
  };

  const renderOtpEntry = () => (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">Demo OTP</h2>
      <p className="text-xs text-gray-500">Enter synthetic OTP for demo (e.g., 123456)</p>
      <input 
        type="text" 
        value={otpInput}
        onChange={(e) => setOtpInput(e.target.value)}
        className="w-full p-3 border rounded-xl text-center text-lg tracking-widest"
        placeholder="------"
      />
      <button 
        onClick={handleOtpSubmit} 
        disabled={loading || !otpInput}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Verify OTP'}
      </button>
    </div>
  );

  const renderVerified = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-emerald-700">OTP Verified</h2>
      <button onClick={handleDispense} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">
        Proceed to Dispense
      </button>
    </div>
  );

  const renderFailed = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <h2 className="text-xl font-bold text-red-700">Authentication Failed</h2>
      <p className="text-sm">Transaction Blocked.</p>
      <button onClick={() => store.resetForm()} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">
        Restart Demo
      </button>
    </div>
  );

  const renderDispense = () => (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">Synthetic ePoS transaction</h2>
      <div className="p-6 bg-gray-50 border rounded-xl">
        <p className="text-lg font-bold text-gray-900">Dispensing 10kg Rice</p>
      </div>
      <p className="text-emerald-700 font-bold">Ration transaction completed</p>
      <p className="text-amber-600 font-bold text-sm">Post-transaction verification required</p>
      <button onClick={handleReverification} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">
        Run Re-verification
      </button>
    </div>
  );

  const renderReverifyPending = () => (
    <div className="space-y-4 text-center py-8">
      <div className="animate-spin h-10 w-10 text-blue-600 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      <p className="text-gray-600 font-semibold">Running post-transaction verification...</p>
    </div>
  );

  const renderReverifyResult = () => {
    const status = store.reverifyResult?.reverification?.status;
    
    if (status === 'MATCH_CONFIRMED') {
      return (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-emerald-700">Verification confirmed</h2>
          <p className="text-sm text-gray-600">Post-transaction biometric verification matched.</p>
          <button onClick={() => store.resetForm()} className="mt-4 w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">Restart Demo</button>
        </div>
      );
    } else if (status === 'MISMATCH_FLAGGED') {
      return (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-red-700">Verification mismatch flagged</h2>
          <p className="text-sm text-red-600 font-semibold">Additional authorized review is required.</p>
          <button onClick={() => store.resetForm()} className="mt-4 w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">Restart Demo</button>
        </div>
      );
    } else if (status === 'REVERIFICATION_UNAVAILABLE') {
      return (
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-bold text-amber-700">Re-verification unavailable</h2>
          <p className="text-sm text-amber-600 font-semibold">Additional verification/review may be required.</p>
          <button onClick={() => store.resetForm()} className="mt-4 w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">Restart Demo</button>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold text-red-700">Unknown Error</h2>
        <p className="text-sm text-gray-600">Failed to process re-verification.</p>
        <button onClick={() => store.resetForm()} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">Restart Demo</button>
      </div>
    );
  };

  const renderContent = () => {
    switch (store.verificationState) {
      case 'IDLE': return renderIdle();
      case 'BIOMETRIC_VERIFICATION': return renderBiometric();
      case 'AUTHENTICATED': return renderAuthenticated();
      case 'EXCEPTION_REQUIRED': return renderExceptionRequired();
      case 'DIAGNOSIS_ENTRY': return renderDiagnosisEntry();
      case 'OTP_ENTRY': return renderOtpEntry();
      case 'VERIFIED': return renderVerified();
      case 'FAILED': return renderFailed();
      case 'RATION_DISPENSE': return renderDispense();
      case 'REVERIFICATION_PENDING': return renderReverifyPending();
      case 'REVERIFICATION_RESULT': return renderReverifyResult();
      default: return renderIdle();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2 relative p-6">
      <div className="absolute top-0 right-0 m-2 z-50 flex gap-2">
        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow animate-pulse uppercase tracking-wider">
          v2.0 Architecture
        </span>
        <button onClick={() => store.resetForm()} className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-gray-300">
          Close X
        </button>
      </div>
      
      {localError && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm font-medium">
          {localError}
        </div>
      )}

      {renderContent()}
    </div>
  );
}
