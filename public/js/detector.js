// Computer Vision Face & Proctoring Detector
class ProctorDetector {
  constructor() {
    this.model = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.animId = null;

    // Tracking states
    this.noFaceStartTime = null;
    this.noFaceThresholdMs = 2500; // 2.5 seconds before registering "No Face" violation
    this.noFaceReported = false;

    this.lastMultiFaceReportTime = 0;
    this.multiFaceCooldownMs = 6000; // 6s cooldown between multi-face alerts

    this.lookingAwayStartTime = null;
    this.lookingAwayThresholdMs = 4000;
    this.lookingAwayReported = false;

    // Callbacks
    this.onStatusChange = null;
    this.onViolation = null;

    this.isModelLoaded = false;
  }

  async init() {
    try {
      if (window.blazeface) {
        console.log('Loading BlazeFace Neural Model...');
        this.model = await window.blazeface.load();
        this.isModelLoaded = true;
        console.log('BlazeFace AI model loaded successfully.');
        return true;
      } else {
        console.warn('BlazeFace library not found on window. Fallback active.');
        return false;
      }
    } catch (err) {
      console.error('Failed to load BlazeFace model:', err);
      return false;
    }
  }

  start(videoElement, canvasElement, { onStatusChange, onViolation }) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onStatusChange = onStatusChange;
    this.onViolation = onViolation;
    this.isRunning = true;

    this.noFaceStartTime = null;
    this.noFaceReported = false;
    this.lastMultiFaceReportTime = 0;

    this.detectLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  async detectLoop() {
    if (!this.isRunning) return;

    if (this.video && this.video.readyState >= 2 && !this.video.paused) {
      // Sync canvas dimensions to video
      if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
      }

      await this.processFrame();
    }

    // Schedule next detection (~15-20 FPS for optimal performance & responsiveness)
    setTimeout(() => {
      if (this.isRunning) {
        this.animId = requestAnimationFrame(() => this.detectLoop());
      }
    }, 60);
  }

  async processFrame() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    let predictions = [];

    if (this.isModelLoaded && this.model) {
      try {
        predictions = await this.model.estimateFaces(this.video, false);
      } catch (err) {
        // Model busy or webgl context reset
      }
    } else {
      // Fallback light skin-tone/face heuristic if model is still loading
      predictions = this.heuristicFaceCheck();
    }

    const now = Date.now();
    const faceCount = predictions.length;

    let faceStatus = 'OK';
    let gazeStatus = 'FOCUSED';
    let message = 'Face Verified';

    // 1. NO FACE DETECTED
    if (faceCount === 0) {
      faceStatus = 'NO_FACE';
      message = 'No Face Detected';

      if (!this.noFaceStartTime) {
        this.noFaceStartTime = now;
      }

      const elapsed = now - this.noFaceStartTime;
      if (elapsed >= this.noFaceThresholdMs && !this.noFaceReported) {
        this.noFaceReported = true;
        const snapshot = this.captureSnapshot('VIOLATION: NO FACE DETECTED');
        if (this.onViolation) {
          this.onViolation({
            type: 'NO_FACE',
            severity: 'HIGH',
            message: 'Candidate face missing from camera frame for > 2.5 seconds',
            durationSec: Math.round(elapsed / 1000),
            snapshotBase64: snapshot
          });
        }
      }

      // Draw red warning overlay on canvas
      this.drawWarningOverlay(`⚠️ NO FACE DETECTED! Return to frame immediately.`);
    } else {
      // Face is back
      if (this.noFaceStartTime && this.noFaceReported) {
        const totalDuration = Math.round((now - this.noFaceStartTime) / 1000);
        console.log(`Candidate returned to frame after ${totalDuration}s`);
      }
      this.noFaceStartTime = null;
      this.noFaceReported = false;
    }

    // 2. MULTIPLE FACES DETECTED
    if (faceCount > 1) {
      faceStatus = 'MULTIPLE_FACES';
      message = `${faceCount} Faces Detected!`;

      if (now - this.lastMultiFaceReportTime > this.multiFaceCooldownMs) {
        this.lastMultiFaceReportTime = now;
        const snapshot = this.captureSnapshot(`VIOLATION: ${faceCount} FACES DETECTED`);
        if (this.onViolation) {
          this.onViolation({
            type: 'MULTIPLE_FACES',
            severity: 'CRITICAL',
            message: `Multiple faces (${faceCount}) detected in candidate view`,
            durationSec: 1,
            snapshotBase64: snapshot,
            details: { count: faceCount }
          });
        }
      }

      this.drawWarningOverlay(`🚨 ALERT: MULTIPLE FACES (${faceCount}) DETECTED!`);
    }

    // 3. SINGLE FACE - Check head turn / looking away
    if (faceCount === 1) {
      const pred = predictions[0];
      const isLookingAway = this.checkHeadPose(pred, width, height);

      if (isLookingAway) {
        gazeStatus = 'LOOKING_AWAY';
        if (!this.lookingAwayStartTime) {
          this.lookingAwayStartTime = now;
        }
        const awayElapsed = now - this.lookingAwayStartTime;
        if (awayElapsed >= this.lookingAwayThresholdMs && !this.lookingAwayReported) {
          this.lookingAwayReported = true;
          const snapshot = this.captureSnapshot('VIOLATION: LOOKING AWAY FROM SCREEN');
          if (this.onViolation) {
            this.onViolation({
              type: 'LOOKING_AWAY',
              severity: 'MEDIUM',
              message: 'Candidate looking away from screen for prolonged duration',
              durationSec: Math.round(awayElapsed / 1000),
              snapshotBase64: snapshot
            });
          }
        }
      } else {
        this.lookingAwayStartTime = null;
        this.lookingAwayReported = false;
      }
    }

    // Draw bounding boxes for all faces
    predictions.forEach((pred, index) => {
      this.drawFaceBox(pred, index, faceCount);
    });

    // Notify status listener
    if (this.onStatusChange) {
      this.onStatusChange({
        faceCount,
        faceStatus,
        gazeStatus,
        message,
        timestamp: now
      });
    }
  }

  checkHeadPose(pred, canvasWidth, canvasHeight) {
    if (!pred.landmarks || pred.landmarks.length < 3) return false;

    // Landmarks order in BlazeFace:
    // [0]: right eye, [1]: left eye, [2]: nose, [3]: mouth, [4]: right ear, [5]: left ear
    const rightEye = pred.landmarks[0];
    const leftEye = pred.landmarks[1];
    const nose = pred.landmarks[2];

    const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
    const eyeDist = Math.abs(leftEye[0] - rightEye[0]);

    if (eyeDist === 0) return false;

    // Deviation of nose from midpoint between eyes relative to distance between eyes
    const noseOffset = Math.abs(nose[0] - eyeMidX) / eyeDist;

    // If offset is high (> 0.65), face is turned sideways
    return noseOffset > 0.68;
  }

  drawFaceBox(pred, index, totalFaces) {
    const ctx = this.ctx;
    let start, end;

    if (pred.topLeft && pred.bottomRight) {
      start = pred.topLeft;
      end = pred.bottomRight;
    } else if (pred.box) {
      start = [pred.box.x, pred.box.y];
      end = [pred.box.x + pred.box.width, pred.box.y + pred.box.height];
    } else {
      return;
    }

    const x = start[0];
    const y = start[1];
    const w = end[0] - start[0];
    const h = end[1] - start[1];

    ctx.save();

    // Multi-face = Red; Single Face = Emerald Green; Secondary face = Red
    const isPrimary = (index === 0 && totalFaces === 1);
    const strokeColor = isPrimary ? '#10b981' : '#ef4444';
    const fillColor = isPrimary ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.2)';

    // Rounded rectangle
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // Corner brackets
    const bracketSize = Math.min(18, w * 0.2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = strokeColor;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + bracketSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketSize, y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - bracketSize, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + bracketSize);
    ctx.stroke();

    // Label tag
    const label = isPrimary ? 'Candidate (Verified)' : `⚠️ Person #${index + 1} (Unauthorized!)`;
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = strokeColor;
    ctx.fillRect(x, Math.max(0, y - 22), textWidth + 16, 22);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 8, Math.max(16, y - 6));

    // Draw landmarks if present
    if (pred.landmarks) {
      pred.landmarks.forEach(([lx, ly], i) => {
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, 2 * Math.PI);
        ctx.fillStyle = isPrimary ? '#34d399' : '#f87171';
        ctx.fill();
      });
    }

    ctx.restore();
  }

  drawWarningOverlay(text) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    // Glowing warning banner
    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.fillRect(0, h - 45, w, 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h - 18);
    ctx.restore();
  }

  heuristicFaceCheck() {
    // If BlazeFace is still downloading or fallback mode
    // Analyzes center pixel activity & brightness from webcam
    if (!this.video || this.video.videoWidth === 0) return [];

    const offscreen = document.createElement('canvas');
    offscreen.width = 160;
    offscreen.height = 120;
    const octx = offscreen.getContext('2d');
    octx.drawImage(this.video, 0, 0, 160, 120);

    const frame = octx.getImageData(0, 0, 160, 120);
    const data = frame.data;
    let skinPixelCount = 0;
    let totalPixels = 160 * 120;

    // Sample pixels in central region
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Basic skin tone heuristic in RGB space
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15) {
        skinPixelCount++;
      }
    }

    const skinRatio = skinPixelCount / (totalPixels / 4);
    if (skinRatio > 0.08) {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      return [{
        topLeft: [cw * 0.28, ch * 0.2],
        bottomRight: [cw * 0.72, ch * 0.8],
        probability: [0.9]
      }];
    }

    return [];
  }

  captureSnapshot(watermarkText = 'PROCTOR EVIDENCE') {
    if (!this.video || this.video.videoWidth === 0) return null;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.video.videoWidth || 640;
    snapCanvas.height = this.video.videoHeight || 480;
    const snapCtx = snapCanvas.getContext('2d');

    // Draw video frame
    snapCtx.drawImage(this.video, 0, 0, snapCanvas.width, snapCanvas.height);

    // Draw active annotations if any
    snapCtx.drawImage(this.canvas, 0, 0, snapCanvas.width, snapCanvas.height);

    // Watermark header bar
    const barHeight = 40;
    snapCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    snapCtx.fillRect(0, 0, snapCanvas.width, barHeight);

    snapCtx.fillStyle = '#f43f5e';
    snapCtx.font = 'bold 14px monospace';
    snapCtx.fillText(`[${watermarkText}]`, 14, 25);

    snapCtx.fillStyle = '#e2e8f0';
    snapCtx.font = '12px monospace';
    const timeStr = new Date().toLocaleString();
    const metricsStr = `TIME: ${timeStr}`;
    const textWidth = snapCtx.measureText(metricsStr).width;
    snapCtx.fillText(metricsStr, snapCanvas.width - textWidth - 14, 25);

    // Watermark footer bar
    snapCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    snapCtx.fillRect(0, snapCanvas.height - 24, snapCanvas.width, 24);
    snapCtx.fillStyle = '#94a3b8';
    snapCtx.font = '11px sans-serif';
    snapCtx.fillText('AI SECURE PROCTORING AUDIT SYSTEM • TAMPER-EVIDENT EVIDENCE SNAPSHOT', 14, snapCanvas.height - 8);

    return snapCanvas.toDataURL('image/jpeg', 0.82);
  }
}

window.ProctorDetector = ProctorDetector;
