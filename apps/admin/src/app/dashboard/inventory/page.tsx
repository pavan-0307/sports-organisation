'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

interface InventoryUnitItem {
  id: string;
  productId: string;
  serialNumber: string | null;
  inventoryCode: string;
  barcode: string | null;
  qrCode: string | null;
  status: 'available' | 'reserved' | 'rented' | 'maintenance' | 'damaged';
  branch: string;
  purchasePrice: string | null;
  purchaseDate: string | null;
  condition: string;
  conditionNotes: string | null;
  maintenanceDueDate: string | null;
  lastMaintenanceDate: string | null;
  currentBranch: string;
  currentLocation: string | null;
  lockerNumber: string | null;
  remarks: string | null;
  availability: boolean;
  createdAt: string;
  product: { name: string; type: string };
}

export default function InventoryPage() {
  const [units, setUnits] = useState<InventoryUnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dependency list
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  // Bulk Generate Modal States
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkBranch, setBulkBranch] = useState('Main');
  const [bulkCondition, setBulkCondition] = useState('excellent');

  // Edit Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUnitId, setEditUnitId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'available' | 'reserved' | 'rented' | 'maintenance' | 'damaged'>('available');
  const [editCondition, setEditCondition] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editConditionNotes, setEditConditionNotes] = useState('');
  const [editCurrentBranch, setEditCurrentBranch] = useState('');
  const [editCurrentLocation, setEditCurrentLocation] = useState('');
  const [editLockerNumber, setEditLockerNumber] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/units', {
        params: { search, page, limit: 10 }
      });
      if (response.data.success) {
        setUnits(response.data.data.units);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to database.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (err) {
      console.warn('Failed loading products list.');
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openBulkModal = () => {
    setBulkProductId(products[0]?.id || '');
    setBulkPrefix('');
    setBulkCount(5);
    setBulkBranch('Main');
    setBulkCondition('excellent');
    setIsBulkOpen(true);
  };

  const openEditModal = (item: InventoryUnitItem) => {
    setEditUnitId(item.id);
    setEditStatus(item.status);
    setEditCondition(item.condition);
    setEditBranch(item.branch);
    setEditSerial(item.serialNumber || '');
    setEditPurchasePrice(item.purchasePrice || '');
    setEditConditionNotes(item.conditionNotes || '');
    setEditCurrentBranch(item.currentBranch || '');
    setEditCurrentLocation(item.currentLocation || '');
    setEditLockerNumber(item.lockerNumber || '');
    setEditRemarks(item.remarks || '');
    setIsEditOpen(true);
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/units/bulk-generate', {
        productId: bulkProductId,
        prefix: bulkPrefix.toUpperCase(),
        count: bulkCount,
        branch: bulkBranch,
        condition: bulkCondition
      });
      if (response.data.success) {
        setSuccess(response.data.data.message || 'Bulk units generated.');
        setIsBulkOpen(false);
        fetchUnits();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate units.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUnitId) return;
    setLoadingAction(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/units/${editUnitId}`, {
        status: editStatus,
        condition: editCondition,
        branch: editBranch,
        serialNumber: editSerial || undefined,
        purchasePrice: editPurchasePrice !== '' ? parseFloat(editPurchasePrice) : null,
        conditionNotes: editConditionNotes || null,
        currentBranch: editCurrentBranch || undefined,
        currentLocation: editCurrentLocation || null,
        lockerNumber: editLockerNumber || null,
        remarks: editRemarks || null
      });
      if (response.data.success) {
        setSuccess('Inventory unit status updated successfully.');
        setIsEditOpen(false);
        fetchUnits();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update unit details.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'reserved':
      case 'rented':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'maintenance':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'damaged':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Physical Inventory Control</h1>
          <p className="text-sm text-slate-400">Track and inspect barcode serials, conditions, and locations of individual equipment items.</p>
        </div>
        <button
          onClick={openBulkModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Bulk Generate Units
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
          placeholder="Search by inventory code or serial number..."
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
                <th className="px-6 py-4">Item Code / Serials</th>
                <th className="px-6 py-4">Product Catalog Link</th>
                <th className="px-6 py-4">Location (Locker)</th>
                <th className="px-6 py-4">Status & Condition</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && units.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Querying inventory units...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No physical units generated.
                  </td>
                </tr>
              ) : (
                units.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-bold text-slate-200">{item.inventoryCode}</div>
                        {item.serialNumber && <div className="text-xs text-slate-400">SN: {item.serialNumber}</div>}
                        {item.qrCode && <div className="text-[10px] text-slate-500">{item.qrCode}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-300">{item.product?.name}</div>
                      <div className="text-xs text-slate-400 capitalize">Type: {item.product?.type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs">
                      <div>Branch: {item.currentBranch}</div>
                      {item.currentLocation && <div>Area: {item.currentLocation}</div>}
                      {item.lockerNumber && <div>Locker: {item.lockerNumber}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1.5">
                        <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-400">Cond: {item.condition}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="rounded border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                      >
                        Inspect / Edit
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

      {/* Bulk Generate Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Bulk Generate Serial Units</h2>
            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Select Product Catalog Profile</label>
                <select
                  value={bulkProductId}
                  onChange={(e) => setBulkProductId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Internal Prefix (e.g. BAT-)</label>
                  <input
                    type="text"
                    required
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="BAT-"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Count (Quantity)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value, 10))}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Store Branch</label>
                  <input
                    type="text"
                    required
                    value={bulkBranch}
                    onChange={(e) => setBulkBranch(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Initial Quality Condition</label>
                  <input
                    type="text"
                    required
                    value={bulkCondition}
                    onChange={(e) => setBulkCondition(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {loadingAction ? 'Generating...' : 'Confirm Generation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Inspect / Edit Inventory Unit</h2>
            <form onSubmit={handleUpdateUnit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Serial Number (SN)</label>
                  <input
                    type="text"
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    placeholder="e.g. SN-KOK-12345"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPurchasePrice}
                    onChange={(e) => setEditPurchasePrice(e.target.value)}
                    placeholder="120.00"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Origin Purchase Branch</label>
                  <input
                    type="text"
                    required
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Operation Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="available">Available (In Stock)</option>
                    <option value="reserved">Reserved</option>
                    <option value="rented">Rented (Out)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged (Action Alert)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Physical Quality Condition</label>
                  <input
                    type="text"
                    required
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Condition Notes</label>
                  <input
                    type="text"
                    value={editConditionNotes}
                    onChange={(e) => setEditConditionNotes(e.target.value)}
                    placeholder="e.g. minor scratches"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300">Current Branch</label>
                  <input
                    type="text"
                    required
                    value={editCurrentBranch}
                    onChange={(e) => setEditCurrentBranch(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Current Location (Area)</label>
                  <input
                    type="text"
                    value={editCurrentLocation}
                    onChange={(e) => setEditCurrentLocation(e.target.value)}
                    placeholder="e.g. Row C"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">Locker Number</label>
                  <input
                    type="text"
                    value={editLockerNumber}
                    onChange={(e) => setEditLockerNumber(e.target.value)}
                    placeholder="e.g. L-12"
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Remarks / Maintenance Notes</label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Additional diagnostic details..."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {loadingAction ? 'Updating...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
