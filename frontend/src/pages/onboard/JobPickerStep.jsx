import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, MapPin, CheckCircle2 } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { useOnboardStore } from '../../store/onboardStore';
import { Spinner, Button, Alert } from '../../components/ui';

export default function JobPickerStep() {
  const navigate = useNavigate();
  const { resumeId, selectedJob, setJob } = useOnboardStore();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resumeId) navigate('/onboard');
  }, [resumeId, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedQ.trim()) {
        res = await jobService.searchJobs(debouncedQ, 1, 20);
      } else {
        res = await jobService.getJobs({ page: 1, limit: 20 });
      }
      setJobs(res?.jobs || []);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleSelect = (job) => {
    setJob(job);
  };

  const handleNext = () => {
    if (selectedJob) navigate('/onboard/gap');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Pick a Target Job</h2>
      <p className="text-slate-400 mb-6">Choose the role you want to prepare for.</p>

      {error && <Alert type="error" message={error} />}

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 mb-4">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          className="bg-transparent flex-1 text-sm text-white placeholder-slate-400 outline-none"
          placeholder="Search by title, skill, or company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Selected job banner */}
      {selectedJob && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/40 border border-indigo-700 mb-4">
          <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{selectedJob.title}</p>
            <p className="text-xs text-slate-400">{selectedJob.company}</p>
          </div>
          <Button onClick={handleNext} size="sm">Confirm →</Button>
        </div>
      )}

      {/* Job list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : jobs.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No jobs found.</p>
        ) : jobs.map((job) => {
          const isSelected = selectedJob?._id === job._id;
          const title = job.jobTitle ?? job.title;
            const company = job.companyName ?? job.company;
            const location = job.jobLocation ?? job.location;
            return (
            <button
              key={job._id}
              onClick={() => handleSelect(job)}
              className={`w-full text-left p-4 rounded-xl border transition-colors
                ${isSelected
                  ? 'border-indigo-600 bg-indigo-900/30'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{title}</p>
                  <p className="text-sm text-slate-400">{company}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {location && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} />{location}
                      </span>
                    )}
                    {job.workType && (
                      <span className="text-xs text-slate-500 capitalize">{job.workType}</span>
                    )}
                    {(job.requiredSkills ?? job.skills ?? []).slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-indigo-900/40 text-indigo-300 px-1.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={18} className="text-indigo-400 shrink-0 mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <Button onClick={handleNext} disabled={!selectedJob} className="w-full">
          Analyse Skill Gap →
        </Button>
      </div>
    </div>
  );
}
