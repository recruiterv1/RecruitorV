import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Mic, RefreshCw, Search, X } from 'lucide-react';
import SpeakButton from '../components/SpeakButton';

// SuperAdmin → Briefings. Five views over who has briefed what, and who has
// listened. A light is green when the thing exists, red when it does not.

// One glowing dot. Green = done, red = outstanding.
const Light = ({ on, title, onClick }) => {
  const dot = (
    <span style={{
      width: 9, height: 9, borderRadius: '50%',
      background: on ? '#22c55e' : '#ef4444',
      boxShadow: `0 0 5px 1.5px ${on ? '#22c55e' : '#ef4444'}99`,
      animation: 'briefPulse 1.6s ease-in-out infinite',
    }} />
  );
  // Answered items open; unanswered ones have nothing to show.
  if (on && onClick) {
    return (
      <button type="button" onClick={onClick} title={title}
        className="inline-flex items-center justify-center rounded-full hover:ring-2 hover:ring-green-300 transition"
        style={{ width: 14, height: 14 }}>
        {dot}
      </button>
    );
  }
  return (
    <span title={title} className="inline-flex items-center justify-center" style={{ width: 14, height: 14 }}>
      {dot}
    </span>
  );
};

// Read and play what was actually submitted.
const BriefingReader = ({ open, onClose }) => {
  if (!open) return null;
  const { heading, sub, items, focus } = open;
  const answered = (items || []).filter(i => i.on);
  const all = answered.map(i => `${i.title}. ${i.text}`).join('. ');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{heading}</h3>
            {sub && <p className="text-white/80 text-xs mt-0.5">{sub}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {all && <SpeakButton text={all} title="Play the whole briefing" tone="green" />}
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {!answered.length ? (
            <p className="text-sm text-gray-500 py-8 text-center">Nothing has been submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {answered.map(i => (
                <div key={i.key}
                  className={`rounded-xl border p-4 ${i.key === focus ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-gray-900">{i.title}</p>
                    <SpeakButton text={`${i.title}. ${i.text}`} title={`Play: ${i.title}`} tone="green" compact />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-2">{i.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Lights = ({ lights = [], empty = 'Not started', onOpen }) => {
  if (!lights.length) return <span className="text-[11px] text-gray-400">{empty}</span>;
  const done = lights.filter(l => l.on).length;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1">
        {lights.map(l => (
          <Light key={l.key} on={l.on}
            title={`${l.title} — ${l.on ? 'submitted, click to read and play' : 'not submitted'}`}
            onClick={onOpen ? () => onOpen(l.key) : undefined} />
        ))}
      </span>
      <span className={`text-[11px] font-semibold ${done === lights.length ? 'text-green-600' : 'text-gray-400'}`}>
        {done}/{lights.length}
      </span>
    </span>
  );
};

const Pulse = () => (
  <style>{`@keyframes briefPulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
);

const Shell = ({ title, sub, onRefresh, children }) => (
  <div className="p-4 sm:p-6">
    <Pulse />
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mic size={20} /> {title}</h2>
        <p className="text-white/80 text-sm mt-1">{sub}</p>
      </div>
      <button onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium">
        <RefreshCw size={16} /> Refresh
      </button>
    </div>
    {children}
  </div>
);

const useFeed = (url) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = () => {
    setData(null); setError('');
    axios.get(url, { withCredentials: true })
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load.'));
  };
  useEffect(() => { load(); }, [url]);   // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, load };
};

const Select = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="h-9 border-2 border-gray-200 rounded-lg px-2 text-xs bg-white focus:border-blue-500 outline-none max-w-[190px]">
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ── 1. Positions ─────────────────────────────────────────────────────────────
export const BriefingPositions = () => {
  const { data, error, load } = useFeed('/api/briefing-admin/positions');
  const [reader, setReader] = useState(null);
  const [q, setQ] = useState('');
  const [client, setClient] = useState('');
  const [cat, setCat] = useState('');
  const [state, setState] = useState('');

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    const n = q.trim().toLowerCase();
    return data.rows.filter(r => {
      if (client && r.client !== client) return false;
      if (cat && r.skill_category !== cat) return false;
      if (state === 'complete' && !(r.coach.done && r.clientspoc.done && r.vendor.done)) return false;
      if (state === 'none' && (r.coach.done || r.clientspoc.done || r.vendor.done)) return false;
      if (!n) return true;
      return r.position.toLowerCase().includes(n) || r.client.toLowerCase().includes(n) || String(r.pos_id).includes(n);
    });
  }, [data, q, client, cat, state]);

  return (
    <Shell title="Briefings — Positions" onRefresh={load}
      sub="One light per briefing item, for the coach, the ClientSPOC and the vendor.">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search position, client or ID"
            className="w-full h-9 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none" />
        </div>
        <Select value={client} onChange={setClient} options={data?.filters?.clients || []} placeholder="All clients" />
        <Select value={cat} onChange={setCat} options={data?.filters?.categories || []} placeholder="All categories" />
        <Select value={state} onChange={setState} options={['complete', 'none']} placeholder="Any state" />
      </div>

      <BriefingReader open={reader} onClose={() => setReader(null)} />

      {error ? <p className="py-16 text-center text-red-500 text-sm">{error}</p>
        : !data ? <p className="py-16 text-center text-gray-400 text-sm">Loading…</p>
        : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Coach briefing</th>
                  <th className="px-4 py-3 font-semibold">ClientSPOC briefing</th>
                  <th className="px-4 py-3 font-semibold">Vendor briefing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!rows.length ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-400">No positions match these filters.</td></tr>
                ) : rows.map(r => (
                  <tr key={r.pos_id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.position || '—'}</p>
                      <p className="text-xs text-gray-400">#{r.pos_id}{r.skill_category ? ` · ${r.skill_category}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.client || '—'}</td>
                    {['coach', 'clientspoc', 'vendor'].map(k => (
                      <td key={k} className="px-4 py-3">
                        <Lights lights={r[k].lights} empty="No briefing"
                          onOpen={(focus) => setReader({
                            heading: `${k === 'clientspoc' ? 'ClientSPOC' : k === 'vendor' ? 'Vendor' : 'Coach'} briefing`,
                            sub: `${r.position} (#${r.pos_id})${r[k].author ? ` · ${r[k].author}` : ''}`,
                            items: r[k].lights, focus,
                          })} />
                        {r[k].author && <p className="text-[11px] text-gray-400 mt-0.5">{r[k].author}</p>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
};

// ── 2. Recruiters ────────────────────────────────────────────────────────────
export const BriefingRecruiters = () => {
  const { data, error, load } = useFeed('/api/briefing-admin/recruiters');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    const n = q.trim().toLowerCase();
    return data.rows.filter(r => {
      if (source && r.source !== source) return false;
      if (!n) return true;
      return r.recruiter.toLowerCase().includes(n) || r.email.toLowerCase().includes(n);
    });
  }, [data, q, source]);

  return (
    <Shell title="Briefings — Recruiters" onRefresh={load}
      sub="Whether each recruiter has listened, with a separate row per briefing source.">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search recruiter"
            className="w-full h-9 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none" />
        </div>
        <Select value={source} onChange={setSource} options={data?.sources || []} placeholder="All sources" />
      </div>

      {error ? <p className="py-16 text-center text-red-500 text-sm">{error}</p>
        : !data ? <p className="py-16 text-center text-gray-400 text-sm">Loading…</p>
        : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Recruiter</th>
                  <th className="px-4 py-3 font-semibold">Briefing source</th>
                  <th className="px-4 py-3 font-semibold">Listened</th>
                  <th className="px-4 py-3 font-semibold">Per briefing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!rows.length ? (
                  <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400">
                    No recruiter has a published briefing on a position they hold yet.
                  </td></tr>
                ) : rows.map((r, i) => (
                  <tr key={`${r.email}-${r.sourceKey}-${i}`} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.recruiter}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        r.listened === r.briefings ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.listened}/{r.briefings}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* One line per position, so it is clear which briefing was
                          heard rather than just a row of anonymous dots. */}
                      <div className="space-y-1">
                        {(r.positions || []).map(p => (
                          <div key={p.key} className="flex items-center gap-2">
                            <Light on={p.heard}
                              title={p.heard ? 'Listened' : 'Not listened yet'} />
                            <span className="text-xs text-gray-700 truncate max-w-[220px]">
                              {p.position || `Position #${p.pos_id}`}
                            </span>
                            <span className="text-[11px] text-gray-400 whitespace-nowrap">
                              #{p.pos_id} · {p.items} item{p.items === 1 ? '' : 's'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
};

// ── 3 & 4. Coaches / ClientSPOCs ─────────────────────────────────────────────
const AuthorView = ({ url, title, sub }) => {
  const { data, error, load } = useFeed(url);
  const [reader, setReader] = useState(null);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    const n = q.trim().toLowerCase();
    return data.rows.filter(r => {
      if (author && r.author !== author) return false;
      if (!n) return true;
      return r.author.toLowerCase().includes(n) || r.position.toLowerCase().includes(n) || String(r.pos_id).includes(n);
    });
  }, [data, q, author]);

  return (
    <Shell title={title} sub={sub} onRefresh={load}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or position"
            className="w-full h-9 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none" />
        </div>
        <Select value={author} onChange={setAuthor} options={data?.filters?.authors || []} placeholder="Everyone" />
      </div>

      <BriefingReader open={reader} onClose={() => setReader(null)} />

      {error ? <p className="py-16 text-center text-red-500 text-sm">{error}</p>
        : !data ? <p className="py-16 text-center text-gray-400 text-sm">Loading…</p>
        : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Answers</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!rows.length ? (
                  <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400">Nothing here yet.</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={`${r.email}-${r.pos_id}-${i}`} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{r.author}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{r.position || '—'}</p>
                      <p className="text-xs text-gray-400">#{r.pos_id}{r.client ? ` · ${r.client}` : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Lights lights={r.lights}
                        onOpen={(focus) => setReader({
                          heading: `${r.author}'s briefing`,
                          sub: `${r.position || 'Position'} (#${r.pos_id})${r.client ? ` · ${r.client}` : ''}`,
                          items: r.lights, focus,
                        })} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        r.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status === 'ready' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
};

export const BriefingCoaches = () => (
  <AuthorView url="/api/briefing-admin/coaches" title="Briefings — Coaches"
    sub="A light per question, green once that coach has answered it." />
);
export const BriefingClientSpocs = () => (
  <AuthorView url="/api/briefing-admin/clientspocs" title="Briefings — ClientSPOCs"
    sub="A light per question, green once that ClientSPOC has answered it." />
);

// ── 5. Companies ─────────────────────────────────────────────────────────────
export const BriefingCompanies = () => {
  const { data, error, load } = useFeed('/api/briefing-admin/companies');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    const n = q.trim().toLowerCase();
    return n ? data.rows.filter(r => r.company.toLowerCase().includes(n)) : data.rows;
  }, [data, q]);

  return (
    <Shell title="Briefings — Companies" onRefresh={load}
      sub={data?.summary
        ? `${data.summary.withAudio} of ${data.summary.total} companies have an audio note.`
        : 'Whether each company profile carries an audio note.'}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search company"
            className="w-full h-9 border-2 border-gray-200 rounded-lg pl-9 pr-3 text-xs focus:border-blue-500 outline-none" />
        </div>
      </div>

      {error ? <p className="py-16 text-center text-red-500 text-sm">{error}</p>
        : !data ? <p className="py-16 text-center text-gray-400 text-sm">Loading…</p>
        : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Audio note</th>
                <th className="px-4 py-3 font-semibold">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!rows.length ? (
                <tr><td colSpan={3} className="px-4 py-16 text-center text-gray-400">No companies match.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.company || '—'}</td>
                  <td className="px-4 py-3">
                    <Light on={r.hasAudio} title={r.hasAudio ? 'Audio note added' : 'No audio note'} />
                  </td>
                  <td className="px-4 py-3">
                    {r.hasAudio ? (
                      <div className="flex items-start gap-2">
                        <SpeakButton text={r.audioText || r.preview} title={`Play ${r.company}'s audio note`} tone="green" compact />
                        <span className="text-xs text-gray-500">{r.preview}{r.length > 140 ? '…' : ''}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
};
