/**
 * @fileoverview Setu Officer Dashboard — Application root.
 *
 * PROTOTYPE — Synthetic Data Only.
 * No live UIDAI/ePoS integration.
 */

import { useEffect, useState } from 'react';
import HotspotMap from './components/HotspotMap';
import CauseBreakdown from './components/CauseBreakdown';
import RecurringFailureTable from './components/RecurringFailureTable';
import AnonymityNotice from './components/AnonymityNotice';
import InvestigationSection from './components/InvestigationSection';
import { apiClient } from './lib/apiClient';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    hotspots: null,
    causes: null,
    recurringFailures: null,
    summary: null
  });
  
  // Predictive Entitlement Demo State
  const [tokenStatus, setTokenStatus] = useState('ACTIVE');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Execute fetches concurrently
        const [hotspotsData, causesData, failuresData, summaryData] = await Promise.all([
          apiClient.getHotspots(),
          apiClient.getCauses(),
          apiClient.getRecurringFailures(),
          apiClient.getSummary()
        ]);
        
        setDashboardData({
          hotspots: hotspotsData,
          causes: causesData,
          recurringFailures: failuresData,
          summary: summaryData
        });
      } catch (err) {
        console.error("Dashboard failed to load:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Calculate total suppressed buckets across endpoints (simplification for notice)
  const totalSuppressed = dashboardData.summary?.suppressedBuckets || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Prototype safety banner */}
      <div className="w-full bg-amber-50 border-b border-amber-300 text-amber-800 text-xs text-center py-1.5 px-4 font-medium">
        ⚠️ PROTOTYPE — Synthetic Data Only · No live UIDAI/ePoS integration · All geographic data is aggregated
      </div>

      {/* Header */}
      <header className="bg-indigo-800 text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Setu · सेतु — Officer Dashboard</h1>
            <p className="text-indigo-300 text-xs">The Last Inch — District Supply Officer View</p>
          </div>
          <span className="text-xs bg-amber-400 text-amber-900 font-semibold rounded px-3 py-1">
            SYNTHETIC DATA
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        
        <AnonymityNotice suppressedCount={totalSuppressed} />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* Top Cards for Demo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Failures</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{dashboardData.summary?.totalFailures ?? 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Top Failure Cause</p>
                <p className="text-lg font-bold text-indigo-700 mt-1 leading-tight py-1">{dashboardData.summary?.topCause?.replace(/_/g, ' ') || 'None'}</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Hotspots</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{dashboardData.summary?.activeHotspots ?? 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Suppressed Buckets</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{dashboardData.summary?.suppressedBuckets ?? 0}</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic data</p>
              </div>
            </div>

            {/* Predictive Entitlement Engine Section */}
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative mb-6">
              <span className="absolute top-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Synthetic Demo Data</span>
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-emerald-500">⚡</span> Predictive Entitlement Engine
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Monitoring of offline continuity Trust Tokens and automated asynchronous reconciliation.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Trust Tokens Active</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">1,842</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Offline Transactions</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">127</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                  <p className="text-xs text-emerald-800 uppercase font-semibold">Successfully Reconciled</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">124</p>
                </div>
                <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="text-xs text-amber-800 uppercase font-semibold">Pending Reconciliation</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">3</p>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-xs text-red-800 uppercase font-semibold">Flagged</p>
                  <p className="text-xl font-bold text-red-700 mt-1">1</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Trust Token Activity (Current Cycle)</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">Active (1,842)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">Used Offline (127)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '7%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">Reconciled (124)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '6.8%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">Flagged (1)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '0.1%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className={`p-4 rounded-lg border ${tokenStatus === 'ACTIVE' ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Trust Token Monitoring</h3>
                    <div className="space-y-1 text-xs mb-4">
                      <p className="flex justify-between"><span className="text-gray-600">Token:</span> <span className="font-mono font-bold text-gray-800">TT-DEMO-1842</span></p>
                      <p className="flex justify-between"><span className="text-gray-600">Status:</span> <span className={`font-bold ${tokenStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>{tokenStatus}</span></p>
                      {tokenStatus === 'ACTIVE' ? (
                        <>
                          <p className="flex justify-between"><span className="text-gray-600">Last transaction:</span> <span>Today</span></p>
                          <p className="flex justify-between"><span className="text-gray-600">Anomaly score:</span> <span className="text-emerald-600 font-bold">LOW</span></p>
                        </>
                      ) : (
                        <>
                          <p className="flex justify-between"><span className="text-gray-600">Anomaly score:</span> <span className="text-red-600 font-bold">CRITICAL</span></p>
                          <p className="flex justify-between mt-2 pt-2 border-t border-red-200"><span className="text-gray-800 font-bold">Next cycle:</span> <span className="text-red-700 font-bold">Live authentication required</span></p>
                        </>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setTokenStatus(tokenStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE')}
                      className={`w-full text-xs font-bold py-2 rounded transition border ${tokenStatus === 'ACTIVE' ? 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-100' : 'bg-white text-red-700 border-red-300 hover:bg-red-100'}`}
                    >
                      {tokenStatus === 'ACTIVE' ? 'Simulate Anomaly' : 'Reset Token'}
                    </button>
                    <p className="text-[9px] text-gray-400 text-center mt-2">Demo simulation only</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Hotspot Map Section */}
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
              <span className="absolute top-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Synthetic Demo Data</span>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Failure Hotspot Map</h2>
              <p className="text-xs text-gray-500 mb-4">
                Geographic distribution of authentication failures. Buckets with fewer than 5 events are suppressed (k-anonymity). Locations and counts shown are synthetic demo data.
              </p>
              <HotspotMap data={dashboardData.hotspots?.buckets} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cause Analytics Section */}
              <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
                <span className="absolute top-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Synthetic Demo Data</span>
                <h2 className="text-base font-semibold text-gray-800 mb-1">Failure Cause Breakdown</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Distribution of failure causes across all synthetic events.
                </p>
                <CauseBreakdown data={dashboardData.causes?.causes} />
              </section>

              {/* Recurring Failures Section */}
              <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
                <span className="absolute top-4 right-4 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Synthetic Demo Data</span>
                <h2 className="text-base font-semibold text-gray-800 mb-1">Recurring Failures</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Fair Price Shops with a high concentration of repeated authentication failures. Groups with fewer than 5 failures are suppressed to protect anonymity.
                </p>
                <RecurringFailureTable data={dashboardData.recurringFailures?.shops} />
              </section>
            </div>

            {/* Investigation Section */}
            <InvestigationSection />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4">
        Setu (सेतु) · Officer Dashboard · Prototype · Synthetic Data Only
      </footer>
    </div>
  );
}
