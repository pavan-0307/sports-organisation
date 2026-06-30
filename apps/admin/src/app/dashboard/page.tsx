'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">
          Hello, {user?.firstName || 'Admin'}
        </h1>
        <p className="mt-2 text-slate-400">
          Welcome back to the SportNest Administration panel. Here is an overview of the platform configuration.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">API Gateway Status</p>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">Active</span>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Online
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Port 4000 resolving routes</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">Environment Node</p>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">Dev</span>
            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Isolated
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Connecting PostgreSQL local docker</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-slate-400">Monorepo Packages</p>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-100">7</span>
            <span className="text-xs text-slate-400">Active Workspaces</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Including types, ui, config libraries</p>
        </div>
      </div>

      {/* System info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6">
        <h2 className="text-lg font-semibold text-slate-200">System Logs Diagnostics</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm border-b border-slate-800/60 pb-3">
            <span className="text-slate-400">Prisma Client</span>
            <span className="font-mono text-slate-300">v5.22.0</span>
          </div>
          <div className="flex items-center justify-between text-sm border-b border-slate-800/60 pb-3">
            <span className="text-slate-400">NextJS Framework</span>
            <span className="font-mono text-slate-300">v15.5.19</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Access Hashing Code</span>
            <span className="font-mono text-slate-300">Argon2id (64MB)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
