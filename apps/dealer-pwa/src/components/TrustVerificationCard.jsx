import { useSessionStore } from '../store/useSessionStore.js';

export default function TrustVerificationCard() {
  const { resetForm } = useSessionStore();

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-emerald-500 overflow-hidden mt-4 transform transition-all">
      <div className="bg-emerald-50 px-4 py-6 border-b border-emerald-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle background pattern/glow for "magic" feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-transparent opacity-50"></div>
        
        <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg mb-3 z-10 border-4 border-emerald-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-emerald-900 font-extrabold text-xl uppercase tracking-wide z-10 shadow-sm">
          Biometric Bypassed
        </h2>
        <p className="text-md font-bold text-emerald-700 mt-1 z-10">
          Historical Trust Verified
        </p>
        
        <div className="mt-3 bg-white px-3 py-1 rounded-full border border-emerald-200 text-xs font-mono text-emerald-600 font-bold z-10 flex items-center gap-1 shadow-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          TRUST TOKEN VALID
        </div>
      </div>
      
      <div className="p-6 space-y-5 bg-white">
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider mb-1">Action Required</p>
          <p className="text-2xl font-black text-gray-900">Dispense 10kg Rice</p>
        </div>

        <div className="text-sm text-gray-600 bg-emerald-50/50 p-4 rounded border border-emerald-100">
          <p className="font-semibold text-emerald-800 flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Zero-Friction Counter
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Inventory has been automatically deducted from local ledger.</li>
            <li>No further network confirmation required.</li>
            <li>Transaction will sync asynchronously.</li>
          </ul>
        </div>

        <button 
          onClick={resetForm}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition mt-2 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Sync Logs (Simulated) & Reset
        </button>
      </div>
    </div>
  );
}
