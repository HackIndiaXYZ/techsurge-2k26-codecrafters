# CHANGELOG

## [0.1.0] — 2026-09-18 — Scaffold Complete
### Added
- Root npm workspace (`package.json`) with `concurrently` for multi-service `dev` command.
- `packages/shared`: `constants.js` (synthetic prefixes, k-anonymity threshold, API paths, resolution/verification statuses) and `causeTaxonomy.js` (8 canonical failure causes + display labels).
- `apps/dealer-pwa`: React 18 + Vite 5 shell with Tailwind CSS, Zustand, i18n stubs (en/hi/te), SyntheticBanner, Header, DiagnosisPlaceholder. Builds in 401ms.
- `apps/officer-dashboard`: React 18 + Vite 5 shell with Tailwind CSS, Recharts. Placeholder map/chart/table sections. Builds in 481ms.
- `services/api`: Express 4 server with Helmet, CORS, centralized error handler, `GET /api/v1/health` → HTTP 200. Starts without MongoDB.
- `.env.example`, `.gitignore`, root `README.md`.
- All placeholder API directories: `config/`, `middleware/`, `routes/`, `controllers/`, `engine/`, `ai/`, `integrations/`, `models/`, `services/`, `utils/`.
### Notes
- `recharts@2.x` deprecation warning — upgrade to v3 requires authorization.
- 2 npm audit vulnerabilities — non-blocking for scaffold, to be addressed before deployment.

## [0.2.0] — 2026-09-18 — Rule Engine + PII Firewall
### Added
- `services/api/src/engine/rules.json`: 8 rules (R-BIO-001..004, R-CON-001, R-DEV-001, R-SEED-001, R-ESC-000). All trilingual (en/hi/te). All marked `RULE_REQUIRES_VERIFICATION` — no circular has been independently confirmed during this session.
- `services/api/src/engine/ruleSchema.js`: Zod schema validating the registry at module load. Server refuses to start if registry is malformed.
- `services/api/src/engine/rulesEngine.js`: Pure deterministic function. Zero LLM imports. 8-level explicit precedence. Returns `confidence: 1.0`. Never returns null. Loads and validates registry on import.
- `services/api/src/middleware/verhoeff.js`: Standalone Verhoeff checksum validator. Pure function. No logging. Explicit disclaimer that a passing check does not prove Aadhaar identity.
- `services/api/src/middleware/piiFirewall.js`: Full ARCHITECTURE.md §6 implementation. Verhoeff-gated Aadhaar detection (hard 422 on valid checksum), phone/email/PAN redaction, forbidden key rejection, nested deep-walk, never logs raw PII.
- `services/api/tests/rulesEngine.test.js`: 14 tests — all 10 required + 4 extras.
- `services/api/tests/piiFirewall.test.js`: 15 tests — all 10 required + 5 extras.
- `services/api/tests/verhoeff.test.js`: 11 tests covering valid/invalid/malformed/spaces/length.
### Test results
- Total: 40 tests, 40 pass, 0 fail
- Dealer PWA build: ✅ 460ms
- Officer Dashboard build: ✅ 361ms
- `GET /api/v1/health` → HTTP 200 ✅
### Notes
- All 8 rules are `RULE_REQUIRES_VERIFICATION`. No government circular has been verified during this session. Citation strings explicitly say so.
- `subjectRef` in FailureEvent is optional; not implemented in Phase 3.


### Changed
- **Thesis paragraph**: Replaced "officially sanctioned fallback" with "applicable documented fallback procedure from the Rule Registry (each rule carries its verification status)".
- **Invariant I3**: Now requires `verificationStatus` in every response. Only `VERIFIED` rules may be described as official.
- **`subjectRef`**: Removed overclaimed "IRREVERSIBLE" label. Field is now explicitly optional; omit entirely if beneficiary-level correlation is not needed for the MVP.
- **Renamed**: `RepeatOffenderTable.jsx` → `RecurringFailureTable.jsx` throughout the architecture document.
- **Renamed endpoint**: `GET /api/v1/insights/repeat-offenders` → `GET /api/v1/insights/recurring-failures`.
- **Demo script stat removed**: Unverified "94,030" statistic replaced with factual, source-neutral problem framing.

## [0.4.0] — 2026-09-18 — Dealer PWA Core Form UI & Offline Queue
### Added
- `apps/dealer-pwa/src/store/useSessionStore.js`: Zustand state management for non-PII UI logic.
- `apps/dealer-pwa/src/hooks/useOfflineQueue.js`: Resilient localStorage offline queuing system.
- `apps/dealer-pwa/src/components/FailurePicker.jsx`: Mobile-first form capturing structured failure states per the `causeTaxonomy`.
- `apps/dealer-pwa/src/components/GuidanceCard.jsx`: Presents deterministic guidance securely, prominently displaying rule verification status.
- UI translated comprehensively across English, Hindi, and Telugu using local i18n JSONs.
- Stringent PII constraints observed: No fields for Aadhaar, Name, Phone. Explicit privacy text included in UI.
- Built-in graceful degradation ensuring app remains usable if API fails or device loses connectivity.
### Test results
- API Backend Tests run automatically post-PWA updates: 56/56 passing.
- Dealer PWA Vite build completes in under 500ms without warnings.

## [0.5.0] — 2026-09-18 — Bounded AI Voice Diagnosis
### Added
- `services/api/src/ai/classifier.js`: Gemini 2.5 Flash strictly configured to output JSON restricted to the `causeTaxonomy`.
- `services/api/src/middleware/piiFirewall.js`: Exported `scrubText` to strip PII from ASR transcripts *before* they hit the LLM.
- `services/api/src/controllers/diagnose.controller.js`: Implemented `handleVoiceDiagnosis` which enforces the `transcript -> scrub -> classify -> deterministic engine` flow.
- `apps/dealer-pwa/src/components/VoiceRecorder.jsx`: Web Speech API implementation for in-browser ASR (Telugu, Hindi, English).
- Added backend tests guaranteeing AI bounding, PII scrubbing, and fallback safety.

## [0.5.1] — 2026-09-18 — Architecture Fix (Gemini REST)
### Changed
- Refactored `classifier.js` to replace the `@google/generative-ai` SDK with native Node.js `fetch` REST integration.
- This restores full compliance with the frozen ARCHITECTURE.md constraint ("Gemini 2.5 Flash REST").
- Uninstalled the `@google/generative-ai` package from the `services/api` workspace.
- No behavior change was intended at the classifier boundary.

### Status
ARCHITECTURE.md is now considered **FROZEN v1.0**. No architecture changes may be made without explicit authorization.

## [0.3.0] — 2026-09-18 — Form Diagnosis API & Mongoose Models
### Added
- `services/api/src/config/env.js` and `db.js`: Zod-validated environment config and graceful MongoDB connection handling.
- `services/api/src/models/FailureEvent.js` and `AuditLog.js`: Strict, no-PII schemas conforming exactly to the architecture. AuditLog is capped for append-only tracking.
- `services/api/src/services/diagnosisService.js`: Orchestrates the deterministic flow, ensuring rulesEngine acts as the sole authority and logs results.
- `services/api/src/controllers/diagnose.controller.js`: Zod-based input validation for `POST /api/v1/diagnose/form`.
- `services/api/src/routes/diagnose.routes.js`: Wire-up of the form endpoint.
- `services/api/scripts/seedSyntheticEvents.js`: Generates ~2000 entirely synthetic events (no real PII) across 3 geographic clusters (Kurnool, Anantapur, Kadapa) with jittered coordinates to support future dashboard visualizations.
- `services/api/tests/diagnose.controller.test.js`: 13 tests covering valid/invalid form inputs, routing logic, verification status, and graceful DB failure handling.
- `services/api/tests/models.test.js`: 3 tests guaranteeing strict schemas and zero PII fields.
### Test results
- Total: 56 tests, 56 pass, 0 fail.
- API starts flawlessly without `MONGODB_URI`, demonstrating resilience.
- PII Firewall correctly intercepts PII sent to the new `/diagnose/form` endpoint.
## [Unreleased] - 2026-09-18
### Changed
- **ARCHITECTURE RECONCILIATION**: The previous architecture based on Next.js, TypeScript, and LocalStorage has been explicitly superseded by the final "Setu (सेतु)" architecture for the 24-hour hackathon. The new frozen stack uses React, Vite, Node.js, Express, and MongoDB Atlas. All historical documentation referring to Next.js and TypeScript is marked as superseded.

### Added
- (SUPERSEDED) Initialized repository structure.
- (SUPERSEDED) Created project documentation based on Next.js/TypeScript architecture.
