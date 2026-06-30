'use client';

import React from 'react';

export default function InventoryPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Inventory Lookup</h1>
        <p className="text-sm text-slate-400">Search and manage product catalogs, brands, categories, and serial numbers.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          📦
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-200">Catalog Module Loading</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Sprint 3 (Inventory & Products) is currently being scheduled. This view will aggregate unified retail/rental products and track inventory units.
        </p>
      </div>
    </div>
  );
}
