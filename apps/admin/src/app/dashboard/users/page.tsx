'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'guest' | 'customer' | 'staff' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Pagination States
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5; // Reduced page limit to easily test pagination controls

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users', {
        params: { search, page, limit }
      });
      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      } else {
        setError(response.data.error?.message || 'Failed to fetch user directory.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to API services.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page index on search query change to avoid out of bounds page numbers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    setError('');
    setSuccessMessage('');
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const response = await api.put(`/users/${userId}/status`, { status: nextStatus });
      if (response.data.success) {
        setSuccessMessage(`Account status updated to ${nextStatus}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus as any } : u))
        );
      } else {
        setError(response.data.error?.message || 'Status change aborted.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Status change operation failed.');
    }
  };

  const handleRoleChange = async (userId: string, nextRole: string) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.put(`/users/${userId}/role`, { role: nextRole });
      if (response.data.success) {
        setSuccessMessage(`User role modified to ${nextRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole as any } : u))
        );
      } else {
        setError(response.data.error?.message || 'Role change aborted.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Role change operation failed.');
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management Directory</h1>
          <p className="text-sm text-slate-400">
            Control user access roles, account status configurations, and review active registration log metrics.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition self-start"
        >
          Refresh Directory
        </button>
      </div>

      {/* Search Filter Box */}
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or email address..."
          className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Retrieving records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No active user accounts found matching query.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-200">
                          {item.firstName} {item.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{item.email}</div>
                        {item.phone && <div className="text-xs text-slate-500">{item.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin && currentUser?.id !== item.id ? (
                        <select
                          value={item.role}
                          onChange={(e) => handleRoleChange(item.id, e.target.value)}
                          className="rounded border border-slate-700 bg-slate-800 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="guest">guest</option>
                          <option value="customer">customer</option>
                          <option value="staff">staff</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      ) : (
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {item.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'suspended'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUser?.id !== item.id ? (
                        <button
                          onClick={() => handleStatusChange(item.id, item.status)}
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                            item.status === 'active'
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {item.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Self profile</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-6 py-4">
            <div className="text-xs text-slate-400">
              Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages}</span>
            </div>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
