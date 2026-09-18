import { useOfflineQueue } from '../hooks/useOfflineQueue.js';
import { useSessionStore } from '../store/useSessionStore.js';

export default function OfflineBanner() {
  const { isOffline } = useOfflineQueue();
  const queuedCount = useSessionStore(state => state.queuedCount);

  if (!isOffline && queuedCount === 0) return null;

  return (
    <div className={`p-2 text-center text-sm font-medium text-white ${isOffline ? 'bg-amber-600' : 'bg-blue-600'}`}>
      {isOffline ? (
        <span>You are offline. {queuedCount > 0 ? `${queuedCount} request(s) queued.` : ''}</span>
      ) : (
        <span>Syncing {queuedCount} queued request(s)...</span>
      )}
    </div>
  );
}
