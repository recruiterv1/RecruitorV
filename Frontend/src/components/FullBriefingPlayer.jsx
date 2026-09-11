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
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const audioRef = useRef(null);
  const urlRef = useRef('');
  const barRef = useRef(null);

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

  // A YouTube-style bar: a thin track that thickens on hover, with a thumb that
  // only appears then. An <input type="range"> cannot be styled to that without
  // per-browser pseudo-elements, so the track is a div and the position comes
  // from where the pointer is along it.
  const seekTo = (clientX) => {
    const a = audioRef.current;
    const el = barRef.current;
    if (!a || !el || !dur) return;
    const { left, width } = el.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - left) / width, 0), 1);
    a.currentTime = pct * dur;
    setAt(pct * dur);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => seekTo(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, dur]);

  const changeLang = (code) => {
    setLang(code);
    if (url) load(code);            // already listening — swap language in place
  };

  if (!script) return null;

  const pct = dur ? Math.min(100, (at / dur) * 100) : 0;

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
    // overflow hidden + minWidth 0 throughout: at half width the seek bar was
    // escaping the card and the two time labels were landing on top of each other.
    <div style={{ ...shell, borderRadius: 16, padding: 12, minWidth: 0, overflow: 'hidden' }}>
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

      {/* Controls on one line, the seek bar on its own below it — a single row
          cannot hold all of this at half width without crushing something. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <button onClick={toggle} disabled={loading} aria-label={playing ? 'Pause' : 'Play'}
          style={{ ...btn, width: 40, height: 40, flexShrink: 0,
            background: 'var(--orange, #f47b20)', color: '#fff' }}>
          {loading ? <Loader2 size={17} className="animate-spin" />
            : playing ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 2 }} />}
        </button>

        <button onClick={() => jump(-SKIP)} disabled={!url} aria-label={`Back ${SKIP} seconds`}
          style={{ ...btn, width: 30, height: 30, flexShrink: 0, opacity: url ? 1 : 0.35 }}>
          <RotateCcw size={14} />
        </button>
        <button onClick={() => jump(SKIP)} disabled={!url} aria-label={`Forward ${SKIP} seconds`}
          style={{ ...btn, width: 30, height: 30, flexShrink: 0, opacity: url ? 1 : 0.35 }}>
          <RotateCw size={14} />
        </button>

        {/* Elapsed / total, or how many sections are queued before first play. */}
        <span style={{ fontSize: 11.5, color: mut, whiteSpace: 'nowrap', flexShrink: 0,
          fontVariantNumeric: 'tabular-nums' }}>
          {url ? `${clock(at)} / ${clock(dur)}` : `${items.length} section${items.length === 1 ? '' : 's'}`}
        </span>

        <select value={lang} onChange={e => changeLang(e.target.value)} aria-label="Language"
          style={{ marginLeft: 'auto', flexShrink: 0, maxWidth: 104, fontSize: 11.5,
            padding: '4px 6px', borderRadius: 8,
            background: dark ? 'rgba(255,255,255,0.1)' : '#fff', color: fg,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#e2e8f0'}` }}>
          {LANGS.map(l => <option key={l.code} value={l.code} style={{ color: '#0f172a' }}>{l.label}</option>)}
        </select>
      </div>

      {/* The bar. Padding above and below gives a comfortable hit area while the
          visible track stays thin. */}
      <div
        ref={barRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseDown={(e) => { if (url) { setDragging(true); seekTo(e.clientX); } }}
        onTouchStart={(e) => { if (url) { setDragging(true); seekTo(e.touches[0].clientX); } }}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(at)}
        tabIndex={url ? 0 : -1}
        onKeyDown={(e) => {
          if (!url) return;
          if (e.key === 'ArrowLeft') { jump(-5); e.preventDefault(); }
          if (e.key === 'ArrowRight') { jump(5); e.preventDefault(); }
        }}
        style={{ marginTop: 10, padding: '7px 0', cursor: url ? 'pointer' : 'default',
          touchAction: 'none', opacity: url ? 1 : 0.45 }}>
        <div style={{ position: 'relative', height: hover || dragging ? 5 : 3,
          borderRadius: 99, background: dark ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
          transition: 'height .12s ease' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${pct}%`,
            background: 'var(--orange, #f47b20)', borderRadius: 99 }} />
          {/* The thumb shows only while hovering or dragging, as YouTube's does. */}
          <div style={{ position: 'absolute', top: '50%', left: `${pct}%`,
            width: 13, height: 13, marginLeft: -6.5, borderRadius: '50%',
            background: 'var(--orange, #f47b20)',
            transform: `translateY(-50%) scale(${hover || dragging ? 1 : 0})`,
            transition: 'transform .12s ease', pointerEvents: 'none' }} />
        </div>
      </div>

      {err && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#f87171', marginTop: 8 }}>
          <AlertCircle size={12} /> {err}
        </p>
      )}
    </div>
  );
}
