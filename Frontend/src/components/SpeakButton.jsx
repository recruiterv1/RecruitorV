import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Volume2, Loader2, Square, ChevronDown } from 'lucide-react';

// Languages offered for the on-page audio. `code` is the translate + speech BCP-47
// base; `voice` is the BCP-47 tag we try to match against installed TTS voices.
const LANGS = [
  { code: 'en', voice: 'en-IN', label: 'English' },
  { code: 'hi', voice: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'bn', voice: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'ta', voice: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te', voice: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'mr', voice: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'gu', voice: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', voice: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', voice: 'ml-IN', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', voice: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ur', voice: 'ur-IN', label: 'اردو (Urdu)' },
];

// Languages for which the backend returns clear synthesized MP3 audio. These are
// played directly (device voice not needed), so they sound the same everywhere.
// English uses the browser's own voice (instant, always available).
const SERVER_TTS = new Set(['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur']);

// Pick the best installed voice for a BCP-47 tag: exact match first, then the
// same language prefix (e.g. 'hi' matches 'hi-IN' or 'hi').
const pickVoice = (voices, tag) => {
  if (!voices.length) return null;
  const t = tag.toLowerCase();
  const prefix = t.split('-')[0];
  return voices.find(v => v.lang?.toLowerCase() === t)
    || voices.find(v => v.lang?.toLowerCase().startsWith(prefix + '-'))
    || voices.find(v => v.lang?.toLowerCase() === prefix)
    || null;
};

/**
 * A speaker button that reads `text` aloud via the browser's free Web Speech API,
 * with a language dropdown (English/Hindi + other Indian languages). Non-English
 * choices are translated first via /api/tts/translate.
 *
 * Props: text (string), title (tooltip/aria label), compact (smaller icon-only),
 *        className (extra classes on the button).
 */
export default function SpeakButton({ text, title = 'Play audio', compact = false, className = '' }) {
  const [lang, setLang] = useState('en');
  const [busy, setBusy] = useState(false);      // translating
  const [speaking, setSpeaking] = useState(false);
  const [open, setOpen] = useState(false);       // language menu
  const [voices, setVoices] = useState([]);
  const [err, setErr] = useState('');
  const menuRef = useRef(null);
  const audioRef = useRef(null);      // HTMLAudioElement for server MP3 playback
  const audioUrlRef = useRef(null);   // object URL to revoke on stop
  const [menuPos, setMenuPos] = useState(null);   // fixed-position coords for the dropdown

  // Open the menu with fixed coords derived from the trigger, so no sibling card
  // or ancestor overflow can clip/cover it. Flips above the button near the
  // viewport bottom.
  const openMenu = () => {
    const el = menuRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const menuH = 280, menuW = 208;
      const below = r.bottom + 6;
      const top = (window.innerHeight - r.bottom < menuH) ? Math.max(8, r.top - menuH - 6) : below;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - menuW - 8);
      setMenuPos({ top, left });
    }
    setOpen(true);
  };

  // Load (and keep in sync) the list of installed TTS voices.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { try { window.speechSynthesis.onvoiceschanged = null; } catch (_) {} };
  }, []);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Stop speech if the component unmounts.
  useEffect(() => () => stop(), []);

  const stopAudio = () => {
    try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } } catch (_) {}
    try { if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; } } catch (_) {}
  };
  const stop = () => { try { window.speechSynthesis?.cancel(); } catch (_) {} stopAudio(); setSpeaking(false); };

  // Speak with the browser's built-in voice (English, or fallback for others).
  const speakWithBrowser = async (chosen, meta) => {
    if (!window.speechSynthesis) { setErr('Audio not supported in this browser.'); return; }
    let toSpeak = (text || '').toString().trim();
    if (chosen !== 'en') {
      try { setBusy(true); const r = await axios.post('/api/tts/translate', { text: toSpeak, target: chosen }); toSpeak = r.data?.translated || toSpeak; }
      catch (_) {} finally { setBusy(false); }
    }
    const u = new SpeechSynthesisUtterance(toSpeak);
    u.lang = meta.voice;
    const v = pickVoice(voices, meta.voice);
    if (v) u.voice = v;
    else if (chosen !== 'en') setErr(`No ${meta.label.replace(/\s*\(.*\)/, '')} voice on this device — playing with the default voice.`);
    u.rate = 0.98; u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const speak = async (chosen) => {
    setErr('');
    const raw = (text || '').toString().trim();
    if (!raw) { setErr('No text to play.'); return; }

    // Toggle off if the same language is already playing.
    const wasSpeaking = speaking && chosen === lang;
    stop();
    if (wasSpeaking) return;

    const meta = LANGS.find(l => l.code === chosen) || LANGS[0];

    // Indian languages → clear server MP3 (no dependence on device voices).
    if (SERVER_TTS.has(chosen)) {
      try {
        setBusy(true);
        const r = await axios.post('/api/tts/speak', { text: raw, lang: chosen }, { responseType: 'blob' });
        const url = URL.createObjectURL(r.data);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setSpeaking(false); stopAudio(); };
        audio.onerror = () => { setSpeaking(false); stopAudio(); };
        setSpeaking(true);
        await audio.play();
        return;
      } catch (_) {
        // Server audio failed — fall back to the browser voice.
        stopAudio();
        return speakWithBrowser(chosen, meta);
      } finally { setBusy(false); }
    }

    // English (and anything else) → browser voice.
    return speakWithBrowser(chosen, meta);
  };

  const onMainClick = () => { if (speaking) stop(); else speak(lang); };
  const chooseLang = (code) => { setLang(code); setOpen(false); speak(code); };

  const iconSize = compact ? 14 : 16;

  return (
    <span ref={menuRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={onMainClick}
        title={title}
        aria-label={title}
        className={`inline-flex items-center justify-center rounded-full transition-colors ${compact ? 'w-7 h-7' : 'w-8 h-8'} ${speaking ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
      >
        {busy ? <Loader2 size={iconSize} className="animate-spin" /> : speaking ? <Square size={iconSize} /> : <Volume2 size={iconSize} />}
      </button>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title="Choose language"
        aria-label="Choose language"
        className="inline-flex items-center text-gray-500 hover:text-gray-800 -ml-0.5"
      >
        <ChevronDown size={compact ? 12 : 14} />
      </button>

      {open && menuPos && (
        <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 208 }}
          className="max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          {LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => chooseLang(l.code)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 ${l.code === lang ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-gray-700'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {err && <span className="absolute top-full mt-1 left-0 whitespace-nowrap text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 z-40">{err}</span>}
    </span>
  );
}
