// A warm, projected copy of the candidate collection.
//
// Several pages need "all candidates" and used to fetch them as whole
// documents. Two fields on a candidate — the full resume text and the match
// tokens built from it — are larger than everything else put together, and
// reading thirty thousand of them never finished inside Hosting's sixty-second
// ceiling, so every one of those pages returned 500.
//
// Asking Firestore for a named set of fields keeps the heavy two out of the
// read entirely, and the result is cached, so a page waits on a lookup rather
// than a scan.

const { db } = require('./firebase_ad');
const { cached } = require('../utils/cache');

// Everything the candidate tables and reports display. Deliberately explicit:
// a field not named here is not fetched, which is the entire point.
const FIELDS = [
  'candidate', 'emails', 'mob', 'dob', 'pan_number', 'jr_number', 'rh_id',
  'pos_id', 'pos_name', 'client', 'clientspoc', 'hr_name',
  'recId', 'recEmail', 'recName', 'recRole', 'addedBy', 'addedByRole',
  'source', 'statusa', 'statusaDate', 'statusChangedAt', 'statusChangedBy',
  'statusChangedByName', 'rejectReason', 'datePosted', 'dateAdded', 'updatedAt',
  'cv_data', 'curr_loc', 'curr_state', 'pref_loc', 'pref_state',
  'total_exp', 'rel_exp', 'current_ctc', 'exp_ctc', 'offer_amt', 'offer_hand',
  'notice_period', 'last_day', 'self_rate', 'curr_emp', 'highest_education',
  'skill_type', 'tech_category', 'tech_subcategory', 'tech_skill', 'tech_exp',
  'nontech_category', 'nontech_subcategory', 'nontech_skill', 'nontech_exp',
  'skills', 'skillsText', 'skillCategory', 'matchPercent', 'matchSummary',
  'referredBy', 'filledFromCv',
];

const TTL_MS = 10 * 60 * 1000;

const allCandidates = () => cached('candidate_index', TTL_MS, async () => {
  const snap = await db.collection('candidate_db').select(...FIELDS).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// Bulk resume-bank uploads are three quarters of the collection and belong to
// the Resume Bank, not to the candidate tables — excluding them here means the
// pages that never wanted them do not pay to carry them across the wire.
const lc = (v) => String(v == null ? '' : v).toLowerCase().trim();
const phone10 = (v) => String(v == null ? '' : v).replace(/\D/g, '').slice(-10);
const msOf = (v) => (v?._seconds ? v._seconds * 1000 : (v?.seconds ? v.seconds * 1000 : 0));

// The same person, twice, on the same position.
//
// That is not someone applying to two roles — it is one application recorded
// more than once, usually a resubmission, and it makes a table read as though
// there were more candidates than there are.
//
// Matched on the position plus an email or a phone number. A shared name is not
// enough: two different people can have the same name, and merging them would
// hide a real candidate. The newest row is the one kept; the others stay in the
// database and the kept row carries the count.
const dedupe = (rows) => {
  const seen = new Map();
  const out = [];
  for (const c of rows) {
    if (!c.pos_id) { out.push(c); continue; }
    const email = lc(c.emails), phone = phone10(c.mob);
    if (!email && !phone) { out.push(c); continue; }

    const keys = [email && `e:${email}|${c.pos_id}`, phone.length === 10 && `p:${phone}|${c.pos_id}`]
      .filter(Boolean);
    const hit = keys.map(k => seen.get(k)).find(Boolean);
    const at = msOf(c.updatedAt) || msOf(c.datePosted);

    if (!hit) {
      const entry = { ...c, duplicates: 1, _at: at };
      keys.forEach(k => seen.set(k, entry));
      out.push(entry);
      continue;
    }
    hit.duplicates += 1;
    // Keep the newer record's fields, without losing the count or its place.
    if (at > hit._at) Object.assign(hit, c, { duplicates: hit.duplicates, _at: at });
    // A row reached through one key must be findable by the other next time.
    keys.forEach(k => { if (!seen.has(k)) seen.set(k, hit); });
  }
  return out.map(({ _at, ...rest }) => rest);
};

const workingCandidates = async () =>
  dedupe((await allCandidates()).filter(c => c.source !== 'clientspoc_bulk'));

module.exports = { allCandidates, workingCandidates, dedupe, FIELDS };
