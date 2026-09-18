# DEMO SCRIPT (Draft)

**Objective**: Demonstrate the end-to-end flow of diagnosing a synthetic authentication failure and logging it for the Officer Dashboard.

## Scene 1: The Fair Price Shop (FPS)
- **Role**: FPS Dealer
- **Action**: Open the Counter Assistant app.
- **Narrative**: "A beneficiary, let's call them BEN-SYN-001, arrives at the shop. Their fingerprint fails to authenticate on the ePoS machine after three attempts."
- **Action**: In the app, the dealer selects "Authentication Failure".
- **Action**: The dealer answers simple diagnostic questions (e.g., "What type of error?" -> "Biometric Mismatch").
- **Narrative**: "Instead of turning the beneficiary away, the app determines the official fallback procedure."
- **Action**: The app displays the documented fallback (e.g., Iris scan fallback or OTP-based fallback) with simple instructions.
- **Action**: The dealer follows the steps, marks the procedure as "Actioned", and logs the synthetic event.

## Scene 2: The Officer Dashboard
- **Role**: District Supply Officer
- **Action**: Switch to the Officer Dashboard view.
- **Narrative**: "As these failures happen, they are logged synthetically without exposing PII."
- **Action**: Show the dashboard updating with the new failure event.
- **Action**: Highlight the charts showing "Hotspots" (e.g., a specific shop having an unusual number of biometric failures).
- **Narrative**: "Officials can now proactively identify device issues or training gaps at specific shops without waiting for manual reports."

## Scene 3: Voice & Accessibility
- **Role**: FPS Dealer (Voice Mode)
- **Action**: Dealer clicks the microphone icon.
- **Narrative**: "For dealers who may struggle with the interface, they can just speak."
- **Action**: Speak: "Fingerprint is not matching."
- **Action**: The diagnostic engine automatically selects the right failure cause.
