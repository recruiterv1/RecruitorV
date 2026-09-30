// Resume Bank — searching the candidate pool.
//
// The page this replaces asked for every candidate in one response. At 30,000
// records that read never finished inside Firebase Hosting's 60-second ceiling,
// so the endpoint returned 500 for everyone and the feature was unusable.
//
// Two things make it work. The list is paginated, so a request carries fifty
// records rather than thirty thousand. And searching needs the whole pool in
// hand, which is too slow to read per request, so a slim index is built once
// and reused — small fields only, no resume text, no match tokens.

const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const { cached } = require('../utils/cache');

const router = express.Router();

// Everything the list, the filters and the search need — and nothing else. The
// two heavyweight fields on a candidate (resumeText, matchTokens) are what made
// the old read impossible, so they are never fetched here.
const FIELDS = [
  'candidate', 'emails', 'mob', 'curr_loc', 'curr_state', 'pref_loc',
  'skill_type', 'tech_category', 'nontech_category', 'skillCategory',
  'skillsText', 'tech_skill', 'nontech_skill', 'total_exp', 'rel_exp',
  'statusa', 'datePosted', 'updatedAt', 'cv_data', 'pos_name', 'client',
  'notice_period', 'curr_emp', 'highest_education', 'source',
];

const INDEX_TTL_MS = 15 * 60 * 1000;

const lc = (s) => String(s == null ? '' : s).toLowerCase().trim();
const asText = (v) => (Array.isArray(v) ? v.join(' ') : String(v == null ? '' : v));
const msOf = (v) => (v?._seconds ? v._seconds * 1000 : (v?.seconds ? v.seconds * 1000 : 0));

// A candidate nobody is currently working. These are the re-usable ones, and
// the reason to open the Resume Bank at all — the same rule the JD matcher uses,
// so the two features agree about who is available.
const { TERMINAL_STATUSES } = require('../utils/resumeBankMatch');
const isAvailable = (c) => {
  const st = lc(c.statusa);
  return !st || st === 'resume bank' || TERMINAL_STATUSES.has(st);
};


/* ── Understanding what was typed ──────────────────────────────────────────────
 *
 * People do not fill in fields, they describe who they want. All three of these
 * mean the same search and all three have to work:
 *
 *   Java, mumbai, 5-10 year, 1month notice
 *   Java mumbai 5-10 year 1month notice
 *   give me candidate for java positions matching to Senior Data Engineer
 *
 * So the phrase is read rather than matched literally: the parts that are
 * obviously an experience range, a notice period or a place are lifted out and
 * applied as real filters, the filler words are dropped, and whatever is left is
 * treated as skills.
 */

// Words that carry no meaning in a search phrase. Without this list a sentence
// like "give me candidates for..." searches for the word "give".
const FILLER = new Set((
  'give me show find get need want looking please a an the for with and or of in on ' +
  'to candidate candidates profile profiles resume resumes cv cvs person people ' +
  'who which that are is have has having matching match matched suitable fit ' +
  'position positions role roles job jobs opening openings requirement requirements ' +
  'exp experience experienced yr yrs year years notice period np joining ' +
  'immediate immediately joiner joiners joinee month months day days min max around about approx ' +
  'any all some good strong'
).split(/\s+/));

// "3Y 1M", "5", "5.5 years" → years as a number.
const expYears = (v) => {
  const s = String(v == null ? '' : v).toLowerCase();
  const ym = s.match(/(\d+(?:\.\d+)?)\s*y/);
  if (ym) {
    const mm = s.match(/(\d+)\s*m/);
    return Number(ym[1]) + (mm ? Number(mm[1]) / 12 : 0);
  }
  const n = s.match(/(\d+(?:\.\d+)?)/);
  return n ? Number(n[1]) : null;
};

// "Immediate", "30 days", "2 months" → days.
const noticeDays = (v) => {
  const s = String(v == null ? '' : v).toLowerCase();
  if (!s) return null;
  if (/immediate|asap|serving/.test(s)) return 0;
  const mo = s.match(/(\d+)\s*(month|mon\b|m\b)/);
  if (mo) return Number(mo[1]) * 30;
  const wk = s.match(/(\d+)\s*(week|wk)/);
  if (wk) return Number(wk[1]) * 7;
  const d = s.match(/(\d+)\s*(day|d\b)/);
  if (d) return Number(d[1]);
  const bare = s.match(/^(\d+)$/);
  return bare ? Number(bare[1]) : null;
};

const parseQuery = (raw, knownLocations) => {
  const out = { terms: [], expMin: null, expMax: null, maxNotice: null, locations: [], phrase: '' };
  const text = String(raw || '').toLowerCase().trim();
  if (!text) return out;
  out.phrase = text;

  let rest = text;
  const eat = (re) => { rest = rest.replace(re, ' '); };

  // Experience first: "5-10 years", "5 to 10 yrs", "8+ years", "5 years".
  // Longest unit first, or "years" matches as "y" and leaves "ears" behind to
  // be searched for as though it were a skill. The unit is optional, so the
  // whole unit group carries the ? rather than the word boundary.
  const N = '(\\d+(?:\\.\\d+)?)';
  const YR = '(?:\\s*(?:years|year|yrs|yr|y)\\b)';
  let m = rest.match(new RegExp(`${N}\\s*(?:-|–|to)\\s*${N}\\s*\\+?${YR}?`));
  if (m) {
    out.expMin = Number(m[1]); out.expMax = Number(m[2]); eat(m[0]);
  } else if ((m = rest.match(new RegExp(`${N}\\s*\\+${YR}?`)))) {
    out.expMin = Number(m[1]); eat(m[0]);
  } else if ((m = rest.match(new RegExp(`${N}${YR}`)))) {
    // A single figure is a floor, not an exact match — nobody means "exactly 5".
    out.expMin = Number(m[1]); eat(m[0]);
  }

  // Notice: "1month notice", "30 days np", "immediate".
  if (/\bimmediate|\basap/.test(rest)) { out.maxNotice = 0; eat(/\bimmediate(ly)?\b|\basap\b/); }
  else if ((m = rest.match(/(\d+)\s*(?:month|months|mon)\b/))) { out.maxNotice = Number(m[1]) * 30; eat(m[0]); }
  else if ((m = rest.match(/(\d+)\s*(?:day|days)\b/))) { out.maxNotice = Number(m[1]); eat(m[0]); }

  // Places, longest first so "navi mumbai" is not eaten by "mumbai".
  const places = [...(knownLocations || [])].map(l => String(l).toLowerCase().trim())
    .filter(Boolean).sort((a, b) => b.length - a.length);
  for (const place of places) {
    if (out.locations.length >= 3) break;
    if (rest.includes(place)) { out.locations.push(place); rest = rest.split(place).join(' '); }
  }

  // Whatever survives is what they actually want the person to know.
  out.terms = rest.split(/[^a-z0-9+#.]+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !FILLER.has(t) && !/^\d+$/.test(t));

  return out;
};

const buildIndex = async () => {
  const snap = await db.collection('candidate_db').select(...FIELDS).get();
  return snap.docs.map((d) => {
    const c = d.data();
    // One lowercased blob per candidate, so a search is a substring test rather
    // than a walk over a dozen fields for every row on every keystroke.
    const haystack = lc([
      c.candidate, c.emails, c.mob, c.curr_loc, c.curr_state, c.pref_loc,
      c.skillsText, asText(c.tech_skill), asText(c.nontech_skill),
      c.tech_category, c.nontech_category, c.skillCategory,
      c.curr_emp, c.highest_education, c.pos_name, c.client,
    ].filter(Boolean).join(' '));
    // Field names are kept exactly as the candidate record writes them. The
    // page that renders these rows already knows that shape, and renaming here
    // would mean rewriting every card and modal for no gain.
    return {
      id: d.id,
      candidate: c.candidate || '',
      emails: c.emails || '',
      mob: c.mob || '',
      curr_loc: c.curr_loc || '',
      curr_state: c.curr_state || '',
      pref_loc: c.pref_loc || '',
      skill_type: c.skill_type || '',
      tech_category: c.tech_category || '',
      nontech_category: c.nontech_category || '',
      skillCategory: c.skillCategory || '',
      skillsText: c.skillsText || '',
      tech_skill: c.tech_skill || [],
      nontech_skill: c.nontech_skill || [],
      total_exp: c.total_exp || '',
      rel_exp: c.rel_exp || '',
      statusa: c.statusa || '',
      notice_period: c.notice_period || '',
      curr_emp: c.curr_emp || '',
      highest_education: c.highest_education || '',
      pos_name: c.pos_name || '',
      client: c.client || '',
      source: c.source || '',
      cv_data: c.cv_data || '',
      datePosted: c.datePosted || null,
      hasCv: !!c.cv_data,
      available: isAvailable(c),
      // Parsed once here rather than on every row of every search.
      expY: expYears(c.total_exp || c.rel_exp),
      noticeD: noticeDays(c.notice_period),
      at: msOf(c.updatedAt) || msOf(c.datePosted),
      haystack,
    };
  });
};

// One row per person, not one per upload.
//
// About a tenth of the bank is the same person more than once — the same email
// uploaded again later, usually by a different SPOC. Nearly every one of those
// pairs carries a *different* CV file, so they are not accidental repeats to be
// thrown away: they are newer and older copies of the same person's resume.
// Deleting would lose a resume, so nothing is deleted. The newest is the one
// shown, the rest stay on the record, and the row says how many there are.
//
// A row with no email cannot be matched this way and is left as its own entry
// rather than merged on a guess about the name.
const collapseDuplicates = (rows) => {
  const byEmail = new Map();
  const out = [];
  for (const r of rows) {
    const key = lc(r.emails);
    if (!key) { out.push(r); continue; }
    const seen = byEmail.get(key);
    if (!seen) { byEmail.set(key, { ...r, versions: 1 }); continue; }
    seen.versions += 1;
    // Keep the newer record, but carry the running count across.
    if (r.at > seen.at) byEmail.set(key, { ...r, versions: seen.versions });
  }
  return out.concat([...byEmail.values()]);
};

const getIndex = () => cached('resume_bank_index', INDEX_TTL_MS,
  async () => collapseDuplicates(await buildIndex()));

const authed = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try { req.user = jwt.verify(token, process.env.SECKEY); next(); }
  catch (e) { return res.status(403).json({ success: false, message: 'Session expired.' }); }
};

// GET /search — one page of the bank, filtered and searched on the server.
// Position titles, so "matching to <position>" can be read as a position and
// its own skills folded into the search.
const positionTitles = () => cached('resume_bank_positions', 10 * 60 * 1000, async () => {
  const snap = await db.collection('admin_AddPos')
    .select('pos_id', 'position', 'client', 'skill_category').get();
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    .filter(p => p.position);
});

// Buckets for the narrowing filters. Ranges beat raw values here: nobody wants
// to choose between "3Y 2M" and "3Y 4M".
const expBand = (y) => (y == null ? 'Not stated'
  : y < 2 ? '0-2 years' : y < 5 ? '2-5 years' : y < 8 ? '5-8 years'
  : y < 12 ? '8-12 years' : '12+ years');
const noticeBand = (d) => (d == null ? 'Not stated'
  : d <= 0 ? 'Immediate' : d <= 15 ? 'Up to 15 days' : d <= 30 ? 'Up to 30 days'
  : d <= 60 ? 'Up to 60 days' : '60+ days');

// Counts for each narrowing option, taken from the rows that actually matched —
// so every option offered leads somewhere, and says how far.
const facetsOf = (rows) => {
  const tally = (pick) => {
    const m = {};
    rows.forEach(r => { const v = pick(r) || 'Not stated'; m[v] = (m[v] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1])
      .slice(0, 12).map(([value, count]) => ({ value, count }));
  };
  return {
    location: tally(r => r.curr_loc),
    category: tally(r => r.tech_category || r.nontech_category || r.skillCategory),
    experience: tally(r => expBand(r.expY)),
    notice: tally(r => noticeBand(r.noticeD)),
    status: tally(r => r.statusa),
  };
};

// GET /search — one page of the bank. The phrase is read, not matched literally.
router.get('/search', authed, async (req, res) => {
  try {
    const rows = await getIndex();
    const knownLocations = [...new Set(rows.map(r => r.curr_loc).filter(Boolean))];
    const parsed = parseQuery(req.query.q, knownLocations);

    // "…matching to <position>" — find the position and use its own skills.
    let matchedPosition = null;
    if (parsed.phrase && /match|for the|for position|similar/.test(parsed.phrase)) {
      const titles = await positionTitles();
      const hit = titles
        .filter(p => parsed.phrase.includes(String(p.position).toLowerCase().trim()))
        .sort((a, b) => String(b.position).length - String(a.position).length)[0];
      if (hit) {
        matchedPosition = { pos_id: hit.pos_id, position: hit.position, client: hit.client };
        const extra = lc(hit.position).split(/[^a-z0-9+#.]+/)
          .filter(t => t.length > 2 && !FILLER.has(t));
        parsed.terms = [...new Set([...parsed.terms, ...extra])];
      }
    }

    // Explicit dropdown choices sit on top of whatever the phrase said.
    const location = lc(req.query.location);
    const category = lc(req.query.category);
    const skillType = lc(req.query.skillType);
    const status = lc(req.query.status);
    const expBandPick = String(req.query.expBand || '');
    const noticePick = String(req.query.noticeBand || '');
    const availableOnly = String(req.query.availableOnly || '') === 'true';
    const withCvOnly = String(req.query.withCv || '') === 'true';

    const filtered = rows.filter((r) => {
      if (availableOnly && !r.available) return false;
      if (withCvOnly && !r.hasCv) return false;
      if (location && !lc(r.curr_loc).includes(location) && !lc(r.pref_loc).includes(location)) return false;
      if (category && lc(r.tech_category) !== category && lc(r.nontech_category) !== category
          && lc(r.skillCategory) !== category) return false;
      if (skillType && lc(r.skill_type) !== skillType) return false;
      if (status && lc(r.statusa) !== status) return false;
      if (expBandPick && expBand(r.expY) !== expBandPick) return false;
      if (noticePick && noticeBand(r.noticeD) !== noticePick) return false;

      // Every skill term must appear. Two words should narrow, not widen.
      for (const t of parsed.terms) if (!r.haystack.includes(t)) return false;

      // Place, experience and notice are only recorded on about a quarter of
      // this pool — the rest arrived as bulk CV uploads carrying little more
      // than a name and a skill list. Excluding everyone without a stated
      // value would throw away three quarters of the bank on a search for
      // "mumbai"; keeping them silently would bury the people who really are
      // in Mumbai. So a stated value that disagrees is excluded, a stated
      // value that agrees is ranked up, and an unstated one is neither.
      r._score = 0;
      if (parsed.locations.length) {
        const where = lc(r.curr_loc) + ' ' + lc(r.pref_loc);
        if (where.trim()) {
          if (!parsed.locations.some(l => where.includes(l))) return false;
          r._score += 3;
        }
      }
      if (parsed.expMin != null || parsed.expMax != null) {
        if (r.expY != null) {
          if (parsed.expMin != null && r.expY < parsed.expMin) return false;
          if (parsed.expMax != null && r.expY > parsed.expMax) return false;
          r._score += 2;
        }
      }
      if (parsed.maxNotice != null) {
        if (r.noticeD != null) {
          if (r.noticeD > parsed.maxNotice) return false;
          r._score += 1;
        }
      }
      return true;
    });

    // Confirmed matches first, then the unstated ones, newest within each.
    filtered.sort((a, b) => (req.query.sort === 'oldest' ? a.at - b.at
      : (b._score - a._score) || (b.at - a.at)));

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const start = (page - 1) * limit;
    // The blob is for matching, not for reading — sending it would put back a
    // good part of the weight this endpoint exists to remove.
    const pageRows = filtered.slice(start, start + limit)
      .map(({ haystack, expY, noticeD, _score, ...rest }) => ({ ...rest, confirmed: _score > 0 }));

    res.json({
      success: true,
      rows: pageRows,
      page,
      limit,
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / limit)),
      poolSize: rows.length,
      // What the phrase was taken to mean, so the page can show it back and the
      // person can see why they got these people rather than guessing.
      understood: {
        skills: parsed.terms,
        locations: parsed.locations,
        expMin: parsed.expMin, expMax: parsed.expMax,
        maxNotice: parsed.maxNotice,
        position: matchedPosition,
      },
      facets: facetsOf(filtered),
    });
  } catch (e) {
    console.error('resume-bank/search error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /filters — the values actually present in the pool, so a filter never
// offers something that returns nothing.
router.get('/filters', authed, async (req, res) => {
  try {
    const rows = await getIndex();
    const vals = (pick) => [...new Set(rows.map(pick).filter(Boolean))].sort();
    res.json({
      success: true,
      locations: vals(r => r.curr_loc).slice(0, 400),
      categories: [...new Set(rows.flatMap(r =>
        [r.tech_category, r.nontech_category, r.skillCategory]).filter(Boolean))].sort(),
      skillTypes: vals(r => r.skill_type),
      statuses: vals(r => r.statusa),
      poolSize: rows.length,
      available: rows.filter(r => r.available).length,
      withCv: rows.filter(r => r.hasCv).length,
    });
  } catch (e) {
    console.error('resume-bank/filters error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});



// GET /suggested — who in the bank is worth this recruiter's time right now.
//
// The bank opened on an empty page waiting for a search, which asks the
// recruiter to guess what is in it. They already have positions and skill
// categories on file, so the page can answer first and be searched second.
//
// Scored against their own live positions, and each candidate is kept once
// under the position they fit best. A recruiter with no positions yet falls
// back to their skill categories, because that is the case where an empty page
// is least helpful of all.
router.get('/suggested', authed, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const minScore = Math.min(Math.max(parseInt(req.query.minScore, 10) || 45, 1), 100);
    // Thirty is the page, not a slice of something larger. Scoring the whole
    // pool against every position is the expensive part and it does not get
    // cheaper by asking for more.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 30);

    const positions = await myActivePositions(email);
    const { getMatchingCandidates } = require('../utils/resumeBankMatch');

    // Scoring thirty thousand candidates against ten positions takes tens of
    // seconds even with the pool warm, so a recruiter pays for it once and
    // every reload for the next quarter hour is instant. Their positions do
    // not change minute to minute.
    const compute = async () => {
    const best = new Map();
    for (const pos of positions) {
      // Already excludes anyone submitted to that position, so nothing is
      // suggested that would be rejected as a duplicate on submit.
      const hits = await getMatchingCandidates(db, pos, minScore);
      for (const h of hits) {
        const seen = best.get(h.id);
        // getMatchingCandidates calls it matchPercent.
        if (seen && seen.matchPercent >= h.matchPercent) continue;
        best.set(h.id, {
          ...h,
          forPosition: { pos_id: pos.pos_id, position: pos.position, client: pos.client },
        });
      }
    }

    return [...best.values()].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, limit);
    };

    let rows = await cached(`rb_suggested:${email}:${minScore}:${limit}`, 15 * 60 * 1000, compute);
    let basis = 'positions';

    if (!rows.length) {
      // No positions, or nothing scored above the bar — fall back to the
      // categories they work in, which is still better than a blank page.
      const snap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
      const cats = snap.empty ? [] : (Array.isArray(snap.docs[0].data().skillCategory)
        ? snap.docs[0].data().skillCategory : [snap.docs[0].data().skillCategory]).filter(Boolean).map(lc);
      if (cats.length) {
        const all = await getIndex();
        rows = all
          .filter(r => r.available && r.hasCv
            && cats.includes(lc(r.tech_category || r.nontech_category || r.skillCategory)))
          .sort((a, b) => b.at - a.at)
          .slice(0, limit)
          .map(({ haystack, expY, noticeD, ...rest }) => rest);
        basis = 'categories';
      }
    }

    res.json({
      success: true,
      rows,
      basis,                      // positions | categories | none
      count: rows.length,
      positions: positions.map(p => ({ pos_id: p.pos_id, position: p.position, client: p.client })),
      minScore,
    });
  } catch (e) {
    console.error('resume-bank/suggested error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── Shortlist ────────────────────────────────────────────────────────────────
 *
 * A recruiter reading the bank finds someone worth keeping and has nowhere to
 * put them, so the good ones are lost between sessions. Shortlisting sets them
 * aside; the shortlist page then does the part that is actually hard — working
 * out which of that recruiter's own live positions each person fits, how well,
 * and on the strength of what.
 *
 * Only positions approved to this recruiter and still active are considered. A
 * score against a position they cannot work is noise.
 */

const SHORTLIST = () => db.collection('resume_bank_shortlist');

// A shortlist is a working set for today, not a folder that fills up. Anything
// kept for four hours and not acted on drops off, so the page always reads as
// "who am I working right now" rather than a backlog nobody revisits.
const SHORTLIST_HOURS = 4;
const shortlistId = (email, candidateId) => `${String(email).replace(/[.]/g, '_')}__${candidateId}`;

// The recruiter's own live positions, with the full record the matcher needs —
// the assignment row carries a title but not the requirement text.
const myActivePositions = async (email) => {
  const positionAccess = require('../model_fire/positionAccessF');
  const assignments = await positionAccess.getRecruiterAssignments(email);
  if (!assignments.length) return [];

  const ids = [...new Set(assignments.map(a => String(a.positionId)))];
  const docs = await Promise.all(ids.map(id =>
    db.collection('admin_AddPos').where('pos_id', '==', id).limit(1).get()));

  const { isActivePos } = require('../utils/resumeBankMatch');
  return docs.map(d => (d.empty ? null : d.docs[0].data()))
    .filter(p => p && isActivePos(p.status));
};

// POST /shortlist/:candidateId — keep this person.
router.post('/shortlist/:candidateId', authed, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const doc = await db.collection('candidate_db').doc(req.params.candidateId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Candidate not found.' });
    const c = doc.data();
    await SHORTLIST().doc(shortlistId(email, req.params.candidateId)).set({
      recruiterEmail: email,
      candidateId: req.params.candidateId,
      // Enough to list them if the candidate record is later archived.
      candidateName: c.candidate || '',
      emails: c.emails || '',
      note: String(req.body?.note || '').slice(0, 500),
      addedAt: new Date(),
    }, { merge: true });
    res.json({ success: true, message: 'Added to your shortlist.' });
  } catch (e) {
    console.error('resume-bank/shortlist add error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /shortlist/:candidateId
router.delete('/shortlist/:candidateId', authed, async (req, res) => {
  try {
    await SHORTLIST().doc(shortlistId(lc(req.user.email), req.params.candidateId)).delete();
    res.json({ success: true, message: 'Removed from your shortlist.' });
  } catch (e) {
    console.error('resume-bank/shortlist remove error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /shortlist/ids — which of these are already kept, for the bank's buttons.
router.get('/shortlist/ids', authed, async (req, res) => {
  try {
    const snap = await SHORTLIST().where('recruiterEmail', '==', lc(req.user.email)).get();
    const cutoff = Date.now() - SHORTLIST_HOURS * 3600 * 1000;
    res.json({
      success: true,
      ids: snap.docs.filter(d => msOf(d.data().addedAt) >= cutoff).map(d => d.data().candidateId),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /shortlist — the page: everyone kept, each against the best of this
// recruiter's live positions, with the reason for the score.
router.get('/shortlist', authed, async (req, res) => {
  try {
    const email = lc(req.user.email);
    const [snap, positions] = await Promise.all([
      SHORTLIST().where('recruiterEmail', '==', email).get(),
      myActivePositions(email),
    ]);

    // Expired entries are cleared on the way past rather than by a sweep, so
    // what the page shows and what the database holds never disagree.
    const cutoff = Date.now() - SHORTLIST_HOURS * 3600 * 1000;
    const live = snap.docs.filter(d => msOf(d.data().addedAt) >= cutoff);
    const stale = snap.docs.filter(d => msOf(d.data().addedAt) < cutoff);
    if (stale.length) {
      await Promise.all(stale.map(d => d.ref.delete().catch(() => {})));
    }

    const kept = live.map(d => d.data())
      .sort((a, b) => msOf(b.addedAt) - msOf(a.addedAt));
    if (!kept.length) {
      return res.json({ success: true, rows: [], positions: [], count: 0, holdHours: SHORTLIST_HOURS });
    }

    const { buildJd, prepCandidate, scoreWithReason } = require('../utils/resumeBankMatch');
    // Built once per position, not once per candidate per position.
    const jds = positions.map(p => ({ pos: p, jd: buildJd(p) })).filter(x => x.jd.totalW);

    // The scorer reads the CV blob, which the search index deliberately leaves
    // out — so the shortlist fetches it for these few, not for thirty thousand.
    const cands = await Promise.all(kept.map(k =>
      db.collection('candidate_db').doc(k.candidateId).get()));

    const rows = kept.map((k, i) => {
      const doc = cands[i];
      if (!doc.exists) return { ...k, missing: true, matches: [] };
      const c = doc.data();
      const prep = prepCandidate(c);

      const matches = jds.map(({ pos, jd }) => {
        const r = scoreWithReason(jd, prep);
        return {
          pos_id: pos.pos_id,
          position: pos.position,
          client: pos.client,
          // Carried so submitting from here needs no second lookup.
          clientspoc: pos.clientspoc || '',
          hr_name: pos.hr_name || '',
          score: r.score,
          // The words that earned the score, and the ones that did not — a
          // number on its own tells a recruiter nothing they can act on.
          matched: r.matched.slice(0, 12),
          missing: r.missing.slice(0, 8),
        };
      }).sort((a, b) => b.score - a.score);

      return {
        candidateId: k.candidateId,
        candidate: c.candidate || k.candidateName || '',
        emails: c.emails || k.emails || '',
        mob: c.mob || '',
        curr_loc: c.curr_loc || '',
        total_exp: c.total_exp || '',
        notice_period: c.notice_period || '',
        skillsText: c.skillsText || '',
        cv_data: c.cv_data || '',
        note: k.note || '',
        addedAt: k.addedAt || null,
        // What is left of the four hours, so the card can say so.
        msLeft: Math.max(0, msOf(k.addedAt) + SHORTLIST_HOURS * 3600 * 1000 - Date.now()),
        best: matches[0] || null,
        matches: matches.slice(0, 5),
      };
    });

    res.json({
      success: true,
      rows,
      count: rows.length,
      positions: positions.map(p => ({ pos_id: p.pos_id, position: p.position, client: p.client })),
      holdHours: SHORTLIST_HOURS,
    });
  } catch (e) {
    console.error('resume-bank/shortlist error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
module.exports.warmIndex = getIndex;
