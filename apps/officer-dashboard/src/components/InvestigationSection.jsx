import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import InvestigationCaseCard from './InvestigationCaseCard';

export default function InvestigationSection() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetchCases = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const filters = currentFilter !== 'ALL' ? { status: currentFilter } : {};
      const data = await apiClient.getInvestigations(filters);
      // backend returns { cases: [...] }
      setCases(data.cases || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(filter);
  }, [filter, fetchCases]);

  const handleUpdateCase = (updatedCase) => {
    setCases((prevCases) => 
      prevCases.map((c) => (c.caseId === updatedCase.caseId ? updatedCase : c))
    );
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
      <span className="absolute top-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase tracking-wider">v2.0 Architecture</span>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Investigation Cases
          </h2>
          <p className="text-xs text-gray-500 mt-1">Authorized review and referral workflow for flagged verification anomalies.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Cases</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button 
            onClick={() => fetchCases(filter)}
            disabled={loading}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-1.5 px-3 rounded shadow-sm transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}

      {loading && cases.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading investigation cases...
        </div>
      ) : cases.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cases.map((caseData) => (
            <InvestigationCaseCard 
              key={caseData.caseId} 
              caseData={caseData} 
              onUpdate={handleUpdateCase} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500 font-medium">No investigation cases currently available.</p>
        </div>
      )}
    </section>
  );
}
