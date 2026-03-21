import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gapService } from '../../services/gapService';
import { useOnboardStore } from '../../store/onboardStore';
import { SkillBadge, Spinner, Button, Alert, Card } from '../../components/ui';
import { ArrowLeft, Briefcase, MapPin, Target, TrendingUp, AlertTriangle, CheckCircle2, XCircle, MinusCircle, BookOpen } from 'lucide-react';

// ─── Circular progress ring ───────────────────────────────────────────────────
function RingScore({ value, color, label, sub }) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white">{Math.round(value)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

// ─── Stacked bar ─────────────────────────────────────────────────────────────
function SkillBar({ satisfied, partial, missing }) {
  const total = satisfied + partial + missing;
  if (total === 0) return null;
  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden h-3 w-full bg-slate-700">
        {satisfied > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{ width: `${(satisfied / total) * 100}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className="bg-amber-400 transition-all duration-700"
            style={{ width: `${(partial / total) * 100}%` }}
          />
        )}
        {missing > 0 && (
          <div
            className="bg-red-500 transition-all duration-700"
            style={{ width: `${(missing / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{satisfied} satisfied</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{partial} partial</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{missing} missing</span>
      </div>
    </div>
  );
}

// ─── Skill column card ────────────────────────────────────────────────────────
function SkillColumn({ icon: Icon, title, skills, variant, iconColor, borderColor }) {
  return (
    <Card className={`flex flex-col gap-3 border-t-4 ${borderColor}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
          variant === 'satisfied' ? 'bg-emerald-900/60 text-emerald-300' :
          variant === 'partial'   ? 'bg-amber-900/60 text-amber-300' :
                                    'bg-red-900/60 text-red-300'
        }`}>{skills.length}</span>
      </div>
      {skills.length === 0 ? (
        <p className="text-xs text-slate-500 italic">None</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => <SkillBadge key={s} skill={s} variant={variant} />)}
        </div>
      )}
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GapStep() {
  const navigate = useNavigate();
  const { resumeId, selectedJob, resumeData, setGapReport } = useOnboardStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resumeId || !selectedJob) { navigate('/onboard'); return; }
    gapService.analyze(resumeId, selectedJob._id)
      .then((data) => { setReport(data); setGapReport(data.gapReportId, data); })
      .catch((err) => setError(err.response?.data?.message || 'Failed to analyse gap. Please try again.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const jobTitle   = selectedJob?.jobTitle   ?? selectedJob?.title;
  const jobCompany = selectedJob?.companyName ?? selectedJob?.company;
  const jobLocation = selectedJob?.jobLocation ?? selectedJob?.location;
  const workType   = selectedJob?.workType;

  // Candidate skills from resume (flat list for display)
  const candidateSkills = (() => {
    const s = resumeData?.skills ?? {};
    return [
      ...(s.technical_skills ?? []),
      ...(s.frameworks ?? []),
      ...(s.databases ?? []),
      ...(s.languages ?? []),
      ...(s.tools_and_technologies ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i);
  })();

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <Spinner size="lg" />
          <Target size={20} className="absolute inset-0 m-auto text-indigo-400" />
        </div>
        <p className="text-slate-300 font-medium">Analysing your skill match…</p>
        <p className="text-slate-500 text-sm">Comparing your resume against {jobTitle}</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/onboard/job')} variant="secondary">
          <ArrowLeft size={16} /> Back to Job Selection
        </Button>
      </div>
    );
  }

  const { satisfied = [], partial = [], missing = [], matchScore = 0, gapScore = 0, totalRequired = 0 } = report ?? {};
  const noData = totalRequired === 0;

  return (
    <div className="w-full space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button variant="ghost" onClick={() => navigate('/onboard/job')} className="mb-3 pl-0 text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Back to Job Selection
          </Button>
          <h2 className="text-2xl font-bold text-white">Skill Gap Analysis</h2>
          <p className="text-slate-400 text-sm mt-0.5">How your skills stack up against the job requirements</p>
        </div>
        <Button onClick={() => navigate('/onboard/roadmap')} className="shrink-0">
          Generate Learning Roadmap →
        </Button>
      </div>

      {/* ── Job info card ───────────────────────────────────────────────────── */}
      <Card className="flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-900/60 border border-indigo-700 flex items-center justify-center shrink-0">
          <Briefcase size={22} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{jobTitle}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
            {jobCompany && <span className="font-medium text-slate-300">{jobCompany}</span>}
            {jobLocation && <span className="flex items-center gap-1"><MapPin size={13} />{jobLocation}</span>}
            {workType && <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs">{workType}</span>}
          </div>
        </div>
        {noData && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2">
            <AlertTriangle size={15} />
            No defined skills for this role — showing your resume skills below
          </div>
        )}
      </Card>

      {/* ── Scores ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-6">
          <RingScore value={matchScore} color="#6366f1" label="Match Score" sub="Skills aligned" />
        </Card>
        <Card className="flex flex-col items-center justify-center py-6">
          <RingScore value={gapScore} color="#ef4444" label="Gap Score" sub="Skills to bridge" />
        </Card>
        <Card className="col-span-2 flex flex-col justify-center gap-4 py-4 px-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp size={15} className="text-indigo-400" />
            <span>Skill Distribution ({satisfied.length + partial.length + missing.length} total required)</span>
          </div>
          <SkillBar satisfied={satisfied.length} partial={partial.length} missing={missing.length} />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-emerald-400">{satisfied.length}</div>
              <div className="text-xs text-slate-500">You have</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400">{partial.length}</div>
              <div className="text-xs text-slate-500">Partial match</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-400">{missing.length}</div>
              <div className="text-xs text-slate-500">You need</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Skill columns ──────────────────────────────────────────────────── */}
      {!noData && (
        <div className="grid md:grid-cols-3 gap-4">
          <SkillColumn
            icon={CheckCircle2} title="Satisfied" skills={satisfied} variant="satisfied"
            iconColor="text-emerald-400" borderColor="border-emerald-600"
          />
          <SkillColumn
            icon={MinusCircle} title="Partial Match" skills={partial} variant="partial"
            iconColor="text-amber-400" borderColor="border-amber-500"
          />
          <SkillColumn
            icon={XCircle} title="Missing — Need to Learn" skills={missing} variant="missing"
            iconColor="text-red-400" borderColor="border-red-600"
          />
        </div>
      )}

      {/* ── Your Resume Skills ─────────────────────────────────────────────── */}
      {candidateSkills.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Your Skills (from Resume)</h3>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300">
              {candidateSkills.length} detected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidateSkills.map((s) => {
              const norm = s.toLowerCase();
              const isSatisfied = satisfied.some(x => x.toLowerCase() === norm);
              const isMissing   = missing.some(x => x.toLowerCase() === norm);
              const isPartial   = partial.some(x => x.toLowerCase() === norm);
              const variant = isSatisfied ? 'satisfied' : isPartial ? 'partial' : isMissing ? 'missing' : 'brand';
              return <SkillBadge key={s} skill={s} variant={variant} />;
            })}
          </div>
          {noData && (
            <p className="text-xs text-slate-500 mt-3 italic">
              Skills are color-coded once compared against job requirements. Select a role with listed skills for a richer analysis.
            </p>
          )}
        </Card>
      )}

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => navigate('/onboard/job')}>
          <ArrowLeft size={16} /> Change Job
        </Button>
        <Button onClick={() => navigate('/onboard/roadmap')} className="flex-1">
          Generate Learning Roadmap →
        </Button>
      </div>
    </div>
  );
}

