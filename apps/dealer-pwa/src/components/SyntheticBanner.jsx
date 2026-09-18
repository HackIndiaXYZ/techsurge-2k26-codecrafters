/**
 * @fileoverview Prototype safety banner.
 * Must always be visible on every screen.
 */
export default function SyntheticBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-300 text-amber-800 text-xs text-center py-1.5 px-4 font-medium">
      ⚠️ PROTOTYPE — Synthetic Data Only · No live UIDAI/ePoS integration · Human dealer remains responsible
    </div>
  );
}
