import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Circle, Clock, ExternalLink, Trophy,
  Download, Target, Briefcase, MapPin, ArrowRight,
  BookOpen, Zap, Star, TrendingUp, Award, ChevronDown,
  ChevronUp, Layers, Users, Lightbulb, CheckCircle2,
} from 'lucide-react';
import { pathwayService } from '../../services/gapService';
import { jobService } from '../../services/jobService';
import { useOnboardStore } from '../../store/onboardStore';
import { SkillBadge, Spinner, Button, Alert, Card } from '../../components/ui';

// ─── SVG ring ─────────────────────────────────────────────────────────────────
function RingScore({ value = 0, color = '#6366f1', size = 90, label }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 100, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="8" stroke="#1e293b" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="8"
          stroke={color} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill="white" fontSize="15" fontWeight="700">
          {value}%
        </text>
      </svg>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
}

// ─── Status cycle ──────────────────────────────────────────────────────────────
const STATUS_CYCLE = ['pending', 'in-progress', 'completed'];

const PRIORITY_STYLES = {
  critical:    { bg: 'bg-red-900/30 border-red-800',    badge: 'bg-red-900/60 text-red-300',    icon: '🔴', label: 'Critical' },
  recommended: { bg: 'bg-amber-900/20 border-amber-800', badge: 'bg-amber-900/60 text-amber-300', icon: '🟡', label: 'Recommended' },
  optional:    { bg: 'bg-slate-800 border-slate-700',    badge: 'bg-slate-700 text-slate-400',    icon: '⚪', label: 'Optional' },
};

// ─── Single step card ──────────────────────────────────────────────────────────
function StepCard({ step, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ps = PRIORITY_STYLES[step.priority] ?? PRIORITY_STYLES.optional;

  const toggle = async () => {
    const idx = STATUS_CYCLE.indexOf(step.status ?? 'pending');
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setUpdating(true);
    try { await onStatusUpdate(step._id, next); } finally { setUpdating(false); }
  };

  return (
    <div className={`rounded-xl border ${ps.bg} transition-all`}>
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Status toggle */}
        <button onClick={toggle} disabled={updating} className="shrink-0 mt-0.5" title="Cycle status">
          {step.status === 'completed' ? (
            <CheckCircle size={22} className="text-emerald-400" />
          ) : step.status === 'in-progress' ? (
            <Circle size={22} className="text-yellow-400 fill-yellow-400/20" />
          ) : (
            <Circle size={22} className="text-slate-500" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500">#{step.order}</span>
            <SkillBadge skill={step.skill} variant={
              step.status === 'completed' ? 'satisfied' :
              step.status === 'in-progress' ? 'partial' : 'neutral'
            } />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ps.badge}`}>
              {ps.icon} {ps.label}
            </span>
            {step.status === 'completed' && (
              <span className="text-xs text-emerald-400 font-medium">✓ Done</span>
            )}
          </div>

          {/* Course info */}
          {step.courseTitle && (
            <p className="text-sm font-semibold text-white mt-1 mb-0.5">{step.courseTitle}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {step.estimatedHours > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={11} /> {step.estimatedHours}h
              </span>
            )}
            {step.courseProvider && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <BookOpen size={11} /> {step.courseProvider}
              </span>
            )}
            {step.resourceUrl && (
              <a
                href={step.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <ExternalLink size={11} /> Start Course
              </a>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded: reason + completion date */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/60 pt-3 space-y-2">
          {step.reason && (
            <p className="text-sm text-slate-300 leading-relaxed">{step.reason}</p>
          )}
          {step.completedAt && (
            <p className="text-xs text-emerald-400">
              ✓ Completed on {new Date(step.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Priority section header ───────────────────────────────────────────────────
function PrioritySection({ priority, steps, onStatusUpdate }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!steps.length) return null;

  const completed = steps.filter(s => s.status === 'completed').length;
  const totalH = steps.reduce((a, s) => a + (s.estimatedHours ?? 0), 0);

  const headerCfg = {
    critical:    { color: 'text-red-400',   border: 'border-red-700',   bg: 'bg-red-900/10',   icon: <Zap size={15} />,   title: 'Critical Skills — Must Learn',          sub: 'Required for this role — top priority' },
    recommended: { color: 'text-amber-400', border: 'border-amber-700', bg: 'bg-amber-900/10', icon: <Star size={15} />,   title: 'Recommended — Strengthen Your Profile', sub: 'Preferred skills that make you stand out' },
    optional:    { color: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-800/30', icon: <Layers size={15} />, title: 'Optional — Extra Value',                sub: 'Nice-to-have skills for broader expertise' },
  }[priority];

  return (
    <div className={`rounded-xl border ${headerCfg.border} ${headerCfg.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className={headerCfg.color}>{headerCfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${headerCfg.color}`}>{headerCfg.title}</p>
          <p className="text-xs text-slate-500">{headerCfg.sub}</p>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="text-slate-400">{completed}/{steps.length} done</span>
          <span className="text-slate-500">~{totalH}h</span>
          {collapsed ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronUp size={16} className="text-slate-500" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map(step => (
            <StepCard key={step._id} step={step} onStatusUpdate={onStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Related job card ──────────────────────────────────────────────────────────
function RelatedJobCard({ job, onNavigate }) {
  const title   = job.jobTitle ?? job.title ?? 'Role';
  const company = job.companyName ?? job.company ?? '';
  const rawLoc  = job.jobLocation ?? job.location;
  const location = rawLoc && typeof rawLoc === 'object'
    ? [rawLoc.city, rawLoc.country].filter(Boolean).join(', ')
    : rawLoc;
  const skills = (job.requiredSkills ?? []).slice(0, 4);
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-slate-400">{company}</p>
        {location && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {location}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {skills.map(s => <SkillBadge key={s} skill={s} variant="neutral" />)}
      </div>
      <button
        onClick={onNavigate}
        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-auto"
      >
        Browse jobs <ArrowRight size={11} />
      </button>
    </div>
  );
}

// ─── PDF download ──────────────────────────────────────────────────────────────
function buildPDF(pathway, gapReport, selectedJob) {
  const steps = pathway?.steps ?? [];
  const priorities = ['critical', 'recommended', 'optional'];

  const skillRows = priorities.map(p => {
    const ps = steps.filter(s => s.priority === p);
    if (!ps.length) return '';
    const labels = { critical: '🔴 Critical — Must Learn', recommended: '🟡 Recommended', optional: '⚪ Optional' };
    const colors = { critical: '#dc2626', recommended: '#d97706', optional: '#94a3b8' };
    return `
      <h2 style="font-size:14px;font-weight:700;color:${colors[p]};margin:20px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${labels[p]}</h2>
      ${ps.map(s => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:8px;page-break-inside:avoid">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <strong style="color:#4f46e5;min-width:32px">#${s.order}</strong>
            <span style="background:#eef2ff;color:#4f46e5;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">${s.skill}</span>
            <span style="font-size:11px;color:${colors[p]};font-weight:600;text-transform:capitalize">${p}</span>
          </div>
          ${s.courseTitle ? `<p style="font-size:13px;font-weight:600;color:#1e293b;margin:0 0 4px">📚 ${s.courseTitle}</p>` : ''}
          <p style="font-size:12px;color:#475569;margin:0 0 6px;line-height:1.5">${s.reason || ''}</p>
          <div style="display:flex;gap:16px;font-size:12px;color:#94a3b8;flex-wrap:wrap">
            ${s.estimatedHours ? `<span>⏱ ${s.estimatedHours}h</span>` : ''}
            ${s.courseProvider ? `<span>🎓 ${s.courseProvider}</span>` : ''}
            ${s.resourceUrl ? `<a href="${s.resourceUrl}" style="color:#6366f1">🔗 Start Course</a>` : ''}
          </div>
        </div>`).join('')}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Learning Roadmap — ${selectedJob?.jobTitle ?? 'Your Role'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:white;padding:36px;max-width:800px;margin:0 auto}
  h1{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:4px}
  .sub{color:#64748b;font-size:13px;margin-bottom:20px}
  .stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
  .stat{border:1px solid #e2e8f0;border-radius:8px;padding:10px 18px;text-align:center}
  .stat-v{font-size:20px;font-weight:700}
  .stat-l{font-size:11px;color:#94a3b8;margin-top:2px}
  .skills-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
  .skill-chip{background:#f1f5f9;color:#334155;border-radius:4px;padding:3px 8px;font-size:12px}
  @media print{body{padding:20px}}
</style>
</head>
<body>
  <h1>🗺️ Learning Roadmap: ${selectedJob?.jobTitle ?? 'Your Role'}</h1>
  <p class="sub">${selectedJob?.companyName ? selectedJob.companyName + ' · ' : ''}Generated ${new Date().toLocaleDateString()} · ${steps.length} learning steps · ~${pathway?.totalEstimatedHours ?? 0}h total</p>
  <div class="stats">
    <div class="stat"><div class="stat-v" style="color:#6366f1">${gapReport?.matchScore ?? 0}%</div><div class="stat-l">Match Score</div></div>
    <div class="stat"><div class="stat-v" style="color:#10b981">${(gapReport?.satisfied ?? []).length}</div><div class="stat-l">Skills Matched</div></div>
    <div class="stat"><div class="stat-v" style="color:#ef4444">${steps.filter(s => s.priority === 'critical').length}</div><div class="stat-l">Critical to Learn</div></div>
    <div class="stat"><div class="stat-v" style="color:#f59e0b">${pathway?.totalEstimatedHours ?? 0}h</div><div class="stat-l">Total Hours</div></div>
  </div>
  ${(gapReport?.satisfied ?? []).length ? `<p style="font-size:13px;color:#64748b;margin-bottom:6px">✅ Already have: <strong>${(gapReport?.satisfied ?? []).join(', ')}</strong></p>` : ''}
  ${skillRows}
</body></html>`;

  const w = window.open('', '_blank', 'width=860,height=720');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ─── Personal recommendations ─────────────────────────────────────────────────
function PersonalRecommendations({ gapReport, steps }) {
  const { matchScore = 0, satisfied = [], missing = [], transferable = [] } = gapReport ?? {};
  const recs = [];

  if (matchScore >= 70) {
    recs.push({ icon: <Trophy size={15} className="text-yellow-400" />, text: `You're a strong match at ${matchScore}% — focus on the ${missing.length} remaining critical skills to become a top candidate.` });
  } else if (matchScore >= 40) {
    recs.push({ icon: <TrendingUp size={15} className="text-blue-400" />, text: `At ${matchScore}% match, completing the critical steps below will significantly boost your profile. You're making real progress.` });
  } else {
    recs.push({ icon: <Lightbulb size={15} className="text-amber-400" />, text: `With ${matchScore}% match, start with the critical skills — even completing 2-3 will dramatically improve your candidacy.` });
  }

  if (satisfied.length > 0) {
    const top3 = satisfied.slice(0, 3);
    recs.push({ icon: <CheckCircle2 size={15} className="text-emerald-400" />, text: `Your existing ${top3.join(', ')} skills are directly relevant — they'll speed up learning adjacent topics in your roadmap.` });
  }

  const criticalSteps = steps.filter(s => s.priority === 'critical' && s.status !== 'completed');
  if (criticalSteps.length > 0) {
    const first = criticalSteps[0];
    recs.push({ icon: <Zap size={15} className="text-red-400" />, text: `Start with "${first.courseTitle || first.skill}" — it's your highest-priority gap and unlocks the most value for this role.` });
  }

  if (transferable.length > 0) {
    recs.push({ icon: <Layers size={15} className="text-violet-400" />, text: `Your ${transferable.slice(0, 3).join(', ')} skills go beyond this role's requirements — highlight them in your profile and cover letter.` });
  }

  return (
    <Card className="border-l-4 border-indigo-500">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} className="text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Personalized Recommendations</h3>
      </div>
      <div className="space-y-2.5">
        {recs.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
            <span className="shrink-0 mt-0.5">{r.icon}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RoadmapStep() {
  const navigate = useNavigate();
  const { gapReportId, gapReport, selectedJob, setPathway } = useOnboardStore();
  const [pathway, setLocalPathway] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [relatedJobs, setRelatedJobs] = useState([]);

  // Generate pathway on mount
  useEffect(() => {
    if (!gapReportId) { navigate('/onboard/gap'); return; }
    pathwayService.generate(gapReportId)
      .then(p => { setLocalPathway(p); setPathway(p._id); })
      .catch(err => setError(err?.response?.data?.message || 'Failed to generate roadmap.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  // Fetch related jobs once the selected job is known
  useEffect(() => {
    const query = selectedJob?.jobTitle ?? selectedJob?.title ?? '';
    if (!query) return;
    jobService.searchJobs(query, { limit: 5 })
      .then(data => {
        const jobs = data?.jobs ?? data ?? [];
        setRelatedJobs(jobs.filter(j => String(j._id) !== String(selectedJob?._id)).slice(0, 4));
      })
      .catch(() => {});
  }, [selectedJob]);

  const handleStatusUpdate = async (stepId, status) => {
    if (!pathway) return;
    try {
      const update = await pathwayService.updateStep(pathway._id, stepId, status);
      setLocalPathway(prev => ({
        ...prev,
        steps: prev.steps.map(s => String(s._id) === String(stepId) ? { ...s, status } : s),
        completedHours:  update?.completedHours  ?? prev.completedHours,
        progressPercent: update?.progressPercent ?? prev.progressPercent,
      }));
    } catch { /* silent */ }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <Spinner size="lg" />
          <Trophy size={20} className="text-yellow-400 absolute -top-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Building your personalized roadmap…</p>
          <p className="text-slate-400 text-sm mt-1">Matching skills · Finding courses · Ordering by prerequisites</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/onboard/gap')} variant="secondary" className="mt-4">← Back</Button>
      </div>
    );
  }

  const steps     = pathway?.steps ?? [];
  const pct       = pathway?.progressPercent ?? 0;
  const totalHrs  = pathway?.totalEstimatedHours ?? 0;
  const doneCount = steps.filter(s => s.status === 'completed').length;
  const hrsLeft   = steps.filter(s => s.status !== 'completed').reduce((a, s) => a + (s.estimatedHours ?? 0), 0);

  const critical    = steps.filter(s => s.priority === 'critical');
  const recommended = steps.filter(s => s.priority === 'recommended');
  const optional    = steps.filter(s => s.priority === 'optional');

  const matchScore = gapReport?.matchScore ?? 0;
  const gapScore   = gapReport?.gapScore   ?? 0;
  const satisfied  = gapReport?.satisfied  ?? [];
  const missing    = gapReport?.missing    ?? [];
  const jobTitle   = selectedJob?.jobTitle ?? selectedJob?.title ?? 'Target Role';
  const company    = selectedJob?.companyName ?? selectedJob?.company ?? '';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">

      {/* ── Header card ─────────────────────────────────────────────────────── */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-slate-800 to-purple-900/20 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="flex gap-4 shrink-0">
            <RingScore value={matchScore} color="#6366f1" label="Match" />
            <RingScore value={Math.max(0, 100 - gapScore)} color="#10b981" size={72} label="Skill Fit" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={18} className="text-yellow-400" />
              <h2 className="text-xl font-bold text-white truncate">{jobTitle}</h2>
            </div>
            {company && <p className="text-slate-400 text-sm mb-2">{company}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Briefcase size={12} /> {steps.length} steps</span>
              <span className="flex items-center gap-1"><Clock size={12} /> ~{totalHrs}h total</span>
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> {satisfied.length} matched</span>
              <span className="flex items-center gap-1 text-red-400"><Target size={12} /> {missing.length} to learn</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{doneCount}/{steps.length} completed</span>
            <span className="font-semibold text-white">{pct}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* ── Summary mini stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Critical',    val: critical.length,    color: 'text-red-400',    icon: <Zap size={14} /> },
          { label: 'Recommended', val: recommended.length, color: 'text-amber-400',  icon: <Star size={14} /> },
          { label: 'Hours Left',  val: `${hrsLeft}h`,      color: 'text-blue-400',   icon: <Clock size={14} /> },
          { label: 'Completed',   val: doneCount,          color: 'text-emerald-400',icon: <Award size={14} /> },
        ].map(({ label, val, color, icon }) => (
          <Card key={label} className="text-center py-3 px-2">
            <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>{icon}</div>
            <div className={`text-xl font-bold ${color}`}>{val}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </Card>
        ))}
      </div>

      {/* ── Personal recommendations ─────────────────────────────────────────── */}
      <PersonalRecommendations gapReport={gapReport} steps={steps} />

      {/* ── Grouped step sections ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <PrioritySection priority="critical"    steps={critical}    onStatusUpdate={handleStatusUpdate} />
        <PrioritySection priority="recommended" steps={recommended} onStatusUpdate={handleStatusUpdate} />
        <PrioritySection priority="optional"    steps={optional}    onStatusUpdate={handleStatusUpdate} />
      </div>

      {/* ── Already strong ───────────────────────────────────────────────────── */}
      {satisfied.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Already Matching ({satisfied.length} skills)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">These match the job requirements — keep them sharp and mention them prominently.</p>
          <div className="flex flex-wrap gap-1.5">
            {satisfied.map(s => <SkillBadge key={s} skill={s} variant="satisfied" />)}
          </div>
        </Card>
      )}

      {/* ── Related roles ────────────────────────────────────────────────────── */}
      {relatedJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Similar Roles You Might Like</h3>
            <span className="ml-auto text-xs text-slate-500">Based on your target role</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedJobs.map(job => (
              <RelatedJobCard key={job._id} job={job} onNavigate={() => navigate('/jobs')} />
            ))}
          </div>
        </div>
      )}

      {/* ── Action bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
        <Button
          variant="secondary"
          onClick={() => buildPDF(pathway, gapReport, selectedJob)}
          className="flex items-center gap-2"
        >
          <Download size={14} /> Download PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex-1"
        >
          Go to Dashboard
        </Button>
        {pathway?._id && (
          <Button onClick={() => navigate(`/pathway/${pathway._id}`)} className="flex-1">
            Full Pathway View <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
