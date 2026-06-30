'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditId(null);
    setFormName('');
    setFormParentId('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: CategoryItem) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormParentId(item.parentId || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');

    const parentIdVal = formParentId === '' ? null : formParentId;

    try {
      if (editId) {
        const response = await api.put(`/categories/${editId}`, { name: formName, parentId: parentIdVal });
        if (response.data.success) {
          setSuccess('Category updated successfully.');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const response = await api.post('/categories', { name: formName, parentId: parentIdVal });
        if (response.data.success) {
          setSuccess('Category created successfully.');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Save operation failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category classification?')) return;
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        setSuccess('Category deleted successfully.');
        fetchCategories();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Delete operation failed.');
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Product Categories</h1>
          <p className="text-sm text-slate-400">Manage hierarchical category mappings for catalog storage.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Add New Category
        </button>
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
                <th className="px-6 py-4">Parent Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Querying categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No product categories defined.
                  </td>
                </tr>
              ) : (
                categories.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-semibold text-slate-200">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.slug}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {item.parentId ? (
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {getParentName(item.parentId)}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-500">Root Node</span>
                      )}
                    </td>
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
            <h2 className="text-xl font-bold text-slate-100 mb-6">{editId ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cricket Equipment"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Parent Category</label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 outline-none transition focus:border-blue-500"
                >
                  <option value="">None (Set as Root Category)</option>
                  {categories
                    .filter((c) => c.id !== editId) // Prevent circular hierarchy mapping self
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
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
