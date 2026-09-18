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

export const apiClient = {
  getHotspots: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/v1/insights/hotspots?${params}`);
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
      const res = await fetch(`/api/v1/insights/causes?${params}`);
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
      const res = await fetch(`/api/v1/insights/recurring-failures?${params}`);
      if (!res.ok) throw new Error('Backend failed');
      return await res.json();
    } catch (e) {
      console.warn("Using synthetic demo data for recurring failures");
      return DEMO_DATA.recurringFailures;
    }
  }
};
