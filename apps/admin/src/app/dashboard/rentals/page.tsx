'use client';

import React from 'react';

export default function RentalsPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Rentals Console</h1>
        <p className="text-sm text-slate-400">Track active rental periods, verify returns, inspect deposits, and process barcode check-ins.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          🔑
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-200">Rentals Module Loading</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Sprint 4 (Equipment Rental) is currently being scheduled. This console will feature QR code vouchers, checkouts, and barcode return scanning.
        </p>
      </div>
    </div>
  );
}
