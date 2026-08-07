/**
 * READ-ONLY review export. Lists every candidate that WOULD be set to
 * "Position On Hold" by the proposed change:
 *   - candidate is on a position that is NOT active, AND
 *   - candidate's current status is NOT a reject status.
 *
 * Makes NO changes. Writes an Excel file for review.
 *
 * Active-position rule (same as the rest of the app): status is empty OR
 * contains the word "active". Anything else (On Hold, Closed, Filled, …) is
 * treated as not-active.
 *
 * Usage: node scripts/exportOnHoldCandidates.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const path = require('path');
const XLSX = require('xlsx');
const { db } = require('../router/firebase_ad');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const isActivePos = (st) => { const s = lc(st); return s === '' || s.includes('active'); };

const REJECTED_STATUSES = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
]);

// Statuses worth a second look before putting on hold (candidate is far along).
const ADVANCED = new Set(['to be offered', 'offer accepted', 'joining', 'test select', 'negotiation scheduled']);

(async () => {
  console.log('\n=== Export candidates for "Position On Hold" review (READ-ONLY) ===\n');

  // 1) Inactive positions.
  const posSnap = await db.collection('admin_AddPos').get();
  const inactivePos = {};
  posSnap.docs.forEach(d => {
    const p = d.data();
    if (!isActivePos(p.status) && p.pos_id) {
      inactivePos[p.pos_id] = {
        position: p.position || '', client: p.client || '', status: p.status || '',
        hr_name: p.hr_name || '', clientspoc: p.clientspoc || '',
      };
    }
  });
  console.log(`Total positions      : ${posSnap.size}`);
  console.log(`Inactive positions   : ${Object.keys(inactivePos).length}`);

  // 2) Candidates on those positions whose status is not a reject status.
  const candSnap = await db.collection('candidate_db').get();
  const rows = [];
  const byStatus = {};
  candSnap.docs.forEach(d => {
    const c = d.data();
    const pid = c.pos_id;
    if (!pid || !inactivePos[pid]) return;
    const st = lc(c.statusa);
    if (REJECTED_STATUSES.has(st)) return;             // skip rejects
    const pos = inactivePos[pid];
    byStatus[c.statusa || '(blank)'] = (byStatus[c.statusa || '(blank)'] || 0) + 1;
    rows.push({
      'Candidate Name': c.candidate || '',
      'Email': c.emails || c.email || '',
      'Phone': c.mob || '',
      'Position': c.pos_name || pos.position,
      'Client': c.client || pos.client,
      'Pos ID': pid,
      'Position Status': pos.status || '(blank)',
      'Current Candidate Status': c.statusa || '(blank)',
      'Will Change To': 'Position On Hold',
      'Already On Hold': st === 'position on hold' ? 'Yes (no change)' : 'No',
      'Review Note': ADVANCED.has(st) ? 'ADVANCED STAGE — review before hold' : '',
      'Recruiter': c.recName || '',
      'Source': c.source || '',
      'Candidate Doc ID': d.id,
    });
  });

  rows.sort((a, b) =>
    String(a.Client).localeCompare(String(b.Client)) ||
    String(a.Position).localeCompare(String(b.Position)) ||
    String(a['Candidate Name']).localeCompare(String(b['Candidate Name'])));

  console.log(`Candidates to change : ${rows.length}\n`);
  console.log('Breakdown by current status:');
  Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`  ${s.padEnd(28)} ${n}`));

  const advancedCount = rows.filter(r => r['Review Note']).length;
  if (advancedCount) console.log(`\n⚠ ${advancedCount} candidate(s) are at an ADVANCED stage (offer/joining/negotiation) — flagged in the sheet.`);

  // 3) Write Excel.
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
    { wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 34 }, { wch: 18 }, { wch: 16 }, { wch: 24 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Position On Hold');
  const out = path.join(__dirname, '..', '..', 'candidates_position_on_hold_review.xlsx');
  XLSX.writeFile(wb, out);
  console.log(`\n✅ Written: ${out}\n`);
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
