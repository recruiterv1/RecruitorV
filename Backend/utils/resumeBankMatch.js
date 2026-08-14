/**
 * Deterministic (no-AI) matcher used to count how many "available" resume-bank
 * candidates strongly match a position's JD.
 *
 * "Available" = a candidate with a CV who is NOT actively in a pipeline on an
 * active position (i.e. rejected/dropped, on-hold, bulk resume-bank, or sitting
 * on a position that is no longer active). These are the re-usable talent pool.
 *
 * Matching compares the position's CORE requirement keywords against a compact
 * per-candidate `matchTokens` blob (pre-computed from the CV text + skills +
 * category) so it runs entirely on small stored fields — no network, no AI.
 */
const STOP = new Set((
  'the and for with that this you your our will must have has had are was were ' +
  'from into out who they them then than over under more most such very able based ' +
  'years year experience experienced work working knowledge skills skill ability ' +
  'strong good excellent using use used team role job position description new per ' +
  'responsibilities responsibility candidate candidates require required requirements ' +
  'including include includes etc across within about also'
).split(/\s+/));

const lc = (s) => (s || '').toString().toLowerCase().trim();
const isActivePos = (st) => { const s = lc(st); return s === '' || s.includes('active'); };

// Statuses that mean the candidate is NOT in an active pipeline (so they are
// available for re-use even if attached to a position).
const TERMINAL_STATUSES = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
  'resume bank', 'position on hold',
]);

const tokenize = (str) => {
  const seen = new Set();
  return (str || '').toString()
    .replace(/<[^>]*>/g, ' ')            // strip HTML tags (rich-text m_have/g_have) so
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')   // tag/attribute names don't pollute the tokens
    .toLowerCase()
    .replace(/[^a-z0-9\s.#+]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
    .filter(w => (seen.has(w) ? false : (seen.add(w), true)));
};

// Compact, de-duplicated token blob for a candidate (CV text + skills + category
// + name). Capped so the stored field stays small.
function computeMatchTokens(cvText, cand = {}) {
  const src = [
    cvText || cand.resumeText || '',
    cand.skillsText || '',
    Array.isArray(cand.skills) ? cand.skills.join(' ') : '',
    cand.skillCategory || '',
    cand.candidate || '',
  ].join(' ');
  return tokenize(src).slice(0, 600).join(' ');
}

// Build a weighted, de-duplicated set of the position's CORE requirement
// keywords (must-have, skill category, title, category, good-to-have). We score
// coverage of THESE, not every word in the JD body. Each field is capped so one
// verbose field can't dominate the denominator.  [weight, text, cap]
function buildJd(pos = {}) {
  const groups = [
    [3, pos.m_have,         25],
    [3, pos.skill_category, 10],
    [2, pos.position,        6],
    [2, pos.pos_cat,         6],
    [1, pos.g_have,         15],
  ];
  const weightOf = new Map();
  for (const [w, str, cap] of groups) {
    for (const word of tokenize(str).slice(0, cap)) {
      if ((weightOf.get(word) || 0) < w) weightOf.set(word, w);
    }
  }
  let totalW = 0;
  const list = [];
  for (const [word, w] of weightOf) { totalW += w; list.push({ word, w }); }
  return { list, totalW };
}

// Pre-tokenise a candidate's match blob once.
function prepCandidate(cand = {}) {
  const text = (cand.matchTokens && cand.matchTokens.length)
    ? cand.matchTokens.toLowerCase()
    : [cand.skillsText, Array.isArray(cand.skills) ? cand.skills.join(' ') : '', cand.skillCategory, cand.candidate]
        .filter(Boolean).join(' ').toLowerCase();
  const tokens = new Set(text.replace(/[^a-z0-9\s.#+]/g, ' ').split(/\s+/).filter(t => t.length > 2));
  return { text, tokens };
}

function score(jd, prep) {
  if (!jd.totalW) return 0;
  let got = 0;
  // Token-set lookups only (no substring scan) — this runs across every position
  // × every candidate for the assigned-positions counts, so it must be O(1)/word.
  for (const { word, w } of jd.list) {
    if (prep.tokens.has(word)) got += w;
  }
  return Math.round((got / jd.totalW) * 100);
}

// Like score(), but also returns which JD keywords matched / are missing — used
// to explain the match percentage to the recruiter.
function scoreWithReason(jd, prep) {
  if (!jd.totalW) return { score: 0, matched: [], missing: [] };
  let got = 0;
  const matched = [], missing = [];
  for (const { word, w } of jd.list) {
    if (prep.tokens.has(word) || prep.text.includes(word)) { got += w; matched.push(word); }
    else missing.push(word);
  }
  return { score: Math.round((got / jd.totalW) * 100), matched, missing };
}

// Short-lived in-process caches (per instance) to avoid heavy reads per request.
let _posCache = { t: 0, set: null };
let _poolCache = { t: 0, data: null };
let _preppedCache = { t: 0, preps: null };   // prepCandidate(pool), reused across scoring
let _countsCache = new Map();                  // posIdsKey -> { t, counts }
const TTL = 5 * 60 * 1000;
const COUNTS_TTL = 90 * 1000;

// Force the next read to refetch — call after writes that change the pool
// (candidate edit, submit-from-bank, bulk resume save) so counts/lists are fresh.
function invalidateCache() {
  _poolCache = { t: 0, data: null };
  _posCache = { t: 0, set: null };
  _preppedCache = { t: 0, preps: null };
  _countsCache.clear();
}

// Prepared pool (candidates run through prepCandidate) cached alongside the pool so
// scoring never re-preps thousands of candidates on every request.
async function getPreppedPool(db) {
  const pool = await getAvailablePool(db);
  if (_preppedCache.preps && _preppedCache.t === _poolCache.t) return _preppedCache.preps;
  const preps = pool.map(prepCandidate);
  _preppedCache = { t: _poolCache.t, preps };
  return preps;
}

async function getActivePosIds(db) {
  const now = Date.now();
  if (_posCache.set && (now - _posCache.t) < TTL) return _posCache.set;
  const snap = await db.collection('admin_AddPos').select('pos_id', 'status').get();
  const set = new Set();
  snap.docs.forEach(d => { const p = d.data(); if (isActivePos(p.status) && p.pos_id) set.add(p.pos_id); });
  _posCache = { t: now, set };
  return set;
}

// Load the available talent pool (CV present, not in an active pipeline on an
// active position). Only small fields are fetched (no full CV text).
async function getAvailablePool(db) {
  const now = Date.now();
  if (_poolCache.data && (now - _poolCache.t) < TTL) return _poolCache.data;

  const activePos = await getActivePosIds(db);
  const snap = await db.collection('candidate_db')
    .select('matchTokens', 'skillsText', 'skillCategory', 'candidate', 'skills', 'statusa',
            'pos_id', 'cv_data', 'cv_url', 'emails', 'mob', 'curr_loc', 'total_exp', 'rel_exp', 'source')
    .get();

  const data = [];
  snap.docs.forEach(d => {
    const c = d.data();
    if (!(c.cv_data || c.cv_url)) return;                       // must have a CV
    const terminal = TERMINAL_STATUSES.has(lc(c.statusa));
    const inUse = !terminal && c.pos_id && activePos.has(c.pos_id); // active pipeline on active pos
    if (inUse) return;                                          // not available
    data.push({ id: d.id, ...c });
  });
  _poolCache = { t: now, data };
  return data;
}

// Returns { [pos_id]: matchCount } — available candidates with score >= threshold.
async function resumeBankMatchCounts(db, positions, threshold = 75) {
  // Memoize by the exact set of positions + threshold — repeat page loads within
  // the TTL return instantly without re-scoring the whole pool.
  const posIds = positions.map(p => p.pos_id).filter(Boolean).sort();
  const key = `${threshold}|${posIds.join(',')}`;
  const hit = _countsCache.get(key);
  if (hit && Date.now() - hit.t < COUNTS_TTL) return hit.counts;

  const preps = await getPreppedPool(db);
  const counts = {};
  for (const pos of positions) {
    const jd = buildJd(pos);
    let n = 0;
    if (jd.totalW >= 6) {
      for (const p of preps) { if (score(jd, p) >= threshold) n++; }
    }
    counts[pos.pos_id] = n;
  }
  if (_countsCache.size > 200) _countsCache.clear();
  _countsCache.set(key, { t: Date.now(), counts });
  return counts;
}

// Returns the available candidates matching a single position's JD at or above
// `threshold`, each with a match percent and matched/missing keyword reason.
// Sorted best-match first.
async function getMatchingCandidates(db, position, threshold = 75) {
  const pool = await getAvailablePool(db);
  const jd = buildJd(position);
  if (jd.totalW < 6) return [];

  // Exclude candidates already submitted to THIS position (by email or phone),
  // so the recruiter isn't offered someone who'd just be skipped on submit.
  const submittedEmails = new Set();
  const submittedPhones = new Set();
  if (position.pos_id) {
    try {
      const subSnap = await db.collection('candidate_db').where('pos_id', '==', position.pos_id).get();
      subSnap.docs.forEach(d => {
        const s = d.data();
        if (s.source === 'clientspoc_bulk') return;           // bank templates aren't submissions
        const e = lc(s.emails); if (e) submittedEmails.add(e);
        const p = (s.mob || '').toString().replace(/\D/g, ''); if (p) submittedPhones.add(p);
      });
    } catch (e) { console.error('matching exclude error:', e.message); }
  }

  const out = [];
  for (const c of pool) {
    const ce = lc(c.emails);
    const cp = (c.mob || '').toString().replace(/\D/g, '');
    if ((ce && submittedEmails.has(ce)) || (cp && submittedPhones.has(cp))) continue; // already submitted
    const { score: s, matched, missing } = scoreWithReason(jd, prepCandidate(c));
    if (s >= threshold) {
      out.push({
        id: c.id,
        candidate: c.candidate || '',
        emails: c.emails || '',
        mob: c.mob || '',
        curr_loc: c.curr_loc || '',
        total_exp: c.total_exp || '',
        skills: Array.isArray(c.skills) ? c.skills : [],
        skillCategory: c.skillCategory || '',
        cv_data: c.cv_data || c.cv_url || '',
        matchPercent: s,
        matched: matched.slice(0, 12),
        missing: missing.slice(0, 12),
      });
    }
  }
  out.sort((a, b) => b.matchPercent - a.matchPercent);
  return out;
}

// Non-"reject" statuses that still mean the candidate was dropped/declined.
const REJECTED_EXTRA = new Set(['client drop', 'candidate drop', 'duplicate', 'offer declined']);
// True for ANY status that contains "reject" (screen reject, l1 reject, hr reject,
// rejected, or any custom "… reject") plus the drop/declined statuses above.
const isRejectedStatus = (statusa) => {
  const s = lc(statusa);
  return s.includes('reject') || REJECTED_EXTRA.has(s);
};

// Rejected candidates (any position) that match this JD >= threshold. Deduped by
// email/phone, keeping the highest-scoring record. Returns cards incl. statusa.
async function getMatchingRejectedCandidates(db, position, threshold = 70) {
  const jd = buildJd(position);
  if (jd.totalW < 6) return [];

  const snap = await db.collection('candidate_db')
    .select('skillsText', 'skillCategory', 'candidate', 'skills', 'statusa',
            'pos_id', 'pos_name', 'cv_data', 'cv_url', 'emails', 'mob', 'curr_loc', 'total_exp', 'rel_exp', 'source', 'matchTokens')
    .get();

  const best = new Map();   // dedupe key -> card
  snap.docs.forEach(d => {
    const c = d.data();
    if (c.source === 'clientspoc_bulk') return;
    if (!(c.cv_data || c.cv_url)) return;
    if (!isRejectedStatus(c.statusa)) return;
    const { score: s, matched, missing } = scoreWithReason(jd, prepCandidate(c));
    if (s < threshold) return;
    const key = lc(c.emails) || (c.mob || '').toString().replace(/\D/g, '') || d.id;
    const prev = best.get(key);
    if (prev && prev.matchPercent >= s) return;
    best.set(key, {
      id: d.id,
      candidate: c.candidate || '',
      emails: c.emails || '',
      mob: c.mob || '',
      curr_loc: c.curr_loc || '',
      total_exp: c.total_exp || '',
      statusa: c.statusa || '',
      lastPosition: c.pos_name || '',
      cv_data: c.cv_data || c.cv_url || '',
      matchPercent: s,
      matched: matched.slice(0, 12),
      missing: missing.slice(0, 12),
    });
  });
  return [...best.values()].sort((a, b) => b.matchPercent - a.matchPercent);
}

module.exports = {
  buildJd, prepCandidate, score, scoreWithReason, computeMatchTokens,
  getAvailablePool, getActivePosIds, getMatchingCandidates, getMatchingRejectedCandidates,
  resumeBankMatchCounts, invalidateCache, TERMINAL_STATUSES, isActivePos,
};
