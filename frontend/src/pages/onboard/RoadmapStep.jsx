import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Clock, ExternalLink, Trophy } from 'lucide-react';
import { pathwayService } from '../../services/gapService';
import { useOnboardStore } from '../../store/onboardStore';
import { SkillBadge, Spinner, Button, Alert, Card } from '../../components/ui';

const STATUS_CYCLE = ['pending', 'in-progress', 'completed'];

function StepCard({ step, pathwayId, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const priority = step.priority ?? 'medium';

  const priorityColor = {
    critical: 'bg-red-900/40 border-red-800',
    high: 'bg-orange-900/40 border-orange-800',
    medium: 'bg-slate-800 border-slate-700',
    low: 'bg-slate-800/60 border-slate-700/50',
  }[priority] ?? 'bg-slate-800 border-slate-700';

  const nextStatus = () => {
    const idx = STATUS_CYCLE.indexOf(step.status ?? 'pending');
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  };

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await onStatusUpdate(step._id, nextStatus());
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${priorityColor} transition-all`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={updating}
          className="shrink-0 mt-0.5"
          title="Toggle status"
        >
          {step.status === 'completed' ? (
            <CheckCircle size={22} className="text-emerald-400" />
          ) : step.status === 'in-progress' ? (
            <Circle size={22} className="text-yellow-400 fill-yellow-400/20" />
          ) : (
            <Circle size={22} className="text-slate-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400">#{step.order}</span>
            <SkillBadge
              skill={step.skill}
              variant={
                step.status === 'completed' ? 'satisfied' :
                step.status === 'in-progress' ? 'partial' : 'neutral'
              }
            />
            {priority !== 'medium' && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                priority === 'critical' ? 'text-red-300 bg-red-900/40' :
                priority === 'high' ? 'text-orange-300 bg-orange-900/40' :
                'text-slate-400'
              }`}>
                {priority}
              </span>
            )}
          </div>

          {step.reason && (
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{step.reason}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {step.estimatedHours > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} /> {step.estimatedHours}h
              </span>
            )}
            {step.course?.resourceUrl && (
              <a
                href={step.course.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <ExternalLink size={12} />
                {step.course.provider ?? 'View Course'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapStep() {
  const navigate = useNavigate();
  const { gapReportId, selectedJob, setPathway } = useOnboardStore();
  const [pathway, setLocalPathway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gapReportId) { navigate('/onboard/gap'); return; }
    const generate = async () => {
      try {
        const res = await pathwayService.generate(gapReportId);
        setLocalPathway(res.data);
        setPathway(res.data._id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate roadmap.');
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []); // eslint-disable-line

  const handleStatusUpdate = async (stepId, status) => {
    if (!pathway) return;
    try {
      const res = await pathwayService.updateStep(pathway._id, stepId, status);
      setLocalPathway(res.data);
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Building your personalized roadmap…</p>
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

  const steps = pathway?.steps ?? [];
  const totalHours = pathway?.totalEstimatedHours ?? 0;
  const pct = pathway?.completionPercentage ?? 0;
  const completedCount = steps.filter((s) => s.status === 'completed').length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-white">Your Learning Roadmap</h2>
        <Trophy size={22} className="text-yellow-400" />
      </div>
      <p className="text-slate-400 mb-6">
        {steps.length} modules · ~{totalHours}h total ·{' '}
        <span className="text-white font-medium">{selectedJob?.title ?? 'Target Role'}</span>
      </p>

      {/* Progress bar */}
      <Card className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">{completedCount}/{steps.length} completed</span>
          <span className="font-semibold text-white">{pct}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {steps.map((step) => (
          <StepCard
            key={step._id}
            step={step}
            pathwayId={pathway?._id}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate('/dashboard')} variant="secondary" className="flex-1">
          Go to Dashboard
        </Button>
        {pathway?._id && (
          <Button onClick={() => navigate(`/pathway/${pathway._id}`)} className="flex-1">
            Full Pathway View
          </Button>
        )}
      </div>
    </div>
  );
}
