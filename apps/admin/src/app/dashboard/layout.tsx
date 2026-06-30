'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      const isAuthorized = ['admin', 'super_admin', 'staff'].includes(user.role);
      if (!isAuthorized) {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p>Restricting secure console profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'User Management', href: '/dashboard/users' },
    { name: 'Inventory Lookup', href: '/dashboard/inventory' },
    { name: 'Rentals Console', href: '/dashboard/rentals' },
    { name: 'Matches & Score', href: '/dashboard/matches' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'admin':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            SportNest Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/20 px-8 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getRoleColor(user.role)}`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">
              System: <span className="text-emerald-500 font-medium">Online</span>
            </span>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
