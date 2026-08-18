import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, ShieldCheck, Loader2, Building2, CheckCircle2, LogIn, Briefcase } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Ad_Pos from './Ad_Pos';

// Free/personal email domains that aren't accepted as a company email.
const FREE_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.in', 'hotmail.com', 'outlook.com', 'live.com',
  'rediffmail.com', 'ymail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com',
]);

const Field = ({ label, required, children, hint }) => (
  <div className="mb-5">
    <label className="block text-[15px] font-semibold text-gray-900 mb-1.5">
      {label}{required && <span className="text-blue-600"> *</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition';

export default function ForEmployer() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('gate');   // gate | existing | form | done
  const [form, setForm] = useState({ fullName: '', mobile: '', company: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const proceed = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) return setError('Please enter your full name.');
    if (!/^\d{10}$/.test(form.mobile.trim())) return setError('Please enter a valid 10-digit mobile number.');
    if (!form.company.trim()) return setError('Please enter the company you are hiring for.');
    const email = form.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');
    if (FREE_DOMAINS.has(email.split('@')[1] || '')) return setError('Please use your official company email address (not a personal email).');

    setBusy(true);
    try {
      const { data } = await axios.post('/api/public-job/check-company', { name: form.company.trim() });
      setStage(data.exists && data.hasLogin ? 'existing' : 'form');
    } catch (_) {
      setStage('form');   // fail open — let them post; server still validates
    } finally { setBusy(false); }
  };

  let body;
  if (stage === 'done') {
    body = (
      <div className="grid place-items-center bg-gradient-to-b from-slate-50 via-blue-50/40 to-white p-4 py-16">
        <div className="w-full max-w-md text-center bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/60 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 grid place-items-center text-green-600 mb-4"><CheckCircle2 size={30} /></div>
          <h1 className="text-xl font-bold text-gray-900">Application received</h1>
          <p className="text-sm text-gray-600 mt-2">
            Thanks, {form.fullName.split(' ')[0] || 'there'}! Your position for <b>{form.company}</b> has been received by RecruiterV and is pending review.
            Once approved, we'll email you at <b>{form.email}</b> with your login details to manage it.
          </p>
          <button onClick={() => navigate('/')} className="mt-5 text-sm font-medium text-blue-600 hover:underline">Back to home</button>
        </div>
      </div>
    );
  } else if (stage === 'existing') {
    body = (
      <div className="grid place-items-center bg-gradient-to-b from-slate-50 via-blue-50/40 to-white p-4 py-16">
        <div className="w-full max-w-md text-center bg-white border border-gray-100 rounded-3xl shadow-xl shadow-slate-200/60 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 grid place-items-center text-white mb-4"><Building2 size={28} /></div>
          <h1 className="text-xl font-bold text-gray-900">This company already has an account</h1>
          <p className="text-sm text-gray-600 mt-2"><b>{form.company}</b> is already registered. Please log in to post and manage your positions.</p>
          <button onClick={() => navigate('/company')} className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5">
            <LogIn size={16} /> Go to Company Login
          </button>
          <div><button onClick={() => setStage('gate')} className="mt-3 text-xs text-gray-500 hover:underline">Use a different company name</button></div>
        </div>
      </div>
    );
  } else if (stage === 'form') {
    body = (
      <div className="bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white"><Briefcase size={18} /></div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">Post a Position — {form.company}</div>
            <div className="text-xs text-gray-400">Your posting is reviewed by our team before going live.</div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-2 sm:p-4">
          <Ad_Pos publicMode={{ companyName: form.company.trim(), posterEmail: form.email.trim(), posterName: form.fullName.trim(), posterPhone: form.mobile.trim(), onPosted: () => setStage('done') }} />
        </div>
      </div>
    );
  } else {
    // gate — the Figma "Post a Position" lead form
    body = (
      <div className="bg-gradient-to-b from-slate-50 via-blue-50/40 to-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 grid place-items-center shadow-lg shadow-blue-600/20">
              <Star size={26} className="text-white fill-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">RecruiterV</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-gray-100 p-6 sm:p-9">
            <h1 className="text-3xl sm:text-[34px] font-extrabold text-gray-900 tracking-tight">Post a Position</h1>
            <p className="text-gray-500 mt-2 mb-7 leading-relaxed">
              Let's start with a few quick details about you. This helps us validate your requirement faster.
            </p>

            {error && <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</div>}

            <form onSubmit={proceed} noValidate>
              <Field label="Your Full Name" required>
                <input className={inputCls} placeholder="e.g. Priya Sharma" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputCls} type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"
                  value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Company You're Hiring For" required>
                <input className={inputCls} placeholder="e.g. Acme Technologies Pvt Ltd" value={form.company} onChange={e => set('company', e.target.value)} />
              </Field>
              <Field label="Official Email ID" required hint="Only company email addresses are accepted.">
                <input className={inputCls} type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>

              <button type="submit" disabled={busy}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-[15px] px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/25 transition disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Continue to Post a Position <ArrowRight size={18} /></>}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
                <ShieldCheck size={14} className="text-emerald-500" />
                Your information is kept private and only used to validate your requirement.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">{body}</main>
      <Footer />
    </div>
  );
}
