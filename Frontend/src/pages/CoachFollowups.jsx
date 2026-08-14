import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Star, Send, RefreshCw, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import CoachExpertPageLayout from '../components/CoachExpertPageLayout';

const CoachFollowups = () => (
  <CoachExpertPageLayout>
    <CoachFollowupsContent />
  </CoachExpertPageLayout>
);

// 1–5 star rating input.
const StarRating = ({ value, onChange }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className="p-0.5" title={`${n} / 5`}>
        <Star size={18} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      </button>
    ))}
  </div>
);

const CoachFollowupsContent = () => {
  const [params, setParams]       = useState([]);     // 5 rating parameters
  const [today, setToday]         = useState('');
  const [eligible, setEligible]   = useState([]);     // open position+recruiter pairs
  const [followups, setFollowups] = useState([]);     // saved rows
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  // Form state
  const [pairKey, setPairKey]     = useState('');
  const [ratings, setRatings]     = useState({});
  const [remarks, setRemarks]     = useState('');
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/coach-expert/followups', { withCredentials: true });
      setParams(r.data?.parameters || []);
      setToday(r.data?.today || '');
      setEligible(r.data?.eligible || []);
      setFollowups(r.data?.followups || []);
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.message || 'Failed to load follow-ups' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const flash = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const selectedPair = eligible.find(p => p.key === pairKey);

  const submit = async () => {
    if (!selectedPair) { flash('error', 'Choose a position & recruiter first.'); return; }
    if (params.some(p => !ratings[p.key])) { flash('error', 'Please rate all 5 parameters.'); return; }
    setSaving(true);
    try {
      await axios.post('/api/coach-expert/followups', {
        positionId: selectedPair.positionId,
        recruiterEmail: selectedPair.recruiterEmail,
        ratings, remarks,
      }, { withCredentials: true });
      flash('success', 'Follow-up saved for today.');
      setPairKey(''); setRatings({}); setRemarks('');
      load();
    } catch (e) {
      flash('error', e.response?.data?.message || 'Could not save follow-up');
    } finally { setSaving(false); }
  };

  const avg = (rt) => {
    const vals = params.map(p => rt?.[p.key] || 0).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 grid place-items-center text-white flex-shrink-0">
          <ClipboardList size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Recruiter Follow-ups</h1>
          <p className="text-sm text-gray-500">
            Log a daily follow-up for recruiters you've assigned positions to. Follow-ups run until the recruiter submits a
            candidate, someone joins, or the position is paused.
          </p>
        </div>
        <button onClick={load} className="text-gray-500 hover:text-blue-600 p-2" title="Refresh"><RefreshCw size={18} /></button>
      </div>

      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}{toast.msg}
        </div>
      )}

      {/* Add follow-up form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">Add today's follow-up</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            <Calendar size={13} /> {today || 'Today'}
          </span>
        </div>

        {eligible.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center">
            No open positions to follow up on. A position appears here only while it's active, unassigned candidate not yet
            submitted, and no one has joined.
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Position &amp; Recruiter</label>
            <select value={pairKey} onChange={e => { setPairKey(e.target.value); setRatings({}); setRemarks(''); }}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500">
              <option value="">Select a position &amp; recruiter…</option>
              {eligible.map(p => (
                <option key={p.key} value={p.key}>
                  {p.positionTitle || p.positionId}{p.client ? ` · ${p.client}` : ''} → {p.recruiterName || p.recruiterEmail}
                </option>
              ))}
            </select>

            {selectedPair && (
              <>
                {/* 5 rating parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                  {params.map(p => (
                    <div key={p.key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">{p.label}</span>
                      <StarRating value={ratings[p.key] || 0} onChange={v => setRatings(r => ({ ...r, [p.key]: v }))} />
                    </div>
                  ))}
                </div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                  placeholder="What did you discuss / advise the recruiter today?"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:border-blue-500 resize-vertical" />
                <div className="flex justify-end">
                  <button onClick={submit} disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60">
                    <Send size={16} /> {saving ? 'Saving…' : 'Save follow-up'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Follow-ups table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-gray-800">Follow-up history</div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : followups.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No follow-ups logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-left">
                  {['Date', 'Position', 'Recruiter', ...params.map(p => p.label), 'Avg', 'Remarks'].map(h => (
                    <th key={h} className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {followups.map(f => (
                  <tr key={f.id} className="border-t border-gray-100 hover:bg-blue-50/30">
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{f.date}</td>
                    <td className="px-3 py-3 font-medium text-gray-700">{f.positionTitle || f.positionId}{f.client ? <span className="block text-[11px] text-gray-400">{f.client}</span> : null}</td>
                    <td className="px-3 py-3 text-gray-700">{f.recruiterName || f.recruiterEmail}</td>
                    {params.map(p => (
                      <td key={p.key} className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-semibold">
                          {f.ratings?.[p.key] || '—'}{f.ratings?.[p.key] ? <Star size={12} className="fill-amber-400 text-amber-400" /> : null}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-3 font-bold text-gray-800">{avg(f.ratings)}</td>
                    <td className="px-3 py-3 text-gray-500 max-w-xs">{f.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachFollowups;
