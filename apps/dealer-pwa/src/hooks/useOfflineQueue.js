import { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore.js';
import { submitDiagnosis } from '../lib/apiClient.js';

const QUEUE_KEY = 'setu_offline_queue';

export function useOfflineQueue() {
  const setQueuedCount = useSessionStore((state) => state.setQueuedCount);
  const setIsOffline = useSessionStore((state) => state.setIsOffline);
  const isOffline = useSessionStore((state) => state.isOffline);

  // Initialize queue count
  useEffect(() => {
    updateCount();
    
    const handleOnline = () => {
      setIsOffline(false);
      processQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getQueue = () => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const updateCount = () => {
    setQueuedCount(getQueue().length);
  };

  const enqueue = (request) => {
    const q = getQueue();
    q.push({ id: Date.now(), createdAt: new Date().toISOString(), request });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    updateCount();
  };

  const processQueue = async () => {
    if (!navigator.onLine) return;
    const q = getQueue();
    if (q.length === 0) return;

    const remaining = [];
    for (const item of q) {
      try {
        await submitDiagnosis(item.request);
        // On success, we don't add it back to remaining
      } catch (err) {
        // If it's a PII or Validation error, we drop it since retrying won't help
        if (err.message === 'SERVER_ERROR') {
          remaining.push(item);
        }
      }
    }
    
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    updateCount();
  };

  return { enqueue, processQueue, getQueue, isOffline };
}
