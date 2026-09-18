# DECISION LOG

*(Note: Previous ADRs involving Next.js and TypeScript have been superseded by the final Setu architecture freeze).*

## ADR-001: React + Vite
React + Vite instead of Next.js for 24-hour hackathon simplicity.

## ADR-002: JavaScript
JavaScript instead of TypeScript to reduce setup/build complexity.

## ADR-003: Express Backend
Express backend provides a clear security and deterministic-rule boundary.

## ADR-004: MongoDB Atlas M0
MongoDB Atlas M0 is used for synthetic event persistence and aggregation.

## ADR-005: Form Diagnosis Priority
Form diagnosis is the guaranteed demo-safe path.

## ADR-006: LLM Boundaries
LLM cannot determine fallback policy.

## ADR-007: Unverified Rules
Unverified rules must never be presented as official verified rules.

## ADR-008: Terminology
Recurring failure terminology replaces offender terminology.

## ADR-009: No Subject Identifiers
No beneficiary subject identifier unless the MVP proves it is necessary.

## ADR-010: Dashboard Data
All dashboard data is synthetic and privacy-preserving.

## ADR-011: concurrently for dev orchestration
Using `concurrently` (minimal, widely-used) to run API + dealer PWA + officer dashboard with a single `npm run dev`. No complex orchestration tooling (Turborepo, nx, etc.) introduced.

## ADR-012: Recharts v2 deprecation — Pending authorization
`recharts@2.x` is deprecated. Upgrading to v3 requires authorization because v3 is a breaking change. Currently scaffolded with v2. Authorization required before implementing analytics charts.

## ADR-013: Node built-in test runner
Using `node:test` (available since Node 18, stable since Node 20) instead of Jest/Mocha/Vitest. Zero new dependencies. Output is TAP-compatible. Matches the "no heavyweight test framework unless explicitly required" constraint.

## ADR-014: Rule registry all RULE_REQUIRES_VERIFICATION
All 8 rules in the initial registry are marked `RULE_REQUIRES_VERIFICATION`. No government circular was independently verified during this build session. Citation strings explicitly say "Pending verification — see INTEGRATION_ROADMAP.md". This is correct per ARCHITECTURE.md and Invariant I3.

## ADR-015: Verhoeff false-positive rate
The Verhoeff algorithm accepts approximately 1 in 10 random 12-digit numbers. This is understood and acceptable: the firewall uses Verhoeff as a HIGH-CONFIDENCE signal, not proof of Aadhaar identity. Low-confidence (non-Verhoeff) 12-digit numbers are redacted, not rejected.

## ADR-016: subjectRef not implemented in Phase 3
`subjectRef` (HMAC pseudonym) is optional per the frozen architecture. It is not built in Phase 3 because recurring-failure correlation is not required for the form-diagnosis endpoint. `pseudonymiser.js` stub remains. Will implement if recurring-failure feature requires it.

## ADR-017: Graceful MongoDB Degradation
If `MONGODB_URI` is not provided or connection fails, the API does not crash. It starts in degraded mode, skips persistence, but still fully executes the deterministic rules engine so the dealer is not blocked from receiving critical fallback guidance.

## ADR-018: Synthetic Jittered Geographic Clustering
Synthetic events are generated around 3 specific district centroids (Kurnool, Anantapur, Kadapa) with randomized jitter. This ensures realistic "hotspot" density for the Officer Dashboard while mathematically preventing the generation of real specific addresses.
## ADR-019: localStorage Offline Queue
To guarantee the P0 demo path without over-engineering Service Workers, offline requests are queued in `localStorage`. Only structural data (never PII or audio) is queued, ensuring privacy while allowing resilience against connectivity drops in Fair Price Shops.

## ADR-020: Bounded AI Classification & Deterministic Authority
The AI (Gemini 2.5 Flash) is strictly bounded to classifying the failure cause from a scrubbed transcript. It NEVER determines the fallback steps, rule ID, or policy citations. The AI output is mapped back into the deterministic Rules Engine, preserving absolute predictability and zero-hallucination guarantees for the actual guidance provided to the dealer. Raw audio and raw transcripts are never persisted.
