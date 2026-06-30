'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../utils/api';

interface CartItem {
  productId: string;
  productName: string;
  baseRentalRate: string;
  securityDeposit: string;
  startDate: string;
  endDate: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Form states
  const [pickupSlot, setPickupSlot] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('sportnest_rental_cart');
    if (data) {
      setCart(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;
    if (!agreed) {
      alert('You must sign the digital rental agreement before checkout.');
      return;
    }
    if (!pickupSlot) {
      alert('Please select a 30-minute pickup slot.');
      return;
    }

    setLoadingCheckout(true);
    setError('');
    setSuccess('');

    try {
      // 1. Create order
      const orderRes = await api.post('/rentals/order', {
        items: [
          {
            productId: cart.productId,
            startDate: cart.startDate,
            endDate: cart.endDate
          }
        ],
        pickupSlot: new Date(pickupSlot).toISOString()
      });

      if (orderRes.data.success) {
        const orderId = orderRes.data.data.order.id;
        const code = orderRes.data.data.order.pickupVerificationCode;

        // 2. Submit simulated payment confirm
        await api.post('/rentals/payment-confirm', {
          rentalOrderId: orderId,
          paymentMethod: 'stripe_mock',
          transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`
        });

        // 3. Complete checkout
        setVerificationCode(code);
        setSuccess('Rental Order placed successfully! Your pickup token has been generated.');
        localStorage.removeItem('sportnest_rental_cart');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Checkout payment request rejected.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!cart && !success) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 font-sans">Your Cart is Empty</h1>
        <Link href="/rentals" className="text-blue-500 hover:underline">
          Return to rental catalog
        </Link>
      </div>
    );
  }

  const days = cart ? calculateDays(cart.startDate, cart.endDate) : 0;
  const rentalCost = cart ? Number(cart.baseRentalRate) * days : 0;
  const depositCost = cart ? Number(cart.securityDeposit) : 0;
  const grandTotal = rentalCost + depositCost;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-100">Secure Checkout</h1>
          <p className="text-sm text-slate-400">Review reservation summaries, pickup hours, and agreements.</p>
        </div>

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-emerald-400">Booking Confirmed! 🎉</h2>
            <p className="text-sm text-slate-300">
              Your pickup token has been generated. Present this token or QR code at the counter for pickup.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm mx-auto space-y-4">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">Verification Token</div>
              <div className="text-3xl font-black text-slate-100 font-mono tracking-wider">{verificationCode}</div>
              <div className="flex h-32 w-32 items-center justify-center bg-white rounded-lg mx-auto p-2">
                {/* Simulated QR Code */}
                <div className="border-4 border-slate-900 h-full w-full flex items-center justify-center text-slate-900 font-bold text-xs select-none">
                  [QR MOCK]
                </div>
              </div>
            </div>

            <Link
              href="/rentals"
              className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Browse More Equipment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Cart & Billing info */}
            <div className="md:col-span-3 space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
                <h2 className="text-lg font-bold text-slate-200">1. Pickup Information</h2>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Select Pickup Time Slot</label>
                  <input
                    type="datetime-local"
                    required
                    value={pickupSlot}
                    onChange={(e) => setPickupSlot(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
                <h2 className="text-lg font-bold text-slate-200">2. Payment details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Name on Card</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-slate-100 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-200">3. Rental Agreement</h2>
                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                  By checking the box below, you agree to:
                  1. Return the equipment on or before the due date.
                  2. Keep the equipment in the same condition as received.
                  3. Pay standard late penalty charges if returned late.
                  4. Allow SportNest to lock security deposits in case of damage or loss.
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  <span className="text-xs text-slate-300 font-medium">I digitally sign the rental agreement.</span>
                </label>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 sticky top-6">
                <h2 className="text-lg font-bold text-slate-200">Summary</h2>

                {cart && (
                  <div className="space-y-4 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-200">{cart.productName}</span>
                      <span className="text-slate-300">x1</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-4">
                      <span>Daily Surcharge Rate</span>
                      <span className="text-slate-300">${cart.baseRentalRate}/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rental Duration</span>
                      <span className="text-slate-300">{days} days</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-4">
                      <span>Total Rental Surcharges</span>
                      <span className="text-slate-300">${rentalCost}</span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>Refundable Deposit</span>
                      <span>${depositCost}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-4 text-sm font-bold text-slate-200">
                      <span>Grand Total</span>
                      <span>${grandTotal}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckoutSubmit}
                  disabled={loadingCheckout}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {loadingCheckout ? 'Authorizing Payment...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
