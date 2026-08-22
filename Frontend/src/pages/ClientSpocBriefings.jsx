import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mic, Search, RefreshCw } from 'lucide-react';

// ClientSPOC → Position Briefings. Same items as the coach/vendor briefing, but
// a SPOC's briefing is open to everyone working the position rather than being
// private to one team.

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

// The briefing has six items: five core areas plus an optional Winning Tip,
// which is deliberately excluded from the coverage score.
const CORE_AREA_COUNT = 5;

const STATE = {
  pending: { dot: '🔴', label: 'Pending', cls: 'bg-red-100 text-red-700' },
  draft: { dot: '🟡', label: 'Draft', cls: 'bg-amber-100 text-amber-700' },
  ready: { dot: '🟢', label: 'Ready', cls: 'bg-green-100 text-green-700' },
};

const Stat = ({ label, value, sub, tone }) => (
  <div className={`rounded-2xl border p-4 ${tone || 'border-gray-200 bg-white'}`}>
    <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
  </div>
);

export default function ClientSpocBriefings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ pending: 0, draft: 0, ready: 0, total: 0, completion: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/briefing/my-positions', { withCredentials: true })
      .then(r => {
        setRows(r.data?.positions || []);
        setStats(r.data?.stats || { pending: 0, draft: 0, ready: 0, total: 0, completion: 0 });
        setError('');
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load your positions.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter(r => {
      if (tab !== 'all' && r.briefingState !== tab) return false;
      if (!n) return true;
      return r.position.toLowerCase().includes(n)
        || (r.client || '').toLowerCase().includes(n)
        || String(r.pos_id).includes(n);
    });
  }, [rows, tab, q]);

  const tabs = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'pending', label: `🔴 Pending (${stats.pending})` },
    { id: 'draft', label: `🟡 Draft (${stats.draft})` },
    { id: 'ready', label: `🟢 Ready (${stats.ready})` },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mic size={20} /> Position Briefings
          </h2>
          <p className="text-white/80 text-sm mt-1">
            Brief every recruiter, coach, expert and vendor working your positions — they can play each item as audio.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Pending" value={stats.pending} sub="Positions with no briefing yet" />
        <Stat label="Draft" value={stats.draft} sub="Started but not published" />
        <Stat label="Ready" value={stats.ready} sub="Live for everyone on the position" />
        <Stat label="Completion" value={`${stats.completion}%`}
          sub={`${stats.ready} of ${stats.total} briefed`} tone="border-blue-200 bg-blue-50" />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search position / client"
            className="h-9 w-60 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold" title="Core areas answered; the optional Winning Tip is not counted">Core areas</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-red-500">{error}</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                  {rows.length ? 'No positions match this filter.' : 'No positions of yours yet.'}
                </td></tr>
              ) : filtered.map(r => {
                const st = STATE[r.briefingState];
                return (
                  <tr key={r.pos_id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.position}</p>
                      <p className="text-xs text-gray-400">#{r.pos_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.client || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.briefingState === 'pending' ? '—' : `${(r.coverage || []).length}/${CORE_AREA_COUNT}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>
                        {st.dot} {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.briefingUpdatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/briefing/${r.pos_id}`)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                          r.briefingState === 'pending'
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'text-blue-700 border border-blue-200 hover:bg-blue-50'}`}>
                        {r.briefingState === 'pending' ? '+ Add Briefing'
                          : r.briefingState === 'draft' ? 'Continue' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
