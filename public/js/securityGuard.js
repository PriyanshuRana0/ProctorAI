// Security Guard: Tab Switching, Window Focus, Fullscreen, and Keystroke Interceptor
class SecurityGuard {
  constructor() {
    this.isActive = false;
    this.tabSwitchStartTime = null;
    this.onViolation = null;
    this.onFullscreenExit = null;
    this.onFullscreenEnter = null;

    this.audioCtx = null;
  }

  start({ onViolation, onFullscreenExit, onFullscreenEnter }) {
    this.isActive = true;
    this.onViolation = onViolation;
    this.onFullscreenExit = onFullscreenExit;
    this.onFullscreenEnter = onFullscreenEnter;

    this.bindEvents();
    this.initAudioBeep();
  }

  stop() {
    this.isActive = false;
    this.unbindEvents();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (e) {}
    }
  }

  initAudioBeep() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    } catch (e) {
      console.warn('Web Audio API not supported for beeps.');
    }
  }

  playWarningBeep(freq = 660, duration = 0.25) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Could not play beep:', e);
    }
  }

  playSevereBeep() {
    this.playWarningBeep(880, 0.15);
    setTimeout(() => this.playWarningBeep(880, 0.25), 180);
  }

  bindEvents() {
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleCopyPaste = this.handleCopyPaste.bind(this);

    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('copy', this.handleCopyPaste);
    document.addEventListener('cut', this.handleCopyPaste);
    document.addEventListener('paste', this.handleCopyPaste);
  }

  unbindEvents() {
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('copy', this.handleCopyPaste);
    document.removeEventListener('cut', this.handleCopyPaste);
    document.removeEventListener('paste', this.handleCopyPaste);
  }

  handleVisibility() {
    if (!this.isActive) return;

    if (document.hidden) {
      // Switched away to another tab or minimized
      this.tabSwitchStartTime = Date.now();
      this.playSevereBeep();
      console.warn('Candidate switched away from exam tab!');
    } else {
      // Returned back to exam tab
      if (this.tabSwitchStartTime) {
        const awayMs = Date.now() - this.tabSwitchStartTime;
        const durationSec = Math.max(1, Math.round(awayMs / 1000));
        this.tabSwitchStartTime = null;

        if (this.onViolation) {
          this.onViolation({
            type: 'TAB_SWITCH',
            severity: 'CRITICAL',
            message: `Candidate navigated away / switched tabs for ${durationSec} seconds`,
            durationSec: durationSec,
            details: { awayDurationSec: durationSec }
          });
        }
      }
    }
  }

  handleBlur() {
    if (!this.isActive) return;
    // Window lost focus (another window, DevTools, or system app clicked)
    // Only fire if not already handled by tab switch visibilitychange
    if (!document.hidden && !this.tabSwitchStartTime) {
      this.playWarningBeep(520, 0.2);
      if (this.onViolation) {
        this.onViolation({
          type: 'WINDOW_BLUR',
          severity: 'HIGH',
          message: 'Exam window lost focus (external application or system action clicked)',
          durationSec: 1
        });
      }
    }
  }

  handleFocus() {
    // Window regained focus
  }

  handleFullscreenChange() {
    if (!this.isActive) return;

    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFullscreen) {
      this.playSevereBeep();
      if (this.onViolation) {
        this.onViolation({
          type: 'FULLSCREEN_EXIT',
          severity: 'HIGH',
          message: 'Candidate exited secure fullscreen examination mode',
          durationSec: 1
        });
      }
      if (this.onFullscreenExit) this.onFullscreenExit();
    } else {
      if (this.onFullscreenEnter) this.onFullscreenEnter();
    }
  }

  handleKeyDown(e) {
    if (!this.isActive) return;

    const key = e.key.toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;

    // Block DevTools shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (
      e.key === 'F12' ||
      (isCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.playWarningBeep();
      if (this.onViolation) {
        this.onViolation({
          type: 'DEVTOOLS_ATTEMPT',
          severity: 'HIGH',
          message: 'Attempted to launch Browser Developer Tools inspection',
          durationSec: 0
        });
      }
      return false;
    }

    // Block Copy, Paste, Print, View Source
    if (isCtrl && (key === 'c' || key === 'v' || key === 'u' || key === 'p' || key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      this.playWarningBeep();
      if (this.onViolation) {
        this.onViolation({
          type: 'CLIPBOARD_ATTEMPT',
          severity: 'MEDIUM',
          message: `Attempted restricted shortcut (Ctrl + ${key.toUpperCase()})`,
          durationSec: 0
        });
      }
      return false;
    }

    // Block Alt+Tab detection attempt if key combination can be captured
    if (e.altKey && (e.key === 'Tab' || key === 'tab')) {
      e.preventDefault();
      this.playSevereBeep();
    }
  }

  handleContextMenu(e) {
    if (!this.isActive) return;
    e.preventDefault();
    this.playWarningBeep(450, 0.15);
    return false;
  }

  handleCopyPaste(e) {
    if (!this.isActive) return;
    e.preventDefault();
    this.playWarningBeep(450, 0.15);
    if (this.onViolation) {
      this.onViolation({
        type: 'CLIPBOARD_ACTION',
        severity: 'MEDIUM',
        message: 'Direct clipboard copy/paste action intercepted',
        durationSec: 0
      });
    }
    return false;
  }

  async requestFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
      return true;
    } catch (err) {
      console.warn('Fullscreen request denied or blocked:', err);
      return false;
    }
  }
}

window.SecurityGuard = SecurityGuard;
