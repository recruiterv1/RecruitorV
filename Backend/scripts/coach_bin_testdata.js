#!/usr/bin/env node
// Synthetic data for trying the Coach/Expert Bin, kept entirely separate from
// live candidates and positions.
//
//   node scripts/coach_bin_testdata.js create   — build the fixture
//   node scripts/coach_bin_testdata.js show     — print the current state
//   node scripts/coach_bin_testdata.js remove   — delete every trace of it
//
// Everything it writes carries testFixture: 'coach_bin_demo', and remove()
// deletes strictly on that marker, so nothing real can be caught by it.

const { db } = require('../router/firebase_ad');
const MARK = 'coach_bin_demo';
const COACH = 'mkumar@yopmail.com';

const H = 3600 * 1000;
const ago = (ms) => new Date(Date.now() - ms);
const ahead = (ms) => new Date(Date.now() + ms);

// Positions and candidates invented for the demo — prefixed so they can never
// collide with a real pos_id.
const POSITIONS = [
  { pos_id: 'TEST-BIN-1', position: 'Senior Snowflake Data Engineer', client: 'Demo Client A', skill_category: 'Technology' },
  { pos_id: 'TEST-BIN-2', position: 'Wealth Relationship Manager',     client: 'Demo Client B', skill_category: 'Banking' },
];

// One row per state worth seeing, with the timers set so each is genuinely in
// that state rather than merely labelled as it.
const CASES = [
  { name: 'Aarti Menon',   pos: 0, submittedAgo: 0.4 * H, state: 'open',            match: 88 },
  { name: 'Rahul Verma',   pos: 0, submittedAgo: 1.2 * H, state: 'open',            match: 71 },
  { name: 'Sneha Iyer',    pos: 1, submittedAgo: 3.6 * H, state: 'open',            match: 64 },   // nearly out of time
  { name: 'Imran Qureshi', pos: 0, submittedAgo: 1.0 * H, state: 'claimed_by_me',   match: 79 },
  { name: 'Divya Nair',    pos: 1, submittedAgo: 2.0 * H, state: 'claimed_by_other', match: 55 },
  { name: 'Karan Malhotra',pos: 0, submittedAgo: 2.5 * H, state: 'claim_lapsed',    match: 82 },   // claimed 2h ago, back in the pool
  { name: 'Pooja Shetty',  pos: 1, submittedAgo: 5.0 * H, state: 'missed',          match: 47 },   // past 4h
  { name: 'Vikram Rao',    pos: 0, submittedAgo: 6.0 * H, state: 'missed_rejected', match: 38 },
];

const create = async () => {
  const now = new Date();
  let candidates = 0, entries = 0;

  for (const c of CASES) {
    const p = POSITIONS[c.pos];
    const submittedAt = ago(c.submittedAgo);
    const expiresAt = new Date(submittedAt.getTime() + 4 * H);

    // The candidate record, marked so it is never mistaken for a real one.
    const candRef = await db.collection('candidate_db').add({
      testFixture: MARK,
      candidate: c.name,
      emails: `${c.name.toLowerCase().replace(/\s+/g, '.')}@demo.invalid`,
      mob: '9' + String(Math.floor(100000000 + Math.random() * 899999999)),
      pos_id: p.pos_id,
      pos_name: p.position,
      client: p.client,
      clientspoc: 'demo.spoc@recruiterv.invalid',
      statusa: c.state === 'missed_rejected' ? 'Rejected' : 'In Review',
      matchPercent: c.match,
      matchSummary: `Demo score ${c.match} — synthetic fixture, not a real assessment.`,
      addedBy: 'demo.recruiter@recruiterv.invalid',
      datePosted: submittedAt,
      createdAt: now,
    });
    candidates++;

    const entry = {
      testFixture: MARK,
      candidateId: candRef.id,
      candidateName: c.name,
      pos_id: p.pos_id,
      positionTitle: p.position,
      client: p.client,
      skillCategory: p.skill_category,
      clientspoc: 'demo.spoc@recruiterv.invalid',
      recruiterEmail: 'demo.recruiter@recruiterv.invalid',
      matchPercent: c.match,
      submittedAt,
      expiresAt,
      status: 'open',
      claimedBy: '', claimedAt: null, claimExpiresAt: null,
      decision: '', reason: '', briefing: '', reviewedBy: '', reviewedAt: null,
      createdAt: now,
    };

    if (c.state === 'claimed_by_me') {
      Object.assign(entry, {
        status: 'claimed', claimedBy: COACH,
        claimedAt: ago(0.2 * H), claimExpiresAt: ahead(0.8 * H),
      });
    }
    if (c.state === 'claimed_by_other') {
      Object.assign(entry, {
        status: 'claimed', claimedBy: 'other.coach@recruiterv.invalid',
        claimedAt: ago(0.3 * H), claimExpiresAt: ahead(0.7 * H),
      });
    }
    if (c.state === 'claim_lapsed') {
      // Claimed two hours ago with a one-hour window: lapsed, so it must read as
      // available again — the case that proves claims do not lock for ever.
      Object.assign(entry, {
        status: 'claimed', claimedBy: 'other.coach@recruiterv.invalid',
        claimedAt: ago(2 * H), claimExpiresAt: ago(1 * H),
      });
    }
    if (c.state === 'missed_rejected') {
      Object.assign(entry, {
        status: 'rejected', decision: 'reject',
        reason: 'Insufficient Laravel depth for this requirement.',
        briefing: 'Good general PHP background, but the role needs production Laravel ownership.',
        reviewedBy: 'other.coach@recruiterv.invalid', reviewedAt: ago(4.5 * H),
      });
    }

    await db.collection('coach_bin').add(entry);
    entries++;
  }

  console.log(`created ${candidates} demo candidates and ${entries} bin entries`);
};

const show = async () => {
  const snap = await db.collection('coach_bin').where('testFixture', '==', MARK).get();
  const ms = v => v?._seconds ? v._seconds * 1000 : 0;
  const dur = (m) => {
    if (m <= 0) return 'expired';
    const h = Math.floor(m / H), mn = Math.floor((m % H) / 60000);
    return `${String(h).padStart(2, '0')}h ${String(mn).padStart(2, '0')}m`;
  };
  const rows = snap.docs.map(d => d.data()).sort((a, b) => ms(a.expiresAt) - ms(b.expiresAt));
  console.log('');
  console.log('CANDIDATE          POSITION                        MATCH  AVAILABLE FOR  STATE');
  console.log('─'.repeat(96));
  rows.forEach(d => {
    const left = ms(d.expiresAt) - Date.now();
    const claimLeft = d.claimExpiresAt ? ms(d.claimExpiresAt) - Date.now() : 0;
    let state;
    if (['approved', 'rejected'].includes(d.status)) state = d.status.toUpperCase() + ' by ' + (d.reviewedBy || '').split('@')[0];
    else if (left <= 0) state = 'MISSED — no longer claimable';
    else if (d.status === 'claimed' && claimLeft > 0) {
      state = d.claimedBy === COACH ? `CLAIMED BY YOU (${dur(claimLeft)} to review)` : `claimed by ${d.claimedBy.split('@')[0]}`;
    } else if (d.status === 'claimed') state = 'OPEN (previous claim lapsed)';
    else state = 'OPEN';
    console.log(
      String(d.candidateName).padEnd(18) +
      String(d.positionTitle).slice(0, 30).padEnd(32) +
      String(d.matchPercent + '%').padEnd(7) +
      dur(left).padEnd(15) +
      state
    );
  });
  console.log('');
  console.log(`${rows.length} fixture entries. Coach ${COACH} sees the OPEN and CLAIMED-BY-YOU rows in the Bin;`);
  console.log('MISSED rows appear under Missed CVs and cannot be approved or rejected.');
};

const remove = async () => {
  let n = 0;
  for (const col of ['coach_bin', 'candidate_db']) {
    const snap = await db.collection(col).where('testFixture', '==', MARK).get();
    for (const d of snap.docs) { await d.ref.delete(); n++; }
  }
  // Prove nothing marked survives.
  let left = 0;
  for (const col of ['coach_bin', 'candidate_db']) {
    const s = await db.collection(col).where('testFixture', '==', MARK).get();
    left += s.size;
  }
  console.log(`deleted ${n} fixture records; ${left} remaining`);
};

const cmd = process.argv[2];
({ create, show, remove }[cmd] || (() => {
  console.log('usage: create | show | remove');
  process.exit(1);
}))().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
