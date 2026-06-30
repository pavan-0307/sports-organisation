'use client';

import React from 'react';

export default function MatchesPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Matches & Scoreboards</h1>
        <p className="text-sm text-slate-400">Manage tournament schedules, log fixture brackets, and update live scoring details.</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
          🏆
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-200">Matches Module Loading</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Sprint 6 (Sports Events & Scoring) is currently being scheduled. This pane will feature dynamic bracket editors and tournament rosters.
        </p>
      </div>
    </div>
  );
}
