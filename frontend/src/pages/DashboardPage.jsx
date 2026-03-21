import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, TrendingUp, FileText, Map, ChevronRight,
  ArrowRight, Sparkles, CheckCircle, Clock, BarChart2, Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gapService, pathwayService } from '../services/gapService';
import { resumeService } from '../services/resumeService';
import { SkillBadge, Spinner } from '../components/ui';

function StatCard({ label, value, icon: Icon, gradient, glow }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 transition-all hover:bg-white/6 hover:border-white/14">
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full ${glow} blur-3xl pointer-events-none opacity-60`} />
      <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-bold text-white text-lg">{title}</h2>
      {linkTo && (
        <Link to={linkTo} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          {linkLabel} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [gapHistory, setGapHistory] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, g, p] = await Promise.all([
          resumeService.getMyResumes().catch(() => []),
          gapService.getHistory().catch(() => ({})),
          pathwayService.getMyPathways().catch(() => []),
        ]);
        setResumes(Array.isArray(r) ? r : []);
        setGapHistory(g?.reports ?? []);
        setPathways(Array.isArray(p) ? p : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const latestPathway = pathways[0];
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#050811]">
      {/* ── Page hero header ──────────────────────────────── */}
      <div className="relative border-b border-white/6 bg-white/1.5 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-125 h-75 rounded-full bg-indigo-700/10 blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">
                <Sparkles size={11} /> Dashboard
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-slate-500">Here's your personalized learning journey overview.</p>
            </div>
            <button
              onClick={() => navigate('/onboard')}
              className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            >
              <PlusCircle size={16} /> New Roadmap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Resumes Uploaded" value={resumes.length} icon={FileText}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" glow="bg-indigo-500" />
          <StatCard label="Gap Analyses" value={gapHistory.length} icon={BarChart2}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700" glow="bg-purple-500" />
          <StatCard label="Pathways Created" value={pathways.length} icon={Map}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" glow="bg-emerald-500" />
          <StatCard
            label="Skills Tracked"
            value={pathways.reduce((acc, p) => acc + (p.steps?.length ?? 0), 0)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            glow="bg-amber-500"
          />
        </div>

        {/* ── Empty state CTA ────────────────────────────── */}
        {pathways.length === 0 && (
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-linear-to-br from-indigo-950/60 to-purple-950/40">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=70&auto=format&fit=crop"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
            />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs text-indigo-300 mb-4">
                  <Zap size={11} /> Get Started
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to build your roadmap?</h2>
                <p className="text-slate-400 max-w-md">Upload your resume, pick a target job, and get a personalized AI-powered learning pathway in under 60 seconds.</p>
              </div>
              <button
                onClick={() => navigate('/onboard')}
                className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Start Onboarding <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Main grid ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Gap Reports */}
          <div className="bg-white/3 border border-white/7 rounded-2xl p-7 hover:border-white/11 transition-all">
            <SectionHeader title="Recent Gap Reports" linkTo="/onboard" linkLabel="New analysis" />
            {gapHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <BarChart2 size={20} className="text-purple-400" />
                </div>
                <p className="text-slate-500 text-sm mb-4">No gap analyses yet.</p>
                <button
                  onClick={() => navigate('/onboard')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  Run your first analysis <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {gapHistory.slice(0, 5).map((report) => {
                  const match = Math.round(report.gapReport?.matchScore ?? 0);
                  const color = match >= 70 ? 'text-emerald-400' : match >= 40 ? 'text-amber-400' : 'text-red-400';
                  const barColor = match >= 70 ? 'bg-emerald-500' : match >= 40 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <li key={report._id} className="flex items-center gap-4 p-4 rounded-xl bg-white/4 border border-white/6 hover:bg-white/7 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{report.jobId?.jobTitle ?? 'Unknown Job'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{report.jobId?.companyName}</div>
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1">
                          <div className={`h-1 rounded-full ${barColor} transition-all`} style={{ width: `${match}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${color}`}>{match}%</div>
                        <div className="text-xs text-slate-600">{report.gapReport?.missing?.length ?? 0} gaps</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Active Pathway */}
          <div className="bg-white/3 border border-white/7 rounded-2xl p-7 hover:border-white/11 transition-all">
            <SectionHeader
              title="Active Pathway"
              linkTo={latestPathway ? `/pathway/${latestPathway._id}` : undefined}
              linkLabel="View full pathway"
            />
            {!latestPathway ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Map size={20} className="text-emerald-400" />
                </div>
                <p className="text-slate-500 text-sm mb-4">No pathway created yet.</p>
                <button
                  onClick={() => navigate('/onboard')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  Generate a roadmap <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="text-white font-semibold truncate max-w-50">
                      {latestPathway.jobId?.jobTitle ?? 'Pathway'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{latestPathway.jobId?.companyName}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="text-2xl font-extrabold text-indigo-400">{latestPathway.progressPercent ?? 0}%</div>
                    <div className="text-xs text-slate-600">complete</div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                  <div
                    className="bg-linear-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${latestPathway.progressPercent ?? 0}%` }}
                  />
                </div>
                <ul className="space-y-2.5">
                  {(latestPathway.steps ?? []).slice(0, 5).map((step) => (
                    <li key={step._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        step.status === 'completed'
                          ? 'bg-emerald-500/15 border border-emerald-500/30'
                          : step.status === 'in-progress'
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        {step.status === 'completed'
                          ? <CheckCircle size={13} className="text-emerald-400" />
                          : step.status === 'in-progress'
                          ? <Clock size={13} className="text-amber-400" />
                          : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                      </div>
                      <SkillBadge
                        skill={step.skill}
                        variant={step.status === 'completed' ? 'satisfied' : step.status === 'in-progress' ? 'partial' : 'neutral'}
                      />
                      <span className="text-slate-600 ml-auto text-xs shrink-0">{step.estimatedHours}h</span>
                    </li>
                  ))}
                </ul>
                {(latestPathway.steps ?? []).length > 5 && (
                  <Link
                    to={`/pathway/${latestPathway._id}`}
                    className="mt-4 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    +{latestPathway.steps.length - 5} more steps <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── All Pathways ───────────────────────────────── */}
        {pathways.length > 1 && (
          <div>
            <SectionHeader title="All Pathways" linkTo="/onboard" linkLabel="Create new" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pathways.map((pathway) => (
                <Link
                  key={pathway._id}
                  to={`/pathway/${pathway._id}`}
                  className="group block bg-white/3 border border-white/7 rounded-2xl p-5 hover:bg-white/6 hover:border-indigo-700/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Map size={17} className="text-indigo-400" />
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold">{pathway.progressPercent ?? 0}%</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5 truncate">{pathway.jobId?.jobTitle ?? 'Pathway'}</div>
                  <div className="text-xs text-slate-500 mb-3">{pathway.jobId?.companyName}</div>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${pathway.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-indigo-400 transition-colors">
                    View roadmap <ChevronRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
