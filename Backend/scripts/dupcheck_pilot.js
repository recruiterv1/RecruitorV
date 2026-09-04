#!/usr/bin/env node
// Start or stop the client-portal duplicate-check pilot.
//
//   node scripts/dupcheck_pilot.js status
//   node scripts/dupcheck_pilot.js on  <recruiter-email> [more emails...]
//   node scripts/dupcheck_pilot.js checkers <email> [more emails...]
//   node scripts/dupcheck_pilot.js off
//
// "off" is the panic button: one write and every recruiter is back to the
// form exactly as it behaves today. Nothing else needs redeploying.

const { db } = require('../router/firebase_ad');
const DOC = db.collection('app_config').doc('duplicate_check');
const [cmd, ...args] = process.argv.slice(2);

const show = async () => {
  const d = await DOC.get();
  if (!d.exists) return console.log('Pilot is OFF (no config document).');
  const c = d.data();
  console.log('enabled         :', c.enabled === true);
  console.log('pilotRecruiters :', (c.pilotRecruiters || []).join(', ') || '(none)');
  console.log('checkers        :', (c.checkers || []).join(', ') || '(none)');
  console.log('clients         :', Object.entries(c.clients || {})
    .map(([k, v]) => `${k}${v.enabled ? '' : ' (off)'}`).join(', ') || '(none)');
  const q = await db.collection('duplicate_check_requests').where('status', '==', 'pending').get();
  console.log('pending checks  :', q.size);
};

(async () => {
  if (cmd === 'on') {
    if (!args.length) { console.error('Give at least one recruiter email.'); process.exit(1); }
    await DOC.set({
      enabled: true,
      pilotRecruiters: args.map(e => e.toLowerCase()),
      clients: { LTIMindtree: { enabled: true, portalName: 'RippleHire',
                                portalUrl: 'https://ltimindtreeapp.ripplehire.com/vendor/agency#list' } },
    }, { merge: true });
    console.log('Pilot ON for:', args.join(', '));
    console.log('Everyone else sees the form exactly as before.\n');
  } else if (cmd === 'checkers') {
    if (!args.length) { console.error('Give at least one checker email.'); process.exit(1); }
    await DOC.set({ checkers: args.map(e => e.toLowerCase()) }, { merge: true });
    console.log('Checkers set:', args.join(', '));
    console.log('They answer at /duplicate-check-queue\n');
  } else if (cmd === 'off') {
    await DOC.set({ enabled: false }, { merge: true });
    console.log('Pilot OFF. Every recruiter is back to the current form.\n');
  } else if (cmd !== 'status') {
    console.log('Usage: status | on <emails...> | checkers <emails...> | off');
    process.exit(1);
  }
  await show();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
