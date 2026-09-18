# SAFETY BOUNDARIES

**THESE BOUNDARIES ARE NON-NEGOTIABLE.**

## Data & Privacy
- **No PII**: No raw PII may be stored, logged, transmitted, or persisted (including Aadhaar, ration card number, phone, name, address, biometric data, photograph, raw audio, or raw transcripts).
- **Synthetic Data Only**: All transaction and demo data must be synthetic.
- **Geographic Aggregation**: Dashboard geographic data must be aggregated or jittered. 
- **k-anonymity**: Suppress geographic buckets where count < 5.

## Integration & Authority
- **No Live Integrations**: No live UIDAI or ePoS integration. Do not claim any live integration.
- **Deterministic Fallback Authority**: The backend deterministic rule engine is the absolute authority for fallbacks.
- **No Automated Entitlements**: No automated entitlement approval or denial.

## LLM Limitations
- **LLM Boundaries**: The LLM (Gemini) NEVER decides fallback, entitlement, eligibility, approval, denial, or government policy.
- **No Rules Fabrication**: Never fabricate a government citation. Unverified government rules must not be presented as verified; they must be marked as `RULE_REQUIRES_VERIFICATION`.

## Human Oversight
- **Human-in-Loop**: The human dealer/officer always remains in control and responsible for the final process.
