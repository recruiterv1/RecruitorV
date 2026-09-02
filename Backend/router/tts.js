// ─────────────────────────────────────────────────────────────────────────────
// Text translation proxy for the on-page audio (speaker) feature.
//
// The frontend speaks text with the browser's free Web Speech API. To play the
// same text in Hindi or another Indian language, we translate it first. This
// route proxies Google's free (unofficial, no-key) translate endpoint so the
// browser isn't blocked by CORS, and caches results in memory to cut calls.
//
// POST /api/tts/translate  { text, target }  →  { translated, target }
//   target: 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'ur' | 'or' | 'en'
// English ('en') is a no-op passthrough.
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();

const SUPPORTED = new Set(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur', 'or']);

// Small LRU-ish cache: key = `${target}:${text}`. Bounded so it can't grow forever.
const cache = new Map();
const CACHE_MAX = 500;
const cacheGet = (k) => cache.get(k);
const cacheSet = (k, v) => { cache.set(k, v); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); };

async function googleTranslate(text, target) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`translate ${resp.status}`);
  const data = await resp.json();
  // Response shape: [[["translated chunk","source chunk",...], ...], ...]
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('bad translate response');
  return data[0].map(seg => (Array.isArray(seg) ? seg[0] : '')).join('');
}

// Languages Google's free TTS can actually voice clearly (verified). Odia ('or')
// is intentionally absent — Google TTS returns 400 for it, so there's no free
// clear voice; the frontend keeps it out of the menu.
// 'en' is included so the briefing player can serve a real MP3 for every
// language. The browser's own speech synthesis cannot be seeked, paused
// reliably or replayed, which a player with controls needs.
const TTS_LANGS = new Set(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur']);

// Split text into ≤180-char chunks on word boundaries (Google TTS caps ~200/req).
const chunkText = (text) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let buf = '';
  for (const w of words) {
    if ((buf + ' ' + w).trim().length > 180) { if (buf) chunks.push(buf.trim()); buf = w; }
    else buf = (buf + ' ' + w).trim();
  }
  if (buf) chunks.push(buf.trim());
  return chunks.length ? chunks : [text];
};

const fetchTtsChunk = async (chunk, lang, idx, total) => {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}`
    + `&client=tw-ob&idx=${idx}&total=${total}&textlen=${chunk.length}&q=${encodeURIComponent(chunk)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://translate.google.com/' } });
  if (!r.ok) throw new Error(`tts ${r.status}`);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('audio')) throw new Error('tts non-audio response');
  return Buffer.from(await r.arrayBuffer());
};

// POST /api/tts/speak  { text, lang }  →  audio/mpeg (MP3)
// Translates the text into `lang` (unless it's already there) and returns clear
// synthesized speech as MP3 — including English, so a player with real
// controls can be used for every language.
router.post('/speak', async (req, res) => {
  try {
    const raw = String(req.body?.text || '').trim();
    const lang = String(req.body?.lang || '').toLowerCase();
    if (!raw) return res.status(400).json({ message: 'text required' });
    if (!TTS_LANGS.has(lang)) return res.status(415).json({ message: 'language not supported for server audio' });

    // Translate to the target language first (cached), then synthesize.
    let text = raw;
    try {
      if (lang === 'en') throw new Error('source is already english');   // no translation needed
      const key = `${lang}:${raw}`;
      const hit = cacheGet(key);
      if (hit !== undefined) text = hit;
      else if (raw.length <= 1800) { text = await googleTranslate(raw, lang); cacheSet(key, text); }
      else {
        const parts = raw.match(/[^.!?]+[.!?]*/g) || [raw];
        let buf = '', chunks = [], out = '';
        for (const p of parts) { if ((buf + p).length > 1800) { chunks.push(buf); buf = p; } else buf += p; }
        if (buf) chunks.push(buf);
        for (const c of chunks) out += await googleTranslate(c, lang);
        text = out; cacheSet(key, text);
      }
    } catch (_) { text = raw; }

    const chunks = chunkText(text);
    const buffers = [];
    for (let i = 0; i < chunks.length; i++) buffers.push(await fetchTtsChunk(chunks[i], lang, i, chunks.length));
    const audio = Buffer.concat(buffers);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(audio);
  } catch (e) {
    return res.status(502).json({ message: e.message });
  }
});

router.post('/translate', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    const target = String(req.body?.target || 'en').toLowerCase();
    if (!text) return res.json({ translated: '', target });
    if (!SUPPORTED.has(target) || target === 'en') return res.json({ translated: text, target });

    const key = `${target}:${text}`;
    const hit = cacheGet(key);
    if (hit !== undefined) return res.json({ translated: hit, target, cached: true });

    // Google caps a single request's length; chunk long text on sentence bounds.
    let translated = '';
    if (text.length <= 1800) {
      translated = await googleTranslate(text, target);
    } else {
      const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
      let buf = '';
      const chunks = [];
      for (const p of parts) { if ((buf + p).length > 1800) { chunks.push(buf); buf = p; } else buf += p; }
      if (buf) chunks.push(buf);
      for (const c of chunks) translated += await googleTranslate(c, target);
    }

    cacheSet(key, translated);
    res.json({ translated, target });
  } catch (e) {
    // Fail soft: return the original text so the browser can still speak it.
    res.json({ translated: String(req.body?.text || ''), target: String(req.body?.target || 'en'), error: e.message });
  }
});

module.exports = router;
