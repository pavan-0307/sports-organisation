'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../utils/api';

interface RentalOrderItem {
  id: string;
  startDate: string;
  endDate: string;
  rentalRate: string;
  securityDeposit: string;
  returnedAt: string | null;
  product: { name: string };
  inventoryUnit: { inventoryCode: string } | null;
  penalties: Array<{ amount: string; reason: string; status: string }>;
}

interface RentalOrder {
  id: string;
  status: 'pending_payment' | 'reserved' | 'active' | 'returned' | 'cancelled' | 'overdue';
  totalAmount: string;
  depositAmount: string;
  pickupSlot: string;
  pickupVerificationCode: string | null;
  createdAt: string;
  customer: { firstName: string; lastName: string; email: string };
  items: RentalOrderItem[];
}

export default function AdminRentalsPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Verification States
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [pickupCondition, setPickupCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [pickupNotes, setPickupNotes] = useState('');

  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnInventoryCode, setReturnInventoryCode] = useState('');
  const [returnCondition, setReturnCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [returnNotes, setReturnNotes] = useState('');
  const [isDamaged, setIsDamaged] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/rentals/history', {
        params: { page, limit: 10 }
      });
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed connecting to database.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/rentals/admin/verify-pickup', {
        verificationCode: verifyCode.trim().toUpperCase(),
        conditionScore: pickupCondition,
        notes: pickupNotes
      });

      if (response.data.success) {
        setSuccess('Pickup verified successfully! Rental active.');
        setIsPickupOpen(false);
        setVerifyCode('');
        setPickupNotes('');
        fetchOrders();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Pickup verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/rentals/admin/verify-return', {
        inventoryCode: returnInventoryCode.trim().toUpperCase(),
        conditionScore: returnCondition,
        notes: returnNotes,
        isDamaged
      });

      if (response.data.success) {
        let returnMessage = 'Return verified successfully!';
        if (response.data.data.penalties > 0) {
          returnMessage += ` Surcharge computed: $${response.data.data.penalties}.`;
        }
        if (response.data.data.damageRecorded) {
          returnMessage += ' Damage logged and deposit locked.';
        }
        setSuccess(returnMessage);
        setIsReturnOpen(false);
        setReturnInventoryCode('');
        setReturnNotes('');
        setIsDamaged(false);
        fetchOrders();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Return check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'returned':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'reserved':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Equipment Rental Console</h1>
          <p className="text-sm text-slate-400">Process hand-offs, run pickup codes scanner, inspect damages, and verify return checklists.</p>
        </div>
        <div className="space-x-3">
          <button
            onClick={() => setIsPickupOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Verify Pickup Token
          </button>
          <button
            onClick={() => setIsReturnOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Process Return Code
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">{success}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Order / Customer</th>
                <th className="px-6 py-4">Gear Details</th>
                <th className="px-6 py-4">Dates / Slot</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    Querying orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No active rental orders registered.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-200">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {order.pickupVerificationCode || 'No Code'}
                        </div>
                        <div className="text-[10px] text-slate-500">{order.customer?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="mb-2 last:mb-0">
                          <div className="font-semibold text-slate-300">{item.product?.name}</div>
                          {item.inventoryUnit && (
                            <div className="font-mono text-slate-500 text-[10px]">
                              Code: {item.inventoryUnit.inventoryCode}
                            </div>
                          )}
                          {item.penalties.length > 0 && (
                            <div className="text-red-400 text-[10px] font-bold">
                              Surcharge: ${item.penalties.reduce((sum, p) => sum + parseFloat(p.amount), 0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      <div>Slot: {new Date(order.pickupSlot).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Rent: {new Date(order.items[0]?.startDate).toLocaleDateString()} to {new Date(order.items[0]?.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-slate-200">Rate: ${order.totalAmount}</div>
                      <div className="text-blue-400">Deposit: ${order.depositAmount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
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

      {/* Pickup Verification Modal */}
      {isPickupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Verify Pickup Code</h2>
            <form onSubmit={handleVerifyPickup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Enter Verification Code (e.g. RN-XXXXXX)</label>
                <input
                  type="text"
                  required
                  placeholder="RN-"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500 font-mono tracking-widest uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Condition Score at Hand-off</label>
                <select
                  value={pickupCondition}
                  onChange={(e) => setPickupCondition(e.target.value as any)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Inspector Notes</label>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Condition verified by staff..."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPickupOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Confirm Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Check-In Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Process Return Inspection</h2>
            <form onSubmit={handleVerifyReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300">Scan / Enter Inventory Unit Code (e.g. BAT-001)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAT-001"
                  value={returnInventoryCode}
                  onChange={(e) => setReturnInventoryCode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">Returned Condition Score</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={isDamaged}
                  onChange={(e) => setIsDamaged(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />
                <span className="text-xs text-red-400 font-semibold">Flag item as damaged (Locks deposit fraction)</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-300">Condition Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notes about returned wear and tear..."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReturnOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Checking in...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
