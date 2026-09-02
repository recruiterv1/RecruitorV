import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, AlertCircle } from 'lucide-react';

// One briefing item as an audio player. The text is never shown — pressing play
// fetches a real MP3 and hands it to a native <audio controls>, so the listener
// gets play/pause, a seek bar and as many repeats as they want.
//
// Every language, English included, is served as MP3 by /api/tts/speak.
// Browser speech synthesis is deliberately not used here: it cannot be seeked
// or reliably replayed, which is the whole point of this control.

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

export default function BriefingPlayer({ item, onPlay, dark = true }) {
  const [lang, setLang] = useState('en');
  const [url, setUrl] = useState('');       // object URL for the loaded MP3
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const audioRef = useRef(null);
  const urlRef = useRef('');

  // Release the object URL when it is replaced or the component goes away.
  const release = () => {
    if (urlRef.current) { try { URL.revokeObjectURL(urlRef.current); } catch (_) { /* already gone */ } }
    urlRef.current = '';
  };
  useEffect(() => release, []);

  const load = async (code) => {
    setLoading(true); setErr('');
    try {
      const r = await axios.post('/api/tts/speak',
        { text: `${item.title}. ${item.text}`, lang: code },
        { responseType: 'blob' });
      release();
      const u = URL.createObjectURL(r.data);
      urlRef.current = u;
      setUrl(u);
      try { onPlay && onPlay(); } catch (_) { /* reporting a listen must never break playback */ }
      // Wait for the element to pick up the new src before playing.
      setTimeout(() => { audioRef.current?.play?.().catch(() => {}); }, 60);
    } catch (_) {
      setErr('Audio is unavailable right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeLang = (code) => {
    setLang(code);
    if (url) load(code);            // already listening — switch language in place
  };

  const chip = dark
    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }
    : { background: '#fff', border: '1px solid #e2e8f0' };
  const titleColor = dark ? 'rgba(255,255,255,0.92)' : '#0f172a';
  const subColor = dark ? 'rgba(255,255,255,0.45)' : '#64748b';

  return (
    <div className="rounded-2xl p-3" style={chip}>
      <div className="flex items-start gap-2">
        <span style={{ fontSize: 15, lineHeight: '18px', flexShrink: 0 }}>{item.icon}</span>
        <span className="text-[12.5px] font-semibold leading-snug flex-1 min-w-0" style={{ color: titleColor }}>
          {item.title}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        {!url && (
          <button
            type="button"
            onClick={() => load(lang)}
            disabled={loading}
            title={`Play: ${item.title}`}
            aria-label={`Play: ${item.title}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-60"
            style={{ background: '#f47b20', color: '#fff' }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {loading ? 'Loading…' : 'Play'}
          </button>
        )}

        <select
          value={lang}
          onChange={(e) => changeLang(e.target.value)}
          aria-label="Audio language"
          className="text-[11px] rounded-lg px-2 py-1.5 outline-none flex-1 min-w-0"
          style={dark
            ? { background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
            : { background: '#fff', color: '#334155', border: '1px solid #e2e8f0' }}
        >
          {LANGS.map(l => <option key={l.code} value={l.code} style={{ color: '#0f172a' }}>{l.label}</option>)}
        </select>
      </div>

      {/* Native controls: play/pause, seek, and replay as often as needed. */}
      {url && (
        <audio
          ref={audioRef}
          src={url}
          controls
          preload="auto"
          className="w-full mt-2.5"
          style={{ height: 36 }}
        />
      )}

      {err && (
        <p className="flex items-center gap-1.5 text-[11px] mt-2" style={{ color: '#fca5a5' }}>
          <AlertCircle size={12} /> {err}
        </p>
      )}
      {loading && !url && (
        <p className="text-[11px] mt-2" style={{ color: subColor }}>Preparing the audio…</p>
      )}
    </div>
  );
}
