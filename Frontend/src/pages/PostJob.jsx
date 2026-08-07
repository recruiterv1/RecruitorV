import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, Building2, CheckCircle2, LogIn } from 'lucide-react';
import Ad_Pos from './Ad_Pos';
import Header from './Header';
import Footer from './Footer';

// Public "Post a Job" funnel.
//  1. Gate: enter company + contact. If the company already has a portal login →
//     send them to /company. Otherwise reveal the full posting form.
//  2. Ad_Pos in publicMode → submits to the public endpoint (admin review).
export default function PostJob() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('gate');        // gate | existing | form | done
  const [company, setCompany] = useState('');
  const [posterName, setPosterName] = useState('');
  const [posterEmail, setPosterEmail] = useState('');
  const [posterPhone, setPosterPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const proceed = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { data } = await axios.post('/api/public-job/check-company', { name: company.trim() });
      if (data.exists && data.hasLogin) { setStage('existing'); }
      else { setStage('form'); }
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  let body;
  if (stage === 'done') {
    body = (
      <div className="grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4 py-16">
        <div className="w-full max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 grid place-items-center text-green-600 mb-4"><CheckCircle2 size={30} /></div>
          <h1 className="text-xl font-bold text-gray-900">Job submitted for review</h1>
          <p className="text-sm text-gray-600 mt-2">Thanks! Our team will review your posting. Once approved, you'll receive login details for <b>{company}</b> to manage it at recruiterv.com/company.</p>
          <button onClick={() => navigate('/')} className="mt-5 text-sm font-medium text-blue-600 hover:underline">Back to home</button>
        </div>
      </div>
    );
  }

  else if (stage === 'existing') {
    body = (
      <div className="grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4 py-16">
        <div className="w-full max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white mb-4"><Building2 size={28} /></div>
          <h1 className="text-xl font-bold text-gray-900">This company already has an account</h1>
          <p className="text-sm text-gray-600 mt-2"><b>{company}</b> is already registered. Please log in to post and manage your jobs.</p>
          <button onClick={() => navigate('/company')} className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5">
            <LogIn size={16} /> Go to Company Login
          </button>
          <div><button onClick={() => setStage('gate')} className="mt-3 text-xs text-gray-500 hover:underline">Use a different company name</button></div>
        </div>
      </div>
    );
  }

  else if (stage === 'form') {
    body = (
      <div className="bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white"><Briefcase size={18} /></div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">Post a Job — {company}</div>
            <div className="text-xs text-gray-400">Your posting is reviewed by our team before going live.</div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-2 sm:p-4">
          <Ad_Pos publicMode={{ companyName: company.trim(), posterEmail: posterEmail.trim(), posterName: posterName.trim(), posterPhone: posterPhone.trim(), onPosted: () => setStage('done') }} />
        </div>
      </div>
    );
  }

  // gate
  else {
    body = (
    <div className="grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4 py-16">
      <form onSubmit={proceed} className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white mb-4"><Briefcase size={26} /></div>
        <h1 className="text-xl font-bold text-gray-900 text-center">Post a Job</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">Tell us about your company to get started.</p>

        <label className="text-xs text-gray-500">Company name *
          <input value={company} onChange={e => setCompany(e.target.value)} required
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>
        <label className="text-xs text-gray-500 block mt-3">Your name *
          <input value={posterName} onChange={e => setPosterName(e.target.value)} required
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>
        <label className="text-xs text-gray-500 block mt-3">Work email *
          <input type="email" value={posterEmail} onChange={e => setPosterEmail(e.target.value)} required
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>
        <label className="text-xs text-gray-500 block mt-3">Phone
          <input value={posterPhone} onChange={e => setPosterPhone(e.target.value)}
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <button type="submit" disabled={busy}
          className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Continue
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-4">Already registered? <button type="button" onClick={() => navigate('/company')} className="text-blue-600 hover:underline">Company login</button></p>
      </form>
    </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">{body}</main>
      <Footer />
    </div>
  );
}
