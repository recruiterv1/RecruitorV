// Auto-suspension of inactive recruiters.
//
// A recruiter is suspended only when ALL of these are true:
//   1. Registered ≥ INACTIVITY_DAYS days ago.
//   2. No position self-assigned (position_access_requests approved) AND no
//      candidate submitted (candidate_db.recEmail == their email).
//   3. Never referred a candidate (candidate_db.referredBy == email, source 'referred').
//   4. No direct applicants from a shared link (referredBy == email, referredViaDirectApply).
//
// Suspended accounts get accountStatus 'suspended' + isActive false; the login
// gate blocks them, and coach/expert recruiter lists hide them.
const { db } = require('../router/firebase_ad');

const recruiterDb = db.collection('recruiter_db');
const candidateDb = db.collection('candidate_db');
const parDb = db.collection('position_access_requests');

const INACTIVITY_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

const SUSPENSION_MESSAGE =
  'Due to inactivity into you account you account has been suspended. Please contact Adminstrator at support@recruiterv.in to activate your account.';

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'object' && typeof v._seconds === 'number') return v._seconds * 1000;
  if (typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

// The 45 days run from registration, or from the last time an admin switched the
// account back on, whichever is later; otherwise a reactivated account is suspended
// again at its very next login because it still has no activity.
const regMsOf = (r) => {
  const base = toMs(r.registrationDate) || toMs(r.createdAt);
  return base ? Math.max(base, toMs(r.reactivatedAt)) : 0;
};

// ── Bulk sweep — used by the daily scheduled job ──────────────────────────────
async function suspendInactiveRecruiters() {
  const cutoff = Date.now() - INACTIVITY_DAYS * DAY_MS;

  const [recSnap, candSnap, parSnap] = await Promise.all([
    recruiterDb.get(),
    candidateDb.select('recEmail', 'referredBy', 'source', 'referredViaDirectApply').get(),
    parDb.where('status', '==', 'approved').select('recruiterEmail').get(),
  ]);

  // Emails that show ANY activity → never suspended.
  const submitted = new Set();
  const referred = new Set();
  const gotDirect = new Set();
  candSnap.docs.forEach((d) => {
    const c = d.data();
    const rec = (c.recEmail || '').toLowerCase().trim();
    if (rec) submitted.add(rec);
    const rb = (c.referredBy || '').toLowerCase().trim();
    if (rb) {
      if ((c.source || '') === 'referred') referred.add(rb);
      if (c.referredViaDirectApply) gotDirect.add(rb);
    }
  });
  const assigned = new Set();
  parSnap.docs.forEach((d) => {
    const e = (d.data().recruiterEmail || '').toLowerCase().trim();
    if (e) assigned.add(e);
  });

  let suspended = 0, scanned = 0;
  let batch = db.batch(), ops = 0;
  const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };

  for (const doc of recSnap.docs) {
    const r = doc.data();
    const email = (r.email || '').toLowerCase().trim();
    if (!email) continue;
    // Only auto-suspend currently-approved (or legacy no-status) recruiters.
    if (r.accountStatus && r.accountStatus !== 'approved') continue;
    const reg = regMsOf(r);
    if (!reg || reg > cutoff) continue; // < 45 days, or unknown date → leave alone
    scanned++;
    const active = submitted.has(email) || assigned.has(email) || referred.has(email) || gotDirect.has(email);
    if (active) continue;
    batch.update(doc.ref, {
      accountStatus: 'suspended',
      isActive: false,
      suspendedAt: new Date(),
      suspendedReason: 'inactivity',
    });
    suspended++; ops++;
    if (ops >= 400) await flush();
  }
  await flush();
  return { suspended, scanned, total: recSnap.size };
}

// ── Single-recruiter check — used at login as a safety net ────────────────────
async function isRecruiterInactiveByEmail(email, recDoc) {
  const e = (email || '').toLowerCase().trim();
  if (!e) return false;
  const reg = regMsOf(recDoc || {});
  if (!reg || reg > Date.now() - INACTIVITY_DAYS * DAY_MS) return false; // not old enough / unknown

  // Any of these → active, so NOT inactive.
  const [sub, asg, ref] = await Promise.all([
    candidateDb.where('recEmail', '==', e).limit(1).get(),
    parDb.where('recruiterEmail', '==', e).where('status', '==', 'approved').limit(1).get(),
    candidateDb.where('referredBy', '==', e).limit(1).get(), // covers both referrals + direct-apply attribution
  ]);
  if (!sub.empty || !asg.empty || !ref.empty) return false;
  return true;
}

// ── Coach / Expert inactivity ─────────────────────────────────────────────────
// Same 4 recruiter conditions PLUS: (5) they have not created a team (no recruiter
// has joined them via an approved coach_team_requests).

async function suspendInactiveCoachesExperts() {
  const cutoff = Date.now() - INACTIVITY_DAYS * DAY_MS;

  const [coachSnap, expertSnap, candSnap, cerSnap, teamSnap] = await Promise.all([
    db.collection('coach_db').get(),
    db.collection('expert_db').get(),
    candidateDb.select('recEmail', 'referredBy', 'source', 'referredViaDirectApply').get(),
    db.collection('coach_expert_requests').select('coachExpertEmail', 'status').get(),
    db.collection('coach_team_requests').where('status', '==', 'approved').select('coachEmail').get(),
  ]);

  const submitted = new Set();
  const referred = new Set();
  const gotDirect = new Set();
  candSnap.docs.forEach((d) => {
    const c = d.data();
    const rec = (c.recEmail || '').toLowerCase().trim();
    if (rec) submitted.add(rec);
    const rb = (c.referredBy || '').toLowerCase().trim();
    if (rb) {
      if ((c.source || '') === 'referred') referred.add(rb);
      if (c.referredViaDirectApply) gotDirect.add(rb);
    }
  });
  const assigned = new Set();
  cerSnap.docs.forEach((d) => {
    const x = d.data();
    const st = (x.status || '').toLowerCase();
    if (st === 'accepted' || st === 'approved') {
      const e = (x.coachExpertEmail || '').toLowerCase().trim();
      if (e) assigned.add(e);
    }
  });
  const teamCreated = new Set();
  teamSnap.docs.forEach((d) => {
    const e = (d.data().coachEmail || '').toLowerCase().trim();
    if (e) teamCreated.add(e);
  });

  const isActive = (email) =>
    submitted.has(email) || assigned.has(email) || referred.has(email) || gotDirect.has(email) || teamCreated.has(email);

  let suspended = 0, scanned = 0, total = 0;
  let batch = db.batch(), ops = 0;
  const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };

  for (const doc of [...coachSnap.docs, ...expertSnap.docs]) {
    total++;
    const r = doc.data();
    const email = (r.email || '').toLowerCase().trim();
    if (!email) continue;
    if (r.accountStatus && r.accountStatus !== 'approved') continue;
    const reg = regMsOf(r);
    if (!reg || reg > cutoff) continue;
    scanned++;
    if (isActive(email)) continue;
    batch.update(doc.ref, {
      accountStatus: 'suspended',
      isActive: false,
      suspendedAt: new Date(),
      suspendedReason: 'inactivity',
    });
    suspended++; ops++;
    if (ops >= 400) await flush();
  }
  await flush();
  return { suspended, scanned, total };
}

async function isCoachExpertInactiveByEmail(email, doc) {
  const e = (email || '').toLowerCase().trim();
  if (!e) return false;
  const reg = regMsOf(doc || {});
  if (!reg || reg > Date.now() - INACTIVITY_DAYS * DAY_MS) return false;

  const [sub, ref, cer, team] = await Promise.all([
    candidateDb.where('recEmail', '==', e).limit(1).get(),
    candidateDb.where('referredBy', '==', e).limit(1).get(),
    db.collection('coach_expert_requests').where('coachExpertEmail', '==', e).where('status', 'in', ['accepted', 'approved']).limit(1).get(),
    db.collection('coach_team_requests').where('coachEmail', '==', e).where('status', '==', 'approved').limit(1).get(),
  ]);
  if (!sub.empty || !ref.empty || !cer.empty || !team.empty) return false;
  return true;
}

module.exports = {
  suspendInactiveRecruiters, isRecruiterInactiveByEmail,
  suspendInactiveCoachesExperts, isCoachExpertInactiveByEmail,
  SUSPENSION_MESSAGE, INACTIVITY_DAYS,
};
