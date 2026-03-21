import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Circle, ExternalLink, ArrowLeft, Target } from 'lucide-react';
import { pathwayService } from '../services/gapService';
import { SkillBadge, Spinner, Button, Alert, Card } from '../components/ui';

const STATUS_CYCLE = ['pending', 'in-progress', 'completed'];

function StepRow({ step, onToggle }) {
  const [busy, setBusy] = useState(false);
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(step.status ?? 'pending') + 1) % STATUS_CYCLE.length];

  const toggle = async () => {
    setBusy(true);
    await onToggle(step._id, next);
    setBusy(false);
  };

  const bg =
    step.status === 'completed' ? 'border-emerald-800 bg-emerald-900/20' :
    step.status === 'in-progress' ? 'border-yellow-800 bg-yellow-900/10' :
    'border-slate-700 bg-slate-800';

  return (
    <div className={`flex gap-4 p-4 rounded-xl border transition-colors ${bg}`}>
      <button onClick={toggle} disabled={busy} className="shrink-0 mt-0.5">
        {step.status === 'completed' ? (
          <CheckCircle size={22} className="text-emerald-400" />
        ) : step.status === 'in-progress' ? (
          <Circle size={22} className="text-yellow-400 fill-yellow-400/20" />
        ) : (
          <Circle size={22} className="text-slate-500" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs text-slate-500 font-bold">#{step.order}</span>
          <SkillBadge
            skill={step.skill}
            variant={step.status === 'completed' ? 'satisfied' : step.status === 'in-progress' ? 'partial' : 'neutral'}
          />
          {step.priority && step.priority !== 'medium' && (
            <span className={`text-xs rounded px-1.5 py-0.5 capitalize font-medium ${
              step.priority === 'critical' ? 'text-red-300 bg-red-900/30' :
              step.priority === 'high' ? 'text-orange-300 bg-orange-900/30' : 'text-slate-400'
            }`}>{step.priority}</span>
          )}
        </div>
        {step.reason && <p className="text-sm text-slate-400 leading-relaxed">{step.reason}</p>}
        <div className="flex items-center gap-4 mt-2">
          {step.estimatedHours > 0 && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} />{step.estimatedHours}h
            </span>
          )}
          {step.course?.resourceUrl && (
            <a
              href={step.course.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <ExternalLink size={11} />
              {step.course.provider ?? 'Course'}
            </a>
          )}
          {step.completedAt && (
            <span className="text-xs text-slate-500">
              Done {new Date(step.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PathwayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pathwayService.getById(id)
      .then((r) => setPathway(r.data))
      .catch(() => setError('Failed to load pathway.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async (stepId, status) => {
    try {
      const res = await pathwayService.updateStep(id, stepId, status);
      setPathway(res.data);
    } catch { /* silent */ }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (error) return <div className="max-w-xl mx-auto py-10"><Alert type="error" message={error} /></div>;

  const steps = pathway?.steps ?? [];
  const pct = pathway?.completionPercentage ?? 0;
  const hoursLeft = steps
    .filter((s) => s.status !== 'completed')
    .reduce((sum, s) => sum + (s.estimatedHours ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target size={20} className="text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">
            {pathway?.job?.title ?? 'Learning Pathway'}
          </h1>
        </div>
        {pathway?.job?.company && (
          <p className="text-slate-400 ml-7">{pathway.job.company}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-white">{steps.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Steps</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-emerald-400">{pct}%</div>
          <div className="text-xs text-slate-400 mt-0.5">Complete</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-indigo-400">{hoursLeft}h</div>
          <div className="text-xs text-slate-400 mt-0.5">Hours Left</div>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <StepRow key={step._id} step={step} onToggle={handleToggle} />
        ))}
      </div>

      {pct === 100 && (
        <div className="mt-8 text-center py-8 bg-emerald-900/20 border border-emerald-700 rounded-xl">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-lg font-bold text-white">Pathway Complete! 🎉</p>
          <p className="text-slate-400 text-sm mt-1">You're ready for this role.</p>
          <Button onClick={() => navigate('/jobs')} className="mt-4">Explore More Jobs</Button>
        </div>
      )}
    </div>
  );
}
