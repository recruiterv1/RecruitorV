import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Check, Loader2, AlertCircle } from 'lucide-react';
import DashShell from '../components/DashShell';

// Where a coach, expert or recruiter sets the hours they can be reached in.
//
// The windows appear on their card when someone is building a team, and the
// card is highlighted while the current time falls inside one of them — so this
// is what decides whether they look reachable to the person choosing.
export default function MyAvailability() {
  const [slots, setSlots] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [maxSlots, setMaxSlots] = useState(3);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    axios.get('/api/coach-expert/my-availability', { withCredentials: true })
      .then(r => {
        setSlots(r.data?.slots || []);
        setChosen(r.data?.availability || []);
        setMaxSlots(r.data?.maxSlots || 3);
        setRole(r.data?.role || '');
      })
      .catch(e => setMsg({ ok: false, text: e?.response?.data?.message || 'Could not load your availability.' }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (slot) => {
    setMsg(null);
    setChosen(c => c.includes(slot)
      ? c.filter(x => x !== slot)
      : (c.length >= maxSlots ? c : [...c, slot]));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await axios.put('/api/coach-expert/my-availability',
        { availability: chosen }, { withCredentials: true });
      setChosen(r.data?.availability || []);
      setMsg({ ok: true, text: 'Saved. This is what others will see on your card.' });
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || 'Could not save that.' });
    } finally { setSaving(false); }
  };

  return (
    <DashShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={20} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Your availability</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Pick up to {maxSlots} two-hour windows you can usually be reached in.
          {role === 'Recruiter'
            ? ' Coaches see this when they invite you onto a team.'
            : ' Recruiters see this when they ask to join your team.'}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {slots.map(slot => {
                const on = chosen.includes(slot);
                const full = chosen.length >= maxSlots;
                return (
                  <button type="button" key={slot} onClick={() => toggle(slot)}
                    disabled={!on && full}
                    className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      on ? 'border-orange-500 bg-orange-50 text-orange-700'
                         : full ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-gray-50'}`}>
                    {on && <Check size={13} className="inline mr-1 -mt-0.5" />}{slot}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {chosen.length}/{maxSlots} selected
              {chosen.length >= maxSlots && ' — deselect one to change'}
            </p>

            {chosen.length === 0 && (
              <p className="flex items-start gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                You have not set any hours yet, so your card shows no availability to
                anyone building a team.
              </p>
            )}

            {msg && (
              <p className={`mt-4 text-sm font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {msg.text}
              </p>
            )}

            <button onClick={save} disabled={saving}
              className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold text-sm shadow-lg disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save availability'}
            </button>
          </>
        )}
      </div>
    </DashShell>
  );
}
