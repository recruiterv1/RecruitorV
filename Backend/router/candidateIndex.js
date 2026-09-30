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
const workingCandidates = async () =>
  (await allCandidates()).filter(c => c.source !== 'clientspoc_bulk');

module.exports = { allCandidates, workingCandidates, FIELDS };
