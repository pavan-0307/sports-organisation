'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/brands', { params: { search, limit: 100 } });
      if (response.data.success) {
        setBrands(response.data.data.brands);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to database.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const openCreateModal = () => {
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: BrandItem) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');

    try {
      if (editId) {
        const response = await api.put(`/brands/${editId}`, { name: formName, description: formDesc });
        if (response.data.success) {
          setSuccess('Brand updated successfully.');
          setIsModalOpen(false);
          fetchBrands();
        }
      } else {
        const response = await api.post('/brands', { name: formName, description: formDesc });
        if (response.data.success) {
          setSuccess('Brand created successfully.');
          setIsModalOpen(false);
          fetchBrands();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Save operation failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand classification?')) return;
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/brands/${id}`);
      if (response.data.success) {
        setSuccess('Brand deleted successfully.');
        fetchBrands();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Brands Directory</h1>
          <p className="text-sm text-slate-400">Classify product inventories by manufacturing brands.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Add New Brand
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands by name..."
          className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">{success}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Querying brands...
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No brands classified in database.
                  </td>
                </tr>
              ) : (
                brands.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-semibold text-slate-200">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.slug}</td>
                    <td className="px-6 py-4 max-w-sm truncate text-slate-400">{item.description || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="rounded border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6">{editId ? 'Edit Brand Classification' : 'Add New Brand'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Nike"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Provide context details..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {loadingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
