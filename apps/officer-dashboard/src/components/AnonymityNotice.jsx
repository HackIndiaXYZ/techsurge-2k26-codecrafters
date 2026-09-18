export default function AnonymityNotice({ suppressedCount }) {
  if (suppressedCount == null || suppressedCount === 0) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">
            <strong>{suppressedCount} {suppressedCount === 1 ? 'bucket' : 'buckets'}</strong> with fewer than 5 failures {suppressedCount === 1 ? 'is' : 'are'} suppressed to protect anonymity.
          </p>
        </div>
      </div>
    </div>
  );
}
