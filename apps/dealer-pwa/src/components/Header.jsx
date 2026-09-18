/**
 * @fileoverview Application header with branding, language selector, and offline indicator.
 */

/** Language options for the placeholder selector */
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
];

export default function Header() {
  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <div>
          <h1 className="text-xl font-bold leading-tight">Setu · सेतु</h1>
          <p className="text-blue-200 text-xs">The Last Inch — Dealer Assistant</p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Offline indicator placeholder */}
          <span className="text-xs bg-green-500 text-white rounded-full px-2 py-0.5 font-medium">
            Online
          </span>

          {/* Language selector placeholder */}
          <select
            className="text-xs bg-blue-600 text-white border border-blue-400 rounded px-2 py-1 cursor-pointer"
            defaultValue="en"
            aria-label="Select language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
