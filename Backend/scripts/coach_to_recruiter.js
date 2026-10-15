#!/usr/bin/env node
// Give active coaches and experts a recruiter account, so they can keep working
// while the Coach/Expert side is closed.
//
//   node scripts/coach_to_recruiter.js dry    — show what would happen
//   node scripts/coach_to_recruiter.js run    — do it
//   node scripts/coach_to_recruiter.js undo   — remove only what this created
//
// Three rules throughout:
//   · Only approved accounts. Suspended and blocked ones were already inactive;
//     converting them would revive dead accounts into the recruiter lists.
//   · Anyone who already has a recruiter account on that email is skipped. They
//     can already sign in; touching their profile risks overwriting what they
//     have entered as a recruiter.
//   · The coach record is left exactly as it is. Nothing is moved or deleted,
//     so this is reversible and the briefings and assignment history survive.

const { db } = require('./../router/firebase_ad');

const MARK = 'converted_from_coach_expert';
const lc = (s) => String(s || '').toLowerCase().trim();

const load = async () => {
  const [coach, expert, rec] = await Promise.all([
    db.collection('coach_db').get(),
    db.collection('expert_db').get(),
    db.collection('recruiter_db').select('email').get(),
  ]);
  return {
    sources: [
      ...coach.docs.map(d => ({ from: 'Coach', id: d.id, ...d.data() })),
      ...expert.docs.map(d => ({ from: 'Expert', id: d.id, ...d.data() })),
    ],
    existing: new Set(rec.docs.map(d => lc(d.data().email))),
  };
};

const main = async () => {
  const mode = process.argv[2] || 'dry';

  if (mode === 'undo') {
    const snap = await db.collection('recruiter_db').where('convertedFrom', '==', MARK).get();
    if (mode === 'undo') {
      for (const d of snap.docs) await d.ref.delete();
      console.log(`removed ${snap.size} recruiter accounts created by this script`);
      console.log('coach and expert records were never touched, so nothing else changed');
    }
    process.exit(0);
  }

  const { sources, existing } = await load();
  const skipped = { inactive: 0, alreadyRecruiter: 0, noEmail: 0 };
  const todo = [];

  for (const s of sources) {
    const email = lc(s.email);
    if (!email) { skipped.noEmail++; continue; }
    if (s.accountStatus !== 'approved') { skipped.inactive++; continue; }
    if (existing.has(email)) { skipped.alreadyRecruiter++; continue; }
    todo.push(s);
  }

  console.log(`${sources.length} coach/expert records`);
  console.log(`  skipped — not approved          : ${skipped.inactive}`);
  console.log(`  skipped — already a recruiter   : ${skipped.alreadyRecruiter}`);
  console.log(`  skipped — no email              : ${skipped.noEmail}`);
  console.log(`  to convert                      : ${todo.length}\n`);

  todo.slice(0, 8).forEach(s => console.log(
    `   ${(s.name || '—').slice(0, 24).padEnd(26)}${s.email.padEnd(34)}${s.from}`));
  if (todo.length > 8) console.log(`   …and ${todo.length - 8} more`);

  if (mode !== 'run') { console.log('\n(dry run — nothing written)'); process.exit(0); }

  let made = 0;
  let batch = db.batch(), ops = 0;
  for (const s of todo) {
    const ref = db.collection('recruiter_db').doc();
    batch.set(ref, {
      name: s.name || '',
      email: lc(s.email),
      mobile: s.mobile || s.phone || '',
      // The same hash, so they sign in with the password they already have.
      password: s.password || '',
      roleCategory: 'Recruiter',
      accountStatus: 'approved',
      isActive: true,
      skillCategory: Array.isArray(s.skillCategory) ? s.skillCategory : (s.skillCategory ? [s.skillCategory] : []),
      specialization: s.specialization || '',
      experienceCategory: s.experienceCategory || '',
      availability: Array.isArray(s.availability) ? s.availability : [],
      resumeUrl: s.resumeUrl || '',
      bio: s.bio || '',
      // Free plan, same as any new recruiter.
      planType: 0,
      maxPositions: 4,
      agreementSigned: !!s.agreementSigned,
      // The eligibility they already passed carries over — they have earned it.
      eligibilityTier: s.eligibilityTier || '',
      eligibilityPercent: s.eligibilityPercent ?? null,
      certificateId: s.certificateId || '',
      // Provenance, so this run can be found and undone.
      convertedFrom: MARK,
      convertedFromRole: s.from,
      convertedFromId: s.id,
      convertedAt: new Date(),
      createdAt: new Date(),
    });
    made++; ops++;
    if (ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops) await batch.commit();

  console.log(`\ncreated ${made} recruiter accounts`);
  console.log('coach and expert records untouched — run "undo" to reverse this');
  process.exit(0);
};

main().catch(e => { console.error(e); process.exit(1); });
