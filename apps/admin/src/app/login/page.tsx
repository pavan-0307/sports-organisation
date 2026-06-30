'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

export default function LoginPage() {
  const { user, loginVerify, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'staff') {
        router.push('/dashboard');
      } else {
        setError('Access denied. This console is restricted to administrators.');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoadingAction(true);

    try {
      const response = await api.post('/auth/login/otp-request', { email });
      if (response.data.success) {
        setStep('otp');
        setMessage('A login OTP has been sent. Check your system logs/email.');
      } else {
        setError(response.data.error?.message || 'Failed to request code.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error occurred. Please verify your email.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoadingAction(true);

    try {
      await loginVerify(email, otp);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Verification failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p>Verifying authentication credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Blurred background accents */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[128px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[128px]"></div>

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            SportNest Console
          </h1>
          <p className="mt-2 text-sm text-slate-400">Administrative Login Gateway</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {message}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sportnest.com"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingAction}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loadingAction ? 'Sending Request...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-300">
                6-Digit OTP Verification Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-center text-xl font-bold tracking-widest text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-1/3 rounded-lg border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loadingAction}
                className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {loadingAction ? 'Verifying...' : 'Verify & Access'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
