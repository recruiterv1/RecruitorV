import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashShell from '../components/DashShell';

// Coach / Vendor briefing entry. One natural briefing per position instead of
// the old six separate questions — the five areas are prompts, and coverage is
// detected live from what the author writes.

const WORD_MIN = 150;
const WORD_MAX = 300;

// Same detection the server runs on save, so the live chips and the stored
// coverage agree. Kept in step with BRIEFING_AREAS in Backend/router/briefing.js.
const AREA_MATCH = {
  requirement: ['requirement', 'jd', 'role', 'actually', 'really', 'looking for', 'must have',
    'background', 'profile', 'experience', 'client wants', 'expectation', 'mandate'],
  sourcing: ['source', 'sourcing', 'headhunt', 'head-hunt', 'target', 'competitor', 'company',
    'linkedin', 'naukri', 'referral', 'portal', 'market', 'talent pool', 'poach', 'search'],
  watchouts: ['watch', 'avoid', 'careful', 'difficult', 'challenge', 'risk', 'reject', 'issue',
    'problem', 'budget', 'notice period', 'location', 'constraint', 'red flag', 'do not'],
  assess: ['assess', 'evaluate', 'screen', 'check', 'ask', 'question', 'judge', 'decide',
    'submit', 'shortlist', 'criteria', 'benchmark', 'validate', 'probe'],
  engage: ['engage', 'close', 'pitch', 'sell', 'convince', 'follow up', 'followup', 'interest',
    'offer', 'counter', 'negotiat', 'growth', 'career', 'motivat', 'keep warm'],
};

const detectCoverage = (text) => {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return [];
  return Object.entries(AREA_MATCH)
    .filter(([, terms]) => terms.filter(m => t.includes(m)).length >= 2)
    .map(([key]) => key);
};

const countWords = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

const Snapshot = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
    <p className="text-sm text-neutral-100 mt-0.5">{value || '—'}</p>
  </div>
);

function BriefingEntryInner() {
  const { pos_id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [tip, setTip] = useState('');
  const [open, setOpen] = useState(null);       // expanded prompt card
  const [saving, setSaving] = useState('');     // 'draft' | 'ready'
  const [toast, setToast] = useState('');

  useEffect(() => {
    let live = true;
    axios.get(`/api/briefing/position/${pos_id}`, { withCredentials: true })
      .then(r => {
        if (!live) return;
        setData(r.data);
        setText(r.data?.briefing?.briefingText || '');
        setTip(r.data?.briefing?.winningTip || '');
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load this briefing.'))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [pos_id]);

  const coverage = useMemo(() => detectCoverage(`${text} ${tip}`), [text, tip]);
  const words = countWords(text);
  const areas = data?.areas || [];

  const save = useCallback(async (status) => {
    setSaving(status);
    setToast('');
    try {
      const r = await axios.post(`/api/briefing/position/${pos_id}`,
        { briefingText: text, winningTip: tip, status }, { withCredentials: true });
      setToast(r.data?.message || 'Saved');
      if (status === 'ready') setTimeout(() => navigate('/my-briefings'), 1200);
    } catch (e) {
      setToast(e.response?.data?.message || 'Could not save.');
    } finally {
      setSaving('');
      setTimeout(() => setToast(''), 4000);
    }
  }, [pos_id, text, tip, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate('/my-briefings')}
          className="text-sm text-neutral-300 border border-neutral-700 rounded-lg px-4 py-2 hover:bg-neutral-900">
          Back to my briefings
        </button>
      </div>
    );
  }

  const p = data.position;
  const prog = data.progress || { ready: 0, total: 0, draft: 0, pending: 0 };
  const pct = prog.total ? Math.round((prog.ready / prog.total) * 100) : 0;
  const status = data.briefing?.status === 'ready' ? 'ready' : (data.briefing ? 'draft' : 'pending');
  const statusPill = {
    pending: { dot: '🔴', label: 'Briefing Status: Pending', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
    draft: { dot: '🟡', label: 'Briefing Status: Draft', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    ready: { dot: '🟢', label: 'Briefing Status: Ready', cls: 'bg-green-500/10 text-green-300 border-green-500/30' },
  }[status];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* Progress strip */}
      <div className="sticky top-16 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-5 py-2.5 flex items-center gap-4 flex-wrap text-[11px]">
          <span className="uppercase tracking-wider text-neutral-500">Your briefing progress</span>
          <div className="flex-1 min-w-[120px] h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-amber-400 font-semibold">{prog.ready}/{prog.total} — {pct}%</span>
          <span className="text-neutral-500">{prog.pending} Pending · {prog.draft} Draft · {prog.ready} Ready</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎙️</span>
            {data.author?.type === 'vendor' ? 'Vendor Briefing' : 'Coach Briefing'}
          </h1>
          <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border ${statusPill.cls}`}>
            {statusPill.dot} {statusPill.label}
          </span>
        </div>
        <p className="mt-2 text-sm">
          <span className="text-neutral-500">Position </span>
          <span className="text-neutral-100">{p.position}</span>
          <span className="text-neutral-500 ml-4">Client </span>
          <span className="text-neutral-100">{p.client}</span>
          <span className="text-neutral-500 ml-4">ID </span>
          <span className="text-amber-400">#{p.pos_id}</span>
        </p>
        <p className="mt-3 text-sm text-neutral-400 max-w-xl">
          Help your recruiters understand how to win this position — beyond what is already
          written in the JD.
        </p>

        {/* Position snapshot */}
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">Position snapshot</p>
            <button onClick={() => navigate(`/dash_view/${p.pos_id}`)}
              className="text-[11px] text-neutral-300 border border-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-800">
              View Full JD ↗
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
            <Snapshot label="Position" value={p.position} />
            <Snapshot label="Client" value={p.client} />
            <Snapshot label="Location" value={p.location} />
            <Snapshot label="Experience" value={p.experience} />
            <Snapshot label="Function" value={p.skill_category || p.pos_cat} />
            <Snapshot label="Openings" value={p.openings} />
          </div>
        </div>

        {/* Prompts */}
        <h2 className="mt-8 text-lg font-bold text-white">Before you brief your team</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Think about these {areas.length} areas. You don't need to answer each one separately —
          use them as prompts to structure your thoughts.
        </p>

        <div className="mt-4 rounded-2xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800">
          {areas.map(a => {
            const covered = coverage.includes(a.key);
            const isOpen = open === a.key;
            return (
              <div key={a.key} className="bg-neutral-900/40">
                <button type="button" onClick={() => setOpen(isOpen ? null : a.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-900">
                  <span className="text-lg flex-shrink-0">{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[11px] text-neutral-600 mr-2">{a.n}</span>
                    <span className="text-sm font-semibold text-neutral-100">{a.title}</span>
                    <span className="block text-xs text-neutral-500 mt-0.5">{a.prompt}</span>
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                    covered ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'}`}>
                    {covered ? '✓ Covered' : 'Not covered'}
                  </span>
                  <span className="text-neutral-600 text-xs">{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-14 text-xs text-neutral-400 leading-relaxed">
                    {a.prompt} Mention it anywhere in your briefing below — this area marks itself
                    covered once you have written about it.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Winning tip */}
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2">
            <span>⭐</span>
            <span className="text-sm font-semibold text-amber-300">Your Winning Tip</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 border border-neutral-700 rounded px-1.5 py-0.5">Optional</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            If you were personally recruiting this position, what is the ONE thing you would do differently?
          </p>
          <textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            rows={2}
            placeholder="Share the practical insight that comes from your experience."
            className="mt-3 w-full bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-amber-500/50 outline-none resize-y"
          />
        </div>

        {/* Coverage */}
        <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-neutral-200">Briefing Coverage</span>
            <span className="text-sm font-bold text-amber-400">{coverage.length}/{areas.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {areas.map(a => {
              const covered = coverage.includes(a.key);
              return (
                <span key={a.key} className={`text-[11px] px-2.5 py-1 rounded-full border ${
                  covered ? 'bg-green-500/10 text-green-300 border-green-500/30'
                          : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                  {covered ? '●' : '○'} {a.title}
                </span>
              );
            })}
          </div>
        </div>

        {/* The briefing itself */}
        <h2 className="mt-8 text-lg font-bold text-white flex items-center gap-2">
          <span>🎙️</span> Brief Your Team
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          You don't need to answer each question separately. Just share your thoughts naturally.
          <span className="text-amber-400"> RecruiterV will automatically convert your briefing into a voice briefing.</span>
        </p>
        <p className="text-xs text-neutral-600 mt-1">
          Recommended: {WORD_MIN}–{WORD_MAX} words · Approx. 1–2 minutes
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Start with what makes this position important or difficult. Then share where to find the right candidates, what to check during the assessment call, what to avoid, and any tips that will help recruiters close the position."
          className="mt-3 w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 text-sm text-neutral-200 placeholder-neutral-600 leading-relaxed focus:border-amber-500/50 outline-none resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${
            words === 0 ? 'text-neutral-600'
              : words < WORD_MIN ? 'text-amber-400'
              : words > WORD_MAX ? 'text-amber-400' : 'text-green-400'}`}>
            {words} / {WORD_MAX} words
          </span>
          {words > 0 && words < 30 && (
            <span className="text-xs text-neutral-500">At least 30 words to create the voice briefing</span>
          )}
        </div>
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-0 z-10 bg-neutral-950/95 backdrop-blur border-t border-neutral-800">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-600">Briefing coverage</p>
            <p className="text-sm font-bold text-amber-400">{coverage.length}/{areas.length}</p>
          </div>
          {toast && <span className="text-xs text-neutral-300 flex-1 text-center">{toast}</span>}
          <div className="flex items-center gap-2">
            <button onClick={() => save('draft')} disabled={!!saving}
              className="px-4 py-2.5 text-sm font-semibold text-neutral-200 border border-neutral-700 rounded-xl hover:bg-neutral-900 disabled:opacity-50">
              {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
            </button>
            <button onClick={() => save('ready')} disabled={!!saving || words < 30}
              className="px-5 py-2.5 text-sm font-bold text-neutral-900 bg-amber-500 hover:bg-amber-400 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
              {saving === 'ready' ? 'Creating…' : 'Create Voice Briefing 🎙️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BriefingEntry() {
  return (
    <DashShell>
      <BriefingEntryInner />
    </DashShell>
  );
}
