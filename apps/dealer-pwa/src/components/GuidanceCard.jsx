import { useSessionStore } from '../store/useSessionStore.js';

export default function GuidanceCard() {
  const { currentDiagnosis, resetForm, language } = useSessionStore();

  if (!currentDiagnosis) return null;

  const isVerified = currentDiagnosis.verificationStatus === 'VERIFIED';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden mt-4">
      <div className="bg-green-50 px-4 py-3 border-b border-green-200">
        <h2 className="text-green-800 font-bold text-lg">Applicable procedure</h2>
        <p className="text-sm text-green-700">{currentDiagnosis.fallback}</p>
      </div>
      
      <div className="p-4 space-y-4">
        <ol className="list-decimal pl-5 space-y-2 text-gray-800">
          {currentDiagnosis.steps[language]?.map((step, idx) => (
            <li key={idx} className="pl-1 leading-snug">{step}</li>
          ))}
        </ol>

        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600 mt-4">
          <p><span className="font-semibold">Rule:</span> {currentDiagnosis.ruleId}</p>
          <p>
            <span className="font-semibold">Status:</span> 
            {isVerified ? (
              <span className="text-green-600 ml-1 font-bold">Verified official rule</span>
            ) : (
              <span className="text-amber-600 ml-1 font-bold">Demo rule — verification pending</span>
            )}
          </p>
          {currentDiagnosis.escalationPath && (
            <p className="mt-1"><span className="font-semibold">Escalation:</span> {currentDiagnosis.escalationPath}</p>
          )}
        </div>

        <button 
          onClick={resetForm}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg border border-gray-300 mt-4"
        >
          New Diagnosis
        </button>
      </div>
    </div>
  );
}
