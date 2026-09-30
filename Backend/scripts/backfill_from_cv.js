#!/usr/bin/env node
// Fill in location, experience and notice period from the CV text, for the
// candidates that arrived without them.
//
//   node scripts/backfill_from_cv.js dry [n]   — show what it would write
//   node scripts/backfill_from_cv.js run       — write it
//
// Roughly three quarters of the Resume Bank came in as bulk CV uploads carrying
// a name, an email and a skill list, so searching it by place or experience
// found almost nobody. The facts are in the CV text; they were simply never
// lifted out.
//
// Two rules throughout: a field that already has a value is never touched, and
// anything not found is left empty rather than guessed. Everything written is
// marked with its origin so it can be told apart from what a person entered,
// and undone.

const { db } = require('../router/firebase_ad');

const lc = (s) => String(s == null ? '' : s).toLowerCase();

// Cities are read from what recruiters have actually typed into the system, so
// the list matches this pool rather than a generic gazetteer.
const loadCities = async () => {
  const snap = await db.collection('candidate_db').select('curr_loc').get();
  const seen = {};
  snap.docs.forEach(d => {
    const v = String(d.data().curr_loc || '').trim();
    if (v.length > 2) seen[v.toLowerCase()] = (seen[v.toLowerCase()] || 0) + 1;
  });
  // A place typed once is as likely to be a typo as a city.
  return Object.entries(seen).filter(([, n]) => n >= 3)
    .map(([c]) => c).sort((a, b) => b.length - a.length);
};

// "Location: Pune", "Current Location - Navi Mumbai", or the city in the
// contact block at the top of the CV.
//
// A city name is not always a home: "Pune University" and "Hyderabad office of
// Acme Ltd" both read as a place and neither says where the person lives. So a
// match sitting next to a school or a company is passed over.
const NOT_A_HOME = /^[\s,.\-]*(university|univ|college|institute|institution|school|campus|academy|polytechnic|ltd|limited|pvt|private|technologies|technology|solutions|systems|services|consulting|software|infotech|labs|inc\b|corp|company)/i;

const cityAt = (hay, cities) => {
  for (const c of cities) {
    let from = 0, at;
    while ((at = hay.indexOf(c, from)) !== -1) {
      const after = hay.slice(at + c.length, at + c.length + 22);
      if (!NOT_A_HOME.test(after)) return c;
      from = at + c.length;          // same city elsewhere may still be a home
    }
  }
  return null;
};

const findLocation = (text, cities) => {
  const labelled = text.match(
    /(?:current\s+)?(?:location|city|based\s+(?:in|at)|residing\s+(?:in|at)|address)\s*[:\-–]\s*([A-Za-z .,]{3,40})/i);
  if (labelled) {
    const hit = cityAt(lc(labelled[1]), cities);
    if (hit) return { value: hit, how: 'labelled' };
  }
  // The contact block sits at the very top. A city named further down is far
  // more likely to be an employer or a university than a home address.
  const hit = cityAt(lc(text.slice(0, 600)), cities);
  return hit ? { value: hit, how: 'header' } : null;
};

// "Total Experience: 6 years", "6+ years of experience", "6 yrs 3 months".
const findExperience = (text) => {
  const pats = [
    /(?:total|overall|professional|work|relevant)\s*(?:it\s*)?experience\s*[:\-–]?\s*(\d{1,2})(?:\.(\d))?\s*\+?\s*(?:years?|yrs?)(?:\s*(?:and\s*)?(\d{1,2})\s*(?:months?|mos?))?/i,
    /(\d{1,2})(?:\.(\d))?\s*\+?\s*(?:years?|yrs?)(?:\s*(?:and\s*)?(\d{1,2})\s*(?:months?|mos?))?\s*(?:of\s*)?(?:total\s*|overall\s*|professional\s*|relevant\s*)?experience/i,
  ];
  for (const re of pats) {
    const m = text.match(re);
    if (!m) continue;
    const years = Number(m[1]);
    // A CV claiming 45 years is a date that got caught, not a career.
    if (!Number.isFinite(years) || years < 0 || years > 40) continue;
    const months = m[3] ? Number(m[3]) : (m[2] ? Math.round(Number('0.' + m[2]) * 12) : 0);
    if (months > 11) continue;
    return { value: `${years}Y ${months}M`, how: 'stated' };
  }
  return null;
};

// "Notice Period: 30 days", "Notice: 2 months", "Immediate joiner".
const findNotice = (text) => {
  const m = text.match(/notice\s*(?:period)?\s*[:\-–]?\s*([^\n\r.;]{0,28})/i);
  if (m) {
    const v = lc(m[1]);
    if (/immediate|serving|available\s*now/.test(v)) return { value: 'Immediate', how: 'stated' };
    const mo = v.match(/(\d{1,2})\s*(?:months?|mos?)/);
    if (mo && Number(mo[1]) <= 6) return { value: `${Number(mo[1]) * 30} days`, how: 'stated' };
    const d = v.match(/(\d{1,3})\s*days?/);
    if (d && Number(d[1]) <= 180) return { value: `${Number(d[1])} days`, how: 'stated' };
  }
  if (/immediate\s*(?:joiner|joining|ly\s*available)/i.test(text)) return { value: 'Immediate', how: 'phrase' };
  return null;
};

const main = async () => {
  const mode = process.argv[2] || 'dry';
  const sampleN = Number(process.argv[3] || 0);

  console.log('reading known cities…');
  const cities = await loadCities();
  console.log(`${cities.length} cities recognised\n`);

  let q = db.collection('candidate_db').select('candidate', 'curr_loc', 'total_exp', 'notice_period', 'resumeText');
  if (mode === 'dry' && sampleN) q = q.limit(sampleN);
  const snap = await q.get();

  let considered = 0, noText = 0, wouldWrite = 0;
  const found = { curr_loc: 0, total_exp: 0, notice_period: 0 };
  const examples = [];
  let batch = db.batch(), ops = 0, written = 0;

  for (const doc of snap.docs) {
    const c = doc.data();
    // Only the ones actually missing something.
    const needs = {
      curr_loc: !String(c.curr_loc || '').trim(),
      total_exp: !String(c.total_exp || '').trim(),
      notice_period: !String(c.notice_period || '').trim(),
    };
    if (!needs.curr_loc && !needs.total_exp && !needs.notice_period) continue;
    considered++;

    const text = String(c.resumeText || '');
    if (text.length < 80) { noText++; continue; }

    const patch = {}, how = {};
    if (needs.curr_loc) {
      const r = findLocation(text, cities);
      // Stored the way the rest of the system writes a city.
      if (r) { patch.curr_loc = r.value.replace(/\b\w/g, ch => ch.toUpperCase()); how.curr_loc = r.how; found.curr_loc++; }
    }
    if (needs.total_exp) {
      const r = findExperience(text);
      if (r) { patch.total_exp = r.value; how.total_exp = r.how; found.total_exp++; }
    }
    if (needs.notice_period) {
      const r = findNotice(text);
      if (r) { patch.notice_period = r.value; how.notice_period = r.how; found.notice_period++; }
    }
    if (!Object.keys(patch).length) continue;
    wouldWrite++;

    if (examples.length < 12) examples.push({ name: c.candidate, patch, how });

    if (mode === 'run') {
      // Marked, so a value lifted from a CV is never mistaken for one a person
      // typed — and so this run can be found and reversed.
      patch.filledFromCv = { fields: Object.keys(how), at: new Date() };
      batch.update(doc.ref, patch);
      ops++; written++;
      if (ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
  }
  if (mode === 'run' && ops) await batch.commit();

  console.log('EXAMPLES');
  console.log('─'.repeat(92));
  examples.forEach(e => {
    const bits = Object.entries(e.patch).map(([k, v]) => `${k}=${v} (${e.how[k]})`).join('   ');
    console.log(String(e.name || '—').slice(0, 26).padEnd(28) + bits);
  });

  console.log('\nSUMMARY');
  console.log('─'.repeat(92));
  console.log('scanned                    :', snap.size);
  console.log('missing at least one field :', considered);
  console.log('  of those, no CV text     :', noText);
  console.log('  location found           :', found.curr_loc);
  console.log('  experience found         :', found.total_exp);
  console.log('  notice period found      :', found.notice_period);
  console.log(mode === 'run' ? 'records UPDATED            : ' + written
                             : 'records that WOULD update  : ' + wouldWrite);
  if (mode !== 'run') console.log('\n(dry run — nothing was written)');
  process.exit(0);
};

main().catch(e => { console.error(e); process.exit(1); });
