/**
 * @fileoverview Placeholder for the diagnosis area.
 * The actual diagnostic form and rule-engine integration is implemented in a later phase.
 */
export default function DiagnosisPlaceholder() {
  return (
    <div className="space-y-4">
      {/* Context */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h2 className="text-base font-semibold text-blue-900 mb-1">Authentication Failure</h2>
        <p className="text-sm text-blue-700">
          Use this tool to diagnose why a beneficiary's Aadhaar authentication failed and to find
          the applicable documented fallback procedure.
        </p>
      </div>

      {/* Placeholder card */}
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-6 text-center text-gray-400 space-y-2">
        <div className="text-4xl">🔧</div>
        <p className="font-medium text-gray-500">Diagnosis form coming soon</p>
        <p className="text-xs">
          The deterministic diagnostic engine and form will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
}
