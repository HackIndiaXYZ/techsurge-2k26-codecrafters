export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

