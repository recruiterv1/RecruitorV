import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2, LogIn } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

// Self-registration for Company and Vendor accounts. Both land as 'pending' and
// cannot sign in until a SuperAdmin approves them, so the page says so plainly
// rather than implying instant access.

const COPY = {
  company: {
    title: 'Register your Company',
    blurb: 'Tell us about your company. Once approved, you can post positions, add your HRs and follow every candidate.',
    nameLabel: 'Company name',
    loginPath: '/company',
    landing: '/for-company',
  },
  vendor: {
    title: 'Register as a Vendor',
    blurb: 'Tell us about your agency. Once approved, you can register your recruiters and post positions privately to your team.',
    nameLabel: 'Vendor / agency name',
    loginPath: '/vendor',
    landing: '/for-vendor',
  },
};

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition';

export default function PortalRegister({ portal = 'company' }) {
  const navigate = useNavigate();
  const copy = COPY[portal] || COPY.company;
  const [f, setF] = useState({ name: '', contactName: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.password !== f.confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const r = await axios.post(`/api/portal/${portal}/register`, {
        name: f.name, contactName: f.contactName, email: f.email,
        phone: f.phone, password: f.password,
      });
      if (r.data?.success) setDone(true);
      else setError(r.data?.message || 'Could not register.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register. Please try again.');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Registration received</h1>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Your account is with our team for review. We'll email you as soon as it's approved —
              you'll be able to sign in from that point.
            </p>
            <button onClick={() => navigate(copy.landing)}
              className="mt-6 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
              Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-gray-600 mt-2 text-[15px] leading-relaxed">{copy.blurb}</p>

          <form onSubmit={submit} className="mt-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <label className="block text-sm font-semibold text-gray-900 mb-1.5">{copy.nameLabel} *</label>
            <input required value={f.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder={copy.nameLabel} />

            <label className="block text-sm font-semibold text-gray-900 mb-1.5 mt-4">Contact person *</label>
            <input required value={f.contactName} onChange={e => set('contactName', e.target.value)} className={inputCls} placeholder="Full name" />

            <label className="block text-sm font-semibold text-gray-900 mb-1.5 mt-4">Work email *</label>
            <input required type="email" value={f.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="you@company.com" />
            <p className="text-xs text-gray-400 mt-1">This becomes your login. Personal mailboxes aren't accepted.</p>

            <label className="block text-sm font-semibold text-gray-900 mb-1.5 mt-4">Phone *</label>
            <input required type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="10-digit mobile" />

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Password *</label>
                <input required type="password" minLength={6} value={f.password} onChange={e => set('password', e.target.value)} className={inputCls} placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Confirm password *</label>
                <input required type="password" minLength={6} value={f.confirm} onChange={e => set('confirm', e.target.value)} className={inputCls} placeholder="Repeat it" />
              </div>
            </div>

            <p className="mt-5 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Accounts are reviewed before they go live. You'll be able to sign in once a
              RecruiterV administrator approves yours.
            </p>

            <button type="submit" disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold text-sm disabled:opacity-60">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit registration'}
            </button>

            <button type="button" onClick={() => navigate(copy.loginPath)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
              <LogIn size={15} /> Already registered? Sign in
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
