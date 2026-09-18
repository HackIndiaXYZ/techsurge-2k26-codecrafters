/**
 * @fileoverview Prototype safety banner.
 * Must always be visible on every screen.
 */
export default function SyntheticBanner() {
  return (
    <div className="bg-amber-100 text-amber-900 px-4 py-2 text-xs font-bold text-center border-b border-amber-200">
      <span className="uppercase tracking-wider">Demo • Synthetic Data Only</span>
    </div>
  );
}
