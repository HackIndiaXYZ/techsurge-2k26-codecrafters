// Synthetic demo data fallback for when the backend is unavailable during the Round 2 Demo
const DEMO_DATA = {
  hotspots: {
    buckets: [
      { shopCode: 'FPS-N1', latitude: 19.0964, longitude: 78.3430, count: 42, district: 'Nirmal', state: 'TS' },
      { shopCode: 'FPS-A3', latitude: 19.6766, longitude: 78.5323, count: 38, district: 'Adilabad', state: 'TS' },
      { shopCode: 'FPS-NZ2', latitude: 18.6705, longitude: 78.0941, count: 31, district: 'Nizamabad', state: 'TS' },
      { shopCode: 'FPS-K5', latitude: 18.4386, longitude: 79.1288, count: 25, district: 'Karimnagar', state: 'TS' },
      { shopCode: 'FPS-M1', latitude: 18.0468, longitude: 78.2612, count: 20, district: 'Medak', state: 'TS' }
    ],
    suppressedBuckets: 12
  },
  causes: {
    causes: [
      { cause: 'BIOMETRIC_MISMATCH', count: 1240 },
      { cause: 'CONNECTIVITY_FAILURE', count: 450 },
      { cause: 'BIOMETRIC_QUALITY_POOR', count: 180 },
      { cause: 'DEVICE_FAILURE', count: 80 },
      { cause: 'DEMOGRAPHIC_MISMATCH', count: 35 },
      { cause: 'SEEDING_NOT_DONE', count: 15 }
    ]
  },
  recurringFailures: {
    shops: [
      { shopCode: 'FPS-N1', district: 'Nirmal', state: 'TS', count: 42 },
      { shopCode: 'FPS-A3', district: 'Adilabad', state: 'TS', count: 38 },
      { shopCode: 'FPS-NZ2', district: 'Nizamabad', state: 'TS', count: 31 },
      { shopCode: 'FPS-K5', district: 'Karimnagar', state: 'TS', count: 25 },
      { shopCode: 'FPS-M1', district: 'Medak', state: 'TS', count: 20 }
    ],
    suppressedShops: 12
  }
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = {
  getHotspots: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/api/v1/insights/hotspots?${params}`);
      if (!res.ok) throw new Error('Backend failed');
      return await res.json();
    } catch (e) {
      console.warn("Using synthetic demo data for hotspots");
      return DEMO_DATA.hotspots;
    }
  },

  getCauses: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/api/v1/insights/causes?${params}`);
      if (!res.ok) throw new Error('Backend failed');
      return await res.json();
    } catch (e) {
      console.warn("Using synthetic demo data for causes");
      return DEMO_DATA.causes;
    }
  },

  getRecurringFailures: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/api/v1/insights/recurring-failures?${params}`);
      if (!res.ok) throw new Error('Backend failed');
      return await res.json();
    } catch (e) {
      console.warn("Using synthetic demo data for recurring failures");
      return DEMO_DATA.recurringFailures;
    }
  },

  getInvestigations: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.transactionRef) params.append('transactionRef', filters.transactionRef);
    
    const url = `${API_BASE}/api/v1/investigations${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Investigation case could not be found.');
      throw new Error('Unable to connect to the backend.');
    }
    return res.json();
  },

  updateInvestigation: async (caseId, action) => {
    const res = await fetch(`${API_BASE}/api/v1/investigations/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    if (!res.ok) {
      if (res.status === 404) throw new Error('Investigation case could not be found.');
      if (res.status === 400 || res.status === 409) throw new Error('That workflow transition is not currently available.');
      throw new Error('Unable to update this case. Please try again.');
    }
    return res.json();
  },

  getSummary: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/api/v1/insights/summary?${params}`);
      if (!res.ok) throw new Error('Backend failed');
      return await res.json();
    } catch (e) {
      console.warn("Using synthetic demo data for summary");
      return {
        totalFailures: 2000,
        topCause: 'BIOMETRIC_MISMATCH',
        activeHotspots: 8,
        suppressedBuckets: 12,
        totalExceptions: 6,
        openInvestigations: 3
      };
    }
  }
};
