/**
 * @fileoverview Setu Officer Dashboard — Application root.
 *
 * PROTOTYPE — Synthetic Data Only.
 * No live UIDAI/ePoS integration.
 */

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
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

        {/* Hotspot Map Section */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Failure Hotspot Map</h2>
          <p className="text-xs text-gray-500 mb-4">
            Geographic distribution of authentication failures. Buckets with fewer than 5 events are suppressed (k-anonymity).
          </p>
          <div className="rounded bg-gray-100 flex items-center justify-center h-64 text-gray-400 text-sm">
            🗺️ Leaflet + OpenStreetMap map will be rendered here (Phase 8)
          </div>
        </section>

        {/* Cause Analytics Section */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Failure Cause Breakdown</h2>
          <p className="text-xs text-gray-500 mb-4">
            Distribution of failure causes across all synthetic events.
          </p>
          <div className="rounded bg-gray-100 flex items-center justify-center h-48 text-gray-400 text-sm">
            📊 Recharts bar/pie chart will be rendered here (Phase 8)
          </div>
        </section>

        {/* Recurring Failures Section */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Recurring Failure Locations</h2>
          <p className="text-xs text-gray-500 mb-4">
            Fair Price Shops with a high concentration of repeated authentication failures.
          </p>
          <div className="rounded bg-gray-100 flex items-center justify-center h-36 text-gray-400 text-sm">
            📋 Recurring failure table will be rendered here (Phase 8)
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4">
        Setu (सेतु) · Officer Dashboard · Prototype · Synthetic Data Only
      </footer>
    </div>
  );
}
