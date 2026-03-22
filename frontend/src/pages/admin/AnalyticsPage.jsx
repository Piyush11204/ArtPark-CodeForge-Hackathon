import { useEffect, useState } from 'react';
import { getAdminStats } from '../../services/adminService';
import { Spinner } from '../../components/ui';

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'border-indigo-700 bg-indigo-900/20',
    green: 'border-green-700 bg-green-900/20',
    yellow: 'border-yellow-700 bg-yellow-900/20',
    blue: 'border-blue-700 bg-blue-900/20',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SimpleBar({ data, label }) {
  if (!data?.length) return <p className="text-slate-500 text-sm">No data</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d[label]} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 truncate">{d[label]}</span>
          <div className="flex-1 bg-slate-700 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-300 w-8 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function SignupChart({ data }) {
  if (!data?.length) return <p className="text-slate-500 text-sm">No signup data in last 30 days</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-indigo-600 rounded-t hover:bg-indigo-500 transition-colors cursor-default"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-700 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
            {d.date}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-400">{error}</div>
    );
  }

  const { overview, signupTrend, roleDistribution, topSkills } = stats;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and trends</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={overview.totalUsers} sub={`${overview.activeUsers} active`} color="indigo" />
        <StatCard label="Jobs Listed" value={overview.totalJobs} sub={`${overview.activeJobs} active`} color="blue" />
        <StatCard label="Courses" value={overview.totalCourses} color="green" />
        <StatCard label="Resumes Processed" value={overview.totalResumes} color="yellow" />
        <StatCard label="Gap Reports" value={overview.totalGapReports} color="indigo" />
        <StatCard label="Learning Pathways" value={overview.totalPathways} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup trend */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">User Signups — Last 30 Days</h2>
          <SignupChart data={signupTrend} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">{signupTrend[0]?.date}</span>
            <span className="text-xs text-slate-500">{signupTrend[signupTrend.length - 1]?.date}</span>
          </div>
        </div>

        {/* Role distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Role Distribution</h2>
          <SimpleBar data={roleDistribution} label="role" />
        </div>
      </div>

      {/* Top skills */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Top Required Skills (from active jobs)</h2>
        <SimpleBar data={topSkills} label="skill" />
      </div>
    </div>
  );
}
