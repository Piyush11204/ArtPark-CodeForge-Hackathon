import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, Circle, ExternalLink, ArrowLeft, Target,
  Trophy, Zap, Star, Layers, BookOpen, Award, Download,
  TrendingUp, ChevronDown, ChevronUp, Briefcase, MapPin,
  CheckCircle2, BarChart2, Lightbulb, Users,
} from 'lucide-react';
import { pathwayService } from '../services/gapService';
import { jobService } from '../services/jobService';
import { SkillBadge, Spinner, Button, Alert, Card } from '../components/ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CYCLE = ['pending', 'in-progress', 'completed'];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── SVG Ring ─────────────────────────────────────────────────────────────────
function RingScore({ value = 0, color = '#6366f1', size = 100, trackColor = '#1e293b' }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 100, 1) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="9" stroke={trackColor} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="9"
        stroke={color} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill="white" fontSize="16" fontWeight="700">{value}%</text>
    </svg>
  );
}

// ─── Timeline connector ───────────────────────────────────────────────────────
function TimelineDot({ status, priority }) {
  const colors = {
    completed:   'bg-emerald-400 border-emerald-500 shadow-emerald-900',
    'in-progress': 'bg-yellow-400 border-yellow-500 shadow-yellow-900',
    pending:     priority === 'critical' ? 'bg-red-800 border-red-700' : priority === 'recommended' ? 'bg-amber-800 border-amber-700' : 'bg-slate-600 border-slate-500',
  };
  return (
    <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${colors[status] ?? colors.pending} shadow-sm`} />
  );
}

// ─── Step card (expanded) ─────────────────────────────────────────────────────
function TimelineStep({ step, index, total, onToggle }) {
  const [busy, setBusy]       = useState(false);
  const [open, setOpen]       = useState(step.priority === 'critical');

  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(step.status ?? 'pending') + 1) % STATUS_CYCLE.length];

  const handleToggle = async () => {
    setBusy(true);
    await onToggle(step._id, next);
    setBusy(false);
  };

  const priorityBadge = {
    critical:    'bg-red-900/60 text-red-300 border border-red-700',
    recommended: 'bg-amber-900/60 text-amber-300 border border-amber-700',
    optional:    'bg-slate-700 text-slate-400',
  }[step.priority] ?? 'bg-slate-700 text-slate-400';

  const cardBorder = {
    completed:   'border-emerald-800 bg-emerald-900/10',
    'in-progress': 'border-yellow-800 bg-yellow-900/10',
    pending:     step.priority === 'critical' ? 'border-red-800/60 bg-slate-800' : 'border-slate-700 bg-slate-800',
  }[step.status] ?? 'border-slate-700 bg-slate-800';

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 w-5">
        <TimelineDot status={step.status} priority={step.priority} />
        {index < total - 1 && (
          <div className={`w-0.5 flex-1 mt-1 ${step.status === 'completed' ? 'bg-emerald-700' : 'bg-slate-700'}`} />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border ${cardBorder} overflow-hidden`}>
        {/* Header row */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <button onClick={handleToggle} disabled={busy} className="shrink-0 mt-0.5" title="Cycle status">
              {step.status === 'completed' ? (
                <CheckCircle size={22} className="text-emerald-400" />
              ) : step.status === 'in-progress' ? (
                <Circle size={22} className="text-yellow-400 fill-yellow-400/20" />
              ) : (
                <Circle size={22} className="text-slate-500 hover:text-slate-300" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-500">#{step.order}</span>
                <SkillBadge skill={step.skill} variant={
                  step.status === 'completed' ? 'satisfied' :
                  step.status === 'in-progress' ? 'partial' : 'neutral'
                } />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge}`}>
                  {step.priority}
                </span>
              </div>

              {/* Course title */}
              {step.courseTitle && (
                <p className="text-base font-semibold text-white mt-1">{step.courseTitle}</p>
              )}

              {/* Provider + hours + link */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {step.courseProvider && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                    <BookOpen size={11} /> {step.courseProvider}
                  </span>
                )}
                {step.estimatedHours > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} /> {step.estimatedHours}h estimated
                  </span>
                )}
                {step.status === 'completed' && step.completedAt && (
                  <span className="text-xs text-emerald-400">✓ {fmtDate(step.completedAt)}</span>
                )}
              </div>
            </div>

            {/* Expand + course link */}
            <div className="flex items-center gap-2 shrink-0">
              {step.resourceUrl && (
                <a
                  href={step.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <ExternalLink size={12} /> Open
                </a>
              )}
              <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 text-slate-500 hover:text-white transition-colors"
              >
                {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded body */}
        {open && (
          <div className="border-t border-slate-700/50 px-4 py-3 space-y-3">
            {step.reason && (
              <p className="text-sm text-slate-300 leading-relaxed">{step.reason}</p>
            )}
            {step.resourceUrl && (
              <a
                href={step.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <ExternalLink size={14} /> Start Learning on {step.courseProvider ?? 'Course Platform'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Progress breakdown by priority ──────────────────────────────────────────
function ProgressBreakdown({ steps }) {
  const groups = {
    critical:    { label: 'Critical',    color: '#ef4444', icon: <Zap size={13} /> },
    recommended: { label: 'Recommended', color: '#f59e0b', icon: <Star size={13} /> },
    optional:    { label: 'Optional',    color: '#94a3b8', icon: <Layers size={13} /> },
  };
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([p, cfg]) => {
        const total = steps.filter(s => s.priority === p).length;
        if (!total) return null;
        const done  = steps.filter(s => s.priority === p && s.status === 'completed').length;
        const pct   = Math.round((done / total) * 100);
        return (
          <div key={p}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
              <span>{done}/{total} · {pct}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: cfg.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PDF builder ─────────────────────────────────────────────────────────────
function buildPDF(pathway) {
  const steps = pathway?.steps ?? [];
  const job   = pathway?.jobId;

  const rows = ['critical','recommended','optional'].map(p => {
    const ps = steps.filter(s => s.priority === p);
    if (!ps.length) return '';
    const colors = { critical: '#dc2626', recommended: '#d97706', optional: '#94a3b8' };
    const labels = { critical: '🔴 Critical', recommended: '🟡 Recommended', optional: '⚪ Optional' };
    return `
      <h2 style="font-size:14px;color:${colors[p]};margin:18px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${labels[p]}</h2>
      ${ps.map(s => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px;page-break-inside:avoid">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
            <b style="color:#4f46e5">#${s.order}</b>
            <span style="background:#eef2ff;color:#4f46e5;border-radius:4px;padding:1px 7px;font-size:12px">${s.skill}</span>
            <span style="font-size:11px;color:${colors[p]};text-transform:capitalize">${p}</span>
            ${s.status === 'completed' ? '<span style="color:#10b981;font-size:11px">✓ Completed</span>' : ''}
          </div>
          ${s.courseTitle ? `<p style="font-size:13px;font-weight:600;margin:0 0 4px">📚 ${s.courseTitle}</p>` : ''}
          <p style="font-size:12px;color:#475569;margin:0 0 5px;line-height:1.5">${s.reason ?? ''}</p>
          <div style="display:flex;gap:14px;font-size:11px;color:#94a3b8;flex-wrap:wrap">
            ${s.estimatedHours ? `<span>⏱ ${s.estimatedHours}h</span>` : ''}
            ${s.courseProvider ? `<span>🎓 ${s.courseProvider}</span>` : ''}
            ${s.resourceUrl ? `<a href="${s.resourceUrl}" style="color:#6366f1">🔗 Start</a>` : ''}
          </div>
        </div>`).join('')}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Full Learning Pathway${job?.jobTitle ? ' — ' + job.jobTitle : ''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:36px;max-width:800px;margin:0 auto}
  h1{font-size:22px;font-weight:700}
  .sub{color:#64748b;font-size:13px;margin:4px 0 18px}
  .stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
  .stat{border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;text-align:center}
  .stat-v{font-size:20px;font-weight:700}
  .stat-l{font-size:11px;color:#94a3b8}
  @media print{body{padding:18px}}
</style>
</head><body>
  <h1>🗺 Full Learning Pathway${job?.jobTitle ? ': ' + job.jobTitle : ''}</h1>
  <p class="sub">${job?.companyName ? job.companyName + ' · ' : ''}Printed ${new Date().toLocaleDateString()} · ${steps.length} steps · ~${pathway.totalEstimatedHours ?? 0}h · ${pathway.progressPercent ?? 0}% complete</p>
  <div class="stats">
    <div class="stat"><div class="stat-v" style="color:#6366f1">${pathway.progressPercent ?? 0}%</div><div class="stat-l">Progress</div></div>
    <div class="stat"><div class="stat-v" style="color:#10b981">${steps.filter(s=>s.status==='completed').length}</div><div class="stat-l">Completed</div></div>
    <div class="stat"><div class="stat-v" style="color:#ef4444">${steps.filter(s=>s.priority==='critical'&&s.status!=='completed').length}</div><div class="stat-l">Critical Left</div></div>
    <div class="stat"><div class="stat-v" style="color:#f59e0b">${pathway.totalEstimatedHours ?? 0}h</div><div class="stat-l">Total Hours</div></div>
  </div>
  ${rows}
</body></html>`;

  const w = window.open('', '_blank', 'width=860,height=720');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ─── Main PathwayPage ─────────────────────────────────────────────────────────
export default function PathwayPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all | pending | in-progress | completed

  useEffect(() => {
    pathwayService.getById(id)
      .then(data => {
        setPathway(data);
        // Fetch related jobs using job title
        const title = data?.jobId?.jobTitle ?? '';
        if (title) {
          jobService.searchJobs(title, { limit: 5 })
            .then(r => setRelatedJobs((r?.jobs ?? r ?? []).filter(j => String(j._id) !== String(data?.jobId?._id)).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(() => setError('Failed to load pathway.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async (stepId, status) => {
    try {
      const update = await pathwayService.updateStep(id, stepId, status);
      setPathway(prev => ({
        ...prev,
        steps: prev.steps.map(s => String(s._id) === String(stepId) ? { ...s, status } : s),
        completedHours:  update?.completedHours  ?? prev.completedHours,
        progressPercent: update?.progressPercent ?? prev.progressPercent,
      }));
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm">Loading your pathway…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">← Back</Button>
      </div>
    );
  }

  const steps     = pathway?.steps ?? [];
  const pct       = pathway?.progressPercent ?? 0;
  const totalHrs  = pathway?.totalEstimatedHours ?? 0;
  const doneCount = steps.filter(s => s.status === 'completed').length;
  const inProg    = steps.filter(s => s.status === 'in-progress').length;
  const hrsLeft   = steps.filter(s => s.status !== 'completed').reduce((a,s)=>a+(s.estimatedHours??0),0);

  const critical    = steps.filter(s => s.priority === 'critical').length;
  const recommended = steps.filter(s => s.priority === 'recommended').length;
  const optional    = steps.filter(s => s.priority === 'optional').length;

  const jobTitle = pathway?.jobId?.jobTitle ?? 'Learning Pathway';
  const company  = pathway?.jobId?.companyName ?? '';
  const workType = pathway?.jobId?.workType ?? '';

  const filteredSteps = activeFilter === 'all' ? steps : steps.filter(s => s.status === activeFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Button
          variant="secondary"
          onClick={() => buildPDF(pathway)}
          className="flex items-center gap-2 text-sm"
        >
          <Download size={14} /> Export PDF
        </Button>
      </div>

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Ring */}
          <div className="shrink-0">
            <RingScore value={pct} color={pct === 100 ? '#10b981' : '#6366f1'} size={110} />
            <p className="text-xs text-slate-400 text-center mt-1">Progress</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} className="text-indigo-400" />
              <h1 className="text-2xl font-bold text-white truncate">{jobTitle}</h1>
            </div>
            {company && (
              <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                <span className="flex items-center gap-1"><Briefcase size={13} /> {company}</span>
                {workType && <span className="capitalize px-2 py-0.5 bg-slate-700 rounded text-xs">{workType}</span>}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> {doneCount} completed</span>
              {inProg > 0 && <span className="flex items-center gap-1"><Circle size={12} className="text-yellow-400" /> {inProg} in progress</span>}
              <span className="flex items-center gap-1"><Clock size={12} /> {hrsLeft}h remaining</span>
              <span className="flex items-center gap-1 text-indigo-300"><BarChart2 size={12} /> {totalHrs}h total</span>
            </div>
          </div>

          {/* Trophy on completion */}
          {pct === 100 && (
            <div className="text-center shrink-0">
              <Trophy size={48} className="text-yellow-400 mx-auto" />
              <p className="text-xs text-yellow-400 font-semibold mt-1">Complete!</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-6 flex-col lg:flex-row">

        {/* ── Left: timeline ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'all',         label: `All (${steps.length})` },
              { key: 'pending',     label: `Pending (${steps.filter(s=>s.status==='pending').length})` },
              { key: 'in-progress', label: `In Progress (${inProg})` },
              { key: 'completed',   label: `Done (${doneCount})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          {filteredSteps.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No steps in this filter.</div>
          ) : (
            filteredSteps.map((step, i) => (
              <TimelineStep
                key={step._id}
                step={step}
                index={i}
                total={filteredSteps.length}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">

          {/* Stats */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={14} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Progress Breakdown</h3>
            </div>
            <ProgressBreakdown steps={steps} />
            <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-center">
              {[
                { val: critical, label: 'Critical',    color: 'text-red-400' },
                { val: recommended, label: 'Recommended', color: 'text-amber-400' },
                { val: optional,    label: 'Optional',    color: 'text-slate-400' },
                { val: `${totalHrs}h`, label: 'Total Hours', color: 'text-blue-400' },
              ].map(({ val, label, color }) => (
                <div key={label} className="py-1">
                  <div className={`text-lg font-bold ${color}`}>{val}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Personal tips */}
          <Card className="border-l-4 border-indigo-600">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Tips</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-1.5"><Zap size={11} className="text-red-400 mt-0.5 shrink-0" /> Complete critical skills first — they unblock everything else.</li>
              <li className="flex items-start gap-1.5"><TrendingUp size={11} className="text-blue-400 mt-0.5 shrink-0" /> 1 hour/day = finish in ~{Math.ceil(hrsLeft / 30)} months at this pace.</li>
              <li className="flex items-start gap-1.5"><Award size={11} className="text-yellow-400 mt-0.5 shrink-0" /> Completing a step updates your match score for future applications.</li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={11} className="text-emerald-400 mt-0.5 shrink-0" /> Mark steps in-progress to track what you're actively studying.</li>
            </ul>
          </Card>

          {/* Related jobs */}
          {relatedJobs.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Related Roles</h3>
              </div>
              <div className="space-y-2">
                {relatedJobs.map(job => {
                  const title   = job.jobTitle ?? job.title ?? 'Role';
                  const co      = job.companyName ?? '';
                  const rawLoc  = job.jobLocation ?? job.location;
                  const loc     = rawLoc && typeof rawLoc === 'object'
                    ? [rawLoc.city, rawLoc.country].filter(Boolean).join(', ')
                    : rawLoc;
                  return (
                    <button
                      key={job._id}
                      onClick={() => navigate('/jobs')}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                    >
                      <p className="text-xs font-semibold text-white truncate">{title}</p>
                      <p className="text-xs text-slate-400">{co}{loc ? ` · ${loc}` : ''}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Completion banner ────────────────────────────────────────────────── */}
      {pct === 100 && (
        <div className="mt-8 text-center py-10 bg-gradient-to-r from-emerald-900/40 to-indigo-900/40 border border-emerald-700 rounded-2xl">
          <Trophy size={52} className="text-yellow-400 mx-auto mb-3" />
          <p className="text-2xl font-bold text-white mb-2">Pathway Complete! 🎉</p>
          <p className="text-slate-300 text-sm mb-6">You've completed every step. You're ready to apply for this role with confidence.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => navigate('/jobs')}>
              <Briefcase size={15} /> Browse Jobs
            </Button>
            <Button variant="secondary" onClick={() => buildPDF(pathway)}>
              <Download size={15} /> Save Certificate PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


