'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'retail' | 'rental' | 'hybrid';
  retailPrice: string | null;
  baseRentalRate: string | null;
  securityDeposit: string | null;
  sportId: string;
  brandId: string;
  categoryId: string;
  sport: { name: string };
  brand: { name: string };
  category: { name: string };
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown dependency states
  const [sports, setSports] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'retail' | 'rental' | 'hybrid'>('retail');
  const [formSportId, setFormSportId] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formRetailPrice, setFormRetailPrice] = useState('');
  const [formRentalRate, setFormRentalRate] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [imageUrl1, setImageUrl1] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/products', {
        params: { search, page, limit: 10 }
      });
      if (response.data.success) {
        setProducts(response.data.data.products);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to product API.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [sRes, bRes, cRes] = await Promise.all([
        api.get('/sports', { params: { limit: 100 } }),
        api.get('/brands', { params: { limit: 100 } }),
        api.get('/categories')
      ]);
      if (sRes.data.success) setSports(sRes.data.data.sports);
      if (bRes.data.success) setBrands(bRes.data.data.brands);
      if (cRes.data.success) setCategories(cRes.data.data.categories);
    } catch (err) {
      console.warn('Failed loading configuration dependencies.');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const openCreateModal = () => {
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setFormType('retail');
    setFormSportId(sports[0]?.id || '');
    setFormBrandId(brands[0]?.id || '');
    setFormCategoryId(categories[0]?.id || '');
    setFormRetailPrice('');
    setFormRentalRate('');
    setFormDeposit('');
    setImageUrl1('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ProductItem) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setFormType(item.type);
    setFormSportId(item.sportId);
    setFormBrandId(item.brandId);
    setFormCategoryId(item.categoryId);
    setFormRetailPrice(item.retailPrice || '');
    setFormRentalRate(item.baseRentalRate || '');
    setFormDeposit(item.securityDeposit || '');
    setImageUrl1(item.images?.[0]?.url || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');

    const payload = {
      sportId: formSportId,
      brandId: formBrandId,
      categoryId: formCategoryId,
      name: formName,
      description: formDesc || undefined,
      type: formType,
      retailPrice: formType !== 'rental' && formRetailPrice !== '' ? parseFloat(formRetailPrice) : null,
      baseRentalRate: formType !== 'retail' && formRentalRate !== '' ? parseFloat(formRentalRate) : null,
      securityDeposit: formType !== 'retail' && formDeposit !== '' ? parseFloat(formDeposit) : null,
      images: imageUrl1 !== '' ? [imageUrl1] : []
    };

    try {
      if (editId) {
        const response = await api.put(`/products/${editId}`, payload);
        if (response.data.success) {
          setSuccess('Product details updated successfully.');
          setIsModalOpen(false);
          fetchProducts();
        }
      } else {
        const response = await api.post('/products', payload);
        if (response.data.success) {
          setSuccess('Product successfully catalogued.');
          setIsModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Save operation aborted.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All inventory mappings remain but will hide.')) return;
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data.success) {
        setSuccess('Product deleted successfully.');
        fetchProducts();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Delete operation aborted.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Unified Product Catalog</h1>
          <p className="text-sm text-slate-400">Manage products, pricing matrices, and configure rental/sale business rules.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Add New Product
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products by name..."
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
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Specs</th>
                <th className="px-6 py-4">Sale Model</th>
                <th className="px-6 py-4">Pricing Matrix</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Querying catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No products catalogued matching query.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition animate-fade-in">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        {item.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-500 font-bold border border-slate-700">
                            🏏
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-200">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-xs text-slate-300">Brand: {item.brand?.name}</div>
                        <div className="text-xs text-slate-400">Sport: {item.sport?.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize bg-slate-800 text-slate-300 border border-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {item.type === 'retail' || item.type === 'hybrid' ? (
                        <div className="text-slate-300">Purchase: ${item.retailPrice}</div>
                      ) : null}
                      {item.type === 'rental' || item.type === 'hybrid' ? (
                        <div className="text-blue-400">
                          Rent: ${item.baseRentalRate}/day (Deposit: ${item.securityDeposit})
                        </div>
                      ) : null}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-6 py-4">
            <div className="text-xs text-slate-400">Page {page} of {totalPages}</div>
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-6">{editId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Commercial Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Cricket Leather Ball"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Sales Model</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="retail">Retail Sale Only</option>
                    <option value="rental">Rental Only</option>
                    <option value="hybrid">Both (Hybrid Model)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Sport</label>
                  <select
                    value={formSportId}
                    onChange={(e) => setFormSportId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  >
                    {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Brand</label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  >
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Catalog specs..."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500 resize-none"
                />
              </div>

              {/* Conditional Pricing matrices depending on type */}
              {(formType === 'retail' || formType === 'hybrid') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300">Purchase Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formRetailPrice}
                    onChange={(e) => setFormRetailPrice(e.target.value)}
                    placeholder="25.00"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              )}

              {(formType === 'rental' || formType === 'hybrid') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Daily Rental Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formRentalRate}
                      onChange={(e) => setFormRentalRate(e.target.value)}
                      placeholder="5.00"
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">Refundable Security Deposit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formDeposit}
                      onChange={(e) => setFormDeposit(e.target.value)}
                      placeholder="50.00"
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300">Image Asset URL</label>
                <input
                  type="url"
                  value={imageUrl1}
                  onChange={(e) => setImageUrl1(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
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
                  {loadingAction ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
