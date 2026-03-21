import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { gapService } from '../../services/gapService';
import { useOnboardStore } from '../../store/onboardStore';
import { SkillBadge, Spinner, Button, Alert, Card } from '../../components/ui';

const COLORS = { satisfied: '#10b981', partial: '#f59e0b', missing: '#ef4444' };

export default function GapStep() {
  const navigate = useNavigate();
  const { resumeId, selectedJob, setGapReport } = useOnboardStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resumeId || !selectedJob) { navigate('/onboard'); return; }
    const analyze = async () => {
      try {
        const res = await gapService.analyze(resumeId, selectedJob._id);
        const data = res.data;
        setReport(data);
        setGapReport(data._id, data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to analyse gap. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, []); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Analysing your skills against the job…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/onboard/job')} variant="secondary" className="mt-4">
          ← Back
        </Button>
      </div>
    );
  }

  const { gapReport, matchScore, gapScore } = report;
  const { satisfied = [], partial = [], missing = [] } = gapReport ?? {};

  const pieData = [
    { name: 'Satisfied', value: satisfied.length, color: COLORS.satisfied },
    { name: 'Partial', value: partial.length, color: COLORS.partial },
    { name: 'Missing', value: missing.length, color: COLORS.missing },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-1">Skill Gap Analysis</h2>
      <p className="text-slate-400 mb-6">
        vs. <span className="text-white font-medium">{selectedJob?.title}</span>
        {selectedJob?.company && <span className="text-slate-500"> @ {selectedJob.company}</span>}
      </p>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-indigo-400">{Math.round((matchScore ?? 0) * 100)}%</div>
          <div className="text-sm text-slate-400 mt-1">Match Score</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-red-400">{Math.round((gapScore ?? 0) * 100)}%</div>
          <div className="text-sm text-slate-400 mt-1">Gap Score</div>
        </Card>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <Card className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend
                formatter={(value) => <span className="text-sm text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Skill columns */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { label: '✅ Satisfied', skills: satisfied, variant: 'satisfied' },
          { label: '⚠️ Partial', skills: partial, variant: 'partial' },
          { label: '❌ Missing', skills: missing, variant: 'missing' },
        ].map(({ label, skills, variant }) => (
          <Card key={variant}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">{label}</h3>
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <SkillBadge key={s} skill={s} variant={variant} />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button onClick={() => navigate('/onboard/roadmap')} className="w-full">
        Generate Learning Roadmap →
      </Button>
    </div>
  );
}
