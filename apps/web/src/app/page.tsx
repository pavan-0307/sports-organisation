import React from 'react';

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Background ambient glow effect */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="font-bold text-xl text-white">S</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SPORTNEST</h1>
            <p className="text-[10px] tracking-widest text-blue-500 font-semibold uppercase">Customer Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">SYSTEMS OPERATIONAL</span>
        </div>
      </header>

      {/* Hero section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/20 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-sm">
          <span>⚡ ESLint v9 & ESM Migration Complete</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 max-w-3xl">
          Elevate Your{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
            Sports Organisation
          </span>
        </h2>

        <p className="text-slate-400 text-lg md:text-xl max-w-xl mb-12 font-medium">
          Welcome to the SportNest client app portal. Manage events, track athletes, and coordinate teams with peak performance.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="http://localhost:3001"
            className="px-8 py-3.5 rounded-xl font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all duration-300 shadow-xl shadow-white/5 active:scale-95"
          >
            Access Admin Dashboard
          </a>
          <a
            href="http://localhost:4000/api-docs"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3.5 rounded-xl font-bold border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all duration-300 backdrop-blur-sm active:scale-95 text-slate-300"
          >
            API Documentation
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/25 backdrop-blur-sm text-left">
            <h3 className="text-white font-bold text-lg mb-2">Member Portal</h3>
            <p className="text-slate-400 text-sm">Self-service registration, membership management, and fee collection for participants.</p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/25 backdrop-blur-sm text-left">
            <h3 className="text-white font-bold text-lg mb-2">Event Schedule</h3>
            <p className="text-slate-400 text-sm">Interactive calendar with upcoming fixtures, tournaments, and real-time scheduling updates.</p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/25 backdrop-blur-sm text-left">
            <h3 className="text-white font-bold text-lg mb-2">Performance Center</h3>
            <p className="text-slate-400 text-sm">Comprehensive tracking of metrics, athletic stats, milestones, and development records.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 SportNest Inc. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
