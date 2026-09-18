# ARCHITECTURE.md — "Setu" | PS-D02 The Last Inch

> **AI AGENT: READ THIS FILE IN FULL BEFORE WRITING ANY CODE.**
> This document is the single source of truth. If a request conflicts with this
> file, follow this file and say so. Do not introduce libraries, services, folders,
> or patterns not listed here. Do not refactor across module boundaries.
> When unsure, generate a stub with `// TODO(arch):` and stop.

**Project name:** Setu (सेतु — "bridge")
**Duration:** 24 hours. Every decision below is optimised for shipping, not elegance.

---

## 0. The One-Paragraph Thesis

A Fair Price Shop dealer, in Telugu or Hindi, describes why a beneficiary's fingerprint
failed. Setu classifies the cause, looks up the **applicable documented fallback procedure**
from the Rule Registry (each rule carries its verification status), and reads the exact steps back to the dealer in his language.
The failure is logged with **zero personally identifiable information** and surfaces on a
District Supply Officer map as a geographic hotspot. The AI never decides the entitlement;
it only listens and explains.

---

## 1. NON-NEGOTIABLE INVARIANTS

These are graded by the judges. Violating any one of them fails the project.

| # | Invariant | Enforcement |
|---|---|---|
| I1 | **The LLM never decides a fallback.** It classifies input and rephrases output. Nothing else. | `rulesEngine.js` has zero LLM imports. Enforce in code review. |
| I2 | **No raw PII is stored, logged, or transmitted.** No Aadhaar numbers, names, phone numbers, biometrics. | `piiFirewall.js` middleware, position 3 in the chain. |
| I3 | **Every recommendation cites a Rule Registry entry with its verification status.** Response always includes `ruleId`, `citation`, and `verificationStatus`. Only rules marked `VERIFIED` may be described as official. | `rules.json` schema requires all three fields. |
| I4 | **Human stays in the loop.** The system never approves or denies an entitlement. It only advises the dealer. | No approval endpoints exist. UI copy says "Suggested next step". |
| I5 | **No claim of live UIDAI/ePoS integration.** All transaction data is synthetic. | Persistent `SYNTHETIC DATA` badge in UI footer. |
| I6 | **k-anonymity on the officials' map.** Suppress any aggregation bucket with `count < 5`. | `aggregationService.js`. |

---

## 2. TECH STACK — LOCKED

Do not substitute. Do not add. Everything below has a free tier and no cloud bill.

| Layer | Choice | Version | Why |
|---|---|---|---|
| Frontend | React 18 + Vite | ^5 | Fast HMR, instant builds |
| Styling | Tailwind CSS | ^3.4 | No design system needed at 3am |
| State | Zustand | ^4 | Redux is overkill for 24h |
| Maps | Leaflet + react-leaflet + OpenStreetMap | ^4 | **No API token required** |
| Charts | Recharts | ^2 | One import, done |
| Backend | Node.js 20 + Express | ^4.19 | Stated constraint |
| DB | MongoDB Atlas **M0 free** + Mongoose | ^8 | Stated constraint |
| ASR / TTS | **Bhashini (Dhruva / ULCA)** | REST | Govt of India language DPI — free, Telugu + Hindi |
| ASR fallback | Browser Web Speech API | native | Demo-day insurance if Bhashini is slow |
| LLM | Google Gemini 2.5 Flash (free tier) | REST | Free, fast, good Indic handling |
| Validation | Zod | ^3 | Schema-level PII defence |
| Monorepo | **npm workspaces** | native | Turborepo/Nx setup cost is not worth 24h |
| Deploy FE | Vercel | free | |
| Deploy BE | Render | free | Cold starts are acceptable; warm it before the pitch |

**Explicitly forbidden:** AWS, GCP paid services, Docker/Kubernetes, Redis, Kafka,
microservices, GraphQL, Next.js, TypeScript (JS + JSDoc only — TS type errors will eat
2 hours you do not have), Mapbox, Whisper self-hosting, authentication systems beyond a
hardcoded demo passcode.

---

## 3. MONOREPO STRUCTURE

Create exactly this. Do not add top-level directories.

```
setu/
├── ARCHITECTURE.md                  ← this file, pinned in every AI session
├── README.md
├── package.json                     ← npm workspaces root
├── .env.example
├── .gitignore
│
├── apps/
│   ├── dealer-pwa/                  ← React: the counter-side app
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   ├── public/
│   │   │   ├── manifest.json        ← PWA, installable, works offline-ish
│   │   │   └── icons/
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── components/
│   │       │   ├── VoiceRecorder.jsx        ← MediaRecorder + waveform
│   │       │   ├── FailurePicker.jsx        ← BIG icon buttons, no typing
│   │       │   ├── GuidanceCard.jsx         ← numbered steps + TTS play button
│   │       │   ├── LanguageToggle.jsx       ← te / hi / en
│   │       │   ├── OfflineBanner.jsx
│   │       │   └── SyntheticDataBadge.jsx   ← I5 compliance, always visible
│   │       ├── hooks/
│   │       │   ├── useVoiceCapture.js
│   │       │   ├── useSpeechFallback.js     ← Web Speech API safety net
│   │       │   └── useOfflineQueue.js       ← localStorage queue, flush on reconnect
│   │       ├── lib/
│   │       │   ├── apiClient.js
│   │       │   └── clientScrub.js           ← strip 12-digit seqs BEFORE upload
│   │       ├── i18n/
│   │       │   ├── te.json
│   │       │   ├── hi.json
│   │       │   └── en.json
│   │       └── store/useSessionStore.js
│   │
│   └── officer-dashboard/           ← React: the DSO-side app
│       ├── vite.config.js
│       └── src/
│           ├── main.jsx
│           ├── App.jsx
│           ├── components/
│           │   ├── HotspotMap.jsx           ← Leaflet + circle markers by density
│           │   ├── CauseBreakdown.jsx       ← Recharts bar chart
│           │   ├── RecurringFailureTable.jsx ← shops with >N mismatch events
│           │   ├── AnonymityNotice.jsx      ← "buckets <5 suppressed"
│           │   └── TimeSeriesPanel.jsx
│           └── lib/apiClient.js
│
├── services/
│   └── api/                         ← Node/Express: the ONLY backend
│       ├── package.json
│       ├── src/
│       │   ├── server.js            ← app bootstrap, middleware chain order
│       │   ├── config/
│       │   │   ├── env.js           ← zod-validated env, fails fast on missing salt
│       │   │   └── db.js
│       │   ├── middleware/
│       │   │   ├── piiFirewall.js   ★ THE CENTREPIECE — see §6
│       │   │   ├── verhoeff.js      ★ Aadhaar check-digit validator
│       │   │   ├── pseudonymiser.js ★ HMAC-SHA256 subjectRef
│       │   │   ├── auditLogger.js
│       │   │   └── errorHandler.js
│       │   ├── routes/
│       │   │   ├── diagnose.routes.js
│       │   │   ├── insights.routes.js
│       │   │   └── health.routes.js
│       │   ├── controllers/
│       │   │   ├── diagnose.controller.js
│       │   │   └── insights.controller.js
│       │   ├── engine/              ★ DETERMINISTIC — NO LLM IMPORTS ALLOWED
│       │   │   ├── rulesEngine.js
│       │   │   ├── rules.json       ← the decision tree, see §5
│       │   │   └── ruleSchema.js    ← zod schema validating rules.json at boot
│       │   ├── ai/                  ← LLM is quarantined to this folder
│       │   │   ├── classifier.js    ← text → enum. Temperature 0.
│       │   │   ├── renderer.js      ← rule steps → plain language
│       │   │   └── prompts/
│       │   │       ├── classify.prompt.txt
│       │   │       └── render.prompt.txt
│       │   ├── integrations/
│       │   │   ├── bhashini.js      ← ASR + TTS + NMT
│       │   │   └── gemini.js
│       │   ├── models/
│       │   │   ├── FailureEvent.js  ← strict:true, NO PII fields
│       │   │   ├── RuleRegistry.js
│       │   │   └── AuditLog.js
│       │   ├── services/
│       │   │   ├── diagnosisService.js
│       │   │   └── aggregationService.js
│       │   └── utils/
│       │       ├── scrubText.js     ← shared by firewall + egress guard
│       │       └── logger.js        ← pino, redact paths configured
│       └── scripts/
│           ├── seedRules.js
│           └── seedSyntheticEvents.js   ← 2000 fake ePoS events, clustered
│
├── packages/
│   └── shared/
│       ├── constants.js             ← FAILURE_CAUSES enum, shared FE+BE
│       └── causeTaxonomy.js
│
└── docs/
    ├── ARCHITECTURE_NOTE.pdf        ← deliverable §11 of the PS
    ├── INTEGRATION_ROADMAP.md       ← "what real ePoS integration requires"
    └── demo-script.md               ← the 4-minute pitch, word for word
```

---

## 4. DATA MODEL

### `FailureEvent` — the only collection that grows

```js
{
  _id: ObjectId,
  eventId: String,              // uuid v4
  subjectRef: String,           // optional — server-generated pseudonymous reference:
                               // HMAC-SHA256(SALT, cardId)[0:16]. Raw value discarded
                               // immediately. Omit entirely if repeat-failure detection
                               // does not require beneficiary-level correlation.
  failureCause: String,         // enum, see §5
  confidence: Number,           // classifier confidence 0-1
  ruleApplied: String,          // e.g. "R-BIO-004"
  resolutionOffered: String,    // enum: FACE_AUTH | OTP | EXCEPTION_REGISTER | NOMINEE | ESCALATE
  resolutionOutcome: String,    // enum: RESOLVED | REFUSED | PENDING | UNKNOWN
  shopCode: String,             // "AP-KNL-0142" — synthetic, NOT GPS
  district: String,
  state: String,
  geo: { lat: Number, lng: Number },   // ward centroid, jittered ±500m. NEVER exact.
  language: String,             // te | hi | en
  inputMode: String,            // VOICE | FORM
  createdAt: Date
}
// mongoose: { strict: true, strictQuery: true }
// FORBIDDEN FIELDS — never add: aadhaar, name, phone, address, biometricTemplate,
// rationCardNumber, photo, transcript, rawAudio
```

### `RuleRegistry`

```js
{
  ruleId: String,          // "R-BIO-004"
  version: String,         // "2024.1"
  causeMatch: [String],
  conditions: Object,      // { ageAbove: 65, attemptsAtLeast: 3 }
  fallback: String,
  steps: { en: [String], hi: [String], te: [String] },
  citation: String,        // "DFPD Circular No. 15-2/2017-ND-I, Para 4(b)"
  sourceUrl: String,
  escalationPath: String,
  active: Boolean
}
```

### `AuditLog` — append-only, no payloads

```js
{ ts, action, ruleId, outcome, piiRejectionReason, requestHash }
// NEVER write req.body into this collection.
```

---

## 5. THE RULES ENGINE (deterministic, no AI)

### Cause taxonomy — `packages/shared/constants.js`

```js
export const FAILURE_CAUSES = Object.freeze({
  BIOMETRIC_MISMATCH:      'BIOMETRIC_MISMATCH',      // worn ridges, elderly, manual labour
  BIOMETRIC_QUALITY_POOR:  'BIOMETRIC_QUALITY_POOR',  // wet/dirty/injured finger
  CONNECTIVITY_FAILURE:    'CONNECTIVITY_FAILURE',    // server/network timeout
  DEVICE_FAILURE:          'DEVICE_FAILURE',          // scanner not registering
  DEMOGRAPHIC_MISMATCH:    'DEMOGRAPHIC_MISMATCH',    // name/DOB seeding error
  SEEDING_NOT_DONE:        'SEEDING_NOT_DONE',        // Aadhaar not linked to card
  BENEFICIARY_ABSENT:      'BENEFICIARY_ABSENT',      // migrant / bedridden / deceased
  UNKNOWN:                 'UNKNOWN'
});
```

### Engine contract

```js
// engine/rulesEngine.js — PURE FUNCTION. No I/O. No LLM. No randomness.
// Fully unit-testable, which is exactly why judges will trust it.
export function resolveFallback({ cause, attempts, age, hasRegisteredMobile,
                                  isSeeded, connectivity, deviceOk }) {
  // → { ruleId, fallback, steps, citation, escalationPath, confidence: 1.0 }
  // If no rule matches, return R-ESC-000 (escalate to District Supply Officer).
  // NEVER return null. NEVER guess.
}
```

### Minimum viable rule set — build these 8, they cover the PS demo

| ruleId | Cause + condition | Fallback |
|---|---|---|
| R-BIO-001 | Mismatch, attempts ≥ 3, age ≥ 65 | **Face authentication** (AadhaarFaceRD) |
| R-BIO-002 | Mismatch, attempts ≥ 3, mobile seeded | **OTP authentication** |
| R-BIO-003 | Mismatch, attempts ≥ 3, no mobile, no face device | **Exception register** + dealer attestation |
| R-BIO-004 | Quality poor (wet/dirty) | Clean + dry + retry 2x, then escalate to R-BIO-001 |
| R-CON-001 | Connectivity failure | **Offline/store-and-forward mode**; dealer must NOT turn beneficiary away |
| R-DEV-001 | Device failure | Alternate ePoS or nearest FPS; log device ID for DSO |
| R-SEED-001 | Not seeded | Seeding camp / MeeSeva referral; **exception register for this cycle** |
| R-ESC-000 | No match | Escalate: DSO + 1967 / 1800-425-2977 helpline |

> **Accuracy note for your pitch:** cite the actual circulars in `citation`. If you cannot
> verify a specific circular number in time, write `"Pending verification — see
> INTEGRATION_ROADMAP.md"`. **Never invent a circular number.** A judge who catches a
> fabricated government citation will end your run on the spot. Honesty here is a feature.

---

## 6. ★ THE PII FIREWALL — exact middleware strategy

### Middleware chain order in `server.js` — do not reorder

```js
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));
app.use(express.json({ limit: '256kb' }));
app.use(piiFirewall);        // ← 3. BEFORE any route, BEFORE any logging
app.use(pseudonymiser);      // ← 4. hash-and-discard
app.use(auditLogger);        // ← 5. records ruleId only
app.use('/api/v1', routes);
app.use(errorHandler);
```

### Strategy: **non-collection first, rejection second, redaction last**

**Layer 0 — The field does not exist.** The dealer UI has no Aadhaar input, no name
field, no phone field. Failure selection is icon-based. You cannot leak what you never
render. *This is the strongest control and it costs zero code.*

**Layer 1 — `piiFirewall.js`: detect and REJECT, do not silently clean.**

```
FOR each string value in deep-walk(req.body, req.query, req.params):
  1. Match /\b\d{4}\s?\d{4}\s?\d{4}\b/g  → candidate Aadhaar
  2. Run verhoeffValidate(candidate)
     → PASSES  : hard reject. 422 { code: 'PII_DETECTED', field, hint }
     → FAILS   : likely a random 12-digit number → redact to '[REDACTED_NUM]', continue
  3. Match phone /\b[6-9]\d{9}\b/          → redact
  4. Match email, PAN /[A-Z]{5}\d{4}[A-Z]/ → redact
  5. Reject outright if any key name ∈ {aadhaar, uid, name, phone, mobile, address,
     biometric, fingerprint, photo}
  6. On any rejection: auditLog.write({ piiRejectionReason, requestHash })
     — write the REASON, never the VALUE.
```

**Why Verhoeff matters (say this to the judges):** Aadhaar numbers use the Verhoeff
check-digit algorithm. A naive `\d{12}` regex also blocks legitimate data — transaction
IDs, timestamps. Validating the checksum means you reject *real* Aadhaar numbers with
high precision and let harmless numbers through. That is the difference between a
compliance theatre demo and an engineered control.

**Why reject instead of redact:** silently cleaning teaches the operator nothing. A hard
422 with "Please do not enter Aadhaar numbers — this system does not need them" changes
behaviour at the counter. Redaction is the fallback for low-confidence matches only.

**Layer 2 — `pseudonymiser.js`.** If repeat-failure detection needs a subject handle:

```js
subjectRef = crypto.createHmac('sha256', env.SUBJECT_SALT)
                   .update(String(cardId))
                   .digest('hex').slice(0, 16);
delete req.body.cardId;   // raw value dies here, before the controller
```
Salt lives in env, is never logged, and is rotated per deployment. One-way by construction.

**Layer 3 — Schema starvation.** Mongoose `strict: true` and no PII fields defined.
Even if Layers 1–2 fail, Mongo drops unknown keys. Demo this live: POST a payload with
`name`, show it vanish.

**Layer 4 — EGRESS guard (the one everyone forgets).** Bhashini returns a *transcript*.
A beneficiary may have spoken her Aadhaar number aloud. So:

- Run `scrubText()` on the ASR transcript **the moment it returns**, before it is
  classified, logged, or sent to Gemini.
- The raw transcript is **never persisted**. Only the resulting enum is stored.
- Raw audio blobs are discarded after ASR. Nothing is written to disk.

**Layer 5 — Log redaction.** Configure pino `redact: ['req.body', 'req.headers.authorization', '*.transcript', '*.audio']`.
Most PII leaks in hackathon projects happen through `console.log`, not the database.

---

## 7. API CONTRACT

```
POST /api/v1/diagnose/voice
  multipart: audio(blob), language(te|hi|en), shopCode
  → 200 { eventId, detectedCause, confidence, ruleId, fallback,
          steps[], citation, ttsUrl, escalationPath }
  → 422 { code: 'PII_DETECTED', field, hint }

POST /api/v1/diagnose/form
  json: { cause, attempts, age, hasRegisteredMobile, isSeeded,
          connectivity, deviceOk, shopCode }
  → 200 { same shape as above }
  // NOTE: this endpoint bypasses BOTH the LLM and the ASR. It is 100% deterministic.
  // It is also your demo safety net if the network dies. Build it FIRST.

POST /api/v1/diagnose/:eventId/outcome
  json: { resolutionOutcome }

GET  /api/v1/insights/hotspots?state=&district=&from=&to=
  → { buckets: [{ shopCode, district, geo, count, topCause }], suppressedBuckets: n }
  // buckets with count < 5 are omitted and counted in suppressedBuckets

GET  /api/v1/insights/causes
GET  /api/v1/insights/recurring-failures
GET  /api/v1/health
```

---

## 8. AI PROMPT CONTRACTS — strictly bounded

### `classify.prompt.txt`
```
You are a classifier. Read the dealer's description of an authentication failure.
Output ONLY one JSON object, no prose, no markdown fences:
{"cause":"<one of: BIOMETRIC_MISMATCH|BIOMETRIC_QUALITY_POOR|CONNECTIVITY_FAILURE|
DEVICE_FAILURE|DEMOGRAPHIC_MISMATCH|SEEDING_NOT_DONE|BENEFICIARY_ABSENT|UNKNOWN>",
 "attempts":<int|null>,"ageBand":"<UNDER_60|60_PLUS|UNKNOWN>","confidence":<0-1>}
If you cannot determine the cause, output UNKNOWN. Never guess.
Never output advice, fallback steps, or rule references.
```
Temperature 0. Response parsed with Zod. **On parse failure → cause = UNKNOWN → R-ESC-000.**
Never retry with a looser prompt.

### `render.prompt.txt`
```
Rewrite the numbered steps below into simple spoken {{language}} for a shop dealer
speaking to an elderly beneficiary. Grade-5 reading level. Short sentences.
DO NOT add steps. DO NOT remove steps. DO NOT change their order.
DO NOT mention any rule, law, or circular number.
Output only the rewritten steps as a JSON array of strings.
```

**Guardrail:** after rendering, assert `output.length === input.steps.length`. If not,
discard the LLM output and serve the pre-written `rules.json` translation verbatim.
The deterministic text is always the fallback. **The demo must work with the LLM
switched off entirely.**

---

## 9. 24-HOUR EXECUTION PLAN

### What to BUILD vs what to MOCK

| Component | Verdict | Reasoning |
|---|---|---|
| Rules engine + rules.json | **BUILD FULLY** | This is the graded core. 8 real rules. |
| PII firewall + Verhoeff | **BUILD FULLY** | Your differentiator. Demo it live. |
| Form-based diagnosis flow | **BUILD FULLY** | Works with zero network. Your safety net. |
| Officer map + aggregation | **BUILD FULLY** | Judges love a map. Cheap to build with Leaflet. |
| Bhashini ASR | **BUILD, with Web Speech fallback** | Huge credibility. Risky alone. |
| Gemini classifier | **BUILD** | ~40 lines. Low risk. |
| TTS playback | **BUILD (browser SpeechSynthesis)** | Native, free, instant. Bhashini TTS only if time. |
| Synthetic ePoS logs | **MOCK — 2000 seeded events** | Clustered in 3 districts so hotspots are visible. |
| ePoS device integration | **MOCK — document only** | PS explicitly says non-live. Write the roadmap doc. |
| Helpline/IVR integration | **MOCK — architecture note** | Describe the pattern; do not build. |
| Authentication / login | **HARDCODE a demo passcode** | Zero judge credit. |
| Offline sync queue | **BUILD (localStorage only)** | 30 minutes; big accessibility credit. |
| Unit tests | **BUILD only for rulesEngine.js** | 10 tests proving deterministic accuracy = evidence for §9 grading. |
| Docker / CI / CD | **SKIP** | Zero credit. Costs hours. |
| TypeScript | **SKIP** | Type errors at hour 19 will kill you. |

### Hour-by-hour

| Hours | Task | Done-when |
|---|---|---|
| 0–1 | Lock scope. Scaffold monorepo per §3 with Antigravity. Atlas cluster live. `.env` set. | `npm run dev` starts both apps |
| 1–3 | Write `rules.json` (8 rules + real citations) + `rulesEngine.js` + its unit tests | 10 tests green |
| 3–4 | `piiFirewall.js` + `verhoeff.js` + `pseudonymiser.js`. Prove with curl. | 422 on a valid Aadhaar, 200 on a random 12-digit |
| 4–6 | `POST /diagnose/form` end-to-end. Mongoose models. Seed script. | Form input → real fallback JSON |
| 6–8 | Dealer PWA: FailurePicker + GuidanceCard. Telugu/Hindi i18n. **DEPLOY NOW.** | Live URL works on your phone |
| 8–10 | Gemini classifier + renderer with guardrails | Free text → correct cause |
| 10–13 | Bhashini ASR integration + Web Speech fallback + egress scrub | Speak Telugu → correct guidance |
| 13–15 | Seed 2000 synthetic events. Aggregation service + k-anonymity. | `/insights/hotspots` returns clusters |
| 15–18 | Officer dashboard: Leaflet map, cause chart, recurring-failure table | Hotspots visibly cluster |
| 18–19 | Browser TTS playback. Offline queue. Accessibility pass (large text, high contrast). | Works with network throttled |
| 19–20 | **FREEZE FEATURES.** Bug bash only. | No new files created |
| 20–21 | Architecture note PDF + INTEGRATION_ROADMAP.md (PS deliverable §11) | Both docs exist |
| 21–23 | Rehearse the demo **three times**. Record a backup screen capture. | Under 4 minutes, no stumbles |
| 23–24 | Buffer. Warm the Render instance 10 min before the pitch. | Sleep if you can |

**Hard rule: feature freeze at hour 19.** Teams lose hackathons at hour 22 adding one more
thing. You will be tempted. Don't.

---

## 10. DEMO SCRIPT — the 4 minutes that decide it

1. **(30s) The problem.** "Authentication failures at Fair Price Shops are a documented
   last-mile gap in PDS delivery. Biometric mismatches, connectivity failures, and device
   faults cause eligible beneficiaries to leave without their entitlement. Official fallback
   procedures exist. Most dealers at the counter do not know them."
2. **(60s) The dealer flow.** Speak into the phone in Telugu: *"Ammagari vellu padatledu,
   moodu sarlu try chesanu"* → guidance appears and is read aloud: face authentication,
   the exact steps, the circular it comes from.
3. **(45s) The security demo — this is your moment.** Open devtools. POST a payload
   containing a valid Aadhaar number. Show the **422 PII_DETECTED**. Then POST a random
   12-digit number and show it pass. Say: *"We validate the Verhoeff checksum, so we reject
   real Aadhaar numbers and don't block legitimate data. And we reject rather than silently
   redact — because silently cleaning teaches the operator nothing."*
4. **(45s) The officer map.** Hotspots cluster in three districts. Point at the suppression
   notice: *"Any cell under five events is hidden. One beneficiary can never be
   re-identified from this map."*
5. **(30s) The honest close.** *"The rules engine is deterministic and unit-tested — the AI
   never decides an entitlement, it only listens and explains. No UIDAI integration is
   claimed. Here is exactly what real ePoS integration would require."* Hold up the roadmap.

Point 5 wins it. Every other team will claim their AI solves the problem. You will be the
only one who says where the AI is *not* allowed to go — and that is precisely what section 8
of the problem statement asks for.

---

## 11. RISKS AND WHAT TO DO ABOUT THEM

| Risk | Likelihood | Mitigation |
|---|---|---|
| Bhashini onboarding/API key takes hours | **High** | Register in hour 0. Web Speech API fallback built by hour 12. |
| Render free tier cold start during pitch | High | Ping `/health` every 10 min from the dealer PWA. Warm it manually pre-pitch. |
| Venue wifi dies | Medium | Screen recording backup + form flow runs fully offline |
| Gemini rate limit | Medium | Cache classifications by input hash. Deterministic path never needs the LLM. |
| Cannot verify a real circular number | **High** | Write "Pending verification" — never fabricate one |
| Scope creep at hour 20 | **Very high** | Feature freeze at 19. Non-negotiable. |

## 12. FINAL CHECKPOINT

- **Smallest version that still feels real:** form-based diagnosis + rules engine + PII
  firewall + seeded map. That alone is a credible submission. Voice is the amplifier, not
  the foundation.
- **Biggest security risk:** the ASR transcript on the return path. Scrub at egress, not
  just ingress.
- **Build first:** `rules.json` and `rulesEngine.js`. Everything else is a wrapper around them.