# JeevikaAI: Architecture Audit & Prioritized Implementation Plan

> **Product Vision**: A voice-first, highly accessible livelihood and skill guidance platform tailored for individuals facing language barriers or limited digital literacy. The platform collects education, existing skills, interests, occupation, location, and work mobility preferences through natural Hindi, English, and Bhojpuri conversation, recommending NSQF-aligned training pathways and local opportunities.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The audit of `https://github.com/SwiftSwap-1/JeevikaAi` revealed that on 2026-10-15, commits (`abc134c`, `3642a6f`, `9332902`) removed `app.jsx`, `index.html`, and `shell.html`, causing `https://jeevikaai.pages.dev/` to return an HTTP 404 error. The complete codebase has been retrieved from commit `2a9ca785c11419f22ae0888a48f982a9ed62bd9c`. As requested, development will continue using the **HTML, CSS, and JavaScript / React architecture**.

- **Confirmed Decision 1 (Stack Preservation)**: Retain the lightweight HTML, CSS, and JavaScript architecture with in-browser React and zero build overhead, ensuring compatibility with Cloudflare Pages and offline-first edge deployment.
- **Confirmed Decision 2 (Non-Destructive Restoration)**: Immediately restore and stabilize the deleted core files (`index.html`, `app.jsx`, `shell.html`) to make the live prototype operational again before adding new features.
- **Confirmed Decision 3 (Dual-Engine AI & Voice Strategy)**: Keep the deterministic, transparent rule-based scoring engine for instant offline recommendations while layering a secure server-side Gemini conversational voice proxy for dynamic Hindi/Bhojpuri dialogue and synthesis.
- **Confirmed Decision 4 (Zero-Barrier Guest Access)**: Full questionnaire, transparent fit explanations, and roadmap features remain accessible without sign-in; Firebase Auth and Firestore will be added as an optional, unobtrusive "Save your progress" feature.

---

## 1. Repository & Prototype Audit Findings

### 1.1 Current Architecture & Implemented Features
- **Frontend Core**: Single-bundle standalone application (`index.html` compiled from `shell.html` + `app.jsx`). Utilizes React 18 and ReactDOM loaded via cdnjs, with Google Fonts (`Bricolage Grotesque` and `Hind`).
- **Voice Guidance**: In-browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) supporting Hindi (`hi-IN`) and Indian English (`en-IN`), with error fallbacks and a full keyboard/text input alternative.
- **Explainable Matching Engine**: Deterministic rule-based evaluation (`evaluate()` in `app.jsx`) combining base points (30 pts), interest keyword matching (up to 36 pts), existing skill matching (up to 18 pts), education prerequisites (±8 pts), work preference (+8 pts), travel range / mobility matrix (up to 8 pts), and local demand signals.
- **Roadmap & Opportunity Showcase**: Multi-stage learning pathways with progress toggles and filterable local livelihood options with proximity badges and shortlisting.
- **Sample Data Integrity**: High-quality, culturally resonant demo profile (*Sunita Devi*, Maharajganj, UP) clearly marked with "Fictional sample data" tags and disclaimers.

### 1.2 Incomplete Integrations & Gaps
1. **Repository State & Live Deployment Failure**: Cloudflare Pages (`https://jeevikaai.pages.dev/`) fails with 404 because recent GitHub commits deleted all files in `main`.
2. **Persistence & Accounts**: Firebase Auth and Cloud Firestore mentioned in the stack are not yet implemented; refreshing the page resets in-memory assessment data.
3. **Conversational Intelligence**: No conversational LLM integration exists; user answers are processed strictly by hardcoded keyword matching rather than conversational extraction.
4. **Bhojpuri & Dialect Support**: Web Speech API lacks native support for `bho-IN` across standard Android/iOS browsers.
5. **Text-to-Speech (Audio Readout)**: The current implementation only supports voice input (STT); there is no audio playback/read-aloud for users with low reading literacy.

### 1.3 Security & Privacy Evaluation
- **Zero Exposed Secrets**: Currently, no private API keys or tokens are checked into the repository or client-side code.
- **Input Sanitization**: Profile summary generation uses raw string concatenation for names, requiring strict HTML escaping and sanitization before export.
- **Microphone Permissions**: Properly handles `not-allowed`, `no-speech`, and `audio-capture` errors with polite fallback to manual selection.

---

## 2. User Experience & Visual Design

The UI will strictly adhere to the universal design constitution and mobile touch ergonomics for first-time digital users:

```
┌────────────────────────────────────────────────────────┐
│ [Ribbon: Demo Prototype / Disclaimers]                 │
│ [Sticky Nav: JeevikaAI Logo | Lang Selector | Nav]     │
├────────────────────────────────────────────────────────┤
│ HERO VIEWPORT (Bricolage Grotesque + Hind)             │
│  "Your Skills. Your Language. Your Livelihood."        │
│  [Large 56px Mic Pulse CTA] [Explore Opportunities]    │
│  Floating Live Preview Card (Sunita Devi, 92% Match)   │
├────────────────────────────────────────────────────────┤
│ GUIDED ASSESSMENT (Natural Thumb Zone)                 │
│  - Progress Tracker (Step X of 8)                      │
│  - Audio Prompt & TTS Speaker Button                   │
│  - Large 64px Central Microphone Button                │
│  - Live Audio Waveform & Speech Feedback ("Heard:")    │
│  - Quick-Tap Suggestion Chips & Text Fallback Area     │
├────────────────────────────────────────────────────────┤
│ ROADMAP DASHBOARD (Desktop 2-Col / Mobile Single Col)   │
│  [Left: Sticky Profile Card & Edit Shortcut]           │
│  [Right: Top NSQF Pathways + Match Score Gauge]        │
│    └─ "Why this recommendation?" Transparent Breakdown │
│    └─ 3-Stage Learning Timeline with Checkboxes        │
│    └─ Hyperlocal Opportunities (Filters: Job / Self)   │
└────────────────────────────────────────────────────────┘
```

- **Color Palette & Visual Tokens**:
  - Dominant Neutral: Deep Navy Canvas (`#0E2E50` to `#163A63`), Clean Crisp Surface (`#FFFFFF` light, `#10253B` dark), Subtle Divider (`#D9E3EE`).
  - Brand Primary: Accessible Ocean Blue (`#1479BD`) and Livelihood Teal (`#18A999`).
  - Text: High-contrast Ink (`#0E2238` on light, `#E6EEF7` on dark).
- **Typography**: `Bricolage Grotesque` for display and section headers; `Hind` for readable Hindi and English body text.
- **Ergonomics**: All buttons, microphone controls, and chips maintain touch hitboxes $\ge 48 \times 48\text{px}$.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Dual-Engine Architecture (Deterministic + LLM)
- **Chosen Approach**: Use the deterministic, transparent rule-based algorithm as the core engine, while using Google Gemini as an auxiliary conversational assistant to clarify inputs and extract profile parameters.
- **Why**: Transparency is non-negotiable in civic and livelihood recommendations. Beneficiaries must understand *why* a career is recommended without black-box hallucinations.
- **Alternative Considered**: Full LLM-generated recommendations. Rejected because LLMs can hallucinate non-existent certification levels or unverified wage promises.

### Decision 2: Text-to-Speech (TTS) Read-Aloud for Illiterate Beneficiaries
- **Chosen Approach**: Implement in-browser Web Speech Synthesis (`window.speechSynthesis`) with Hindi voice detection, reading out questions and roadmap summaries aloud.
- **Why**: A voice-first platform cannot assume reading literacy; auditory guidance completes the accessibility loop.

### Decision 3: Progressive Persistence
- **Chosen Approach**: Save current state to `localStorage` immediately so progress is never lost during accidental page refreshes. Add Firebase Auth and Cloud Firestore as an optional cloud backup.
- **Why**: First-time smartphone users frequently switch apps or accidentally reload; forced sign-in causes high drop-off.

---

## 4. Technical Architecture & Phased Implementation Plan

### 4.1 System Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                         │
│  ┌───────────────────────┐      ┌─────────────────────────┐ │
│  │  Voice Audio Engine   │      │   Navigation & Views    │ │
│  │  - Web Speech STT/TTS │      │   - Home Landing        │ │
│  │  - Waveform Visualizer│      │   - Voice Assessment    │ │
│  └──────────┬────────────┘      │   - Roadmap Dashboard   │ │
│             │                   └────────────┬────────────┘ │
│             ▼                                ▼              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               Beneficiary State Manager                │ │
│  │  - LocalStorage Cache & Session Recovery               │ │
│  │  - Optional Firebase Auth & Firestore Sync             │ │
│  └──────────────────────────┬─────────────────────────────┘ │
│                             ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Rule-Based Scoring & NSQF Engine              │ │
│  │  - Tag Matching (Interests / Skills / Education)       │ │
│  │  - Mobility Matrix (Nearby / District / State)         │ │
│  │  - Opportunity Ranking & Shortlisting                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
               (When Online / Proxy Configured)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SECURE BACKEND PROXY                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Cloudflare Worker / Express Proxy                     │ │
│  │  - Gemini API Structured Extraction (Hindi / Bhojpuri) │ │
│  │  - Firestore Rule Enforcement & User Profiles          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Prioritized Phased Implementation Plan

#### Phase 1: Repository Stabilization & Zero-Loss Recovery (Immediate)
- **Goal**: Restore the repository and bring `https://jeevikaai.pages.dev/` back online.
- **Affected Files**: `index.html`, `app.jsx`, `shell.html`, `README.md`.
- **Dependencies**: Git history commit `2a9ca785c11419f22ae0888a48f982a9ed62bd9c`.
- **Acceptance Criteria**:
  - `index.html` loads cleanly in all browsers without compilation errors.
  - Landing page, 8-question assessment, Sunita Devi demo profile, and roadmap render seamlessly.

#### Phase 2: Speech Accessibility & Bhojpuri Dialect Optimization
- **Goal**: Add Text-to-Speech (TTS) audio readout and Bhojpuri conversational prompts.
- **Affected Files**: `app.jsx`, `shell.html`.
- **Acceptance Criteria**:
  - Beneficiary can tap a speaker icon to hear questions read aloud in Hindi.
  - Bhojpuri spoken phrases and common vocabulary variants are mapped in keyword matching.
  - Voice wave animation reacts to speech input; explicit guidance provided if microphone is blocked.

#### Phase 3: Offline-First Persistence & State Recovery
- **Goal**: Prevent loss of beneficiary responses across reloads and mobile backgrounding.
- **Affected Files**: `app.jsx`.
- **Acceptance Criteria**:
  - Assessment answers automatically persist to `localStorage`.
  - Beneficiaries can resume incomplete assessments without starting over.

#### Phase 4: Gemini AI Structured Dialogue & Backend Proxy Setup
- **Goal**: Enable natural open-ended conversational collection via Gemini API with secure key protection.
- **Affected Files**: `server.ts` or Cloudflare Worker script, `app.jsx`.
- **Manual Setup Requirements**: User adds `GEMINI_API_KEY` in environment secrets.
- **Acceptance Criteria**:
  - Users can say natural unstructured sentences (e.g., "हम सिलाई कइले बानी अउर गाँव में काम खोजत बानी").
  - Backend proxy extracts structured parameters (`skills: ['stitching']`, `mobility: 'nearby'`) and feeds them into the explainable scoring engine.

#### Phase 5: Optional Firebase Authentication & Cloud Sync
- **Goal**: Enable saving profiles to the cloud across devices without blocking first-time users.
- **Affected Files**: `app.jsx`, `firebase-config.js`.
- **Manual Setup Requirements**: Firebase project provisioning via `set_up_firebase` tool.
- **Acceptance Criteria**:
  - Sign-in button available in dashboard header.
  - Saved roadmaps and shortlisted opportunities sync securely to Firestore.

---

## 5. Verification & Acceptance Checklist

- [ ] Complete codebase restored and verified against the original repository.
- [ ] No API keys or private credentials exposed in client code.
- [ ] Voice assessment works with Web Speech API and gracefully falls back to text.
- [ ] Transparent scoring formula clearly explains every point in "Why this recommendation?".
- [ ] All interactive buttons and touch targets meet the $\ge 48\text{px}$ standard.
