import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, TrendingUp, FileText, Map, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gapService, pathwayService } from '../services/gapService';
import { resumeService } from '../services/resumeService';
import { Card, SkillBadge, Spinner, Button } from '../components/ui';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
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
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const latestPathway = pathways[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's your learning journey overview.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Resumes Uploaded" value={resumes.length} icon={FileText} color="bg-indigo-600" />
        <StatCard label="Gap Analyses" value={gapHistory.length} icon={TrendingUp} color="bg-purple-600" />
        <StatCard label="Pathways Created" value={pathways.length} icon={Map} color="bg-emerald-600" />
      </div>

      {/* Start CTA if new user */}
      {pathways.length === 0 && (
        <Card className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 to-slate-800 border-indigo-700">
          <div>
            <h2 className="font-bold text-white text-lg mb-1">Ready to start your journey?</h2>
            <p className="text-slate-400 text-sm">Upload your resume and pick a job to get your personalized roadmap.</p>
          </div>
          <Button onClick={() => navigate('/onboard')} className="shrink-0">
            <PlusCircle size={16} className="mr-2" /> Start Onboarding
          </Button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Gap Reports */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Gap Reports</h2>
            <Link to="/onboard" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              New analysis <ChevronRight size={14} />
            </Link>
          </div>
          {gapHistory.length === 0 ? (
            <p className="text-slate-500 text-sm">No gap analyses yet.</p>
          ) : (
            <ul className="space-y-3">
              {gapHistory.slice(0, 5).map((report) => (
                <li key={report._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                  <div>
                    <div className="text-sm font-medium text-white truncate max-w-[180px]">
                      {report.jobId?.jobTitle ?? 'Unknown Job'}
                    </div>
                    <div className="text-xs text-slate-400">{report.jobId?.companyName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-indigo-300">
                      {Math.round(report.gapReport?.matchScore ?? 0)}% match
                    </div>
                    <div className="text-xs text-red-400">
                      {report.gapReport?.missing?.length ?? 0} missing
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Active Pathway */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Active Pathway</h2>
            {latestPathway && (
              <Link to={`/pathway/${latestPathway._id}`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            )}
          </div>
          {!latestPathway ? (
            <p className="text-slate-500 text-sm">No pathway generated yet.</p>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white font-medium truncate max-w-[200px]">
                  {latestPathway.jobId?.jobTitle ?? 'Pathway'}
                </span>
                <span className="text-xs text-slate-400">
                  {latestPathway.progressPercent ?? 0}% done
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${latestPathway.progressPercent ?? 0}%` }}
                />
              </div>
              <ul className="space-y-2">
                {(latestPathway.steps ?? []).slice(0, 4).map((step) => (
                  <li key={step._id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      step.status === 'completed' ? 'bg-emerald-400' :
                      step.status === 'in-progress' ? 'bg-yellow-400' : 'bg-slate-600'
                    }`} />
                    <SkillBadge
                      skill={step.skill}
                      variant={step.status === 'completed' ? 'satisfied' : step.status === 'in-progress' ? 'partial' : 'neutral'}
                    />
                    <span className="text-slate-400 ml-auto text-xs">{step.estimatedHours}h</span>
                  </li>
                ))}
              </ul>
              {(latestPathway.steps ?? []).length > 4 && (
                <p className="text-xs text-slate-500 mt-2">
                  +{latestPathway.steps.length - 4} more steps
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
