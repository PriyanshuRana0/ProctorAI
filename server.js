const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/snapshots', express.static(SNAPSHOTS_DIR));

// Helper functions for persistent storage
function loadStudents() {
  try {
    if (!fs.existsSync(STUDENTS_FILE)) return [];
    const raw = fs.readFileSync(STUDENTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading students:', err);
    return [];
  }
}

function loadSessions() {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading sessions:', err);
    return [];
  }
}

function saveSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

function calculateIntegrityScore(session) {
  let score = 100;
  const stats = session.stats;

  // Deductions
  // 1. Multiple Faces (severe - someone else is helping / present)
  score -= (stats.multiFaceCount || 0) * 20;

  // 2. No face detected (candidate leaving desk or covering camera)
  score -= (stats.noFaceCount || 0) * 5;
  score -= Math.floor((stats.noFaceDurationSec || 0) / 4);

  // 3. Tab switching / window blur
  score -= (stats.tabSwitchCount || 0) * 10;
  score -= Math.floor((stats.tabSwitchDurationSec || 0) / 5);

  // 4. Fullscreen exits
  score -= (stats.fullscreenExitCount || 0) * 8;

  // 5. Window blur (lost focus without tab switch)
  score -= (stats.blurCount || 0) * 4;

  // 6. Suspicious audio noise spikes
  score -= (stats.audioSpikeCount || 0) * 2;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getVerdict(score, stats) {
  if (stats.multiFaceCount >= 3 || stats.tabSwitchCount >= 5 || score < 50) {
    return {
      status: 'DISQUALIFIED',
      label: 'High Risk / Disqualified',
      color: 'red',
      description: 'Severe violations detected including multiple unauthorized faces or excessive tab switching.'
    };
  }
  if (score < 80 || stats.tabSwitchCount > 0 || stats.multiFaceCount > 0 || stats.noFaceCount >= 2) {
    return {
      status: 'NEEDS_REVIEW',
      label: 'Suspicious / Manual Review Needed',
      color: 'amber',
      description: 'Suspicious incidents recorded. Proctor review recommended before validation.'
    };
  }
  return {
    status: 'HIGH_INTEGRITY',
    label: 'Verified High Integrity',
    color: 'emerald',
    description: 'Clean proctoring session with zero or negligible anomalies.'
  };
}

// API Routes

// Student Authentication (College ID + Password verification)
app.post('/api/auth/login', (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please enter both Student ID and Password provided by your college.'
    });
  }

  const students = loadStudents();
  const student = students.find(s => s.studentId.trim().toUpperCase() === studentId.trim().toUpperCase());

  if (!student) {
    return res.status(401).json({
      success: false,
      error: `Access Denied: Student ID "${studentId}" is not registered in the college examination registry.`
    });
  }

  if (student.password !== password.trim()) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Incorrect examination password. Please enter the valid passkey issued by your college examination cell.'
    });
  }

  // Authentication successful - return student profile without password
  const { password: _, ...studentProfile } = student;
  res.json({
    success: true,
    message: 'College Identity Verified Successfully',
    student: studentProfile
  });
});

// Demo credentials list for evaluators/testers
app.get('/api/auth/demo-credentials', (req, res) => {
  const students = loadStudents();
  const demoList = students.map(s => ({
    studentId: s.studentId,
    name: s.name,
    college: s.college,
    demoPassword: s.password
  }));
  res.json({ success: true, credentials: demoList });
});

// Start new session (Verifies that candidate is registered)
app.post('/api/sessions/start', (req, res) => {
  const {
    candidateName,
    studentId,
    email,
    examId,
    examTitle,
    totalQuestions,
    durationMinutes
  } = req.body;

  if (!candidateName || !studentId) {
    return res.status(400).json({ error: 'Candidate name and student ID are required' });
  }

  // Validate student against institutional registry
  const students = loadStudents();
  const matchedStudent = students.find(s => s.studentId.trim().toUpperCase() === studentId.trim().toUpperCase());
  if (!matchedStudent) {
    return res.status(401).json({
      error: `Unauthorized: Student ID "${studentId}" is not found in the institutional student records.`
    });
  }

  const sessionId = 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const session = {
    id: sessionId,
    candidateName: matchedStudent.name || candidateName.trim(),
    studentId: matchedStudent.studentId || studentId.trim(),
    email: matchedStudent.email || (email || '').trim(),
    college: matchedStudent.college || 'ABC College / Institutional Registry',
    department: matchedStudent.department || 'Computer Applications',
    examId: examId || 'EXAM-DEFAULT',
    examTitle: examTitle || 'General Technical Assessment',
    totalQuestions: totalQuestions || 10,
    durationMinutes: durationMinutes || 15,
    startTime: new Date().toISOString(),
    endTime: null,
    status: 'IN_PROGRESS',
    integrityScore: 100,
    stats: {
      noFaceCount: 0,
      noFaceDurationSec: 0,
      multiFaceCount: 0,
      tabSwitchCount: 0,
      tabSwitchDurationSec: 0,
      blurCount: 0,
      fullscreenExitCount: 0,
      audioSpikeCount: 0
    },
    violations: [],
    examResult: null
  };

  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);

  res.json({ success: true, session });
});

// Log a violation
app.post('/api/sessions/:id/violation', (req, res) => {
  const sessionId = req.params.id;
  const {
    type,
    severity,
    message,
    timestamp,
    durationSec = 0,
    snapshotBase64,
    details = {}
  } = req.body;

  const sessions = loadSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const violationId = 'VIO-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  let snapshotUrl = null;

  // Save snapshot if provided
  if (snapshotBase64 && snapshotBase64.includes('base64,')) {
    try {
      const base64Data = snapshotBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${sessionId}_${violationId}.jpg`;
      fs.writeFileSync(path.join(SNAPSHOTS_DIR, filename), buffer);
      snapshotUrl = `/snapshots/${filename}`;
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  }

  // Update statistics
  const duration = Number(durationSec) || 0;
  switch (type) {
    case 'NO_FACE':
      session.stats.noFaceCount = (session.stats.noFaceCount || 0) + 1;
      session.stats.noFaceDurationSec = (session.stats.noFaceDurationSec || 0) + duration;
      break;
    case 'MULTIPLE_FACES':
      session.stats.multiFaceCount = (session.stats.multiFaceCount || 0) + 1;
      break;
    case 'TAB_SWITCH':
      session.stats.tabSwitchCount = (session.stats.tabSwitchCount || 0) + 1;
      session.stats.tabSwitchDurationSec = (session.stats.tabSwitchDurationSec || 0) + duration;
      break;
    case 'WINDOW_BLUR':
      session.stats.blurCount = (session.stats.blurCount || 0) + 1;
      break;
    case 'FULLSCREEN_EXIT':
      session.stats.fullscreenExitCount = (session.stats.fullscreenExitCount || 0) + 1;
      break;
    case 'AUDIO_ANOMALY':
      session.stats.audioSpikeCount = (session.stats.audioSpikeCount || 0) + 1;
      break;
  }

  // Record violation event
  const violationRecord = {
    id: violationId,
    type,
    severity: severity || 'MEDIUM', // LOW, MEDIUM, HIGH, CRITICAL
    message: message || 'Proctoring anomaly detected',
    timestamp: timestamp || new Date().toISOString(),
    durationSec: duration,
    snapshotUrl,
    details
  };

  session.violations.push(violationRecord);
  session.integrityScore = calculateIntegrityScore(session);

  saveSessions(sessions);

  res.json({
    success: true,
    violation: violationRecord,
    currentIntegrityScore: session.integrityScore,
    totalViolations: session.violations.length
  });
});

// Finalize & Submit exam
app.post('/api/sessions/:id/submit', (req, res) => {
  const sessionId = req.params.id;
  const { answers = {}, timeSpentSec = 0, autoSubmitted = false, examScoreData = null } = req.body;

  const sessions = loadSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.endTime = new Date().toISOString();
  session.status = 'COMPLETED';
  session.timeSpentSec = timeSpentSec;
  session.autoSubmitted = autoSubmitted;

  // Final score recalculation
  session.integrityScore = calculateIntegrityScore(session);
  const verdict = getVerdict(session.integrityScore, session.stats);
  session.verdict = verdict;

  // Exam questions result
  if (examScoreData) {
    session.examResult = examScoreData;
  }

  saveSessions(sessions);

  res.json({
    success: true,
    session,
    verdict
  });
});

// Get session report
app.get('/api/sessions/:id/report', (req, res) => {
  const sessionId = req.params.id;
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const verdict = getVerdict(session.integrityScore, session.stats);

  res.json({
    success: true,
    session,
    verdict
  });
});

// Admin: List all sessions
app.get('/api/admin/sessions', (req, res) => {
  const sessions = loadSessions();
  // Return summarized list
  const summaries = sessions.map(s => ({
    id: s.id,
    candidateName: s.candidateName,
    studentId: s.studentId,
    examTitle: s.examTitle,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    integrityScore: s.integrityScore,
    totalViolations: s.violations ? s.violations.length : 0,
    stats: s.stats,
    verdict: s.verdict || getVerdict(s.integrityScore, s.stats)
  }));

  res.json({ success: true, sessions: summaries });
});

// Admin: Clear / Reset database (optional dev tool)
app.delete('/api/admin/sessions/clear', (req, res) => {
  saveSessions([]);
  res.json({ success: true, message: 'All sessions cleared' });
});

app.listen(PORT, () => {
  console.log(`ProctorAI Security Server is running at http://localhost:${PORT}`);
});

