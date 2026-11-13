// Report Generator for ProctorAI
class ReportGenerator {
  static renderReport(containerId, sessionData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      id,
      candidateName,
      studentId,
      email,
      college = 'ABC College / Institutional Registry',
      department = 'Computer Applications (MCA)',
      examTitle,
      startTime,
      endTime,
      integrityScore = 100,
      stats = {},
      violations = [],
      verdict = {},
      examResult = null,
      timeSpentSec = 0
    } = sessionData;

    const formattedStart = new Date(startTime).toLocaleString();
    const formattedEnd = endTime ? new Date(endTime).toLocaleString() : 'N/A';
    const totalMinutes = Math.floor(timeSpentSec / 60);
    const totalSecs = timeSpentSec % 60;
    const durationFormatted = `${totalMinutes}m ${totalSecs}s`;

    // Determine verdict details
    const verdictLabel = verdict.label || (integrityScore >= 80 ? 'Verified High Integrity' : integrityScore >= 50 ? 'Suspicious / Review Recommended' : 'Disqualified / High Risk');
    const verdictColor = verdict.color || (integrityScore >= 80 ? 'emerald' : integrityScore >= 50 ? 'amber' : 'red');
    const verdictDesc = verdict.description || '';

    // Color helpers
    const badgeColorClasses = {
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      red: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    }[verdictColor] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

    const gaugeStrokeColor = {
      emerald: '#10b981',
      amber: '#f59e0b',
      red: '#ef4444'
    }[verdictColor] || '#3b82f6';

    // SVG Circle Calculations
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (integrityScore / 100) * circumference;

    // Filter snapshot violations
    const snapshotViolations = violations.filter(v => v.snapshotUrl || (v.snapshotBase64));

    let html = `
      <div class="proctor-report-wrapper max-w-5xl mx-auto space-y-8 print:p-0">
        <!-- Print / Action Bar -->
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg print:hidden">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span class="text-sm font-medium text-slate-300">Official Proctoring Integrity Dossier Generated</span>
          </div>
          <div class="flex items-center gap-3">
            <button id="btn-print-report" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-md">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h10z"></path></svg>
              Print / Save PDF
            </button>
            <button id="btn-export-json" class="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download Audit JSON
            </button>
            <button id="btn-retake-exam" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-all">
              New Session
            </button>
          </div>
        </div>

        <!-- Document Header -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div class="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                AI Security Proctoring Audit Report
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${examTitle}</h1>
              <p class="text-sm text-slate-400 mt-1">Session ID: <span class="font-mono text-slate-300">${id}</span></p>
            </div>
            <div class="flex flex-col items-start md:items-end">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${badgeColorClasses}">
                <span class="w-2 h-2 rounded-full ${verdictColor === 'emerald' ? 'bg-emerald-400' : verdictColor === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}"></span>
                ${verdictLabel}
              </span>
              <span class="text-xs text-slate-500 mt-2">Generated on ${new Date().toLocaleString()}</span>
            </div>
          </div>

          <!-- Candidate & Exam Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6 text-sm">
            <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              <span class="text-xs text-slate-400 uppercase tracking-wider block">Candidate Name</span>
              <span class="font-semibold text-slate-100 text-base mt-0.5 block truncate">${candidateName}</span>
            </div>
            <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              <span class="text-xs text-slate-400 uppercase tracking-wider block">Student / Roll ID</span>
              <span class="font-semibold text-slate-100 text-base mt-0.5 block font-mono truncate">${studentId}</span>
            </div>
            <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
              <span class="text-xs text-slate-400 uppercase tracking-wider block">Institution</span>
              <span class="font-semibold text-slate-100 text-xs mt-0.5 block truncate" title="${college}">${college}</span>
            </div>
            <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              <span class="text-xs text-slate-400 uppercase tracking-wider block">Exam Duration</span>
              <span class="font-semibold text-slate-100 text-base mt-0.5 block">${durationFormatted}</span>
            </div>
            <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              <span class="text-xs text-slate-400 uppercase tracking-wider block">Academic Score</span>
              <span class="font-semibold ${examResult && examResult.percentage >= 70 ? 'text-emerald-400' : 'text-slate-100'} text-base mt-0.5 block">
                ${examResult ? `${examResult.score}/${examResult.total} (${examResult.percentage}%)` : 'Submitted'}
              </span>
            </div>
          </div>
        </div>

        <!-- Integrity Score & Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Circular Integrity Score Dial -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Overall Integrity Score</h3>
            <div class="relative w-36 h-36 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="${radius}" stroke="#1e293b" stroke-width="10" fill="transparent" />
                <circle cx="60" cy="60" r="${radius}" stroke="${gaugeStrokeColor}" stroke-width="10" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" fill="transparent" class="transition-all duration-1000" />
              </svg>
              <div class="absolute flex flex-col items-center">
                <span class="text-3xl font-black text-white">${integrityScore}%</span>
                <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Trust Level</span>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-4 leading-relaxed max-w-xs">
              ${verdictDesc}
            </p>
          </div>

          <!-- Violation Breakdown Metrics (2 cols) -->
          <div class="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Proctoring Anomaly Breakdown</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              
              <!-- No Face -->
              <div class="bg-slate-950/60 border ${stats.noFaceCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>No Face Detected</span>
                  <span class="text-base">👤❌</span>
                </div>
                <div class="text-xl font-bold ${stats.noFaceCount > 0 ? 'text-amber-400' : 'text-slate-200'}">
                  ${stats.noFaceCount || 0} <span class="text-xs font-normal text-slate-400">events</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Duration: ${stats.noFaceDurationSec || 0}s absent
                </div>
              </div>

              <!-- Multiple Faces -->
              <div class="bg-slate-950/60 border ${stats.multiFaceCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Multiple Faces</span>
                  <span class="text-base">👥⚠️</span>
                </div>
                <div class="text-xl font-bold ${stats.multiFaceCount > 0 ? 'text-rose-400' : 'text-slate-200'}">
                  ${stats.multiFaceCount || 0} <span class="text-xs font-normal text-slate-400">events</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Unauthorized presence
                </div>
              </div>

              <!-- Tab Switching -->
              <div class="bg-slate-950/60 border ${stats.tabSwitchCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Tab Switches</span>
                  <span class="text-base">📑🔀</span>
                </div>
                <div class="text-xl font-bold ${stats.tabSwitchCount > 0 ? 'text-rose-400' : 'text-slate-200'}">
                  ${stats.tabSwitchCount || 0} <span class="text-xs font-normal text-slate-400">times</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Away: ${stats.tabSwitchDurationSec || 0}s total
                </div>
              </div>

              <!-- Window Blur -->
              <div class="bg-slate-950/60 border ${stats.blurCount > 0 ? 'border-amber-500/40' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Window Focus Lost</span>
                  <span class="text-base">🖥️</span>
                </div>
                <div class="text-xl font-bold ${stats.blurCount > 0 ? 'text-amber-400' : 'text-slate-200'}">
                  ${stats.blurCount || 0} <span class="text-xs font-normal text-slate-400">times</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Outside app focus
                </div>
              </div>

              <!-- Fullscreen Exit -->
              <div class="bg-slate-950/60 border ${stats.fullscreenExitCount > 0 ? 'border-rose-500/40' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Fullscreen Exits</span>
                  <span class="text-base">⛶</span>
                </div>
                <div class="text-xl font-bold ${stats.fullscreenExitCount > 0 ? 'text-rose-400' : 'text-slate-200'}">
                  ${stats.fullscreenExitCount || 0} <span class="text-xs font-normal text-slate-400">times</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Exited secure lock
                </div>
              </div>

              <!-- Audio Spikes -->
              <div class="bg-slate-950/60 border ${stats.audioSpikeCount > 0 ? 'border-amber-500/40' : 'border-slate-800'} p-3.5 rounded-xl">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Audio / Speech Noise</span>
                  <span class="text-base">🎙️</span>
                </div>
                <div class="text-xl font-bold ${stats.audioSpikeCount > 0 ? 'text-amber-400' : 'text-slate-200'}">
                  ${stats.audioSpikeCount || 0} <span class="text-xs font-normal text-slate-400">spikes</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Ambient talk detected
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Evidence Snapshot Gallery -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                AI Captured Evidence Snapshots
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Automated visual webcam capture during flagged security anomalies.</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              ${snapshotViolations.length} Captured Images
            </span>
          </div>

          ${snapshotViolations.length === 0 ? `
            <div class="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 class="text-sm font-semibold text-slate-200">Zero Visual Infractions Recorded</h4>
              <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No camera anomalies (absence, multiple faces) were detected throughout this examination.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${snapshotViolations.map((v, i) => `
                <div class="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-md">
                  <div class="relative aspect-video bg-black overflow-hidden cursor-pointer snapshot-preview-card" data-img="${v.snapshotUrl || v.snapshotBase64}">
                    <img src="${v.snapshotUrl || v.snapshotBase64}" alt="Infraction Snapshot" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <span class="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow ${
                      v.type === 'MULTIPLE_FACES' ? 'bg-rose-600 text-white' :
                      v.type === 'NO_FACE' ? 'bg-amber-600 text-white' :
                      'bg-indigo-600 text-white'
                    }">
                      ${v.type.replace('_', ' ')}
                    </span>
                    <span class="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">
                      ${new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div class="p-3">
                    <p class="text-xs text-slate-300 font-medium truncate">${v.message}</p>
                    <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Severity: <strong class="${v.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}">${v.severity}</strong></span>
                      <button class="text-indigo-400 hover:text-indigo-300 font-medium btn-view-image" data-img="${v.snapshotUrl || v.snapshotBase64}">Enlarge ↗</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Chronological Timeline Log -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Chronological Audit Trail & Event Timeline
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Comprehensive timestamped ledger of all system security events.</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              ${violations.length} Total Logs
            </span>
          </div>

          ${violations.length === 0 ? `
            <div class="py-8 text-center text-slate-400 text-sm">
              ✨ Perfect Session: No suspicious activity or violations recorded during the exam.
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="text-[11px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                  <tr>
                    <th class="px-4 py-3 rounded-l-lg">Time</th>
                    <th class="px-4 py-3">Event Type</th>
                    <th class="px-4 py-3">Severity</th>
                    <th class="px-4 py-3">Description</th>
                    <th class="px-4 py-3">Duration</th>
                    <th class="px-4 py-3 rounded-r-lg text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${violations.map(v => `
                    <tr class="hover:bg-slate-800/30 transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        ${new Date(v.timestamp).toLocaleTimeString()}
                      </td>
                      <td class="px-4 py-3 font-semibold whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${
                          v.type === 'MULTIPLE_FACES' ? 'bg-rose-500/20 text-rose-300' :
                          v.type === 'TAB_SWITCH' ? 'bg-rose-500/20 text-rose-300' :
                          v.type === 'NO_FACE' ? 'bg-amber-500/20 text-amber-300' :
                          v.type === 'WINDOW_BLUR' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }">
                          ${v.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <span class="font-bold ${
                          v.severity === 'CRITICAL' ? 'text-rose-400' :
                          v.severity === 'HIGH' ? 'text-orange-400' :
                          'text-amber-400'
                        }">${v.severity}</span>
                      </td>
                      <td class="px-4 py-3 text-slate-300 max-w-xs truncate">${v.message}</td>
                      <td class="px-4 py-3 text-slate-400 whitespace-nowrap">
                        ${v.durationSec ? `${v.durationSec}s` : 'Instant'}
                      </td>
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        ${v.snapshotUrl || v.snapshotBase64 ? `
                          <button class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded text-[11px] font-medium border border-slate-700 btn-view-image" data-img="${v.snapshotUrl || v.snapshotBase64}">
                            View Photo 🔍
                          </button>
                        ` : '<span class="text-slate-600">—</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Academic Assessment Results -->
        ${examResult ? `
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              Academic Evaluation Results
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-400 block uppercase">Score Obtained</span>
                <span class="text-2xl font-bold text-white mt-1 block">${examResult.score} / ${examResult.total}</span>
              </div>
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-400 block uppercase">Percentage</span>
                <span class="text-2xl font-bold ${examResult.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'} mt-1 block">${examResult.percentage}%</span>
              </div>
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-400 block uppercase">Academic Result</span>
                <span class="text-2xl font-bold ${examResult.passed ? 'text-emerald-400' : 'text-rose-400'} mt-1 block">
                  ${examResult.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </span>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Official Sign-off Footer -->
        <div class="text-center text-xs text-slate-500 py-6 border-t border-slate-800 print:block">
          <p>ProctorAI Enterprise Autonomous Integrity Verification Suite • Cryptographically Logged Session</p>
          <p class="mt-1">This report is an official proctoring record generated automatically based on real-time computer vision and browser security telemetry.</p>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach button listeners
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }

    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessionData, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `ProctorAI_Audit_${sessionData.id}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
      };
    }

    const retakeBtn = document.getElementById('btn-retake-exam');
    if (retakeBtn) {
      retakeBtn.onclick = () => {
        if (window.app && window.app.resetToLogin) {
          window.app.resetToLogin();
        } else {
          window.location.reload();
        }
      };
    }

    // Modal view for enlarged snapshots
    const previewCards = container.querySelectorAll('.btn-view-image, .snapshot-preview-card');
    previewCards.forEach(el => {
      el.addEventListener('click', (e) => {
        const imgSrc = el.getAttribute('data-img');
        if (imgSrc) {
          ReportGenerator.showImageModal(imgSrc);
        }
      });
    });
  }

  static showImageModal(imgSrc) {
    let modal = document.getElementById('proctor-image-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'proctor-image-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in';
      modal.innerHTML = `
        <div class="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📷</span> Evidence Snapshot Full View
            </h3>
            <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl font-bold px-2 py-1">&times;</button>
          </div>
          <div class="p-2 bg-black flex items-center justify-center max-h-[75vh]">
            <img id="modal-img" src="" alt="Evidence" class="max-w-full max-h-[70vh] object-contain rounded" />
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#modal-close-btn').onclick = () => modal.remove();
      modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
      };
    }

    modal.querySelector('#modal-img').src = imgSrc;
  }
}

window.ReportGenerator = ReportGenerator;
