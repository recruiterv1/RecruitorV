import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, RotateCcw, RotateCw, Loader2, AlertCircle } from 'lucide-react';

// A whole briefing as one clip.
//
// Each briefing used to be a row of players, one per section, so hearing it
// through meant starting five of them in turn. This reads the sections as a
// single recording — one per author, so the client's briefing and the team's
// stay separate, since they are different people saying different things.
//
// /api/tts/speak already chunks long text and concatenates the MP3, so the
// whole briefing can go in one request.
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
];

const SKIP = 10;   // seconds per jump

const clock = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function FullBriefingPlayer({ items = [], onPlay, dark = true }) {
  const [lang, setLang] = useState('en');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [dur, setDur] = useState(0);
  const audioRef = useRef(null);
  const urlRef = useRef('');

  const release = () => {
    if (urlRef.current) { try { URL.revokeObjectURL(urlRef.current); } catch (_) { /* already gone */ } }
    urlRef.current = '';
  };
  useEffect(() => release, []);

  // Sections joined with a pause between them, so it does not run together.
  const script = items
    .filter(i => String(i?.text || '').trim())
    .map(i => `${i.title}. ${i.text}`)
    .join('\n\n');

  const load = async (code, autoplay = true) => {
    if (!script) return;
    setLoading(true); setErr('');
    try {
      const r = await axios.post('/api/tts/speak', { text: script, lang: code }, { responseType: 'blob' });
      release();
      const u = URL.createObjectURL(r.data);
      urlRef.current = u;
      setUrl(u);
      try { onPlay && onPlay(); } catch (_) { /* reporting a listen must never break playback */ }
      if (autoplay) setTimeout(() => { audioRef.current?.play?.().catch(() => {}); }, 60);
    } catch (_) {
      setErr('Audio is unavailable right now. Please try again.');
    } finally { setLoading(false); }
  };

  const toggle = () => {
    if (!url) return load(lang);
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  const jump = (by) => {
    const a = audioRef.current;
    if (!a || !url) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + by), a.duration || 0);
  };

  const scrub = (e) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    a.currentTime = (Number(e.target.value) / 1000) * dur;
  };

  const changeLang = (code) => {
    setLang(code);
    if (url) load(code);            // already listening — swap language in place
  };

  if (!script) return null;

  const shell = dark
    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }
    : { background: '#fff', border: '1px solid #e2e8f0' };
  const fg = dark ? 'rgba(255,255,255,0.92)' : '#0f172a';
  const mut = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', borderRadius: 999,
    background: dark ? 'rgba(255,255,255,0.12)' : '#f1f5f9', color: fg,
  };

  return (
    <div style={{ ...shell, borderRadius: 16, padding: 14 }}>
      <audio
        ref={audioRef}
        src={url || undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={e => setAt(e.target.currentTime || 0)}
        onLoadedMetadata={e => setDur(e.target.duration || 0)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={toggle} disabled={loading} aria-label={playing ? 'Pause' : 'Play'}
          style={{ ...btn, width: 44, height: 44, flexShrink: 0,
            background: dark ? 'var(--orange, #f47b20)' : '#0f172a', color: '#fff' }}>
          {loading ? <Loader2 size={18} className="animate-spin" />
            : playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>

        <button onClick={() => jump(-SKIP)} disabled={!url} aria-label={`Back ${SKIP} seconds`}
          style={{ ...btn, width: 34, height: 34, flexShrink: 0, opacity: url ? 1 : 0.4 }}>
          <RotateCcw size={15} />
        </button>
        <button onClick={() => jump(SKIP)} disabled={!url} aria-label={`Forward ${SKIP} seconds`}
          style={{ ...btn, width: 34, height: 34, flexShrink: 0, opacity: url ? 1 : 0.4 }}>
          <RotateCw size={15} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <input type="range" min={0} max={1000} value={dur ? (at / dur) * 1000 : 0}
            onChange={scrub} disabled={!url} aria-label="Seek"
            style={{ width: '100%', accentColor: '#f47b20', cursor: url ? 'pointer' : 'default' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: mut, marginTop: 2 }}>
            <span>{clock(at)}</span>
            <span>{url ? clock(dur) : `${items.length} section${items.length === 1 ? '' : 's'}`}</span>
          </div>
        </div>

        <select value={lang} onChange={e => changeLang(e.target.value)}
          aria-label="Language"
          style={{ flexShrink: 0, fontSize: 12, padding: '5px 8px', borderRadius: 8,
            background: dark ? 'rgba(255,255,255,0.1)' : '#fff', color: fg,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#e2e8f0'}` }}>
          {LANGS.map(l => <option key={l.code} value={l.code} style={{ color: '#0f172a' }}>{l.label}</option>)}
        </select>
      </div>

      {err && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f87171', marginTop: 8 }}>
          <AlertCircle size={13} /> {err}
        </p>
      )}
    </div>
  );
}
