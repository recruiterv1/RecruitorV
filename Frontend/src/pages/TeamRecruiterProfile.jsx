import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashShell from '../components/DashShell';
import { User, Save } from 'lucide-react';

// Short profile for a recruiter registered by a vendor. They work under their
// vendor's agreement, so only their name and mobile are needed — the official
// email, office address and website are optional and used purely for the
// signature block on outgoing mail.

const Field = ({ label, value, onChange, placeholder, type = 'text', required, hint }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
      {label} {required ? <span className="text-red-500">*</span> : <span className="text-gray-400">(optional)</span>}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-10 border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
    />
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

function TeamRecruiterProfileInner() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    axios.get('/api/profile/team-profile', { withCredentials: true })
      .then(r => setForm(r.data?.profile || null))
      .catch(e => setError(e.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await axios.put('/api/profile/team-profile', form, { withCredentials: true });
      setMsg({ ok: true, text: r.data?.message || 'Saved.' });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message || 'Could not save.' });
    } finally { setSaving(false); setTimeout(() => setMsg(null), 5000); }
  };

  if (loading) return <div className="py-24 text-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="py-24 text-center text-red-500 text-sm px-6">{error}</div>;
  if (!form) return null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-5 mb-5 shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User size={20} /> My Profile
        </h2>
        <p className="text-white/80 text-sm mt-1">
          {form.vendorName ? `You are part of ${form.vendorName}'s team. ` : ''}
          Just your contact details — the optional fields are only used to sign your emails.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <Field label="Name" required value={form.name} onChange={v => set('name', v)} placeholder="Your full name" />
        <Field label="Mobile number" required type="tel" value={form.mobile} onChange={v => set('mobile', v)} placeholder="10-digit mobile" />

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-700 mb-3">Used for your email signature</p>
          <div className="space-y-4">
            <Field label="Official email ID" type="email" value={form.officialEmail} onChange={v => set('officialEmail', v)}
              placeholder="you@company.com" hint="Shown in your signature. Your login email stays unchanged." />
            <Field label="Office address" value={form.officeAddress} onChange={v => set('officeAddress', v)}
              placeholder="Office address for your signature" />
            <Field label="Website" value={form.website} onChange={v => set('website', v)} placeholder="https://…" />
          </div>
        </div>

        {msg && <p className={`text-xs font-semibold ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

        <button onClick={save} disabled={saving || !form.name?.trim() || !form.mobile?.trim()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">
          <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

export default function TeamRecruiterProfile() {
  return <DashShell><TeamRecruiterProfileInner /></DashShell>;
}
