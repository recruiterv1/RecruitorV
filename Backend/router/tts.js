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
