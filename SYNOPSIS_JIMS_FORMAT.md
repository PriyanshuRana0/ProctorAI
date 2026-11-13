# SYNOPSIS OF THE PROJECT

**Course:** Master of Computer Applications (MCA) – Semester III  
**Paper Code:** MCA-269 (Minor Project – III)  
**Institution:** Jagan Institute of Management Studies (JIMS), Rohini, Sector-5, Delhi  
**Affiliated University:** Guru Gobind Singh Indraprastha University (GGSIPU), Delhi  
**Batch:** 2025–2027  

---

### 1. Title of Project
**ProctorAI: Autonomous Online Examination Proctoring and Integrity Assessment System Using Client-Side Computer Vision and Browser Telemetry**

---

### 2. Problems with the Existing System (Manual System)
Traditionally, academic examinations and certification evaluations have relied upon manual in-person invigilation conducted in designated physical examination centers. Under this manual system, human proctors are physically present in examination halls to supervise examinees, inspect admission credentials, distribute question papers, and watch for unauthorized materials or illicit communication. Although this traditional model has served academic institutions for decades, it exhibits several fundamental weaknesses and critical operational bottlenecks:

* **Excessive Manpower & High Staffing Costs:** A typical physical examination requires 1 to 2 human invigilators for every 25 to 30 students. Conducting university-wide examinations across hundreds or thousands of students requires mobilizing extensive human resources, leading to high administrative overhead and logistical expenses.
* **Human Observer Fatigue & Inattention:** Continuous human visual surveillance over a 2 to 3 hour examination period invariably induces cognitive fatigue. Studies confirm that human attention spans degrade significantly over prolonged monitoring sessions, resulting in blind spots where subtle cheating behaviors—such as quick glances at concealed notes, whispers, or hand signals—frequently go undetected.
* **Inability to Supervise Remote / Distance Learning:** Physical invigilation is fundamentally incapable of supporting distance education, remote degree programs, and global certification exams where candidates reside in dispersed geographic locations. When institutions attempt manual supervision over video conferencing tools (such as Zoom or Google Meet), a single proctor must observe a grid of 20 to 30 miniature video tiles, making it practically impossible to spot unauthorized screen switching or secondary individuals off-camera.
* **Subjectivity & Lack of Tamper-Evident Evidence:** In manual proctoring, when an invigilator suspects a candidate of malpractice, there is rarely an indisputable, timestamped audit trail or photographic evidence. Disciplinary proceedings often depend solely on the invigilator's subjective testimony, leading to legal challenges, academic disputes, and student grievances.
* **Bandwidth & Server Bottlenecks in Naive Automated Systems:** Early automated proctoring software solutions attempt to stream raw video feeds from examinees' webcams to central cloud servers. This approach consumes over 1 Gbps of continuous upstream bandwidth for a single examination cohort, requires expensive dedicated GPU clusters for video decoding, and violates student privacy under data regulations (such as GDPR and FERPA) by continuously recording domestic spaces.

---

### 3. Description of the Proposed System (Web-Based, Online System)
The proposed system, titled **"ProctorAI"**, is a modern, web-based, fully automated examination proctoring platform designed to guarantee academic integrity during unproctored online assessments. It operates entirely within modern web browsers without requiring students to download invasive native executables, kernel-level drivers, or specialized hardware.

ProctorAI introduces an **edge-computing paradigm** for remote invigilation. Instead of streaming continuous video to centralized servers, artificial intelligence neural network models (TensorFlow.js BlazeFace) and acoustic analysis routines execute locally on the candidate's browser via WebGL hardware acceleration. The video feed is analyzed frame-by-frame in real time at 30+ frames per second, ensuring zero latency and 100% data privacy. Raw video never leaves the student's machine.

The key innovations and features of the proposed web-based system include:
* **Automated Candidate Absence Detection (No Face):** The system monitors continuous facial presence. If the candidate steps away from their desk, obscures the camera, or disappears from the viewport for more than 2.5 seconds, an audible alert is sounded, an evidence snapshot is captured, and an infraction is timestamped.
* **Unauthorized Multi-Person Intrusion Detection (Multiple Faces):** The neural network model tracks all detected faces in the frame. If two or more faces appear simultaneously, the system immediately flags a critical security violation, outlines unauthorized individuals in red bounding boxes, and records photographic evidence.
* **Gaze & Head Posture Surveillance:** By calculating geometric ratios between facial landmarks (eyes and nose tip), the system detects when a candidate is turning their head sideways or looking away from the monitor for prolonged durations to consult unauthorized aids.
* **Browser Security & Tab-Switching Lock:** Leveraging the HTML5 Page Visibility API and Window Focus events, the system immediately catches instances where the student switches tabs, minimizes the exam window, or opens external applications, recording the departure timestamp and cumulative seconds spent away.
* **Enforced Fullscreen Viewport Lockdown:** The exam operates inside a locked fullscreen mode. If the candidate attempts to exit fullscreen, an immediate screen lockout modal blocks exam interaction until fullscreen is resumed, and a penalty deduction is applied.
* **Clipboard & Developer Tools Interception:** Prevents digital cheating by neutralizing copy/paste actions (`Ctrl+C`, `Ctrl+V`), right-click context menus, and Developer Tools inspection shortcuts (`F12`, `Ctrl+Shift+I`, `Ctrl+U`).
* **Acoustic Noise & Speech Surveillance:** The Web Audio API performs Fast Fourier Transform (FFT) analysis on microphone input to detect sustained whispers, conversations, or audio assistance without streaming continuous room audio.
* **Dynamic Trust Score & Automated Audit Dossier:** A mathematical decision algorithm calculates an objective Trust & Integrity Score (0–100%). At exam submission, an authoritative audit report is generated with watermarked evidence snapshots, chronological violation logs, and print-ready PDF export.

---

### 4. Description and Identification of the Functional Modules
In accordance with software engineering principles, the system is decomposed into modular components serving two primary user roles:
* **Candidate / Student:** Authenticates into the examination portal, completes hardware diagnostic checks, accepts the academic integrity pledge, takes the assessment under real-time HUD monitoring, receives instant visual/audio feedback on infractions, and views/prints their final integrity report.
* **Examiner / Faculty Proctor / Administrator:** Accesses the centralized oversight dashboard to review all candidate sessions, examine quantitative trust scores, inspect tamper-evident photographic violation evidence, filter suspicious candidates, and export permanent academic audit records.

The functional modules of ProctorAI are defined as follows:
* **Module 1: Candidate Authentication & Diagnostic Gate (`login-view`):** Collects candidate credentials (Name, Student ID, Email, Exam selection). Executes a live diagnostic camera preview with a face alignment guide oval and an interactive microphone sensitivity audio meter, enforcing an academic integrity pledge before entry.
* **Module 2: Computer Vision Facial Telemetry & Gaze Engine (`detector.js`):** Executes client-side TensorFlow.js BlazeFace inference. Processes webcam video frames at 20–30 FPS, computes 6 facial landmark points, calculates looking-away orientation, renders real-time color-coded bounding boxes, and flags 'No Face' or 'Multiple Faces' violations.
* **Module 3: Browser Security & Anti-Cheat Telemetry Guard (`securityGuard.js`):** Listens to HTML5 browser lifecycle events. Intercepts tab switching (`document.visibilitychange`), window blur (`window.onblur`), fullscreen exits (`fullscreenchange`), and blocks restricted keystrokes (`Ctrl+C`, `Ctrl+V`, `F12`, `Ctrl+Shift+I`) and context menus.
* **Module 4: Acoustic Noise & Speech Surveillance Module (`audioMonitor.js`):** Utilizes the Web Audio API (`AudioContext` and `AnalyserNode`) to compute root-mean-square (RMS) volume frequencies, detecting background speech spikes and whispers exceeding a 42% threshold for 30 consecutive frames.
* **Module 5: Interactive Examination Engine (`examQuestions.js` & `app.js`):** Delivers multi-topic academic questions, formatted code snippets, interactive radio selections, question palette navigation, review flagging, and a synchronized countdown timer with auto-submission upon time expiry.
* **Module 6: Dynamic Trust Scoring & Decision Rule Engine (`server.js`):** Implements a mathematical deduction algorithm starting from a base score of 100 points, deducting weighted penalties based on infraction severity and duration, and assigning official integrity verdicts (High Integrity, Needs Review, Disqualified).
* **Module 7: Tamper-Evident Evidence & Snapshot Capture Module:** Uses the HTML5 Canvas 2D API to capture video frames at the exact millisecond of a violation, burns a cryptographic header and footer watermark with timestamp and violation details, and transmits base64 JPEG buffers to the backend repository.
* **Module 8: Comprehensive Audit Report & PDF Generator (`reportGenerator.js`):** Renders a post-exam dossier with a circular SVG trust gauge, categorized infraction metrics, snapshot evidence gallery, chronological event timeline, and one-click print-to-PDF formatting via CSS3 `@media print` stylesheets.
* **Module 9: Faculty Administration & Oversight Dashboard (`admin-view`):** Provides an administrative interface displaying a ledger of all conducted sessions with search, status filtering, and one-click inspection of any candidate's full report and evidence photos.

---

### 5. Tools/Platforms

#### 5.1 Hardware Specifications:
* **Development & Target Machine:** Modern desktop or laptop computer.
* **Processor:** Intel Core i3 / i5 / i7 or AMD Ryzen 3 / 5 / 7 (Multi-Core, 2.0 GHz or higher).
* **RAM:** 8 GB RAM minimum (16 GB recommended for multitasking).
* **Hard Disk / SSD:** Adequate SSD storage with at least 512 MB available space for project source code and snapshots.
* **Input Peripherals:** Standard QWERTY keyboard, mouse / trackpad, built-in or USB HD webcam (720p/1080p), and integrated/USB microphone.
* **Display Resolution:** 1280 x 720 minimum (1920 x 1080 full HD recommended).

#### 5.2 Software Specifications:
* **Operating System:** Microsoft Windows 10/11, macOS, or Linux.
* **Frontend Technologies:** HTML5, CSS3, Modern JavaScript (ES6+), and Tailwind CSS.
* **Backend Runtime:** Node.js (v18.x, v20.x, or higher).
* **API Framework:** Express.js with CORS middleware.
* **Artificial Intelligence & Vision:** Google TensorFlow.js (`@tensorflow/tfjs`) & BlazeFace (`@tensorflow-models/blazeface`).
* **Audio Processing Subsystem:** HTML5 Web Audio API (`AudioContext`, `AnalyserNode`).
* **Database & Storage:** Flat-file structured JSON persistence (`sessions.json`) & file-system snapshot directory (`data/snapshots/`).
* **Browser APIs & Interfaces:** MediaDevices API (`getUserMedia`), Canvas 2D API, Page Visibility API, and Fullscreen API.
* **Development & Testing Tools:** Visual Studio Code, Git, GitHub, Postman, PowerShell, and Google Chrome / Microsoft Edge.

---

### 6. Methodology

#### 6.1 SDLC Model to be used:
The project adopts the **Agile Iterative Development Model** (combining iterative prototyping with sprint-based milestones). Under this approach, the project is broken down into small, manageable iterations (sprints) where analysis, design, implementation, and testing are executed concurrently across functional modules.

#### 6.2 Justification for the Selection of Model:
* **Integration of Heterogeneous Technologies:** The project integrates diverse technical disciplines: neural network inference in the browser, digital audio signal processing, low-level browser security hooks, and REST backend services. An iterative model allows each subsystem to be designed, implemented, and verified independently before assembling the composite system.
* **Empirical Threshold Tuning & Calibration:** Critical proctoring parameters—such as the 2.5-second temporal threshold for missing faces, the 0.68 ratio for gaze displacement, and the 42% volume threshold for audio spikes—cannot be determined theoretically. The Agile iterative approach provides rapid feedback loops to test, calibrate, and eliminate false positives through repeated empirical testing.
* **Risk Mitigation & Continuous Testing:** In a conventional Waterfall model, system integration occurs only at the final stage, creating severe risks of architectural failure. Agile iterative development ensures continuous integration testing at the end of each sprint, uncovering performance bottlenecks and cross-browser incompatibilities early in the lifecycle.
* **Alignment with MCA-269 Academic Milestones:** The iterative model directly aligns with the academic review schedule prescribed for Minor Project – III (MCA-269): Review 1 focuses on requirements and SRS; Review 2 focuses on design models and partial implementation; Review 3 focuses on comprehensive testing and draft reporting.

---

### 7. Future Scope
While the current system provides robust, real-time edge proctoring, several avenues for future enhancement have been identified:
* **Pupil & Eye-Gaze Calibration (WebGazer.js):** Implement a 9-point calibration routine at the start of the exam to track exact pupil coordinates on the screen, distinguishing between reading on-screen questions and glancing at off-screen notes or physical cheat sheets.
* **Dual-Camera Mobile Device Synchronization:** Allow examinees to pair their smartphone via WebRTC QR-code scanning to provide a secondary lateral 45-degree angle, enabling full visibility of the keyboard, hands, and physical desk environment.
* **Speech-to-Text NLP Query Recognition:** Integrate on-device speech recognition (Web Speech API) to transcribe background audio in real time and apply Natural Language Processing to detect exam-specific question keywords being spoken aloud.
* **Object Detection for Unauthorized Devices (COCO-SSD):** Integrate lightweight computer vision object detection models to actively recognize and flag physical contraband in the camera frame, such as mobile phones, earphones, smartwatches, and textbooks.
* **Learning Management System (LMS) Integration via LTI Standard:** Package the proctoring engine as a certified Learning Tools Interoperability (LTI) application, enabling seamless one-click embedding inside institutional LMS platforms such as Moodle, Canvas, Blackboard, and Google Classroom.
* **Blockchain-Backed Immutable Audit Verification:** Generate cryptographic SHA-256 hashes of the final proctoring audit dossier and anchor them onto a public/consortium blockchain ledger (e.g., Polygon/Ethereum) to provide tamper-proof, mathematically verifiable proof of examination integrity for academic transcripts.
