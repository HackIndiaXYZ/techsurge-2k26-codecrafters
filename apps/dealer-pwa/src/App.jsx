/**
 * @fileoverview Setu Dealer PWA — Application root.
 *
 * PROTOTYPE — Synthetic Data Only.
 * No live UIDAI/ePoS integration.
 */

import Header from './components/Header.jsx';
import SyntheticBanner from './components/SyntheticBanner.jsx';
import DiagnosisPlaceholder from './components/DiagnosisPlaceholder.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Prototype safety banner — always visible */}
      <SyntheticBanner />

      {/* App header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Diagnosis area — business logic implemented in a later phase */}
        <DiagnosisPlaceholder />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 px-4">
        Setu (सेतु) · Prototype · Synthetic Data Only · No live UIDAI/ePoS integration
      </footer>
    </div>
  );
}
