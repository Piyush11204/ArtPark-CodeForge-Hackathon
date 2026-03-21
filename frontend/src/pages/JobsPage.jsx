import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, MapPin, Clock, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { jobService } from '../services/jobService';
import { useAuthStore } from '../store/authStore';
import { useOnboardStore } from '../store/onboardStore';
import { Card, Input, Button, Spinner } from '../components/ui';

const WORK_TYPES = ['', 'remote', 'onsite', 'hybrid'];
const JOB_TYPES = ['', 'full-time', 'part-time', 'contract', 'internship'];

function JobCard({ job, onSelect, selectable }) {
  // Job model uses jobTitle/companyName/jobLocation etc.
  // Map frontend keys to the correct backend field names
  const jobTitle = job.jobTitle ?? job.title;
  const company = job.companyName ?? job.company;
  const rawLocation = job.jobLocation ?? job.location;
  const location = rawLocation && typeof rawLocation === 'object'
    ? [rawLocation.city, rawLocation.state, rawLocation.country].filter(Boolean).join(', ')
    : rawLocation;
  const skills = job.requiredSkills ?? job.skills ?? [];
  return (
    <Card className="hover:border-indigo-600 transition-colors cursor-default">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{jobTitle}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {location && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} /> {location}
              </span>
            )}
            {job.workType && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} /> {job.workType}
              </span>
            )}
            {job.jobType && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full capitalize">
                {job.jobType}
              </span>
            )}
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.slice(0, 5).map((s) => (
                <span key={s} className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
              {skills.length > 5 && (
                <span className="text-xs text-slate-500">+{skills.length - 5}</span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col gap-2 items-end">
          {selectable && (
            <Button size="sm" onClick={() => onSelect(job)}>
              Select
            </Button>
          )}
          {job.jobLink && (
            <a
              href={job.jobLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function JobsPage({ selectable = false }) {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const setJob = useOnboardStore((s) => s.setJob);

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [workType, setWorkType] = useState('');
  const [jobType, setJobType] = useState('');

  const LIMIT = 12;
  const totalPages = Math.ceil(total / LIMIT);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    jobService.getCategories().then((r) => setCategories(r?.jobTypes || [])).catch(() => {});
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedQ.trim()) {
        res = await jobService.searchJobs(debouncedQ, { page, limit: LIMIT });
      } else {
        res = await jobService.getJobs({ page, limit: LIMIT, workType, jobType });
      }
      setJobs(res?.jobs || []);
      setTotal(res?.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, page, workType, jobType]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, workType, jobType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSelect = (job) => {
    setJob(job);
    navigate('/onboard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Browse Jobs</h1>
        <p className="text-slate-400 text-sm">{total.toLocaleString()} positions available</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-700 rounded-lg px-3">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            className="bg-transparent flex-1 py-2 text-sm text-white placeholder-slate-400 outline-none"
            placeholder="Search jobs, skills, companies..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="bg-slate-700 text-sm text-white rounded-lg px-3 py-2 border-0 outline-none cursor-pointer"
        >
          <option value="">All Work Types</option>
          {WORK_TYPES.filter(Boolean).map((w) => (
            <option key={w} value={w} className="capitalize">{w}</option>
          ))}
        </select>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="bg-slate-700 text-sm text-white rounded-lg px-3 py-2 border-0 outline-none cursor-pointer"
        >
          <option value="">All Job Types</option>
          {JOB_TYPES.filter(Boolean).map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
        {categories.length > 0 && (
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="bg-slate-700 text-sm text-white rounded-lg px-3 py-2 border-0 outline-none cursor-pointer max-w-[180px]"
          >
            <option value="">All Job Types</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Briefcase size={40} className="mx-auto mb-3 opacity-40" />
          No jobs found. Try different filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} onSelect={handleSelect} selectable={selectable || !!accessToken} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
