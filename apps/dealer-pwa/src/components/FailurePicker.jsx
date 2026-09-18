import { useSessionStore } from '../store/useSessionStore.js';
import { submitDiagnosis } from '../lib/apiClient.js';
import { useOfflineQueue } from '../hooks/useOfflineQueue.js';

const CAUSES = [
  { id: 'BIOMETRIC_MISMATCH', label: 'Biometric failed' },
  { id: 'BIOMETRIC_QUALITY_POOR', label: 'Biometric quality poor' },
  { id: 'CONNECTIVITY_FAILURE', label: 'Connectivity problem' },
  { id: 'DEVICE_FAILURE', label: 'Device problem' },
  { id: 'DEMOGRAPHIC_MISMATCH', label: 'Demographic mismatch' },
  { id: 'SEEDING_NOT_DONE', label: 'Seeding not completed' },
  { id: 'BENEFICIARY_ABSENT', label: 'Beneficiary absent' },
  { id: 'UNKNOWN', label: 'Other / Unknown' },
];

export default function FailurePicker({ translations }) {
  const { 
    selectedCause, setSelectedCause, 
    formData, setFormData, 
    setCurrentDiagnosis, setIsLoading, 
    setErrorMsg, isOffline 
  } = useSessionStore();
  
  const { enqueue } = useOfflineQueue();

  const handleCauseSelect = (e) => {
    setSelectedCause(e.target.value);
  };

  const handleFieldChange = (key, value) => {
    setFormData({ [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCause) return;
    
    // Construct payload with sensible defaults for missing fields
    const payload = {
      cause: selectedCause,
      attempts: parseInt(formData.attempts || 0, 10),
      age: parseInt(formData.age || 0, 10),
      hasRegisteredMobile: formData.hasRegisteredMobile === 'true',
      isSeeded: formData.isSeeded !== 'false',
      connectivity: formData.connectivity !== 'false',
      deviceOk: formData.deviceOk !== 'false',
      shopCode: 'PWA-DEALER',
    };

    if (isOffline) {
      enqueue(payload);
      setErrorMsg("Connection unavailable. Saved on this device.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await submitDiagnosis(payload);
      setCurrentDiagnosis(result);
    } catch (err) {
      if (err.message === 'PII_REJECTED') {
        setErrorMsg("Personal information is not allowed in Setu.");
      } else if (err.message === 'VALIDATION_ERROR') {
        setErrorMsg("Please check the selected information.");
      } else {
        setErrorMsg("Setu could not process this request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold mb-4">{translations['diagnosis.heading'] || 'Why did the beneficiary transaction fail?'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Failure Cause</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            value={selectedCause}
            onChange={handleCauseSelect}
            required
          >
            <option value="" disabled>Select cause...</option>
            {CAUSES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields */}
        {selectedCause === 'BIOMETRIC_MISMATCH' && (
          <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Number of attempts</label>
              <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('attempts', e.target.value)} required>
                <option value="">Select...</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Age group</label>
              <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('age', e.target.value)} required>
                <option value="">Select...</option>
                <option value="30">Below 65</option>
                <option value="70">65+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Registered mobile?</label>
              <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('hasRegisteredMobile', e.target.value)} required>
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        )}

        {selectedCause === 'BIOMETRIC_QUALITY_POOR' && (
          <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Number of attempts</label>
              <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('attempts', e.target.value)} required>
                <option value="">Select...</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
        )}

        {selectedCause === 'CONNECTIVITY_FAILURE' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="block text-sm text-gray-700 mb-1">Connectivity state</label>
            <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('connectivity', e.target.value)} required>
              <option value="">Select...</option>
              <option value="false">Offline / No Signal</option>
              <option value="true">Poor / Intermittent</option>
            </select>
          </div>
        )}

        {selectedCause === 'DEVICE_FAILURE' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="block text-sm text-gray-700 mb-1">Device working?</label>
            <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('deviceOk', e.target.value)} required>
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        )}

        {selectedCause === 'SEEDING_NOT_DONE' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="block text-sm text-gray-700 mb-1">Seeding completed?</label>
            <select className="w-full p-2 rounded border border-gray-300" onChange={(e) => handleFieldChange('isSeeded', e.target.value)} required>
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        )}

        <button 
          type="submit" 
          disabled={!selectedCause}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700"
        >
          {translations['diagnosis.cta'] || 'Get Guidance'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Do not enter Aadhaar, phone number, name, or other personal information.
        </p>
      </form>
    </div>
  );
}
