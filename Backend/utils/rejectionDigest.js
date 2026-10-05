// Monthly note to a recruiter: the reasons their CVs came back, and what the
// reasons list says to do about each one.
//
// A rejection arrives one at a time and reads as bad luck. The pattern across a
// month is the thing worth acting on, and only we can see it.

const { db } = require('../router/firebase_ad');

const lc = (s) => String(s || '').toLowerCase().trim();

const sendMonthlyRejectionDigest = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const ms = v => (v?._seconds ? v._seconds * 1000 : (v?.toMillis ? v.toMillis() : 0));

  const snap = await db.collection('coach_bin').get();
  const rows = snap.docs.map(d => d.data())
    .filter(r => r.decision === 'reject' && ms(r.reviewedAt) >= since.getTime());

  // Group by recruiter, then by reason.
  const byRecruiter = {};
  rows.forEach(r => {
    const e = lc(r.recruiterEmail);
    const label = String(r.rejectCategory || '').trim();
    if (!e || !label) return;
    byRecruiter[e] = byRecruiter[e] || {};
    byRecruiter[e][label] = (byRecruiter[e][label] || 0) + 1;
  });

  const { sendEmail, renderEmail } = require('./email');
  const { guidanceFor } = require('../router/reviewReasons');
  const sent = [];

  for (const [email, counts] of Object.entries(byRecruiter)) {
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    // One rejection is not a pattern, and writing to someone about it reads as
    // nagging. Two is the smallest number worth a letter.
    if (total < 2) continue;

    const items = [];
    for (const [label, count] of top) {
      const guidance = await guidanceFor(label);
      items.push(`<li style="margin-bottom:14px">
        <strong>${label}</strong> — ${count} time${count === 1 ? '' : 's'}
        ${guidance ? `<div style="color:#444;font-size:13px;margin-top:4px">${guidance}</div>` : ''}
      </li>`);
    }

    const html = `<p>Hello,</p>
      <p>Over the last ${days} days, ${total} of your candidates were turned down at review.
      These were the reasons that came up most:</p>
      <ul style="padding-left:18px">${items.join('')}</ul>
      <p>Checking these before you submit is the quickest way to get more of your CVs through.</p>
      <p><a href="https://www.recruiterv.com/my-submissions">See your submissions</a></p>`;

    try {
      // Rendered through the designer so it can be reworded or paused; the
      // wording built above is what sends until someone writes a template.
      const _r = await renderEmail('rejectionDigest',
        { userName: '', total: String(total), days: String(days), dashboardUrl: 'https://www.recruiterv.com/my-submissions' },
        { subject: 'Why your CVs came back this month', htmlContent: html });
      if (!_r.htmlContent) continue;           // paused
      await sendEmail(email, _r.subject, _r.htmlContent);
      sent.push(email);
    } catch (e) {
      // One bad address must not stop the rest of the run.
      console.error('rejection digest failed for', email, e.message);
    }
  }

  return { recruiters: Object.keys(byRecruiter).length, sent: sent.length, rejections: rows.length };
};

module.exports = { sendMonthlyRejectionDigest };
