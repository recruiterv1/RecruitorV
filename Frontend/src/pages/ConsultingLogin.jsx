import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Landmark, Loader2 } from 'lucide-react';

// Consulting-firm portal login — recruiterv.com/consulting
export default function ConsultingLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => el.setAttribute('data-theme', 'dark');
    apply(); const raf = requestAnimationFrame(apply);
    return () => { cancelAnimationFrame(raf); el.removeAttribute('data-theme'); };
  }, []);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      await axios.post('/api/consulting/login', { email: email.trim(), pass }, { withCredentials: true });
      navigate('/consulting-dashboard');
    } catch (err) { setMsg(err.response?.data?.message || 'Login failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white mb-4"><Landmark size={26} /></div>
        <h1 className="text-xl font-bold text-gray-900 text-center">Consulting Firm Login</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">Manage your companies, positions and team.</p>

        <label className="text-xs text-gray-500">Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>
        <label className="text-xs text-gray-500 block mt-3">Password
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
            className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </label>

        {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        <button type="submit" disabled={busy}
          className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Sign in
        </button>
        <div className="mt-5 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">New consulting firm?</p>
          <button type="button" onClick={() => navigate('/consulting-register')} className="mt-1 text-sm font-semibold text-blue-600 hover:underline">Register your firm →</button>
        </div>
      </form>
    </div>
  );
}
