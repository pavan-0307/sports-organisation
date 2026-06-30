'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../utils/api';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  retailPrice: string | null;
  baseRentalRate: string | null;
  securityDeposit: string | null;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
}

export default function ProductRentalDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const router = useRouter();
  const { productId } = use(params);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date selection states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availChecked, setAvailChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await api.get(`/products`);
        if (response.data.success) {
          const found = response.data.data.products.find((p: any) => p.id === productId);
          setProduct(found || null);
        }
      } catch (err) {
        setError('Gear details not found.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please configure both Start Date and End Date.');
      return;
    }

    setCheckingAvail(true);
    setAvailChecked(false);
    setError('');

    try {
      const response = await api.get('/rentals/availability', {
        params: {
          productId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString()
        }
      });
      if (response.data.success) {
        setIsAvailable(response.data.data.available);
        setAvailChecked(true);
        if (!response.data.data.available) {
          setError(response.data.data.message || 'No physical units available for selection.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Verification request failed.');
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!product || !startDate || !endDate) return;

    // Save configuration in localStorage for checkout cart processing
    const cartItem = {
      productId: product.id,
      productName: product.name,
      baseRentalRate: product.baseRentalRate,
      securityDeposit: product.securityDeposit,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString()
    };
    localStorage.setItem('sportnest_rental_cart', JSON.stringify(cartItem));
    router.push('/rentals/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/rentals" className="text-blue-500 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/rentals" className="hover:text-blue-400">Rentals</Link>
          <span>/</span>
          <span className="text-slate-300">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="h-80 w-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden relative">
              {product.images?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl">
                  🏟️
                </div>
              )}
            </div>
          </div>

          {/* Details & Check */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-100">{product.name}</h1>
              <p className="text-sm text-slate-400 mt-2">{product.description || 'Verified operational quality.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-500">Daily Rate</div>
                <div className="text-2xl font-extrabold text-blue-400">${product.baseRentalRate}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Refundable Deposit</div>
                <div className="text-2xl font-extrabold text-slate-200">${product.securityDeposit}</div>
              </div>
            </div>

            <form onSubmit={handleCheckAvailability} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Select Booking Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setAvailChecked(false);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setAvailChecked(false);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checkingAvail}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {checkingAvail ? 'Checking Availability...' : 'Check Availability'}
              </button>
            </form>

            {/* Check Results */}
            {availChecked && isAvailable && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
                <p className="text-sm text-emerald-400 font-semibold">✓ Equipment unit is available for rental!</p>
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
                >
                  Proceed to checkout
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
