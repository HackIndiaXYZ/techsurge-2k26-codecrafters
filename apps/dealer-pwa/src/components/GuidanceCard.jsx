import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore.js';

export default function GuidanceCard() {
  const { currentDiagnosis, resetForm, language, v2FlowActive, setVerificationState } = useSessionStore();
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!currentDiagnosis) return null;

  const isVerified = currentDiagnosis.verificationStatus === 'VERIFIED';
  
  // Use generic English steps if translation isn't available for demo mode
  const steps = currentDiagnosis.steps[language] || currentDiagnosis.steps;

  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Create text to speak (steps)
    const textToSpeak = (Array.isArray(steps) ? steps.join('. ') : steps);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langMap = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
    utterance.lang = langMap[language] || 'en-IN';
    
    window.speechSynthesis.speak(utterance);
  };
  
  const handleStopTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  };

  if (isContinuing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
        <div className="bg-green-50 px-4 py-4 border-b border-green-200 flex items-center justify-center flex-col">
          <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">✓</div>
          <h2 className="text-green-800 font-bold text-lg">Guidance delivered</h2>
          <p className="text-sm text-green-700">Failure recorded anonymously.</p>
        </div>
        
        <div className="p-5 space-y-2 text-sm text-gray-700 bg-gray-50 border-b border-gray-200">
          <p><span className="font-semibold w-16 inline-block text-gray-500">Cause:</span> {currentDiagnosis.detectedCause.replace(/_/g, ' ')}</p>
          <p><span className="font-semibold w-16 inline-block text-gray-500">Rule:</span> {currentDiagnosis.ruleId}</p>
          <p><span className="font-semibold w-16 inline-block text-gray-500">PII:</span> <span className="text-green-600 font-bold">Not collected</span></p>
          <p><span className="font-semibold w-16 inline-block text-gray-500">Status:</span> Recorded</p>
        </div>

        <div className="p-4 space-y-3">
          <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow transition flex items-center justify-center block text-center"
          >
            View Officer Insights →
          </a>
          <button 
            onClick={() => { setIsContinuing(false); resetForm(); }}
            className="w-full text-gray-500 hover:text-gray-700 font-semibold py-2 text-sm"
          >
            Start new transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden mt-4">
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200 text-center">
        <h2 className="text-indigo-800 font-bold text-sm uppercase tracking-wide">Failure detected</h2>
        <p className="text-lg font-extrabold text-indigo-900 mt-1">{currentDiagnosis.detectedCause.replace(/_/g, ' ')}</p>
        <p className="text-xs text-indigo-600 mt-1">Confidence: {currentDiagnosis.confidence > 0.8 ? 'High' : 'Moderate'}</p>
      </div>

      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-900 font-bold text-md border-l-4 border-indigo-500 pl-2">Applicable documented fallback</h3>
          <div className="flex gap-2">
            <button onClick={handlePlayTTS} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-200">▶ Play</button>
            <button onClick={handleStopTTS} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300">■ Stop</button>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-3">{currentDiagnosis.fallback}</p>
        
        <ol className="list-decimal pl-5 space-y-2 text-gray-700 text-sm bg-gray-50 p-3 rounded">
          {Array.isArray(steps) && steps.map((step, idx) => (
            <li key={idx} className="pl-1 leading-snug">{step}</li>
          ))}
        </ol>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="text-xs text-gray-600 space-y-1">
          <p><span className="font-semibold text-gray-500">Citation:</span> {currentDiagnosis.citation}</p>
          <p>
            <span className="font-semibold text-gray-500">Verification status:</span> 
            {isVerified ? (
              <span className="text-green-600 ml-1 font-bold">Verified</span>
            ) : (
              <span className="text-amber-600 ml-1 font-bold">{currentDiagnosis.verificationStatus || 'Pending verification'}</span>
            )}
          </p>
        </div>
        
        <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-800">
          <span className="font-bold block mb-1">Need help?</span>
          {currentDiagnosis.escalationPath || "Escalate to District Supply Officer."}
        </div>
        
        <div className="text-center text-xs font-semibold text-green-700 bg-green-50 p-2 rounded">
          🛡️ Failure recorded without beneficiary PII
        </div>

        {v2FlowActive && currentDiagnosis.fallback === 'OTP' ? (
          <button 
            onClick={() => setVerificationState('OTP_ENTRY')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition mt-4"
          >
            Proceed to OTP Exception
          </button>
        ) : !v2FlowActive && (
          <button 
            onClick={() => setIsContinuing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition mt-4"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
