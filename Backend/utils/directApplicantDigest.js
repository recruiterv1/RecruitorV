// ─────────────────────────────────────────────────────────────────────────────
// Daily direct-applicant digest.
//
// Instead of emailing on every direct-apply submission, we collect the last 24h
// of direct applicants and send ONE summary email at 7 AM IST to each recipient:
//   • Recruiter / Coach / Expert — applicants who applied via THEIR share link
//     (candidate.recEmail, recRole in Recruiter/Coach/Expert)
//   • ClientSPOC — applicants who applied anonymously to their position
//     (candidate.clientspoc)
// The email is a table: Name · Phone · Email · Position.
// ─────────────────────────────────────────────────────────────────────────────
const { db } = require('../router/firebase_ad');
const { sendEmailFull } = require('./email');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'object' && typeof v._seconds === 'number') return v._seconds * 1000;
  if (typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const buildHtml = (name, rows) => {
  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 ? '#f9fafb' : '#ffffff'};">
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:13px;color:#111827;">${esc(r.name)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:13px;color:#374151;">${esc(r.phone)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:13px;color:#374151;">${esc(r.email)}</td>
      <td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:13px;color:#374151;">${esc(r.position)}</td>
    </tr>`).join('');
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:20px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#f97316);padding:16px 22px;">
        <span style="color:#fff;font-size:18px;font-weight:800;">RecruiterV</span>
      </div>
      <div style="padding:22px;color:#1f2937;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#111827;">Your direct applicants — daily summary</h2>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">Hi ${esc(name || 'there')}, here are the ${rows.length} candidate${rows.length === 1 ? '' : 's'} who applied through your shared position link${rows.length === 1 ? '' : 's'} in the last 24 hours.</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#111827;">
              <th style="padding:9px 10px;border:1px solid #e5e7eb;font-size:12px;color:#fff;text-align:left;">Name</th>
              <th style="padding:9px 10px;border:1px solid #e5e7eb;font-size:12px;color:#fff;text-align:left;">Phone</th>
              <th style="padding:9px 10px;border:1px solid #e5e7eb;font-size:12px;color:#fff;text-align:left;">Email</th>
              <th style="padding:9px 10px;border:1px solid #e5e7eb;font-size:12px;color:#fff;text-align:left;">Position</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">Log in to RecruiterV to review and action these applicants.</p>
      </div>
      <div style="padding:12px 22px;border-top:1px solid #f0f0f0;color:#9ca3af;font-size:11px;">© RecruiterV</div>
    </div>
  </div>`;
};

// Send the digest for direct applicants created in the last `windowHours` hours.
async function sendDailyDirectApplicantDigest(windowHours = 24) {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;

  // Single-field range query (no composite index); filter source in memory.
  const snap = await db.collection('candidate_db').where('datePosted', '>=', new Date(cutoff)).get();

  // recipientEmail -> { name, rows: [{name,phone,email,position}] }
  const groups = new Map();
  const spocNameCache = new Map();

  const addRow = (email, name, row) => {
    const key = (email || '').toLowerCase().trim();
    if (!key) return;
    if (!groups.has(key)) groups.set(key, { name: name || '', rows: [] });
    const g = groups.get(key);
    if (!g.name && name) g.name = name;
    g.rows.push(row);
  };

  for (const doc of snap.docs) {
    const c = doc.data();
    if (c.source !== 'direct_apply') continue;
    const row = {
      name: c.candidate || '',
      phone: c.mob || '',
      email: c.emails || '',
      position: c.pos_name || c.position || '',
    };
    const role = (c.recRole || '').toLowerCase();
    if (['recruiter', 'coach', 'expert'].includes(role) && c.recEmail) {
      addRow(c.recEmail, c.recName, row);          // applicant via a sharer's link
    } else if (c.clientspoc) {
      // Resolve SPOC name once per email.
      let spocName = spocNameCache.get(c.clientspoc.toLowerCase());
      if (spocName === undefined) {
        spocName = '';
        try {
          const s = await db.collection('admin_db').where('email', '==', c.clientspoc).limit(1).get();
          if (!s.empty) spocName = s.docs[0].data().name || '';
        } catch (_) {}
        spocNameCache.set(c.clientspoc.toLowerCase(), spocName);
      }
      addRow(c.clientspoc, spocName, row);
    }
  }

  let sent = 0;
  for (const [email, g] of groups) {
    if (!g.rows.length) continue;
    // Newest first
    g.rows.reverse();
    try {
      await sendEmailFull({
        to: email,
        subject: `Your direct applicants — ${g.rows.length} today`,
        htmlContent: buildHtml(g.name, g.rows),
      });
      sent++;
    } catch (e) {
      console.error(`digest email failed for ${email}:`, e.message);
    }
  }
  return { recipients: groups.size, sent, scanned: snap.size };
}

module.exports = { sendDailyDirectApplicantDigest };
