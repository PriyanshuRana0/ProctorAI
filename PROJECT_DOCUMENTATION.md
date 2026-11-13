# ProctorAI — Comprehensive College Project Documentation & Viva Guide

---

## 1. Project Title & Abstract

### Title:
**ProctorAI: Edge-Compute Autonomous Examination Proctoring System Using Client-Side Computer Vision and Browser Telemetry**

### Abstract:
With the widespread adoption of remote education and online certification, maintaining academic integrity in unproctored environments is a critical challenge. Traditional human proctoring suffers from high staffing costs, fatigue, and scalability bottlenecks, while cloud-based video streaming proctoring introduces severe bandwidth consumption, high server infrastructure costs, and privacy concerns.

**ProctorAI** addresses these limitations by implementing a **decentralized, edge-compute proctoring architecture**. The system conducts real-time face detection, gaze posture analysis, tab-switch monitoring, and acoustic activity detection directly within the candidate's web browser using TensorFlow.js BlazeFace and HTML5 APIs. Any security anomaly triggers an automated evidence snapshot, logs the event with cryptographic timestamps, and calculates a dynamic Trust & Integrity Score (0–100%). At the conclusion of the assessment, an auditable post-exam dossier is generated with visual violation proof, designed for instant export and faculty evaluation.

---

## 2. Technology Stack & Justification ("Why Each Technology Was Used")

| Layer | Technology | Why It Was Chosen / Purpose in Project |
| :--- | :--- | :--- |
| **AI / Computer Vision** | **TensorFlow.js & BlazeFace Neural Model** | Lightweight sub-millisecond face detector developed by Google. Unlike heavy server-side Python OpenCV models, running BlazeFace in the browser provides **zero video streaming bandwidth**, **complete user privacy** (video never leaves candidate's device), and real-time 30+ FPS detection without dedicated GPUs. |
| **Acoustic Monitoring** | **Web Audio API (`AudioContext`, `AnalyserNode`)** | Processes audio signals from the microphone via Fast Fourier Transform (FFT) frequency analysis. Detects background murmurs, whispers, and acoustic spikes without recording or transmitting continuous private audio. |
| **Browser Security** | **HTML5 Page Visibility API & Fullscreen API** | Intercepts tab switching (`visibilitychange`), window minimization, and focus loss (`blur`). The Fullscreen API locks the candidate inside a secured viewport, immediately capturing infractions if bypassed. |
| **Evidence Watermarking** | **HTML5 Canvas 2D Context** | Captures high-resolution video frames at the millisecond of any infraction, embeds tamper-evident metadata watermarks (session ID, timestamp, violation type), and exports compressed base64 JPEG blobs. |
| **Frontend Framework** | **Modern Vanilla JavaScript (ES6+), HTML5, Tailwind CSS** | Ensures maximum portability and lightning-fast loading speed with zero bundler friction. Native event handling allows low-level interception of keystrokes (`Ctrl+C`, `Ctrl+V`, `F12`, `Alt+Tab`) and context menu clicks. |
| **Backend & API** | **Node.js & Express.js** | Lightweight, event-driven, non-blocking I/O server. Manages session lifecycles, aggregates violation telemetry, stores evidence snapshots, and computes final integrity scores via REST endpoints. |
| **Persistence Layer** | **JSON Flat-File / File Storage** | Zero-dependency, self-contained persistence. Eliminates external database installation overhead (e.g. MySQL/PostgreSQL setup) while allowing instant inspection, export, and portability across machines. |
| **Reporting Engine** | **CSS3 Paged Media (`@media print`) & JSON Exporter** | Formats dynamic reports into formal print-ready A4/Letter PDF audit certificates, eliminating reliance on third-party PDF server rendering libraries like Puppeteer. |

---

## 3. System Architecture & Telemetry Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANDIDATE CLIENT BROWSER                        │
│                                                                        │
│  ┌───────────────────────┐           ┌───────────────────────────────┐ │
│  │   Webcam Video Stream │           │     Microphone Audio Stream   │ │
│  └───────────┬───────────┘           └───────────────┬───────────────┘ │
│              │                                       │                 │
│              ▼                                       ▼                 │
│  ┌───────────────────────┐           ┌───────────────────────────────┐ │
│  │  TensorFlow BlazeFace │           │     Web Audio API Analyser    │ │
│  │  • No Face (>2.5s)    │           │     • Noise / Speech Spikes   │ │
│  │  • Multi-Face (>1)    │           │     • Dynamic dB Threshold    │ │
│  │  • Head Yaw / Gaze    │           └───────────────┬───────────────┘ │
│  └───────────┬───────────┘                           │                 │
│              │                                       │                 │
│              │       ┌───────────────────────┐       │                 │
│              │       │ Browser Event Guard   │       │                 │
│              │       │ • Tab Visibility      │       │                 │
│              │       │ • Window Blur         │       │                 │
│              │       │ • Fullscreen Exit     │       │                 │
│              │       │ • Shortcut Block      │       │                 │
│              │       └───────────┬───────────┘       │                 │
│              │                   │                   │                 │
│              ▼                   ▼                   ▼                 │
│        ┌───────────────────────────────────────────────────┐           │
│        │        Real-Time Proctor Coordinator (app.js)     │           │
│        │  - Visual HUD Overlay (Green/Red Bounding Boxes)  │           │
│        │  - Dynamic Integrity Trust Score Algorithm        │           │
│        │  - Canvas Evidence Watermark Snapshot Capture     │           │
│        └─────────────────────────┬─────────────────────────┘           │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ HTTPS / REST (JSON + Base64 Snapshots)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          NODE.JS EXPRESS SERVER                        │
│                                                                        │
│  ┌─────────────────────────┐           ┌────────────────────────────┐  │
│  │   Session Controller    │           │    Violation Controller    │  │
│  │   /api/sessions/start   │           │    /api/sessions/:id/vio   │  │
│  └───────────┬─────────────┘           └────────────┬───────────────┘  │
│              │                                      │                  │
│              ▼                                      ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Data Storage & Archival Engine                  │  │
│  │   • sessions.json (Candidate Ledger, Scores, Time Logs)          │  │
│  │   • snapshots/ (Timestamped Watermarked Evidence JPEG Files)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                  │                                     │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Report & Audit Generator                     │  │
│  │   • Integrity Status Gauge (High / Review / Disqualified)       │  │
│  │   • Print-Optimized PDF Audit Dossier                            │  │
│  │   • Cryptographic JSON Audit Trail                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Functional Modules & Implementation Details

### Module 1: Pre-Exam Diagnostics & Candidate Gate (`login-view`)
- **Purpose**: Authenticates candidate identity and ensures hardware readiness before assessment starts.
- **Workflow**:
  1. Candidate enters Name, Student ID, Email, and selects the examination paper.
  2. The system executes a live diagnostic loop via `navigator.mediaDevices.getUserMedia`.
  3. Displays a video stream with an alignment oval to verify lighting and camera positioning.
  4. Tests microphone responsiveness with a real-time decibel meter bar.
  5. Forces explicit agreement to an Academic Integrity Pledge.

### Module 2: Computer Vision Face Detection & Gaze Engine (`detector.js`)
- **Purpose**: Continuously monitors the webcam feed for visual anomalies.
- **Key Detections**:
  - **No Face Detected**: If `predictions.length === 0` for $\ge 2.5\text{ seconds}$, a high-severity infraction is triggered.
  - **Multiple Faces Detected**: If `predictions.length > 1`, an immediate critical alert is fired with the count of unauthorized individuals.
  - **Gaze / Head Posture Analysis**:
    Using BlazeFace 6-point landmarks ($E_{\text{right}}, E_{\text{left}}, N_{\text{nose}}$):
    $$\text{Nose Offset Ratio} = \frac{|N_x - \frac{E_{\text{right},x} + E_{\text{left},x}}{2}|}{|E_{\text{left},x} - E_{\text{right},x}|}$$
    If this ratio exceeds $0.68$, the candidate is looking away or turning their head sideways.

### Module 3: Browser Security Guard (`securityGuard.js`)
- **Purpose**: Prevents off-screen cheating, search-engine lookups, and unauthorized collaboration.
- **Key Detections**:
  - `document.visibilitychange`: Captures departure timestamp and return timestamp; computes exact absence duration.
  - `window.onblur`: Detects clicking on secondary monitors, chat overlays, or external desktop apps.
  - `fullscreenchange`: Enforces fullscreen containment. Exiting triggers an immediate lockout modal.
  - **Keystroke Interception**: Blocks `Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `F12`, and `Ctrl+Shift+I` to prevent clipboard cheating and inspecting answer keys.

### Module 4: Acoustic Noise Monitor (`audioMonitor.js`)
- **Purpose**: Detects unauthorized verbal communication or whisper assistance.
- **Mechanism**:
  - Creates an `AnalyserNode` connected to the candidate's microphone.
  - Samples frequency byte data via `getByteFrequencyData()`.
  - Calculates average volume level $\text{RMS} = \frac{1}{N}\sum_{i=0}^N \text{freq}[i]$.
  - If volume exceeds $42\%$ for $\ge 30\text{ consecutive frames}$ (~1 sec), an audio anomaly is recorded.

### Module 5: Dynamic Integrity Scoring Algorithm
- **Purpose**: Quantifies candidate trustworthiness on a 0–100% scale.
- **Mathematical Formula**:
  $$\text{Integrity Score} = 100 - \sum \text{Penalties}$$
  Where penalties are calculated as:
  - **Multiple Faces**: $-20\text{ points}$ per incident (Critical)
  - **No Face**: $-5\text{ points}$ per incident $+ \lfloor\frac{\text{seconds absent}}{4}\rfloor$
  - **Tab Switch**: $-10\text{ points}$ per incident $+ \lfloor\frac{\text{seconds away}}{5}\rfloor$
  - **Fullscreen Exit**: $-8\text{ points}$ per incident
  - **Window Blur**: $-4\text{ points}$ per incident
  - **Audio Spike**: $-2\text{ points}$ per incident
  - Score is clamped: $\max(0, \min(100, \text{Score}))$.
- **Official Verdict Thresholds**:
  - **High Integrity (Verified)**: $\text{Score} \ge 80\%$, zero multiple-face incidents.
  - **Suspicious / Review Recommended**: $50\% \le \text{Score} < 80\%$.
  - **High Risk / Disqualified**: $\text{Score} < 50\%$ OR $\ge 3$ multiple-face incidents OR $\ge 5$ tab switches.

### Module 6: Audit Report & Evidence Dossier (`reportGenerator.js`)
- **Purpose**: Generates an authoritative post-exam audit certificate.
- **Contains**:
  - Circular SVG Trust Score Gauge with color coding.
  - Metric breakdown cards (incidents + duration).
  - High-resolution Evidence Snapshots with timestamp watermarks.
  - Chronological Event Timeline ledger.
  - Exam question answers and academic score.
  - 1-Click Print / PDF generation (`@media print` stylesheet) and JSON audit file download.

---

## 5. College Viva Questions & Answers (Frequently Asked Questions)

### Q1: Why did you perform face detection in the browser rather than on the backend server?
> **Answer**: "Running BlazeFace client-side via TensorFlow.js provides three major benefits:
> 1. **Zero Bandwidth Cost**: We do not need to stream continuous 1080p/720p video to the server, allowing the system to scale to thousands of students simultaneously.
> 2. **Complete Privacy (GDPR/FERPA compliant)**: The raw video stream stays inside the student's browser. Only small JPEG snapshots taken during genuine infractions are transmitted to the server.
> 3. **Real-Time Latency**: Detection runs at 20–30 FPS locally, giving the student instantaneous visual feedback and zero network delay."

### Q2: What if a student accidentally blinks or adjusts their glasses? Will it falsely flag 'No Face'?
> **Answer**: "No. We introduced a **time threshold of 2.5 seconds**. Brief blinks (100–300ms) or momentary posture shifts do not trigger any violation. A violation is only registered if no face is detected for consecutive frames spanning more than 2.5 seconds."

### Q3: How do you prevent a student from inspecting the code and finding answers in Developer Tools?
> **Answer**: "We implemented layered defenses:
> 1. Shortcut blocking (`F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+U`) and context menu blocking.
> 2. If Developer Tools is opened by undocking or menu clicks, the exam window immediately loses focus, triggering `window.onblur` and `fullscreenchange` security infractions.
> 3. Exam evaluation can be computed server-side upon submission."

### Q4: How is evidence tamper-proofed?
> **Answer**: "When an infraction occurs, the HTML5 Canvas draws the exact camera frame, superimposes a cryptographic header and footer watermark with the Violation Type, Session ID, and local system ISO timestamp, and converts it to a base64 JPEG that is immediately sent and stored in the server's snapshot repository."

### Q5: What is the computational complexity of the BlazeFace model?
> **Answer**: "BlazeFace is a lightweight convolutional neural network specifically optimized for mobile and edge GPUs. It processes an input frame in approximately 10 to 15 milliseconds on standard CPU/WebGL, making it suitable even for modest student laptops without dedicated graphic cards."

---

## 6. Future Scope & Enhancements

1. **Gaze Calibration Engine**: Integrating WebGazer.js to track exact screen coordinates where the candidate's pupils are focused.
2. **Dual-Camera Mobile Sync**: Connecting the candidate's smartphone via WebRTC QR-code to monitor side angles and desk workspace.
3. **Speech-to-Text NLP Analysis**: Integrating speech recognition (Web Speech API) to transcribe whispered words and detect question-related queries.
4. **Blockchain Audit Trail**: Hashing the final session JSON dossier on a distributed ledger (e.g. Ethereum/Polygon) for tamper-evident academic certificate verification.
