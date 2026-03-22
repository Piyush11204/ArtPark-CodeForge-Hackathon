import { useEffect, useState, useCallback } from 'react';
import {
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  toggleAdminCourse,
} from '../../services/adminService';
import { Button, Spinner, Alert, Input } from '../../components/ui';

const BLANK_FORM = {
  title: '',
  skill: '',
  skillCategory: 'other',
  level: 'beginner',
  provider: '',
  resourceUrl: '',
  estimatedHours: '5',
  prerequisites: '',
  tags: '',
};

const CATEGORIES = ['language', 'framework', 'database', 'tool', 'cloud', 'ai_ml', 'soft_skill', 'other'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

function CourseForm({ initial = BLANK_FORM, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      prerequisites: form.prerequisites
        ? form.prerequisites.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      tags: form.tags
        ? form.tags.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      estimatedHours: Number(form.estimatedHours) || 5,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Title *" value={form.title} onChange={set('title')} required />
        <Input label="Skill *" value={form.skill} onChange={set('skill')} required placeholder="e.g. python" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Category</label>
          <select
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.skillCategory}
            onChange={set('skillCategory')}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-300">Level</label>
          <select
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.level}
            onChange={set('level')}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <Input label="Provider *" value={form.provider} onChange={set('provider')} required placeholder="e.g. Coursera" />
        <Input label="Resource URL *" type="url" value={form.resourceUrl} onChange={set('resourceUrl')} required />
        <Input label="Estimated Hours" type="number" min="1" value={form.estimatedHours} onChange={set('estimatedHours')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Prerequisites (comma-separated skills)</label>
        <input
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. html, css"
          value={form.prerequisites}
          onChange={set('prerequisites')}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-300">Tags (comma-separated)</label>
        <input
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. beginner-friendly, hands-on"
          value={form.tags}
          onChange={set('tags')}
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save Course</Button>
      </div>
    </form>
  );
}

export default function CoursesPage() {
  const [data, setData] = useState({ courses: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminCourses({ q, page, limit: 15 });
      setData(result);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createAdminCourse(payload);
      flash('Course created');
      setShowForm(false);
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Failed to create course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await updateAdminCourse(editCourse._id, payload);
      flash('Course updated');
      setEditCourse(null);
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Failed to update course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAdminCourse(id);
      load();
    } catch { flash('Failed to toggle course', 'error'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"?`)) return;
    try {
      await deleteAdminCourse(id);
      flash('Course deleted');
      load();
    } catch (e) {
      flash(e?.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const { courses, pagination } = data;

  const levelColor = { beginner: 'text-green-400', intermediate: 'text-yellow-400', advanced: 'text-red-400' };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total ?? 0} total courses</p>
        </div>
        {!showForm && !editCourse && (
          <Button onClick={() => setShowForm(true)}>+ Add Course</Button>
        )}
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Course</h2>
          <CourseForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitting={submitting} />
        </div>
      )}

      {editCourse && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edit Course</h2>
          <CourseForm
            initial={{
              ...editCourse,
              prerequisites: editCourse.prerequisites?.join(', ') || '',
              tags: editCourse.tags?.join(', ') || '',
              estimatedHours: String(editCourse.estimatedHours || 5),
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditCourse(null)}
            submitting={submitting}
          />
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-72"
          placeholder="Search courses..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : courses.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No courses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Skill / Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{course.title}</p>
                      <p className="text-xs text-slate-400">{course.provider} · {course.estimatedHours}h</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <p>{course.skill}</p>
                      <p className="text-slate-500">{course.skillCategory}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${levelColor[course.level]}`}>
                        {course.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        course.isActive
                          ? 'bg-green-900/50 text-green-300 border border-green-700'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditCourse(course)}
                          className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggle(course._id)}
                          className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          {course.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(course._id, course.title)}
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
