import { useEffect, useState, useCallback } from 'react';
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/adminService';
import { Button, Spinner, Alert } from '../../components/ui';

function UserRow({ user, onUpdate, onDelete }) {
  const [busy, setBusy] = useState(false);

  const toggle = async (field, value) => {
    setBusy(true);
    try {
      await onUpdate(user._id, { [field]: value });
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
            {user.name?.[0] || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
          user.role === 'admin'
            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
            : 'bg-slate-700 text-slate-300'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
          user.isActive
            ? 'bg-green-900/50 text-green-300 border border-green-700'
            : 'bg-red-900/50 text-red-300 border border-red-700'
        }`}>
          {user.isActive ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            disabled={busy}
            onClick={() => toggle('role', user.role === 'admin' ? 'candidate' : 'admin')}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
          >
            {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
          </button>
          <button
            disabled={busy}
            onClick={() => toggle('isActive', !user.isActive)}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
          >
            {user.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            disabled={busy}
            onClick={() => onDelete(user._id, user.name)}
            className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-300 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const [data, setData] = useState({ users: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminUsers({ q, page, limit: 20, role: roleFilter || undefined });
      setData(result);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [q, page, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id, payload) => {
    try {
      await updateAdminUser(id, payload);
      setSuccess('User updated');
      setTimeout(() => setSuccess(''), 2500);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAdminUser(id);
      setSuccess('User deleted');
      setTimeout(() => setSuccess(''), 2500);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Delete failed');
    }
  };

  const { users, pagination } = data;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-1">
          {pagination.total ?? 0} total users
        </p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-64"
          placeholder="Search name or email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="candidate">Candidate</option>
          <option value="admin">Admin</option>
        </select>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : users.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u._id} user={u} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
