# ProctorAI — Autonomous Online Exam Proctoring System

An enterprise-grade, browser-based AI proctoring system designed to maintain academic integrity during online assessments.

Built with **Node.js, Express, TensorFlow.js BlazeFace Computer Vision, and the Web Audio API**.

---

## Key Features

### 1. Candidate Onboarding & Verification
- **Candidate Authentication**: Full Name, Student/Roll ID, Institutional Email, Assessment selection.
- **Pre-Exam Diagnostic Station**:
  - Live webcam preview with face positioning oval guide.
  - Live microphone test with acoustic visualizer meter.
  - System requirement checks & academic pledge agreement.

### 2. Real-Time AI Computer Vision Detection
- **No Face Detection**:
  - Detects if candidate steps away from desk, blocks camera, or disappears.
  - Automatically raises high-priority violation if face absent for >2.5s.
  - Watermarks and records evidence snapshot with timestamp.
- **Multiple Faces Detection**:
  - Detects 2 or more individuals in camera frame (unauthorized assistance).
  - Highlights primary candidate in green and secondary individuals with red warning bounding boxes.
  - Instantly logs severe security violation and captures photo evidence.
- **Head Turn / Looking Away Gaze Detection**:
  - Real-time facial landmark analysis (eyes, nose, ears) calculating head yaw/pitch angles.
  - Flags when candidate looks away from screen for prolonged periods.

### 3. Browser Security & Anti-Cheat Telemetry
- **Tab Switching Detection**:
  - `document.visibilitychange` tracking: Records exact departure time, return time, and total seconds spent away.
- **Window Focus Loss (`blur`)**:
  - Detects when student clicks external desktop applications (e.g. Chat apps, secondary monitors, search engines).
- **Enforced Fullscreen Lock**:
  - Mandatory fullscreen execution. Exiting fullscreen triggers a screen lockout overlay and penalty deduction.
- **Anti-Cheat Shortcut Blocker**:
  - Intercepts and blocks `Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `F12`, `Ctrl+Shift+I` (DevTools), and right-click context menu.
- **Acoustic Speech & Noise Spikes**:
  - Web Audio API `AudioContext` and `AnalyserNode` monitoring sustained background whispering or talking.

### 4. Comprehensive Post-Exam Proctoring Report
- **Candidate Dossier**: Name, ID, exam subject, session ID, start/finish times, and duration.
- **Dynamic Trust & Integrity Gauge**:
  - Visual circular score dial (0–100%) calculated from weighted infraction points.
  - Status Verdict Badge:
    - **HIGH INTEGRITY (VERIFIED)**: ≥80%
    - **NEEDS REVIEW (SUSPICIOUS)**: 50–79%
    - **HIGH RISK / DISQUALIFIED**: <50% or severe repeated infractions.
- **Categorized Infraction Summary**: Counts and cumulative durations for No-Face, Multiple-Faces, Tab Switches, Fullscreen Exits, and Audio Spikes.
- **Visual Evidence Snapshot Gallery**: High-resolution snapshots captured at the exact moment of each violation with watermarked timestamps.
- **Chronological Audit Trail**: Full ledger of every system event with severity, duration, and notes.
- **Export Options**:
  - One-click **Print / Save as PDF** with printer-friendly styling.
  - **Download JSON Audit Trail** for tamper-evident archival.

### 5. Proctor / Admin Oversight Dashboard
- Review all completed candidate sessions, search student records, inspect verdicts, and review snapshot evidence.

---

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- NPM

### 1. Start Server
\`\`\`bash
cd C:\\Users\\priya_dv0o5xp\\.gemini\\antigravity\\scratch\\proctor-ai
npm start
\`\`\`

The server starts at **`http://localhost:3000`**.

### 2. Open in Browser
Open your browser and navigate to:
\`\`\`
http://localhost:3000
\`\`\`

---

## 🧪 How to Test & Demo

1. **Enter Candidate Details**: Enter your Name and Student ID, or use the prefilled sample data.
2. **Device Diagnostic**: Click **"Verify Camera & Microphone"** and allow browser permissions.
3. **Accept Pledge**: Check the agreement box and click **"Launch Proctored Exam"**.
4. **Test Real Detections**:
   - **No Face**: Cover your webcam or step aside for >2.5s -> Notice the warning banner, chime, and snapshot captured!
   - **Tab Switching**: Switch to another tab or minimize the browser -> Notice the audio chime and tab-switch penalty logged upon returning!
   - **Multiple Faces**: Hold up a photo on your phone or have someone stand behind you -> Immediate red multiple-faces alert!
   - **Testing Toolbar**: You can also use the **Live Testing Simulator** buttons on the right HUD (`No Face`, `2+ Faces`, `Tab Switch`, `Audio Noise`) to simulate violations on demand.
5. **Submit & Generate Report**: Click **"Submit Exam"** to generate the Post-Exam Integrity Report and download or print as PDF!
6. **Admin Dashboard**: Click **"Proctor Dashboard"** in the top navigation bar to inspect past sessions and candidate reports.

---

## Project Structure

\`\`\`
proctor-ai/
├── server.js               # Express backend API & persistent session store
├── package.json            # Node.js dependencies & scripts
├── data/
│   ├── sessions.json       # Audit session database
│   └── snapshots/          # Captured evidence snapshot JPEG files
└── public/
    ├── index.html          # Single Page Application
    ├── css/
    │   └── style.css       # Custom styles & PDF print stylesheet
    ├── vendor/
    │   ├── tf.min.js       # TensorFlow.js runtime (local)
    │   └── blazeface.min.js# BlazeFace neural network model (local)
    └── js/
        ├── app.js          # Core application coordinator & UI state
        ├── detector.js     # Computer Vision Face & Gaze tracker
        ├── securityGuard.js# Tab switch, blur, fullscreen & shortcuts
        ├── audioMonitor.js # Web Audio API speech & noise monitor
        ├── reportGenerator.js # Comprehensive audit report renderer
        └── examQuestions.js# Curated assessment question bank
\`\`\`
