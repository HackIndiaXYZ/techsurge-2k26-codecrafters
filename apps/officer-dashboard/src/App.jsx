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
import { apiClient } from './lib/apiClient';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    hotspots: null,
    causes: null,
    recurringFailures: null
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Execute fetches concurrently
        const [hotspotsData, causesData, failuresData] = await Promise.all([
          apiClient.getHotspots(),
          apiClient.getCauses(),
          apiClient.getRecurringFailures()
        ]);
        
        setDashboardData({
          hotspots: hotspotsData,
          causes: causesData,
          recurringFailures: failuresData
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
  const totalSuppressed = dashboardData.hotspots?.suppressedBuckets || 
                          dashboardData.recurringFailures?.suppressedShops || 0;

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
                <p className="text-2xl font-bold text-indigo-700 mt-1">2,000</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic demo data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Top Failure Cause</p>
                <p className="text-lg font-bold text-indigo-700 mt-1 leading-tight py-1">Biometric mismatch</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic demo data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Hotspots</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">8</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic demo data</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Suppressed Buckets</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">12</p>
                <p className="text-[10px] text-gray-400 mt-1">Synthetic demo data</p>
              </div>
            </div>

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
