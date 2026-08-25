import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

// Paid plans for Vendor and Consulting Firm accounts. Mirrors the inbox-plan
// checkout: a one-time Razorpay Order so every method (UPI, cards, netbanking,
// wallets) is available, verified server-side before any access is granted.

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;
export const fmtDate = (v) => v
  ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : null;

/** Plan cards. `onChoose` receives the plan key. */
export const PlanPicker = ({ plans = [], selected, onChoose, disabled }) => (
  <div className="grid sm:grid-cols-2 gap-3">
    {plans.map(p => {
      const on = selected === p.key;
      const perMonth = Math.round((p.amountPaise / 100) / p.months);
      return (
        <button
          key={p.key} type="button" disabled={disabled}
          onClick={() => onChoose(p.key)}
          className={`text-left rounded-2xl border-2 p-4 transition-all ${
            on ? 'border-blue-600 bg-blue-50/60 shadow-md' : 'border-gray-200 hover:border-blue-300'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-gray-900">{p.label}</span>
            {on && <CheckCircle2 size={18} className="text-blue-600" />}
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{rupees(p.amountPaise)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            ≈ ₹{perMonth.toLocaleString('en-IN')} per month · one-time payment
          </p>
          {p.months === 12 && (
            <span className="inline-block mt-2 text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
              Best value
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/**
 * Opens Razorpay for the chosen plan and verifies the payment server-side.
 * Resolves true only once the server has confirmed the signature.
 */
export async function payForPlan(planKey, { onError } = {}) {
  const ok = await loadRazorpay();
  if (!ok) { onError?.('Could not load the payment gateway. Please check your connection.'); return false; }

  const { data } = await axios.post('/api/portal-subscription/order', { plan: planKey }, { withCredentials: true });
  if (!data?.orderId) { onError?.(data?.message || 'Could not start the payment.'); return false; }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: 'RecruiterV',
      description: `Subscription — ${data.plan?.label || ''}`,
      theme: { color: '#2563eb' },
      handler: async (resp) => {
        try {
          const v = await axios.post('/api/portal-subscription/verify', {
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
          }, { withCredentials: true });
          resolve(v.data?.success === true);
        } catch (e) {
          onError?.(e.response?.data?.message || 'We could not confirm that payment.');
          resolve(false);
        }
      },
      modal: { ondismiss: () => resolve(false) },
    });
    rzp.on('payment.failed', () => { onError?.('Payment failed. Please try again.'); resolve(false); });
    rzp.open();
  });
}

/** Renew/subscribe panel for a signed-in vendor or firm. */
export default function SubscriptionPanel() {
  const [status, setStatus] = useState(null);
  const [plan, setPlan] = useState('6month');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => axios.get('/api/portal-subscription/status', { withCredentials: true })
    .then(r => setStatus(r.data))
    .catch(() => setStatus(null));
  useEffect(() => { load(); }, []);

  if (!status) return <div className="py-10 text-center text-sm text-gray-400">Loading…</div>;
  const sub = status.subscription || {};

  const pay = async () => {
    setBusy(true); setErr('');
    const ok = await payForPlan(plan, { onError: setErr });
    setBusy(false);
    if (ok) load();
  };

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-4 ${
        sub.active ? 'border-green-200 bg-green-50/60' : 'border-red-200 bg-red-50/60'}`}>
        <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={16} className={sub.active ? 'text-green-600' : 'text-red-600'} />
          {sub.free ? 'Free access granted by RecruiterV'
            : sub.active ? 'Subscription active'
            : 'Subscription not active'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {sub.validUntil
            ? `${sub.active ? 'Valid until' : 'Expired on'} ${fmtDate(sub.validUntil)}`
            : sub.free ? 'No end date set.' : 'No payment recorded yet.'}
        </p>
      </div>

      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">
          {sub.active ? 'Extend your subscription' : 'Choose a plan'}
        </p>
        <PlanPicker plans={status.plans || []} selected={plan} onChoose={setPlan} disabled={busy} />
      </div>

      {err && <p className="text-xs font-semibold text-red-600">{err}</p>}

      <button onClick={pay} disabled={busy}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold text-sm disabled:opacity-60">
        {busy ? <><Loader2 size={15} className="animate-spin" /> Opening payment…</> : 'Pay with Razorpay'}
      </button>
      <p className="text-[11px] text-gray-400">
        One-time payment — nothing recurring. Your term extends from the current expiry, so paying early costs you nothing.
      </p>
    </div>
  );
}
