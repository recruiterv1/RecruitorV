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
const RECRUITER = 'atulkumar@yopmail.com';
const SPOC = 'chandan.dhami@changeleaders.in';
const OTHER_COACH = 'other.coach@recruiterv.invalid';

const H = 3600 * 1000;
const ago = (ms) => new Date(Date.now() - ms);
const ahead = (ms) => new Date(Date.now() + ms);

// Candidates are invented, but the positions are real ones the pilot coach is
// assigned to and has a ready briefing on. Since the bin now only shows a coach
// positions they qualify for, an invented pos_id would be filtered straight out
// and the fixture would look empty. Nothing real is submitted against these —
// the fixture writes its rows directly, and the hold allowlist stays empty.
const POSITIONS = [
  { pos_id: '2839', position: 'Data Engineer - SNP Glue + Snowflake', client: 'LTM', skill_category: 'Technology' },
  { pos_id: '2646', position: 'Relationship Manager - Wealth Vertical', client: 'TATA Capital', skill_category: 'Banking' },
];

// One row per state worth seeing, with the timers set so each is genuinely in
// that state rather than merely labelled as it.
const CASES = [
  { name: 'Aarti Menon',    pos: 0, submittedAgo: 0.4 * H, state: 'open',             match: 88,
    employer: 'Zeta Analytics', totalExp: '8', relExp: '6', ctc: '26,00,000', expCtc: '34,00,000',
    loc: 'Pune', notice: '60 days', skills: 'Snowflake, dbt, Airflow, Python' },
  { name: 'Rahul Verma',    pos: 0, submittedAgo: 1.2 * H, state: 'open',             match: 71,
    title: 'Data engineer, Airflow heavy' },
  { name: 'Sneha Iyer',     pos: 1, submittedAgo: 3.6 * H, state: 'open',             match: 64,
    employer: 'Meridian Private Bank', totalExp: '5', relExp: '4', ctc: '12,00,000', expCtc: '16,00,000',
    loc: 'Mumbai', notice: '30 days', education: 'MBA Finance', skills: 'Wealth advisory, HNI relationships' },
  { name: 'Imran Qureshi',  pos: 0, submittedAgo: 1.0 * H, state: 'claimed_by_me',    match: 79,
    title: 'Senior data engineer' },
  { name: 'Divya Nair',     pos: 1, submittedAgo: 2.0 * H, state: 'claimed_by_other', match: 55,
    title: 'RM, mostly retail liabilities' },
  { name: 'Karan Malhotra', pos: 0, submittedAgo: 2.5 * H, state: 'claim_lapsed',     match: 82,
    title: 'Snowflake architect' },

  // Already decided, so the recruiter and the Reviewed tab have content.
  { name: 'Priya Deshpande', pos: 0, submittedAgo: 2.2 * H, state: 'approved',        match: 91,
    reason: 'Strong Snowflake and dbt ownership, and has run migrations at this scale before.',
    briefing: 'Push on the data-modelling half at interview — that is where the role really sits. She has led two migrations end to end.',
    suitability: 'Strong fit, can start on the modelling work immediately.',
    comments: 'Notice period is 30 days, negotiable to 20.' },

  { name: 'John Smith',      pos: 1, submittedAgo: 1.6 * H, state: 'rejected',        match: 48,
    reason: 'Good PHP background but not enough Laravel depth for this requirement.',
    briefing: 'Candidate has solid general PHP experience but does not appear to have production Laravel ownership, which this role needs from day one.',
    comments: 'Worth keeping for a general backend role.' },

  // Rejected AND already appealed, with the coach's view in — this is what the
  // Client SPOC's queue is for.
  { name: 'Meera Krishnan',  pos: 1, submittedAgo: 3.0 * H, state: 'appealed',        match: 67,
    employer: 'Crestline Wealth', totalExp: '6', relExp: '3', ctc: '14,00,000', expCtc: '19,00,000',
    loc: 'Bengaluru', notice: '45 days', education: 'MBA Finance', skills: 'Portfolio advisory, HNI',
    reason: 'Wealth experience looks thin for a senior RM brief.',
    briefing: 'Three years is on the light side against the eight the client asked for, and the book size is not stated on the CV.',
    recruiterPoints: 'Her book was 120 crore at her last employer — it is not on the CV but I confirmed it on the call, and she handled HNI clients directly. I think the three years understates her.',
    coachFeedback: 'Fair point on the book size, I had only the CV to go on. I would still flag the tenure but I am comfortable if the client wants to meet her.' },

  // This coach already spent their hour on this one and released it. Clicking
  // Claim should refuse with the cooling-off countdown, and it should still be
  // claimable by anybody else.
  { name: 'Anand Pillai',   pos: 0, submittedAgo: 1.5 * H, state: 'hour_spent',       match: 74,
    employer: 'Northwind Data', totalExp: '7', relExp: '5', ctc: '21,00,000', expCtc: '27,00,000',
    loc: 'Hyderabad', notice: '30 days', skills: 'Snowflake, Python, Kafka' },

  // Past the 4-hour window.
  { name: 'Pooja Shetty',   pos: 1, submittedAgo: 5.0 * H, state: 'missed',           match: 47,
    title: 'RM, 2 yrs' },
  { name: 'Vikram Rao',     pos: 0, submittedAgo: 6.0 * H, state: 'missed_rejected',  match: 38,
    reason: 'Does not meet the Snowflake requirement.',
    briefing: 'Two years of general SQL, no warehouse ownership. Not close enough for this brief.' },
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
      clientspoc: SPOC,
      // An appealed candidate is still rejected until the client says otherwise.
      statusa: ['rejected','missed_rejected','appealed'].includes(c.state) ? 'Rejected'
        : c.state === 'approved' ? 'Submitted' : 'In Review',
      matchPercent: c.match,
      matchSummary: `Demo score ${c.match} — synthetic fixture, not a real assessment.`,
      // Enough of a profile for the review screen to be worth looking at. All
      // invented; no real candidate's details are copied here.
      curr_emp: c.employer || 'Demo Technologies Pvt Ltd',
      total_exp: c.totalExp || '7',
      rel_exp: c.relExp || '5',
      current_ctc: c.ctc || '18,00,000',
      exp_ctc: c.expCtc || '24,00,000',
      curr_loc: c.loc || 'Pune',
      pref_loc: c.prefLoc || 'Pune, Bengaluru',
      notice_period: c.notice || '30 days',
      highest_education: c.education || 'B.E. Computer Science',
      tech_skill: c.skills || 'SQL, Python, Snowflake, dbt',
      // A public dummy PDF, so 'View CV' opens something real without using
      // anybody's actual resume.
      cv_data: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      addedBy: RECRUITER,
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
      clientspoc: SPOC,
      recruiterEmail: RECRUITER,
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
        status: 'claimed', claimedBy: OTHER_COACH,
        claimedAt: ago(0.3 * H), claimExpiresAt: ahead(0.7 * H),
      });
    }
    if (c.state === 'claim_lapsed') {
      // Claimed two hours ago with a one-hour window: lapsed, so it must read as
      // available again — the case that proves claims do not lock for ever.
      Object.assign(entry, {
        status: 'claimed', claimedBy: OTHER_COACH,
        claimedAt: ago(2 * H), claimExpiresAt: ago(1 * H),
      });
    }
    if (c.state === 'approved' || c.state === 'rejected' || c.state === 'appealed') {
      const rejected = c.state !== 'approved';
      Object.assign(entry, {
        status: rejected ? 'rejected' : 'approved',
        decision: rejected ? 'reject' : 'approve',
        reason: c.reason || '', briefing: c.briefing || '',
        comments: c.comments || '', suitability: c.suitability || '',
        reviewedBy: COACH, reviewedByName: 'Mkumar', reviewedAt: ago(c.submittedAgo - 0.5 * H),
      });
    }
    if (c.state === 'appealed') {
      // Raised by the recruiter, seen by the coach, still with the client.
      entry.secondReview = {
        requestedBy: RECRUITER,
        requestedAt: ago(0.6 * H),
        recruiterPoints: c.recruiterPoints,
        status: 'open',
        coachFeedback: c.coachFeedback || '',
        coachDecision: '',
        coachRespondedAt: c.coachFeedback ? ago(0.3 * H) : null,
        spocFeedback: '', spocDecision: '', spocRespondedAt: null,
        outcome: '',
      };
    }
    if (c.state === 'hour_spent') {
      // First claimed 70 minutes ago: the hour is gone, the 15-minute cooling-off
      // is still running.
      entry.claimHistory = { [COACH.replace(/[.]/g, '_')]: ago(70 * 60 * 1000) };
    }
    if (c.state === 'missed_rejected') {
      Object.assign(entry, {
        status: 'rejected', decision: 'reject',
        reason: c.reason || '', briefing: c.briefing || '',
        reviewedBy: OTHER_COACH, reviewedByName: 'Another Coach', reviewedAt: ago(4.5 * H),
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
