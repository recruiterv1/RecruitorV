const { db } = require('./router/firebase_ad');
const { getMatchingRejectedCandidates, buildJd } = require('./utils/resumeBankMatch');
(async () => {
  const snap = await db.collection('admin_AddPos').where('pos_id','==','2454').limit(1).get();
  if (snap.empty) { console.log('Position 2454 NOT FOUND'); process.exit(0); }
  const pos = snap.docs[0].data();
  console.log('Position:', pos.position, '@', pos.client, '| status:', pos.status);
  const jd = buildJd(pos);
  console.log('JD totalW (skill weight):', jd.totalW, '| m_have:', JSON.stringify(pos.m_have||'').slice(0,80));
  for (const th of [70, 60, 50, 40]) {
    const list = await getMatchingRejectedCandidates(db, pos, th);
    console.log(`threshold ${th}: ${list.length} rejected matches`);
    if (th===70 && list.length) list.slice(0,5).forEach(c=>console.log(`   • ${c.candidate} ${c.matchPercent}% [${c.statusa}]`));
  }
  process.exit(0);
})();
