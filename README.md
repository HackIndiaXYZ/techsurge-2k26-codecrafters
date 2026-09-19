# Setu (सेतु) — The Last-Inch PDS Bridge

<div align="center">

![Prototype Badge](https://img.shields.io/badge/status-prototype-orange)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Prototype — Synthetic Data Only. No live UIDAI / ePoS integration.**

*Built for **Kalachakra 2K26 — Digital Public Services Track** · Problem Statement **PS-D02: "The Last Inch"***

</div>

---

## What is Setu?

Setu (सेतु — Sanskrit for *bridge*) solves the "last inch" problem in India's Public Distribution System (PDS). Every day, Aadhaar-based biometric authentication fails at Fair Price Shops across India — due to worn fingerprints, poor connectivity, hardware failures, or un-seeded Aadhaar cards. When this happens, FPS dealers are left without clear guidance, often turning away entitled beneficiaries.

**Setu does three things:**

1. **Diagnoses** the likely cause of a biometric authentication failure.
2. **Looks up** the documented, government-defined fallback procedure for that failure type.
3. **Explains** the next steps to the dealer in simple, multilingual language (English, Hindi, Telugu) — keeping the human dealer in control throughout.

---

## Feature Overview

| Feature | Description |
|---|---|
| 🔬 **Biometric Failure Diagnosis** | Form-based or voice-based input to identify the root cause of failure |
| 🤖 **Gemini LLM Classifier** | Classifies free-form dealer voice input into structured failure cause enums |
| ⚙️ **Deterministic Rule Engine** | 8-rule deterministic engine — sole authority for fallback decisions, zero LLM involvement |
| 💬 **Multilingual Guidance** | Step-by-step guidance delivered in English, Hindi (हिन्दी), and Telugu (తెలుగు) |
| 🔊 **Voice Interface** | ASR-powered voice input via Bhashini integration + Web Speech API TTS |
| 🔐 **OTP Exception Flow** | Full synthetic OTP-based biometric exception authorization (v2.0 architecture) |
| 🏦 **Ration Dispense Simulation** | Synthetic ePoS dispense transaction with post-transaction re-verification |
| 🧑‍✈️ **Officer Analytics Dashboard** | District Supply Officer dashboard with real-time failure analytics and investigation case management |
| 🛡️ **PII Firewall** | Multi-layer firewall — rejects Aadhaar numbers (via Verhoeff checksum), phone numbers, emails, PAN cards |
| 📴 **Offline Queue** | Service Worker + IndexedDB offline queue for connectivity-failure scenarios |
| 🔎 **Investigation Case Tracker** | Officer-facing investigation lifecycle management for flagged reverification mismatches |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │   Dealer PWA         │      │   Officer Dashboard          │   │
│  │   (React 18 + Vite) │      │   (React 18 + Vite)         │   │
│  │   localhost:5173     │      │   localhost:5174             │   │
│  │                     │      │                             │   │
│  │  • FailurePicker     │      │  • Failure metrics           │   │
│  │  • VoiceRecorder     │      │  • Investigation tracker     │   │
│  │  • GuidanceCard      │      │  • Exception analytics       │   │
│  │  • Biometric Flow    │      │  • Re-verification audit     │   │
│  │  • OTP Exception     │      │                             │   │
│  │  • Offline Queue     │      │                             │   │
│  └──────────┬──────────┘      └──────────────┬──────────────┘   │
└─────────────┼────────────────────────────────┼──────────────────┘
              │ HTTPS/REST                      │ HTTPS/REST
              ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│                   Express.js  (Node.js 20+)                      │
│                      localhost:3001                              │
│                                                                  │
│   ┌─────────────┐  ┌────────────┐  ┌──────────────────────────┐ │
│   │  Helmet     │  │    CORS    │  │    JSON Body Parser       │ │
│   └─────────────┘  └────────────┘  └──────────────────────────┘ │
│                         │                                        │
│                         ▼                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    PII FIREWALL                          │  │
│   │  • Aadhaar detection (Verhoeff checksum) → 422 reject    │  │
│   │  • Phone/email/PAN → redact                              │  │
│   │  • Forbidden key names → 422 reject                      │  │
│   └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│          ┌──────────────┼──────────────────┐                    │
│          ▼              ▼                  ▼                    │
│   ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐     │
│   │  /diagnose  │  │  /auth   │  │    /investigations   │     │
│   │             │  │          │  │    /insights         │     │
│   └──────┬──────┘  └────┬─────┘  └──────────────────────┘     │
│          │              │                                        │
│          ▼              ▼                                        │
│   ┌─────────────┐  ┌───────────────────────────┐               │
│   │  Gemini AI  │  │    Auth Service (v2.0)     │               │
│   │  Classifier │  │                           │               │
│   │  (LLM only  │  │  • Biometric aggregation  │               │
│   │  for cause  │  │  • OTP exception           │               │
│   │  classif.)  │  │  • Re-verification        │               │
│   └──────┬──────┘  └───────────────────────────┘               │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │           DETERMINISTIC RULE ENGINE                      │  │
│   │      (ZERO LLM imports — pure function, no I/O)          │  │
│   │                                                          │  │
│   │  Input: { cause, attempts, age, hasRegisteredMobile... } │  │
│   │                                                          │  │
│   │  Precedence:                                             │  │
│   │   1. BIOMETRIC_QUALITY_POOR  → R-BIO-004                │  │
│   │   2. MISMATCH ≥3 + age≥65   → R-BIO-001 (Face Auth)    │  │
│   │   3. MISMATCH ≥3 + mobile   → R-BIO-002 (OTP)          │  │
│   │   4. MISMATCH ≥3            → R-BIO-003 (Exception Reg) │  │
│   │   5. CONNECTIVITY_FAILURE   → R-CON-001                 │  │
│   │   6. DEVICE_FAILURE         → R-DEV-001                 │  │
│   │   7. SEEDING_NOT_DONE       → R-SEED-001                │  │
│   │   8. UNKNOWN / fallback     → R-ESC-000                 │  │
│   │                                                          │  │
│   └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────┬───────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                     MongoDB (Local/Atlas)                        │
│                                                                  │
│  Collections:                                                    │
│  • biometricverificationevents  — per-modality biometric events  │
│  • exceptionauthorizations      — OTP exception audit records    │
│  • rationtransactions           — synthetic dispense records     │
│  • investigationcases           — flagged mismatch cases         │
│  • failureevents                — legacy diagnosis event log     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Full Workflow

### Dealer PWA — Verification Flow (v2.0)

```
[Dealer selects demo scenario]
        │
        ▼
[BIOMETRIC_VERIFICATION]
   Synthetic biometric descriptors submitted (fingerprint + face + iris)
   Face Capture simulation shown (UI demo only, no real image processed)
        │
        ├── All SUCCESS ──────────────────────────────► [AUTHENTICATED]
        │                                                     │
        └── Any FAILURE / UNAVAILABLE ─► [EXCEPTION_REQUIRED] │
                   │                                          │
                   ▼                                          ▼
           [DIAGNOSIS_ENTRY]                        [RATION_DISPENSE]
        Voice input or form input                  Synthetic 10kg rice
        Gemini classifies voice                         dispense
        Rule Engine fires                               │
                   │                                    ▼
                   ▼                        [REVERIFICATION_PENDING]
           [GuidanceCard shown]             Post-transaction biometric
        Steps in EN / HI / TE              re-verification (all 3 modalities)
        TTS playback available                          │
                   │                       ┌───────────┴───────────┐
                   ▼                       ▼                       ▼
             [OTP_ENTRY]          [MATCH_CONFIRMED]     [MISMATCH_FLAGGED]
        Enter synthetic OTP       Transaction clean    Investigation case
        (demo: 123456)                                 auto-created for
                   │                                   Officer dashboard
           ┌───────┴───────┐
           ▼               ▼
       [VERIFIED]       [FAILED]
   Proceed to dispense  Blocked
```

### Officer Dashboard — Analytics & Investigation Flow

```
Officer Dashboard loads
        │
        ▼
[Aggregation Service queries MongoDB]
  • Total failures (30-day window)
  • Exception authorizations count
  • Failure cause breakdown (pie chart)
  • Top exception rules triggered
        │
        ▼
[Investigation Section]
  Cases from reverification mismatches
  Officer can: ACKNOWLEDGE → INVESTIGATING → RESOLVED / ESCALATED
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite 5 | Dealer PWA & Officer Dashboard |
| **State Management** | Zustand | Session state, verification flow state machine |
| **Styling** | Tailwind CSS | Utility-first UI |
| **Backend** | Node.js 20+ / Express.js | REST API server |
| **Validation** | Zod | Strict input validation on all endpoints |
| **Database** | MongoDB + Mongoose | Audit event persistence |
| **AI / LLM** | Google Gemini API | Voice transcript classification (cause enum only) |
| **ASR / TTS** | Bhashini API + Web Speech API | Voice input/output in regional languages |
| **Security** | Helmet + custom PII Firewall | Aadhaar/PII rejection, header hardening |
| **Offline** | Service Worker + IndexedDB | Offline queue for connectivity-failure scenarios |
| **Build Tools** | npm Workspaces + Vite | Monorepo management and bundling |
| **Testing** | Node.js test runner (native) | Unit tests for rule engine, auth, investigations |

---

## Monorepo Structure

```
techsurge/
├── apps/
│   ├── dealer-pwa/                    # FPS Dealer PWA
│   │   └── src/
│   │       ├── components/
│   │       │   ├── SyntheticVerificationFlow.jsx  # Full v2.0 auth flow UI
│   │       │   ├── FailurePicker.jsx              # Structured cause form
│   │       │   ├── GuidanceCard.jsx               # Step-by-step guidance
│   │       │   ├── VoiceRecorder.jsx              # ASR voice input
│   │       │   ├── PredictiveFlow.jsx             # Predictive failure detection
│   │       │   └── TrustVerificationCard.jsx      # Trust & safety info card
│   │       ├── store/useSessionStore.js           # Zustand state machine
│   │       ├── lib/apiClient.js                   # API client (strict contract)
│   │       ├── hooks/useOfflineQueue.js           # IndexedDB offline queue
│   │       └── i18n/                             # EN / HI / TE translations
│   │
│   └── officer-dashboard/             # District Supply Officer Dashboard
│       └── src/
│           ├── App.jsx                            # Metrics & investigation hub
│           ├── components/
│           │   ├── InvestigationSection.jsx       # Case lifecycle management
│           │   └── InvestigationCaseCard.jsx      # Per-case action card
│           └── lib/apiClient.js                   # Dashboard API client
│
├── services/
│   └── api/                           # Express REST API
│       └── src/
│           ├── server.js                          # Entry point
│           ├── engine/
│           │   ├── rulesEngine.js                 # Deterministic rule engine (0 LLM)
│           │   ├── ruleSchema.js                  # Zod rule registry schema
│           │   └── rules.json                     # Verified rule definitions
│           ├── controllers/
│           │   ├── auth.controller.js             # Biometric / OTP / reverify
│           │   ├── diagnose.controller.js         # Form & voice diagnosis
│           │   ├── insights.controller.js         # Officer analytics
│           │   └── investigations.controller.js   # Case management
│           ├── services/
│           │   ├── authService.js                 # Biometric aggregation logic
│           │   ├── diagnosisService.js            # Diagnosis + rule lookup
│           │   ├── aggregationService.js          # MongoDB analytics aggregations
│           │   └── investigationsService.js       # Case lifecycle logic
│           ├── models/
│           │   ├── BiometricVerificationEvent.js  # Per-modality event schema
│           │   ├── ExceptionAuthorization.js      # OTP exception audit schema
│           │   ├── RationTransaction.js           # Dispense transaction schema
│           │   ├── InvestigationCase.js           # Investigation case schema
│           │   └── FailureEvent.js                # Legacy failure event schema
│           ├── middleware/
│           │   ├── piiFirewall.js                 # Multi-layer PII rejection/redaction
│           │   ├── verhoeff.js                    # Aadhaar Verhoeff checksum
│           │   └── errorHandler.js                # Centralised error handler
│           ├── ai/
│           │   └── classifier.js                  # Gemini API cause classifier
│           ├── routes/
│           │   ├── auth.routes.js
│           │   ├── diagnose.routes.js
│           │   ├── insights.routes.js
│           │   └── investigations.routes.js
│           └── scripts/
│               └── seedV2Data.js                  # Synthetic data seeder
│
├── packages/
│   └── shared/
│       └── causeTaxonomy.js           # Shared FailureCause enum
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BUILD_STATUS.md
│   ├── DEMO_SCRIPT.md
│   └── INTEGRATION_ROADMAP.md
│
├── biometrics_hash.txt                # Synthetic biometric registry (2000 entries, demo only)
├── biometrics_history.txt             # Synthetic 12-month biometric history (5000 records, demo only)
└── package.json                       # npm workspaces root
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/biometric` | Submit synthetic biometric verification (fingerprint + face + iris) |
| `POST` | `/api/v1/auth/exception/otp` | Authorize OTP exception for a failed transaction |
| `POST` | `/api/v1/auth/reverify` | Post-transaction biometric re-verification |

### Diagnosis

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/diagnose/form` | Structured cause input → rule lookup → multilingual guidance |
| `POST` | `/api/v1/diagnose/voice` | Voice transcript → Gemini classification → rule lookup → guidance |

### Officer Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/insights/summary` | Failure counts, exception stats, cause breakdown |
| `GET` | `/api/v1/insights/top-rules` | Most-triggered fallback rules |

### Investigations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/investigations` | List all investigation cases |
| `POST` | `/api/v1/investigations` | Create a new investigation case |
| `PATCH` | `/api/v1/investigations/:id/status` | Update case status (INVESTIGATING → RESOLVED etc.) |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | API health check |

---

## Rule Registry

The deterministic rule engine resolves failures using 8 rules across precedence tiers:

| Rule ID | Cause | Fallback | Condition |
|---|---|---|---|
| `R-BIO-001` | BIOMETRIC_MISMATCH | FACE_AUTH | ≥3 attempts + age ≥65 |
| `R-BIO-002` | BIOMETRIC_MISMATCH | OTP | ≥3 attempts + registered mobile |
| `R-BIO-003` | BIOMETRIC_MISMATCH | EXCEPTION_REGISTER | ≥3 attempts, no other option |
| `R-BIO-004` | BIOMETRIC_QUALITY_POOR | CLEAN_RETRY | Any |
| `R-CON-001` | CONNECTIVITY_FAILURE | OFFLINE_MODE | Any |
| `R-DEV-001` | DEVICE_FAILURE | ALTERNATE_EPOS | Any |
| `R-SEED-001` | SEEDING_NOT_DONE / DEMOGRAPHIC_MISMATCH | SEEDING_REFERRAL | Any |
| `R-ESC-000` | UNKNOWN / BENEFICIARY_ABSENT | ESCALATE | Catch-all |

> All rules are marked `RULE_REQUIRES_VERIFICATION` pending official government circular confirmation. No fabricated rules are presented as authoritative.

---

## Synthetic Data Files

| File | Contents | Size |
|---|---|---|
| `biometrics_hash.txt` | 2,000 synthetic beneficiary biometric hashes (50-char cryptographic values) with face authentication hashes | ~2,000 entries |
| `biometrics_history.txt` | 12-month rolling biometric event history — columns: `BENEFICIARY_ID`, `BIOMETRIC_HASH`, `LOCATION_ID`, `DATE` | ~5,000 lines |

> These files are **for demonstration purposes only**. They are not connected to any live system, and contain no real personal data whatsoever.

---

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **MongoDB** (local `mongodb://localhost:27017` or Atlas free tier)

---

## Installation & Running

```bash
# 1. Clone
git clone https://github.com/HackIndiaXYZ/techsurge-2k26-codecrafters
cd techsurge-2k26-codecrafters

# 2. Install all workspace dependencies
npm install

# 3. Configure environment
cp .env.example services/api/.env
# Set MONGODB_URI and GEMINI_API_KEY in services/api/.env

# 4. Start all services
npm run dev
```

### Individual services

```bash
npm run dev:dealer       # Dealer PWA       → http://localhost:5173
npm run dev:dashboard    # Officer Dashboard → http://localhost:5174
npm run dev:api          # Express API       → http://localhost:3001
```

### Seed synthetic data

```bash
cd services/api
node scripts/seedV2Data.js
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | `development` or `production` | Yes |
| `PORT` | API server port (default: `3001`) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (voice classification only) | Optional |
| `BHASHINI_API_KEY` | Bhashini ASR/TTS key | Optional |
| `BHASHINI_USER_ID` | Bhashini user ID | Optional |
| `HMAC_SECRET` | HMAC secret for pseudonymous reference generation | Optional |

---

## Testing

```bash
cd services/api

# Run all tests
npm test

# Individual test suites
node --test tests/rulesEngine.test.js
node --test tests/biometricAuth.test.js
node --test tests/otpException.test.js
node --test tests/reverify.test.js
node --test tests/investigation.test.js
node --test tests/piiFirewall.test.js
```

---

## Safety & Privacy Principles

| Principle | Implementation |
|---|---|
| **No real Aadhaar numbers** | PII Firewall rejects via Verhoeff checksum (HTTP 422) |
| **No real biometric data** | Only synthetic cryptographic hashes; no images stored |
| **No live UIDAI/ePoS** | All flows use synthetic descriptors |
| **No PII persistence** | Mongoose `strict: true` schema starvation; forbidden key rejection |
| **LLM never decides fallback** | Rule Engine has zero LLM imports — is a pure deterministic function |
| **No fabricated rules** | All unverified rules carry `RULE_REQUIRES_VERIFICATION` status |
| **No automated entitlement** | Every action is an instruction to a human dealer |
| **Geographic k-anonymity** | Dashboard suppresses map buckets where count < 5 |

---

## Implementation Status

| Module | Status |
|---|---|
| Deterministic Rule Engine | ✅ Complete — 8 rules, fully tested |
| PII Firewall (5 layers) | ✅ Complete — Verhoeff + pattern detection |
| Dealer PWA (v2.0 flow) | ✅ Complete — Biometric → OTP → Dispense → Reverify |
| Officer Dashboard | ✅ Complete — Analytics + Investigation tracker |
| Gemini Voice Classifier | ✅ Complete |
| OTP Exception Authorization | ✅ Complete |
| Post-transaction Reverification | ✅ Complete |
| Investigation Case Management | ✅ Complete |
| Multilingual Guidance (EN/HI/TE) | ✅ Complete |
| Offline Queue (Service Worker) | ✅ Complete |
| Synthetic Data Seeder | ✅ Complete |
| Unit Tests | ✅ Complete — 7 test suites |
| Bhashini ASR Integration |  ✅ Complete|
| Production Deployment |  ✅ Complete |

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
Built with ❤️ for <strong>Kalachakra 2K26</strong> · <em>No real citizen data was used in building this prototype.</em>
</div>
