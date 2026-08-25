import React, { useState, useEffect } from 'react';
import { PlanPicker } from '../components/PortalSubscription';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Landmark, Loader2, CheckCircle2 } from 'lucide-react';

// Public consulting-firm registration. Creates a 'pending' firm; SuperAdmin then
// approves and sets quotas.
export default function ConsultingRegister() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  // Firms choose a plan at registration; payment happens after approval.
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState('6month');
  useEffect(() => {
    axios.get('/api/portal-subscription/plans')
      .then(r => setPlans(r.data?.plans || []))
      .catch(() => setPlans([]));
  }, []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    if (f.password.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    if (f.password !== f.confirm) { setMsg('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await axios.post('/api/consulting/register', { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password, plan });
      setDone(true);
    } catch (err) { setMsg(err.response?.data?.message || 'Registration failed.'); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4">
      <div className="w-full max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 grid place-items-center text-green-600 mb-4"><CheckCircle2 size={30} /></div>
        <h1 className="text-xl font-bold text-gray-900">Registration received</h1>
        <p className="text-sm text-gray-600 mt-2">Your firm account is pending administrator approval. You'll be able to add companies, positions and your team once it's approved and quotas are set.</p>
        <button onClick={() => navigate('/consulting')} className="mt-5 text-sm font-medium text-blue-600 hover:underline">Go to login</button>
      </div>
    </div>
  );

  const cls = 'mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40';
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 via-blue-50/40 to-orange-50/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white mb-4"><Landmark size={26} /></div>
        <h1 className="text-xl font-bold text-gray-900 text-center">Register your Consulting Firm</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">Create your account. An administrator will approve it and set your quotas.</p>

        <label className="text-xs text-gray-500 block">Firm name *<input value={f.name} onChange={e => set('name', e.target.value)} required className={cls} /></label>
        <label className="text-xs text-gray-500 block mt-3">Email *<input type="email" value={f.email} onChange={e => set('email', e.target.value)} required className={cls} /></label>
        <label className="text-xs text-gray-500 block mt-3">Phone<input value={f.phone} onChange={e => set('phone', e.target.value)} className={cls} /></label>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <label className="text-xs text-gray-500 block">Password *<input type="password" value={f.password} onChange={e => set('password', e.target.value)} required className={cls} /></label>
          <label className="text-xs text-gray-500 block">Confirm *<input type="password" value={f.confirm} onChange={e => set('confirm', e.target.value)} required className={cls} /></label>
        </div>

        {plans.length > 0 && (
          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Choose your plan *</label>
            <PlanPicker plans={plans} selected={plan} onChoose={setPlan} />
            <p className="text-[11px] text-gray-400 mt-2">
              Nothing is charged now. Once your firm is approved you'll sign in and pay,
              and your term starts from that point.
            </p>
          </div>
        )}

        {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        <button type="submit" disabled={busy} className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Register
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-4">Already registered? <button type="button" onClick={() => navigate('/consulting')} className="text-blue-600 hover:underline">Firm login</button></p>
      </form>
    </div>
  );
}
