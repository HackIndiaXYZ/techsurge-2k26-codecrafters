/**
 * @fileoverview Setu Dealer PWA — Application root.
 *
 * PROTOTYPE — Synthetic Data Only.
 * No live UIDAI/ePoS integration.
 */

import { useState } from 'react';
import Header from './components/Header.jsx';
import SyntheticBanner from './components/SyntheticBanner.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import FailurePicker from './components/FailurePicker.jsx';
import VoiceRecorder from './components/VoiceRecorder.jsx';
import GuidanceCard from './components/GuidanceCard.jsx';
import { useSessionStore } from './store/useSessionStore.js';
import en from './i18n/en.json';
import hi from './i18n/hi.json';
import te from './i18n/te.json';

const translations = { en, hi, te };

export default function App() {
  const { currentDiagnosis, isLoading, errorMsg, language, resetForm } = useSessionStore();
  const [inputMode, setInputMode] = useState('voice'); // Default to voice as per demo path request if possible
  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans relative">
      <div className="absolute top-0 right-0 m-2 z-50">
        <span className="bg-fuchsia-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow animate-pulse uppercase tracking-wider">
          Demo Mode
        </span>
      </div>
      <SyntheticBanner />
      <OfflineBanner />
      <Header translations={t} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mb-4 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-10 w-10 bg-blue-200 rounded-full mb-4"></div>
              <div className="text-gray-600 font-medium">Checking applicable procedure...</div>
            </div>
          </div>
        ) : currentDiagnosis ? (
          <GuidanceCard />
        ) : inputMode === 'voice' ? (
          <VoiceRecorder onFallback={() => { setInputMode('form'); resetForm(); }} />
        ) : (
          <div>
            <FailurePicker translations={t} />
            <button 
              onClick={() => { setInputMode('voice'); resetForm(); }}
              className="mt-4 w-full text-center text-sm font-semibold text-blue-600 underline"
            >
              Use Voice Diagnosis instead
            </button>
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // Direct bypass to the exact deterministic outcome required for the demo
                  useSessionStore.setState({
                    currentDiagnosis: {
                      detectedCause: 'BIOMETRIC_MISMATCH',
                      confidence: 0.95,
                      ruleId: 'R-BIO-001',
                      verificationStatus: 'Pending verification',
                      citation: 'DFPD Circular No. 15-2/2017-ND-I, Para 4(b)',
                      fallback: 'Face authentication (AadhaarFaceRD)',
                      steps: [
                        'Ask the beneficiary to retry once.',
                        'If fingerprint authentication continues to fail, use face authentication if available.',
                        'Complete the transaction through the available fallback procedure.',
                        'Escalate if the fallback is unavailable.'
                      ],
                      escalationPath: 'Escalate to District Supply Officer + 1967 helpline.'
                    }
                  });
                }}
                className="w-full bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 border border-fuchsia-300"
              >
                ▶️ RUN DEMO SCENARIO
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 px-4">
        Setu (सेतु) · Prototype · Synthetic Data Only · No live UIDAI/ePoS integration
      </footer>
    </div>
  );
}
