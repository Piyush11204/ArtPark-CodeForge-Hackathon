import { useEffect, useState, useCallback } from 'react';
import {
  getAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  toggleAdminJob,
} from '../../services/adminService';
import { Button, Spinner, Alert, Input } from '../../components/ui';

const BLANK_FORM = {
  jobTitle: '',
  companyName: '',
  jobDescription: '',
  jobLink: '',
  jobType: 'FULL_TIME',
  workType: 'onsite',
  locationType: 'onsite',
  jobLocation: '',
  requiredSkills: '',
  preferredSkills: '',
  requiredExperience: '',
  jobCategory: '',
  salaryMin: '',
  salaryMax: '',
};

function JobForm({ initial = BLANK_FORM, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initial);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      requiredSkills: form.requiredSkills
        ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      preferredSkills: form.preferredSkills
        ? form.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      requiredExperience: form.requiredExperience ? Number(form.requiredExperience) : null,
      salaryRange: {
        min: form.salaryMin ? Number(form.salaryMin) : null,
        max: form.salaryMax ? Number(form.salaryMax) : null,
        currency: 'USD',
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Job Title *" value={form.jobTitle} onChange={set('jobTitle')} required />
        <Input label="Company Name *" value={form.companyName} onChange={set('companyName')} required />
        <Input label="Job Link (URL) *" value={form.jobLink} onChange={set('jobLink')} required type="url" />
        <Input label="Location" value={form.jobLocation} onChange={set('jobLocation')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Job Type</label>
          <select
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.jobType}
            onChange={set('jobType')}
          >
            {['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE', 'OTHER'].map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Work Type</label>
          <select
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.workType}
            onChange={set('workType')}
          >
            {['onsite', 'remote', 'hybrid'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <Input label="Category" value={form.jobCategory} onChange={set('jobCategory')} />
        <Input label="Required Experience (years)" type="number" min="0" value={form.requiredExperience} onChange={set('requiredExperience')} />
        <Input label="Salary Min (USD)" type="number" min="0" value={form.salaryMin} onChange={set('salaryMin')} />
        <Input label="Salary Max (USD)" type="number" min="0" value={form.salaryMax} onChange={set('salaryMax')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Required Skills (comma-separated)</label>
        <input
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. python, react, sql"
          value={form.requiredSkills}
          onChange={set('requiredSkills')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Preferred Skills (comma-separated)</label>
        <input
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. docker, kubernetes"
          value={form.preferredSkills}
          onChange={set('preferredSkills')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Job Description *</label>
        <textarea
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-y"
          required
          value={form.jobDescription}
          onChange={set('jobDescription')}
          placeholder="Describe the role, responsibilities, and requirements..."
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save Job</Button>
      </div>
    </form>
  );
}

export default function JobsPage() {
  const [data, setData] = useState({ jobs: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminJobs({ q, page, limit: 15 });
      setData(result);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createAdminJob(payload);
      flash('Job created successfully');
      setShowForm(false);
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Failed to create job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await updateAdminJob(editJob._id, payload);
      flash('Job updated');
      setEditJob(null);
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Failed to update job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAdminJob(id);
      load();
    } catch { flash('Failed to toggle job', 'error'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete job "${title}"?`)) return;
    try {
      await deleteAdminJob(id);
      flash('Job deleted');
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const { jobs, pagination } = data;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Management</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total ?? 0} total jobs</p>
        </div>
        {!showForm && !editJob && (
          <Button onClick={() => setShowForm(true)}>+ Add Job</Button>
        )}
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Create form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Job</h2>
          <JobForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitting={submitting} />
        </div>
      )}

      {/* Edit form */}
      {editJob && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edit Job</h2>
          <JobForm
            initial={{
              ...editJob,
              requiredSkills: editJob.requiredSkills?.join(', ') || '',
              preferredSkills: editJob.preferredSkills?.join(', ') || '',
              requiredExperience: editJob.requiredExperience ?? '',
              salaryMin: editJob.salaryRange?.min ?? '',
              salaryMax: editJob.salaryRange?.max ?? '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditJob(null)}
            submitting={submitting}
          />
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-72"
          placeholder="Search jobs..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : jobs.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No jobs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{job.jobTitle}</p>
                      <p className="text-xs text-slate-400">{job.companyName} · {job.jobLocation || 'No location'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {job.jobType} / {job.workType}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        job.isActive
                          ? 'bg-green-900/50 text-green-300 border border-green-700'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditJob(job)}
                          className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(job._id)}
                          className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          {job.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(job._id, job.jobTitle)}
                          className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-400">Page {page} of {pagination.pages}</span>
          <Button variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
