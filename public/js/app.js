// Main Application Controller for ProctorAI
class ProctorApp {
  constructor() {
    this.currentSession = null;
    this.mediaStream = null;
    this.detector = new ProctorDetector();
    this.audioMonitor = new AudioMonitor();
    this.securityGuard = new SecurityGuard();

    this.examQuestions = window.EXAM_DATA ? window.EXAM_DATA.questions : [];
    this.currentQuestionIndex = 0;
    this.userAnswers = {}; // { questionId: selectedOptionIndex }
    this.markedForReview = {}; // { questionId: true }

    this.examTimer = null;
    this.remainingSeconds = 15 * 60; // 15 mins default
    this.totalSeconds = 15 * 60;
    this.examStartTime = null;

    this.authenticatedStudent = null;
    this.liveScore = 100;
    this.warningStrikes = 0;
    this.maxStrikes = 5;

    this.init();
  }

  async init() {
    this.cacheDom();
    this.bindEvents();
    
    // Pre-initialize face detector in background
    this.detector.init().then(ready => {
      console.log('Detector initialized status:', ready);
      const badge = document.getElementById('ai-model-status-badge');
      if (badge) {
        badge.innerHTML = ready ? '🟢 AI Vision Model Ready' : '🟡 Heuristic Vision Ready';
      }
    });

    // Handle view query params if any
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      this.showView('admin-view');
      this.loadAdminSessions();
    }
  }

  cacheDom() {
    // Views
    this.loginView = document.getElementById('login-view');
    this.examView = document.getElementById('exam-view');
    this.reportView = document.getElementById('report-view');
    this.adminView = document.getElementById('admin-view');

    // Authentication elements
    this.authStudentIdInput = document.getElementById('auth-student-id');
    this.authPasswordInput = document.getElementById('auth-password');
    this.btnAuthenticateStudent = document.getElementById('btn-authenticate-student');
    this.authAlertBox = document.getElementById('auth-alert-box');
    this.authVerifiedCard = document.getElementById('auth-verified-card');
    this.authInputContainer = document.getElementById('auth-input-container');
    this.authStatusPill = document.getElementById('auth-status-pill');
    this.btnTogglePassword = document.getElementById('btn-toggle-password');
    this.btnLogoutStudent = document.getElementById('btn-logout-student');
    this.verifiedStudentName = document.getElementById('verified-student-name');
    this.verifiedStudentId = document.getElementById('verified-student-id');
    this.verifiedStudentCollege = document.getElementById('verified-student-college');

    // Login elements
    this.examSelect = document.getElementById('exam-select');
    this.btnCheckHardware = document.getElementById('btn-check-hardware');
    this.hardwareStatusArea = document.getElementById('hardware-status-area');
    this.diagnosticVideo = document.getElementById('diagnostic-video');
    this.audioMeterFill = document.getElementById('audio-meter-fill');
    this.termsCheckbox = document.getElementById('terms-agreement');
    this.btnStartExam = document.getElementById('btn-start-exam');

    // Exam elements
    this.examVideo = document.getElementById('exam-webcam');
    this.examCanvas = document.getElementById('exam-overlay-canvas');
    this.timerDisplay = document.getElementById('exam-timer-display');
    this.trustScoreDisplay = document.getElementById('live-trust-score');
    this.trustScoreBar = document.getElementById('live-trust-bar');
    this.strikeBadge = document.getElementById('warning-strike-badge');
    this.faceStatusBadge = document.getElementById('hud-face-status');
    this.gazeStatusBadge = document.getElementById('hud-gaze-status');
    this.audioStatusBadge = document.getElementById('hud-audio-status');
    this.hudAudioBar = document.getElementById('hud-audio-bar');
    this.questionNavGrid = document.getElementById('question-nav-grid');
    this.questionContentArea = document.getElementById('question-content-area');
    this.btnPrevQuestion = document.getElementById('btn-prev-question');
    this.btnNextQuestion = document.getElementById('btn-next-question');
    this.btnReviewQuestion = document.getElementById('btn-review-question');
    this.btnClearAnswer = document.getElementById('btn-clear-answer');
    this.btnSubmitExam = document.getElementById('btn-submit-exam');

    // Fullscreen lock modal
    this.fullscreenLockModal = document.getElementById('fullscreen-lock-modal');
    this.btnResumeFullscreen = document.getElementById('btn-resume-fullscreen');

    // Alert Toast Container
    this.alertToastContainer = document.getElementById('alert-toast-container');
  }

  bindEvents() {
    // Student Authentication events
    if (this.btnAuthenticateStudent) {
      this.btnAuthenticateStudent.onclick = () => this.authenticateStudent();
    }

    if (this.authPasswordInput) {
      this.authPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.authenticateStudent();
      });
    }

    if (this.btnTogglePassword && this.authPasswordInput) {
      this.btnTogglePassword.onclick = () => {
        const isPass = this.authPasswordInput.type === 'password';
        this.authPasswordInput.type = isPass ? 'text' : 'password';
        this.btnTogglePassword.textContent = isPass ? 'Hide' : 'Show';
      };
    }

    if (this.btnLogoutStudent) {
      this.btnLogoutStudent.onclick = () => this.logoutStudent();
    }

    // Demo student chip auto-fills
    const demoChips = document.querySelectorAll('.demo-student-chip');
    demoChips.forEach(chip => {
      chip.onclick = () => {
        const sid = chip.getAttribute('data-id');
        const pass = chip.getAttribute('data-pass');
        if (this.authStudentIdInput) this.authStudentIdInput.value = sid;
        if (this.authPasswordInput) this.authPasswordInput.value = pass;
        this.authenticateStudent();
      };
    });

    // Hardware & Pledge events
    if (this.btnCheckHardware) {
      this.btnCheckHardware.onclick = () => this.runHardwareCheck();
    }

    if (this.termsCheckbox) {
      this.termsCheckbox.onchange = () => {
        this.validateLoginReady();
      };
    }

    if (this.btnStartExam) {
      this.btnStartExam.onclick = () => this.startExamSession();
    }

    // Exam navigation
    if (this.btnPrevQuestion) {
      this.btnPrevQuestion.onclick = () => this.navigateQuestion(this.currentQuestionIndex - 1);
    }
    if (this.btnNextQuestion) {
      this.btnNextQuestion.onclick = () => this.navigateQuestion(this.currentQuestionIndex + 1);
    }
    if (this.btnReviewQuestion) {
      this.btnReviewQuestion.onclick = () => this.toggleMarkForReview();
    }
    if (this.btnClearAnswer) {
      this.btnClearAnswer.onclick = () => this.clearCurrentAnswer();
    }
    if (this.btnSubmitExam) {
      this.btnSubmitExam.onclick = () => this.promptSubmitExam();
    }

    // Fullscreen recovery
    if (this.btnResumeFullscreen) {
      this.btnResumeFullscreen.onclick = async () => {
        await this.securityGuard.requestFullscreen();
        if (this.fullscreenLockModal) {
          this.fullscreenLockModal.classList.add('hidden');
        }
      };
    }

    // Header nav links (Admin / Student view)
    const navAdmin = document.getElementById('nav-admin-portal');
    const navStudent = document.getElementById('nav-student-portal');
    if (navAdmin) {
      navAdmin.onclick = (e) => {
        e.preventDefault();
        this.showView('admin-view');
        this.loadAdminSessions();
      };
    }
    if (navStudent) {
      navStudent.onclick = (e) => {
        e.preventDefault();
        this.showView('login-view');
      };
    }

    // Simulation testing triggers
    const simNoFace = document.getElementById('sim-no-face');
    const simMultiFace = document.getElementById('sim-multi-face');
    const simTabSwitch = document.getElementById('sim-tab-switch');
    const simAudio = document.getElementById('sim-audio-spike');

    if (simNoFace) {
      simNoFace.onclick = () => {
        const snap = this.detector ? this.detector.captureSnapshot('SIMULATION: NO FACE DETECTED') : null;
        this.handleSecurityViolation({
          type: 'NO_FACE',
          severity: 'HIGH',
          message: 'Candidate face missing from camera frame (Simulated)',
          durationSec: 4,
          snapshotBase64: snap
        });
      };
    }

    if (simMultiFace) {
      simMultiFace.onclick = () => {
        const snap = this.detector ? this.detector.captureSnapshot('SIMULATION: 2 FACES DETECTED') : null;
        this.handleSecurityViolation({
          type: 'MULTIPLE_FACES',
          severity: 'CRITICAL',
          message: 'Multiple faces (2) detected in candidate view (Simulated)',
          durationSec: 1,
          snapshotBase64: snap,
          details: { count: 2 }
        });
      };
    }

    if (simTabSwitch) {
      simTabSwitch.onclick = () => {
        const snap = this.detector ? this.detector.captureSnapshot('SIMULATION: TAB SWITCH') : null;
        this.handleSecurityViolation({
          type: 'TAB_SWITCH',
          severity: 'CRITICAL',
          message: 'Candidate navigated away / switched tabs for 5 seconds (Simulated)',
          durationSec: 5,
          snapshotBase64: snap
        });
      };
    }

    if (simAudio) {
      simAudio.onclick = () => {
        this.handleSecurityViolation({
          type: 'AUDIO_ANOMALY',
          severity: 'MEDIUM',
          message: 'Suspicious background talking / acoustic spike detected (Simulated)',
          durationSec: 1
        });
      };
    }
  }

  showView(viewName) {
    const views = ['login-view', 'exam-view', 'report-view', 'admin-view'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) {
        if (v === viewName) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async authenticateStudent() {
    const studentId = this.authStudentIdInput ? this.authStudentIdInput.value.trim() : '';
    const password = this.authPasswordInput ? this.authPasswordInput.value.trim() : '';

    if (!studentId || !password) {
      this.showAuthAlert('Please enter both College Student ID and Password.', 'warning');
      return;
    }

    if (this.btnAuthenticateStudent) {
      this.btnAuthenticateStudent.disabled = true;
      this.btnAuthenticateStudent.innerHTML = `<svg class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Verifying with College Server...`;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password })
      });

      const data = await res.json();

      if (data.success && data.student) {
        this.authenticatedStudent = data.student;

        // Update UI
        if (this.verifiedStudentName) this.verifiedStudentName.textContent = data.student.name;
        if (this.verifiedStudentId) this.verifiedStudentId.textContent = data.student.studentId;
        if (this.verifiedStudentCollege) this.verifiedStudentCollege.textContent = data.student.college || 'ABC College / JIMS';

        if (this.authStatusPill) {
          this.authStatusPill.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
          this.authStatusPill.textContent = '✓ College Verified';
        }

        if (this.authInputContainer) this.authInputContainer.classList.add('hidden');
        if (this.authVerifiedCard) this.authVerifiedCard.classList.remove('hidden');
        if (this.authAlertBox) this.authAlertBox.classList.add('hidden');

        this.validateLoginReady();
        this.showToast('Student Verified', `Welcome ${data.student.name}! College credentials authenticated.`, 'info');
      } else {
        this.showAuthAlert(data.error || 'Access Denied: Invalid credentials.', 'error');
        this.authenticatedStudent = null;
        this.validateLoginReady();
      }
    } catch (err) {
      console.error('Authentication error:', err);
      this.showAuthAlert('Unable to reach authentication server. Please check backend connection.', 'error');
    } finally {
      if (this.btnAuthenticateStudent) {
        this.btnAuthenticateStudent.disabled = false;
        this.btnAuthenticateStudent.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Verify College Credentials`;
      }
    }
  }

  showAuthAlert(message, type = 'error') {
    if (!this.authAlertBox) return;
    this.authAlertBox.classList.remove('hidden');
    if (type === 'error') {
      this.authAlertBox.className = 'mt-4 p-3.5 rounded-xl border bg-rose-950/60 border-rose-500/50 text-rose-300 text-xs flex items-start gap-2 animate-shake';
      this.authAlertBox.innerHTML = `
        <span class="text-base flex-shrink-0">🚫</span>
        <div>
          <strong class="font-bold block">Access Denied:</strong>
          <span>${message}</span>
        </div>
      `;
    } else {
      this.authAlertBox.className = 'mt-4 p-3.5 rounded-xl border bg-amber-950/60 border-amber-500/50 text-amber-300 text-xs flex items-start gap-2';
      this.authAlertBox.innerHTML = `
        <span class="text-base flex-shrink-0">⚠️</span>
        <span>${message}</span>
      `;
    }
  }

  logoutStudent() {
    this.authenticatedStudent = null;
    if (this.authPasswordInput) this.authPasswordInput.value = '';
    if (this.authStatusPill) {
      this.authStatusPill.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
      this.authStatusPill.textContent = '🔒 Awaiting Credentials';
    }
    if (this.authInputContainer) this.authInputContainer.classList.remove('hidden');
    if (this.authVerifiedCard) this.authVerifiedCard.classList.add('hidden');
    if (this.authAlertBox) this.authAlertBox.classList.add('hidden');
    this.validateLoginReady();
  }

  validateLoginReady() {
    const hasAuth = !!this.authenticatedStudent;
    const hasStream = !!this.mediaStream;
    const hasAgreed = this.termsCheckbox && this.termsCheckbox.checked;

    const ready = hasAuth && hasStream && hasAgreed;
    if (this.btnStartExam) {
      this.btnStartExam.disabled = !ready;
      if (ready) {
        this.btnStartExam.classList.remove('opacity-50', 'cursor-not-allowed');
        this.btnStartExam.classList.add('hover:bg-indigo-500', 'shadow-indigo-500/25');
      } else {
        this.btnStartExam.classList.add('opacity-50', 'cursor-not-allowed');
        this.btnStartExam.classList.remove('hover:bg-indigo-500', 'shadow-indigo-500/25');
      }
    }
  }

  async runHardwareCheck() {
    this.btnCheckHardware.disabled = true;
    this.btnCheckHardware.innerHTML = `<svg class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Testing Devices...`;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      this.mediaStream = stream;

      // Attach to diagnostic preview
      if (this.diagnosticVideo) {
        this.diagnosticVideo.srcObject = stream;
        this.diagnosticVideo.play();
      }

      // Show hardware status
      if (this.hardwareStatusArea) {
        this.hardwareStatusArea.classList.remove('hidden');
      }

      // Test audio with AudioMonitor
      this.audioMonitor.start(
        stream,
        null,
        (level) => {
          if (this.audioMeterFill) {
            this.audioMeterFill.style.width = `${level}%`;
          }
        }
      );

      this.btnCheckHardware.classList.remove('bg-slate-800', 'text-slate-300');
      this.btnCheckHardware.classList.add('bg-emerald-600', 'text-white');
      this.btnCheckHardware.innerHTML = `✓ Camera & Mic Verified`;

      this.validateLoginReady();
    } catch (err) {
      console.error('Hardware access denied or error:', err);
      alert('Camera and Microphone permission is required for the proctoring exam. Please allow camera/microphone access in your browser settings.');
      this.btnCheckHardware.disabled = false;
      this.btnCheckHardware.innerHTML = `Retry Hardware Check`;
    }
  }

  async startExamSession() {
    if (!this.authenticatedStudent) {
      alert('Please authenticate your student credentials first.');
      return;
    }

    const candidateName = this.authenticatedStudent.name;
    const studentId = this.authenticatedStudent.studentId;
    const email = this.authenticatedStudent.email || '';
    const examTitle = window.EXAM_DATA ? window.EXAM_DATA.title : 'Full-Stack Architecture Evaluation';

    // 1. Request fullscreen
    await this.securityGuard.requestFullscreen();

    // 2. Call backend to start session
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName,
          studentId,
          email,
          examId: window.EXAM_DATA ? window.EXAM_DATA.examId : 'EXAM-1',
          examTitle,
          totalQuestions: this.examQuestions.length,
          durationMinutes: window.EXAM_DATA ? window.EXAM_DATA.durationMinutes : 15
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to initiate session on server.');
        return;
      }

      this.currentSession = data.session;
      this.liveScore = 100;
      this.warningStrikes = 0;
      this.examStartTime = Date.now();
      this.remainingSeconds = (this.currentSession.durationMinutes || 15) * 60;
      this.totalSeconds = this.remainingSeconds;

      // Update candidate details in Exam Header
      const headerName = document.getElementById('exam-candidate-name');
      const headerId = document.getElementById('exam-candidate-id');
      if (headerName) headerName.textContent = candidateName;
      if (headerId) headerId.textContent = studentId;

      // 3. Switch view to Exam
      this.showView('exam-view');

      // 4. Attach media stream to Exam Webcam
      if (this.examVideo && this.mediaStream) {
        this.examVideo.srcObject = this.mediaStream;
        await this.examVideo.play();
      }

      // 5. Start Security Guard (Tab switch, window blur, fullscreen exit, anti-cheat shortcuts)
      this.securityGuard.start({
        onViolation: (v) => this.handleSecurityViolation(v),
        onFullscreenExit: () => {
          if (this.fullscreenLockModal) {
            this.fullscreenLockModal.classList.remove('hidden');
          }
        },
        onFullscreenEnter: () => {
          if (this.fullscreenLockModal) {
            this.fullscreenLockModal.classList.add('hidden');
          }
        }
      });

      // 6. Start Face Detector
      this.detector.start(this.examVideo, this.examCanvas, {
        onStatusChange: (status) => this.updateProctorHud(status),
        onViolation: (v) => this.handleSecurityViolation(v)
      });

      // 7. Start Audio Monitor
      this.audioMonitor.start(
        this.mediaStream,
        (spike) => {
          this.handleSecurityViolation({
            type: 'AUDIO_ANOMALY',
            severity: 'LOW',
            message: spike.message,
            durationSec: 1
          });
        },
        (level) => {
          if (this.hudAudioBar) {
            this.hudAudioBar.style.width = `${level}%`;
          }
        }
      );

      // 8. Render Exam UI & Questions
      this.renderQuestionNav();
      this.navigateQuestion(0);

      // 9. Start Countdown Timer
      this.startCountdownTimer();

      // Initial toast
      this.showToast('Secure Exam Started', 'Continuous AI facial & browser monitoring is active.', 'info');
    } catch (err) {
      console.error('Error starting session:', err);
      alert('Unable to connect to proctoring server. Please verify backend is running.');
    }
  }

  startCountdownTimer() {
    this.updateTimerDisplay();
    this.examTimer = setInterval(() => {
      this.remainingSeconds--;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        clearInterval(this.examTimer);
        this.autoSubmitExam();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    if (!this.timerDisplay) return;
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.remainingSeconds <= 180) { // 3 mins remaining
      this.timerDisplay.classList.add('text-rose-400', 'animate-pulse');
    }
  }

  updateProctorHud(status) {
    if (this.faceStatusBadge) {
      if (status.faceCount === 1) {
        this.faceStatusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        this.faceStatusBadge.textContent = '1 Face (Verified)';
      } else if (status.faceCount === 0) {
        this.faceStatusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse';
        this.faceStatusBadge.textContent = '⚠️ 0 Faces (Missing)';
      } else {
        this.faceStatusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse';
        this.faceStatusBadge.textContent = `🚨 ${status.faceCount} Faces (Alert!)`;
      }
    }

    if (this.gazeStatusBadge) {
      if (status.gazeStatus === 'LOOKING_AWAY') {
        this.gazeStatusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30';
        this.gazeStatusBadge.textContent = 'Looking Away';
      } else {
        this.gazeStatusBadge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700';
        this.gazeStatusBadge.textContent = 'Screen Focused';
      }
    }
  }

  async handleSecurityViolation(violation) {
    if (!this.currentSession) return;

    this.warningStrikes++;
    if (this.strikeBadge) {
      this.strikeBadge.textContent = `Warnings: ${this.warningStrikes}/${this.maxStrikes}`;
      if (this.warningStrikes >= 3) {
        this.strikeBadge.classList.add('bg-rose-500/20', 'text-rose-400', 'border-rose-500/40');
      }
    }

    // Capture snapshot for tab switch if not already provided
    if (!violation.snapshotBase64 && (violation.type === 'TAB_SWITCH' || violation.type === 'WINDOW_BLUR')) {
      violation.snapshotBase64 = this.detector.captureSnapshot(`VIOLATION: ${violation.type}`);
    }

    // Post to server
    try {
      const res = await fetch(`/api/sessions/${this.currentSession.id}/violation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation)
      });
      const data = await res.json();
      if (data.success) {
        this.liveScore = data.currentIntegrityScore;
        this.updateLiveTrustScore(this.liveScore);
      }
    } catch (err) {
      console.error('Error logging violation:', err);
    }

    // Audible alarm & toast notification
    this.securityGuard.playSevereBeep();
    this.showToast(
      `⚠️ Security Alert: ${violation.type.replace('_', ' ')}`,
      violation.message,
      violation.severity === 'CRITICAL' ? 'critical' : 'warning'
    );
  }

  updateLiveTrustScore(score) {
    if (this.trustScoreDisplay) {
      this.trustScoreDisplay.textContent = `${score}%`;
      if (score >= 80) {
        this.trustScoreDisplay.className = 'text-sm font-bold text-emerald-400';
      } else if (score >= 50) {
        this.trustScoreDisplay.className = 'text-sm font-bold text-amber-400';
      } else {
        this.trustScoreDisplay.className = 'text-sm font-bold text-rose-400 animate-pulse';
      }
    }
    if (this.trustScoreBar) {
      this.trustScoreBar.style.width = `${score}%`;
      if (score >= 80) {
        this.trustScoreBar.className = 'h-full bg-emerald-500 transition-all duration-500';
      } else if (score >= 50) {
        this.trustScoreBar.className = 'h-full bg-amber-500 transition-all duration-500';
      } else {
        this.trustScoreBar.className = 'h-full bg-rose-500 transition-all duration-500';
      }
    }
  }

  showToast(title, message, type = 'info') {
    if (!this.alertToastContainer) return;

    const toast = document.createElement('div');
    const borderBgClass = {
      info: 'bg-slate-900 border-indigo-500/50 text-indigo-400',
      warning: 'bg-slate-900 border-amber-500 text-amber-400 shadow-amber-500/10',
      critical: 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-500/20'
    }[type] || 'bg-slate-900 border-slate-700 text-slate-300';

    toast.className = `p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 flex items-start gap-3 ${borderBgClass}`;
    toast.innerHTML = `
      <div class="text-lg flex-shrink-0">${type === 'critical' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
      <div class="flex-1">
        <h4 class="text-xs font-bold uppercase tracking-wider text-white">${title}</h4>
        <p class="text-xs text-slate-300 mt-0.5 leading-snug">${message}</p>
      </div>
      <button class="text-slate-500 hover:text-white text-sm font-bold ml-1">&times;</button>
    `;

    toast.querySelector('button').onclick = () => toast.remove();
    this.alertToastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 20);

    // Auto remove after 5.5s
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 5500);
  }

  // Exam Questions logic
  renderQuestionNav() {
    if (!this.questionNavGrid) return;
    this.questionNavGrid.innerHTML = '';

    this.examQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.id = `q-nav-btn-${idx}`;
      btn.className = this.getNavButtonClass(idx);
      btn.textContent = idx + 1;
      btn.onclick = () => this.navigateQuestion(idx);
      this.questionNavGrid.appendChild(btn);
    });
  }

  getNavButtonClass(idx) {
    const isCurrent = idx === this.currentQuestionIndex;
    const isAnswered = this.userAnswers[this.examQuestions[idx].id] !== undefined;
    const isMarked = this.markedForReview[this.examQuestions[idx].id];

    let base = 'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all border ';

    if (isCurrent) {
      return base + 'ring-2 ring-indigo-400 bg-indigo-600 text-white border-transparent';
    }
    if (isMarked) {
      return base + 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    }
    if (isAnswered) {
      return base + 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
    return base + 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700';
  }

  navigateQuestion(index) {
    if (index < 0 || index >= this.examQuestions.length) return;
    this.currentQuestionIndex = index;

    // Update nav classes
    this.renderQuestionNav();

    const q = this.examQuestions[index];
    if (!this.questionContentArea) return;

    const selectedOption = this.userAnswers[q.id];

    this.questionContentArea.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
              Question ${index + 1} of ${this.examQuestions.length}
            </span>
            <span class="text-xs font-medium text-slate-400">${q.category}</span>
          </div>
          ${this.markedForReview[q.id] ? `
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1">
              ⭐ Marked for Review
            </span>
          ` : ''}
        </div>

        <div>
          <h3 class="text-base sm:text-lg font-semibold text-white leading-relaxed">${q.question}</h3>
          ${q.codeSnippet ? `
            <div class="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto whitespace-pre">
${this.escapeHtml(q.codeSnippet)}
            </div>
          ` : ''}
        </div>

        <div class="space-y-3 pt-2">
          ${q.options.map((opt, optIdx) => `
            <label class="flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
              selectedOption === optIdx
                ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
            }">
              <input type="radio" name="question-opt" value="${optIdx}" ${selectedOption === optIdx ? 'checked' : ''} class="mt-1 accent-indigo-500 w-4 h-4 cursor-pointer" />
              <div class="flex-1 text-sm font-medium leading-relaxed">${this.escapeHtml(opt)}</div>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Bind option change radio
    const radios = this.questionContentArea.querySelectorAll('input[name="question-opt"]');
    radios.forEach(radio => {
      radio.onchange = (e) => {
        this.selectAnswer(q.id, parseInt(e.target.value, 10));
      };
    });

    // Update prev/next button states
    if (this.btnPrevQuestion) {
      this.btnPrevQuestion.disabled = index === 0;
      this.btnPrevQuestion.classList.toggle('opacity-50', index === 0);
    }
    if (this.btnNextQuestion) {
      if (index === this.examQuestions.length - 1) {
        this.btnNextQuestion.innerHTML = `Finish & Submit ➔`;
        this.btnNextQuestion.onclick = () => this.promptSubmitExam();
      } else {
        this.btnNextQuestion.innerHTML = `Next Question ➔`;
        this.btnNextQuestion.onclick = () => this.navigateQuestion(this.currentQuestionIndex + 1);
      }
    }
  }

  selectAnswer(questionId, optionIndex) {
    this.userAnswers[questionId] = optionIndex;
    this.renderQuestionNav();
    // Re-render current question to update selection styling
    this.navigateQuestion(this.currentQuestionIndex);
  }

  toggleMarkForReview() {
    const q = this.examQuestions[this.currentQuestionIndex];
    if (this.markedForReview[q.id]) {
      delete this.markedForReview[q.id];
    } else {
      this.markedForReview[q.id] = true;
    }
    this.renderQuestionNav();
    this.navigateQuestion(this.currentQuestionIndex);
  }

  clearCurrentAnswer() {
    const q = this.examQuestions[this.currentQuestionIndex];
    delete this.userAnswers[q.id];
    this.renderQuestionNav();
    this.navigateQuestion(this.currentQuestionIndex);
  }

  promptSubmitExam() {
    const answeredCount = Object.keys(this.userAnswers).length;
    const totalCount = this.examQuestions.length;
    const unanswered = totalCount - answeredCount;

    let confirmMsg = `You have answered ${answeredCount} out of ${totalCount} questions.`;
    if (unanswered > 0) {
      confirmMsg += `\nWarning: ${unanswered} question(s) remain unanswered!`;
    }
    confirmMsg += '\n\nAre you sure you want to finalize and submit your exam?';

    if (confirm(confirmMsg)) {
      this.submitExam(false);
    }
  }

  autoSubmitExam() {
    alert('Time limit expired! Your exam will now be submitted automatically.');
    this.submitExam(true);
  }

  async submitExam(autoSubmitted = false) {
    if (this.examTimer) {
      clearInterval(this.examTimer);
      this.examTimer = null;
    }

    // Stop detectors and monitors
    this.detector.stop();
    this.audioMonitor.stop();
    this.securityGuard.stop();

    // Stop camera tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) {}
    }

    // Calculate exam scores
    let correctCount = 0;
    this.examQuestions.forEach(q => {
      if (this.userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const scoreData = {
      score: correctCount,
      total: this.examQuestions.length,
      percentage: Math.round((correctCount / this.examQuestions.length) * 100),
      passed: (correctCount / this.examQuestions.length) >= 0.7
    };

    const timeSpentSec = Math.max(1, Math.round((Date.now() - this.examStartTime) / 1000));

    // Submit to server
    try {
      const res = await fetch(`/api/sessions/${this.currentSession.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: this.userAnswers,
          timeSpentSec,
          autoSubmitted,
          examScoreData: scoreData
        })
      });

      const data = await res.json();
      if (data.success) {
        this.currentSession = data.session;
        this.showView('report-view');
        ReportGenerator.renderReport('report-view', this.currentSession);
      } else {
        alert('Failed to submit exam to server.');
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      // Fallback local report render
      this.showView('report-view');
      this.currentSession.examResult = scoreData;
      this.currentSession.timeSpentSec = timeSpentSec;
      ReportGenerator.renderReport('report-view', this.currentSession);
    }
  }

  async loadAdminSessions() {
    const listContainer = document.getElementById('admin-sessions-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="p-8 text-center text-slate-400">Loading candidate sessions...</div>';

    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();

      if (!data.success || !data.sessions || data.sessions.length === 0) {
        listContainer.innerHTML = `
          <div class="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
            <span class="text-3xl block mb-2">📋</span>
            No proctored sessions found yet. Take a test as a student to generate records.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-[11px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Candidate</th>
                <th class="px-4 py-3">Student ID</th>
                <th class="px-4 py-3">Integrity Score</th>
                <th class="px-4 py-3">Violations</th>
                <th class="px-4 py-3">Verdict</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${data.sessions.map(s => `
                <tr class="hover:bg-slate-800/30 transition-colors">
                  <td class="px-4 py-3 font-semibold text-white">${s.candidateName}</td>
                  <td class="px-4 py-3 font-mono text-slate-400">${s.studentId}</td>
                  <td class="px-4 py-3">
                    <span class="font-bold ${s.integrityScore >= 80 ? 'text-emerald-400' : s.integrityScore >= 50 ? 'text-amber-400' : 'text-rose-400'}">
                      ${s.integrityScore}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-mono ${s.totalViolations > 0 ? 'text-rose-400' : 'text-slate-400'}">
                      ${s.totalViolations} incidents
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${
                      s.verdict.status === 'HIGH_INTEGRITY' ? 'bg-emerald-500/20 text-emerald-300' :
                      s.verdict.status === 'NEEDS_REVIEW' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }">
                      ${s.verdict.label}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold btn-inspect-session" data-id="${s.id}">
                      Inspect Report ➔
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Attach click handlers to inspect report
      listContainer.querySelectorAll('.btn-inspect-session').forEach(btn => {
        btn.onclick = async () => {
          const sid = btn.getAttribute('data-id');
          const repRes = await fetch(`/api/sessions/${sid}/report`);
          const repData = await repRes.json();
          if (repData.success) {
            this.showView('report-view');
            ReportGenerator.renderReport('report-view', repData.session);
          }
        };
      });

    } catch (err) {
      console.error('Error fetching admin sessions:', err);
      listContainer.innerHTML = '<div class="p-8 text-center text-rose-400">Failed to load sessions.</div>';
    }
  }

  resetToLogin() {
    window.location.href = '/';
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate once DOM loads
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ProctorApp();
});
