/**
 * @fileoverview Application header with branding, language selector, and offline indicator.
 */

import { useSessionStore } from '../store/useSessionStore.js';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
];

export default function Header({ translations }) {
  const { language, setLanguage, isOffline } = useSessionStore();

  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight">{translations?.['app.title'] || 'Setu · सेतु'}</h1>
          <p className="text-blue-200 text-xs">{translations?.['app.subtitle'] || 'The Last Inch — Dealer Assistant'}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs text-white rounded-full px-2 py-0.5 font-medium ${isOffline ? 'bg-amber-500' : 'bg-green-500'}`}>
            {isOffline ? translations?.['header.offline'] || 'Offline' : translations?.['header.online'] || 'Online'}
          </span>

          <select
            className="text-xs bg-blue-600 text-white border border-blue-400 rounded px-2 py-1 cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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
