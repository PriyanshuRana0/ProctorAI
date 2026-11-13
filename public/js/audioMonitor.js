// Audio & Voice Activity Monitor for ProctorAI
class AudioMonitor {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.isMonitoring = false;
    this.animationFrame = null;
    this.threshold = 42; // Volume percentage threshold for suspicious noise
    this.consecutiveHighFrames = 0;
    this.spikeDurationThreshold = 30; // ~1 second of sustained noise
    this.lastSpikeTime = 0;
    this.cooldownMs = 8000; // Cooldown between reporting audio violations
  }

  start(mediaStream, onSpikeCallback, onLevelUpdateCallback) {
    try {
      const audioTracks = mediaStream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        console.warn('AudioMonitor: No audio track available in media stream.');
        return false;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.source = this.audioCtx.createMediaStreamSource(mediaStream);
      this.source.connect(this.analyser);

      this.isMonitoring = true;
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkAudio = () => {
        if (!this.isMonitoring) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const levelPct = Math.min(100, Math.round((average / 128) * 100));

        if (onLevelUpdateCallback) {
          onLevelUpdateCallback(levelPct);
        }

        // Noise anomaly check
        const now = Date.now();
        if (levelPct > this.threshold) {
          this.consecutiveHighFrames++;
          if (this.consecutiveHighFrames > this.spikeDurationThreshold && (now - this.lastSpikeTime > this.cooldownMs)) {
            this.lastSpikeTime = now;
            this.consecutiveHighFrames = 0;
            if (onSpikeCallback) {
              onSpikeCallback({
                level: levelPct,
                timestamp: new Date().toISOString(),
                message: `Suspicious background speech / audio spike detected (${levelPct}% volume)`
              });
            }
          }
        } else {
          this.consecutiveHighFrames = Math.max(0, this.consecutiveHighFrames - 1);
        }

        this.animationFrame = requestAnimationFrame(checkAudio);
      };

      checkAudio();
      return true;
    } catch (err) {
      console.error('AudioMonitor initialization error:', err);
      return false;
    }
  }

  stop() {
    this.isMonitoring = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (e) {}
      this.source = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }
  }
}

window.AudioMonitor = AudioMonitor;
