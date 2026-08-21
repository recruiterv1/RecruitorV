import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SpeakButton from '../components/SpeakButton';

// Coach / Vendor briefing summary — every position they can brief on, what state
// each briefing is in, and the way into writing or editing one.

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const STATE = {
  pending: { dot: '🔴', label: 'Pending', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
  draft: { dot: '🟡', label: 'Draft', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  ready: { dot: '🟢', label: 'Ready', cls: 'bg-green-500/10 text-green-300 border-green-500/30' },
};

const StatCard = ({ icon, label, value, sub, accent, bar }) => (
  <div className={`rounded-2xl border p-4 ${accent || 'border-neutral-800 bg-neutral-900/60'}`}>
    <p className="text-[11px] uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
      <span>{icon}</span> {label}
    </p>
    <p className="text-3xl font-bold text-white mt-2">{value}</p>
    <p className="text-[11px] text-neutral-500 mt-1.5">{sub}</p>
    {bar !== undefined && (
      <div className="mt-2 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${bar}%` }} />
      </div>
    )}
  </div>
);

export default function MyBriefings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ pending: 0, draft: 0, ready: 0, total: 0, completion: 0 });
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [playing, setPlaying] = useState(null);   // pos_id whose briefing is expanded
  const [textById, setTextById] = useState({});

  useEffect(() => {
    axios.get('/api/briefing/my-positions', { withCredentials: true })
      .then(r => {
        setRows(r.data?.positions || []);
        setStats(r.data?.stats || { pending: 0, draft: 0, ready: 0, total: 0, completion: 0 });
        setAuthor(r.data?.author || null);
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load your briefings.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (tab !== 'all' && r.briefingState !== tab) return false;
      if (!needle) return true;
      return r.position.toLowerCase().includes(needle)
        || r.client.toLowerCase().includes(needle)
        || String(r.pos_id).includes(needle);
    });
  }, [rows, tab, q]);

  // The briefing text is only fetched when someone actually wants to hear it.
  const openBriefing = async (posId) => {
    if (playing === posId) { setPlaying(null); return; }
    setPlaying(posId);
    if (textById[posId]) return;
    try {
      const r = await axios.get(`/api/briefing/position/${posId}`, { withCredentials: true });
      const b = r.data?.briefing;
      setTextById(m => ({ ...m, [posId]: [b?.briefingText, b?.winningTip].filter(Boolean).join('. ') }));
    } catch (_) {
      setTextById(m => ({ ...m, [posId]: '' }));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500">Loading…</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-red-400 px-6 text-center">{error}</div>;
  }

  const who = author?.type === 'vendor' ? 'My Vendor Briefings' : 'My Coach Briefings';
  const tabs = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'pending', label: `🔴 Pending (${stats.pending})` },
    { id: 'draft', label: `🟡 Draft (${stats.draft})` },
    { id: 'ready', label: `🟢 Ready (${stats.ready})` },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 pb-16">
      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">🎙️ {who}</h1>
            <p className="text-sm text-neutral-500 mt-1">Brief your team once. Help them source better.</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search Position / Client"
              className="h-9 w-64 bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-neutral-600 outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <StatCard icon="🔴" label="Pending" value={stats.pending}
            sub="Positions waiting for your briefing" />
          <StatCard icon="🟡" label="Draft" value={stats.draft}
            sub="Briefings started but not published" />
          <StatCard icon="🟢" label="Ready" value={stats.ready}
            sub="Briefings available to your team" />
          <StatCard icon="📊" label="Completion" value={`${stats.completion}%`}
            sub={`${stats.ready} of ${stats.total} positions briefed`}
            accent="border-blue-500/30 bg-blue-500/5" bar={stats.completion} />
        </div>

        {/* Filters */}
        <h2 className="mt-8 text-base font-bold text-white">Your Positions &amp; Briefing Status</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-4 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900/80">
                <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Assigned</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {!filtered.length ? (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-neutral-600">
                    {rows.length ? 'No positions match this filter.' : 'No positions assigned to you yet.'}
                  </td></tr>
                ) : filtered.map(r => {
                  const st = STATE[r.briefingState];
                  const isOpen = playing === r.pos_id;
                  return (
                    <React.Fragment key={r.pos_id}>
                      <tr className="bg-neutral-900/30 hover:bg-neutral-900/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-neutral-100">{r.position}</p>
                          {r.durationLabel
                            ? <p className="text-[11px] text-neutral-500 mt-0.5">▶ {r.durationLabel}</p>
                            : <p className="text-[11px] text-neutral-600 mt-0.5">#{r.pos_id}</p>}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{r.client || '—'}</td>
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{fmtDate(r.datePosted)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${st.cls}`}>
                            {st.dot} {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{fmtDate(r.briefingUpdatedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {r.briefingState === 'pending' && (
                              <button onClick={() => navigate(`/briefing/${r.pos_id}`)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90">
                                + Add Briefing
                              </button>
                            )}
                            {r.briefingState === 'draft' && (
                              <button onClick={() => navigate(`/briefing/${r.pos_id}`)}
                                className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-amber-500 rounded-lg hover:bg-amber-400">
                                Continue
                              </button>
                            )}
                            {r.briefingState === 'ready' && (
                              <>
                                <button onClick={() => openBriefing(r.pos_id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20">
                                  ▶ Listen
                                </button>
                                <button onClick={() => navigate(`/briefing/${r.pos_id}`)}
                                  className="px-3 py-1.5 text-xs font-semibold text-neutral-300 border border-neutral-700 rounded-lg hover:bg-neutral-800">
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-neutral-900/60">
                          <td colSpan={6} className="px-4 py-4">
                            {textById[r.pos_id] === undefined ? (
                              <p className="text-xs text-neutral-500">Loading briefing…</p>
                            ) : !textById[r.pos_id] ? (
                              <p className="text-xs text-neutral-500">This briefing has no text yet.</p>
                            ) : (
                              <div className="flex items-start gap-3">
                                <SpeakButton text={textById[r.pos_id]} tone="green"
                                  title={`Play the briefing for ${r.position}`} />
                                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap flex-1">
                                  {textById[r.pos_id]}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-neutral-600">
          Briefings are private to your own team — only the recruiters you have put on a position
          can read or hear them.
        </p>
      </div>
    </div>
  );
}
