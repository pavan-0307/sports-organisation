'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../utils/api';

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

export default function RentalsListPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await api.get('/products');
        if (response.data.success) {
          // Only show rental and hybrid products
          const rentalGear = response.data.data.products.filter(
            (p: ProductItem) => p.type === 'rental' || p.type === 'hybrid'
          );
          setProducts(rentalGear);
        }
      } catch (err: any) {
        setError('Unable to fetch gear list. Please reload.');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            SportNest Equipment Rentals
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            Book premium sports kits, cricket gears, tournament balls, and professional kits directly on-demand.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-slate-500 py-24">
            No professional rental equipment catalogued in database yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 duration-300"
              >
                <div className="h-48 w-full bg-slate-850 overflow-hidden relative">
                  {item.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      🏟️
                    </div>
                  )}
                  <div className="absolute top-4 right-4 rounded-full bg-blue-500/95 px-3 py-1 text-xs font-bold text-white shadow-lg uppercase">
                    Rent
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">
                      {item.description || 'Professional sport accessories inspected for maximum safety.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Daily Rate</div>
                      <div className="text-xl font-black text-slate-100">${item.baseRentalRate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider text-right">Refundable Deposit</div>
                      <div className="text-sm font-semibold text-slate-300 text-right">${item.securityDeposit}</div>
                    </div>
                  </div>

                  <Link
                    href={`/rentals/${item.id}`}
                    className="block w-full text-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    Configure Dates & Rent
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
