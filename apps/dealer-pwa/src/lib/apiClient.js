const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchJson(endpoint, payload) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMsg = data.error?.message || data.message;
      if (!errorMsg && data.code === 'VALIDATION_ERROR' && data.errors) {
        const firstField = Object.keys(data.errors).find(k => k !== '_errors');
        if (firstField && data.errors[firstField]?._errors?.length) {
          errorMsg = `${firstField}: ${data.errors[firstField]._errors[0]}`;
        }
      }
      errorMsg = errorMsg || `API Error: ${response.status}`;

      const error = new Error(errorMsg);
      error.status = response.status;
      error.code = data.code || data.error?.code || 'UNKNOWN_ERROR';
      throw error;
    }
    return data;
  } catch (err) {
    // Do not expose backend stack traces, only standard message/code
    const secureError = new Error(err.message || 'Network or unexpected error');
    secureError.code = err.code || 'NETWORK_ERROR';
    throw secureError;
  }
}

export const apiClient = {
  submitBiometric: async (transactionRef, fingerprint, face, iris) => {
    // Enforce structured synthetic descriptor. No PII allowed.
    const payload = {
      transactionRef,
      fingerprint: {
        outcome: fingerprint.outcome,
        failureReason: fingerprint.failureReason || null
      },
      face: {
        outcome: face.outcome,
        failureReason: face.failureReason || null
      },
      iris: {
        outcome: iris.outcome,
        failureReason: iris.failureReason || null
      }
    };
    return fetchJson('/api/v1/auth/biometric', payload);
  },

  submitOtp: async (transactionRef, otp, ruleId) => {
    // Strict contract for OTP exception
    const payload = {
      transactionRef,
      otp: String(otp),
      ruleId
    };
    return fetchJson('/api/v1/auth/exception/otp', payload);
  },

  submitReverification: async (transactionRef, fingerprint, face, iris) => {
    // Enforce structured synthetic descriptor. No PII allowed.
    const payload = {
      transactionRef,
      fingerprint: {
        outcome: fingerprint.outcome,
        failureReason: fingerprint.failureReason || null
      },
      face: {
        outcome: face.outcome,
        failureReason: face.failureReason || null
      },
      iris: {
        outcome: iris.outcome,
        failureReason: iris.failureReason || null
      }
    };
    return fetchJson('/api/v1/auth/reverify', payload);
  }
};

export async function submitDiagnosis(payload) {
  const res = await fetch(`${API_BASE}/api/v1/diagnose/form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    if (res.status === 422) {
      throw new Error('PII_REJECTED');
    }
    if (res.status === 400) {
      throw new Error('VALIDATION_ERROR');
    }
    throw new Error('SERVER_ERROR');
  }

  return res.json();
}

export async function submitVoiceDiagnosis(transcript, language) {
  const res = await fetch(`${API_BASE}/api/v1/diagnose/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, language })
  });

  if (!res.ok) {
    if (res.status === 422) {
      throw new Error('PII_REJECTED');
    }
    if (res.status === 400) {
      throw new Error('VALIDATION_ERROR');
    }
    throw new Error('SERVER_ERROR');
  }

  return res.json();
}
