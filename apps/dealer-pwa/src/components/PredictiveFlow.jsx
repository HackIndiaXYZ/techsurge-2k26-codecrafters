import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore.js';

export default function PredictiveFlow() {
  const { setPredictiveFlowActive, resetForm } = useSessionStore();
  
  // STATES: NIGHTLY_BATCH -> EDGE_SYNC -> BENEFICIARY_ARRIVES -> BIOMETRIC_FAILURE -> TOKEN_VERIFICATION -> ZERO_FRICTION_DISPENSE -> AUDIT_QUEUED -> RECONCILIATION -> SUCCESS
  const [step, setStep] = useState('NIGHTLY_BATCH');

  // Utility to handle automatic transitions
  useEffect(() => {
    if (step === 'EDGE_SYNC') {
      const timer = setTimeout(() => setStep('BENEFICIARY_ARRIVES'), 2500);
      return () => clearTimeout(timer);
    }
    if (step === 'BIOMETRIC_FAILURE') {
      const timer = setTimeout(() => setStep('TOKEN_VERIFICATION'), 2000);
      return () => clearTimeout(timer);
    }
    if (step === 'RECONCILIATION') {
      const timer = setTimeout(() => setStep('SUCCESS'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleReset = () => {
    setPredictiveFlowActive(false);
    resetForm();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2 relative">
      <div className="absolute top-0 right-0 m-2 z-50 flex gap-2">
        <span className="bg-fuchsia-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow animate-pulse uppercase tracking-wider">
          Demo Simulation
        </span>
        <button onClick={handleReset} className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-gray-300">
          Close X
        </button>
      </div>

      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-center pt-8">
        <h2 className="text-gray-800 font-bold text-sm uppercase tracking-wide">Predictive Entitlement Engine</h2>
        <p className="text-xs text-gray-500 mt-1">Offline continuity with pre-authorized Trust Tokens</p>
      </div>

      <div className="p-4">
        {step === 'NIGHTLY_BATCH' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-center mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                NIGHTLY BATCH COMPLETE
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 bg-blue-50/50 p-4 rounded border border-blue-100">
              <p className="flex justify-between"><span>Last processed:</span> <strong>04:42 AM</strong></p>
              <p className="flex justify-between"><span>Beneficiaries analyzed:</span> <strong>12,480</strong></p>
              <p className="flex justify-between"><span>Low-risk identified:</span> <strong>1,842</strong></p>
              <p className="flex justify-between"><span>Trust Tokens generated:</span> <strong>1,842</strong></p>
              <p className="text-[10px] text-gray-400 text-center mt-2 pt-2 border-t border-blue-200">SYNTHETIC DEMO DATA</p>
            </div>

            <div className="text-xs text-gray-500 font-mono text-center space-y-1">
              <p>PDS Transaction History</p>
              <p>↓</p>
              <p>36-Month Trust Analysis</p>
              <p>↓</p>
              <p>Low-Risk Beneficiary Detection</p>
              <p>↓</p>
              <p className="font-bold text-emerald-600">Cryptographic Trust Token</p>
              <p>↓</p>
              <p>Ready for Edge Sync</p>
            </div>

            <div className="bg-emerald-50 p-3 rounded border border-emerald-200 text-xs shadow-sm">
              <h3 className="font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-1">Trust Token Ready</h3>
              <p><strong>Beneficiary:</strong> Ammamma</p>
              <p><strong>Location:</strong> Demo Village</p>
              <p><strong>Entitlement:</strong> Rice — 10 kg</p>
              <p><strong>Trust status:</strong> Historical Trust Verified</p>
              <p><strong>Token status:</strong> <span className="text-emerald-600 font-bold">VALID</span></p>
            </div>

            <button onClick={() => setStep('EDGE_SYNC')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition mt-4">
              Continue to 5:00 AM Sync →
            </button>
          </div>
        )}

        {step === 'EDGE_SYNC' && (
          <div className="space-y-4 text-center py-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800">5:00 AM — ePoS Edge Sync</h2>
            
            <div className="flex justify-center my-6">
              <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div className="text-sm font-mono text-gray-500 space-y-1">
              <p className="text-gray-800">Connecting to Trust Registry...</p>
              <p className="text-gray-600">Downloading signed credentials...</p>
              <p className="text-gray-400">Verifying signatures...</p>
              <p className="text-gray-300">Encrypting local cache...</p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded border border-indigo-100 text-left text-sm mt-6">
              <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Zero-Trust Edge
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-gray-700 text-xs">
                <li>Signed credentials</li>
                <li>Dealer cannot modify tokens</li>
                <li>Local verification</li>
                <li>No live network required during authorized offline flow</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'BENEFICIARY_ARRIVES' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-center mb-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                Sync Complete ✓
              </span>
            </div>
            <div className="text-center text-xs text-gray-500 mb-6">
              <p>1,842 Trust Tokens securely cached</p>
              <p>Device: FPS-DEMO-042</p>
              <p>Last sync: Today, 05:00 AM</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-4">Beneficiary Transaction</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <p className="text-sm text-gray-600 mb-1">Beneficiary</p>
                <p className="text-xl font-bold text-gray-900 mb-3">Ammamma</p>
                
                <p className="text-sm text-gray-600 mb-1">Entitlement</p>
                <p className="text-lg font-bold text-blue-700 mb-3">10 kg Rice</p>
                
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-sm font-bold text-emerald-600">Ready for Authentication</p>
              </div>

              <button onClick={() => setStep('BIOMETRIC_FAILURE')} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-lg shadow-md transition flex justify-center items-center gap-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                Scan Fingerprint
              </button>
            </div>
          </div>
        )}

        {step === 'BIOMETRIC_FAILURE' && (
          <div className="space-y-6 animate-fadeIn py-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Biometric Mismatch</h2>
            <p className="text-red-600 font-bold">Network Unavailable</p>
            
            <div className="mt-8">
              <div className="animate-pulse text-indigo-600 font-semibold text-sm">
                Checking offline continuity authorization...
              </div>
            </div>
          </div>
        )}

        {step === 'TOKEN_VERIFICATION' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-emerald-50 px-4 py-3 rounded-lg border-2 border-emerald-500 mb-4 text-center shadow-sm">
              <h2 className="text-emerald-900 font-extrabold text-lg uppercase tracking-wide">
                Offline Continuity Check
              </h2>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <ul className="space-y-3 text-sm font-medium text-gray-700">
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Trust Token found in cache</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Cryptographic signature verified</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Token validity window active</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Entitlement record matched</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Token not revoked</li>
                <li className="flex items-center gap-3 text-emerald-700 font-bold bg-emerald-50 p-2 rounded"><span className="text-emerald-600 text-lg">✓</span> Offline transaction permitted</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Trust Token:</span><span className="font-bold text-emerald-600">VALID</span>
                <span className="text-gray-500">Verification:</span><span className="font-bold text-emerald-600">SUCCESS</span>
                <span className="text-gray-500">Network:</span><span className="font-bold text-amber-600">OFFLINE</span>
                <span className="text-gray-500">Biometric:</span><span className="font-bold text-red-600">FAILED</span>
                <span className="text-gray-500">Entitlement:</span><span className="font-bold text-emerald-600">VERIFIED</span>
              </div>
            </div>

            <button onClick={() => setStep('ZERO_FRICTION_DISPENSE')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-sm transition mt-4 flex justify-center items-center gap-2 text-lg">
              Dispense Entitlement →
            </button>
          </div>
        )}

        {step === 'ZERO_FRICTION_DISPENSE' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-emerald-50 px-4 py-6 border-2 border-emerald-500 rounded-xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-transparent opacity-50"></div>
              
              <div className="h-16 w-16 mx-auto bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg mb-3 z-10 border-4 border-emerald-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              
              <h2 className="text-emerald-900 font-extrabold text-xl uppercase tracking-wide relative z-10">
                Biometric Bypassed
              </h2>
              <p className="text-md font-bold text-emerald-700 mt-1 relative z-10">
                Historical Trust Verified
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
              <p className="text-4xl font-black text-gray-900 mb-2">Dispense 10 kg Rice</p>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                Offline transaction authorized
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm">
              <p className="font-bold text-gray-800 mb-2 border-b pb-2">Inventory Deduction (Offline)</p>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500">Before:</span>
                <span className="font-mono">1840 kg</span>
              </div>
              <div className="flex justify-between items-center text-red-600 font-bold mb-1">
                <span>Deduct:</span>
                <span className="font-mono">-10 kg</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="font-bold text-gray-800">After:</span>
                <span className="font-mono font-bold">1830 kg</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <p className="font-bold mb-1">Dealer action required: NONE</p>
              <p className="text-xs opacity-90">Because the Trust Token was already verified and the entitlement was valid, the ePoS automatically authorized the transaction without a live network connection.</p>
            </div>

            <button onClick={() => setStep('AUDIT_QUEUED')} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-lg shadow transition mt-2">
              Complete Transaction →
            </button>
          </div>
        )}

        {step === 'AUDIT_QUEUED' && (
          <div className="space-y-6 animate-fadeIn py-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">Transaction queued for reconciliation</h2>
            
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative">
              <div className="absolute left-6 top-5 bottom-8 w-0.5 bg-gray-200"></div>
              
              <ul className="space-y-6 relative">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10 shrink-0 text-xs shadow">✓</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Offline transaction recorded</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10 shrink-0 text-xs shadow">✓</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Signed transaction log created</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center z-10 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  </div>
                  <div>
                    <p className="font-bold text-amber-700 text-sm">Waiting for network</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10 shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-400 text-sm">Backend reconciliation</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 z-10 shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-400 text-sm">Inventory synchronization</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 text-xs space-y-2 font-mono">
              <p className="flex justify-between"><span className="text-gray-500">Transaction ID:</span> <strong>DEMO-TXN-0001842</strong></p>
              <p className="flex justify-between"><span className="text-gray-500">Trust Token:</span> <strong>TT-DEMO-1842</strong></p>
              <div className="pt-2 border-t border-gray-200 text-center text-amber-600 font-bold uppercase tracking-wider">
                Synthetic Demo Transaction
              </div>
            </div>

            <button onClick={() => setStep('RECONCILIATION')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
              Simulate Network Recovery →
            </button>
          </div>
        )}

        {step === 'RECONCILIATION' && (
          <div className="space-y-4 text-center py-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-blue-700">NETWORK RESTORED</h2>
            
            <div className="flex justify-center my-6 relative h-16 w-full">
              {/* Fake progress bar animation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-[width_3s_ease-in-out_forwards]" style={{width: '100%'}}></div>
              </div>
            </div>

            <div className="text-sm font-mono text-gray-600 space-y-1 h-24 overflow-hidden relative">
              <div className="animate-[slideUp_3s_linear_forwards] absolute w-full space-y-1">
                <p>Uploading signed transaction...</p>
                <p>Backend verification...</p>
                <p>Duplicate check...</p>
                <p>Inventory reconciliation...</p>
                <p>Trust Token audit...</p>
                <p className="font-bold text-emerald-600 mt-2">SYNC COMPLETE</p>
              </div>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Offline → Online reconciliation successful</h2>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
              <ul className="space-y-3 text-sm font-medium text-gray-700">
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Transaction synchronized</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Inventory updated in backend</li>
                <li className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Audit completed successfully</li>
                <li className="flex items-center gap-3 font-bold text-emerald-800"><span className="text-emerald-600 text-lg">✓</span> Trust Token remains valid</li>
              </ul>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg text-xs text-indigo-800 border border-indigo-100">
              <p className="font-bold mb-2">How Setu changes the flow:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold border-b border-indigo-200 mb-1 pb-1">Traditional</p>
                  <p className="text-gray-500">Biometric failure → Network failure → Error → Dealer intervention → Beneficiary friction.</p>
                </div>
                <div>
                  <p className="font-semibold border-b border-indigo-200 mb-1 pb-1">Setu Engine</p>
                  <p className="text-emerald-700 font-medium">Predictive Trust Token → Offline verification → Zero-friction dispense → Async reconciliation.</p>
                </div>
              </div>
            </div>

            <a 
              href="http://localhost:5174" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleReset}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg shadow-md transition flex items-center justify-center block text-center"
            >
              View Officer Insights →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
