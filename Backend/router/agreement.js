const express = require('express');
const recruiterF = require('../model_fire/recruiterF');
const coachF = require('../model_fire/coachF');
const expertF = require('../model_fire/expertF');
const { db, admin } = require('./firebase_ad');
const router = express.Router();
const { sendEmailFull } = require('../utils/email');

/**
 * POST /submit
 * Accept agreement submission and send PDF attachment via email
 * Body:
 * {
 *   role: 'Recruiter' | 'Coach' | 'Expert',
 *   user: { name, email, id, pan, aadhaar, address },
 *   meta: { timestamp, ip, version },
 *   pdfBase64: 'data:application/pdf;base64,...' or pure base64,
 *   fileName: 'Agreement.pdf'
 * }
 */
router.post('/submit', async (req, res) => {
  try {
    const { role, user, meta, pdfBase64, fileName, commisiontype } = req.body || {};
    const userEmail = (user?.email || '').toLowerCase();

    console.log(`📝 Agreement submit: role=${role}, email=${userEmail}, pdfSize=${pdfBase64?.length || 0}, brevoKey=${!!process.env.BREVO_API_KEY}`);

    if (!userEmail || !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user.email and pdfBase64'
      });
    }

    const normalizedBase64 = pdfBase64.includes('base64,')
      ? pdfBase64.split('base64,')[1]
      : pdfBase64;

    const recipients = [
      { email: 'recruiterv.noreply@gmail.com' },
      { email: userEmail },
      { email: 'ikumarmrigank@gmail.com' },
      { email: 'roshan@freepathshala.org' }
    ];

    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color:#2563eb;margin:0 0 8px 0;">Agreement Submitted</h2>
        <p style="margin:0 0 12px 0;">A copy of your digitally accepted agreement is attached as PDF.</p>
        <div style="background:#f3f4f6;padding:12px;border-radius:8px;">
          <div><strong>Name:</strong> ${user?.name || ''}</div>
          <div><strong>Email:</strong> ${user?.email || ''}</div>
          ${user?.pan ? `<div><strong>PAN:</strong> ${user.pan}</div>` : ''}
          ${user?.aadhaar ? `<div><strong>Aadhaar:</strong> ${user.aadhaar}</div>` : ''}
          ${user?.address ? `<div><strong>Address:</strong> ${user.address}</div>` : ''}
          <div><strong>Timestamp:</strong> ${meta?.timestamp || new Date().toISOString()}</div>
          ${meta?.ip ? `<div><strong>IP:</strong> ${meta.ip}</div>` : ''}
          ${meta?.version ? `<div><strong>Agreement Version:</strong> ${meta.version}</div>` : ''}
        </div>
        <p style="margin-top:12px;color:#6b7280;">© ${new Date().getFullYear()} RecruiterV</p>
      </div>
    `;

    // Record the acceptance FIRST. The confirmation email is best-effort: if the
    // mail provider is down we must not lose the acceptance, otherwise the user is
    // stuck behind the mandatory agreement gate forever.
    // Update Firestore agreement status (do NOT store PDF base64 — Firestore 1MB doc limit)
    let recorded = false;
    switch ((role || '').toLowerCase()) {
      case 'recruiter': {
        const recruiterDoc = await recruiterF.findRecruiterByEmail(userEmail);
        if (recruiterDoc) {
          await recruiterF.updateRecruiter(recruiterDoc.id, {
            agreementSigned: true,
            agreementRole: role,
            agreementSignedAt: admin.firestore.Timestamp.now(),
            agreementVersion: meta?.version || 'v1.0',
            ...(commisiontype ? { commisiontype } : {})
          });
          recorded = true;
        }
        break;
      }
      case 'coach': {
        const coachDoc = await coachF.findCoachByEmail(userEmail);
        if (coachDoc) {
          await coachF.updateCoach(coachDoc.id, {
            agreementSigned: true,
            agreementRole: role,
            agreementSignedAt: admin.firestore.Timestamp.now(),
            agreementVersion: meta?.version || 'v1.0'
          });
          recorded = true;
        }
        break;
      }
      case 'expert': {
        const expertDoc = await expertF.findExpertByEmail(userEmail);
        if (expertDoc) {
          await expertF.updateExpert(expertDoc.id, {
            agreementSigned: true,
            agreementRole: role,
            agreementSignedAt: admin.firestore.Timestamp.now(),
            agreementVersion: meta?.version || 'v1.0'
          });
          recorded = true;
        }
        break;
      }
    }

    // If no account matched, tell the client instead of reporting a false success —
    // otherwise the user would pass the gate and be re-gated on their next refresh.
    if (!recorded) {
      console.error(`❌ Agreement submit: no ${role} account found for ${userEmail}`);
      return res.status(404).json({ success: false, message: 'Could not find your account to record the agreement. Please contact support.' });
    }

    // Acceptance is safely stored — now try to email the PDF copy.
    let emailSent = true;
    try {
      console.log(`📧 Sending agreement email to ${recipients.length} recipients...`);
      await sendEmailFull({
        to: recipients,
        subject: `Agreement Submitted - ${role || 'RecruiterV'}`,
        htmlContent,
        fromEmail: 'noreply@recruiterv.com',
        fromName: 'RecruiterV Agreements',
        attachment: [{ content: normalizedBase64, name: fileName || `Agreement_${(user?.name || 'User').replace(/\s+/g, '_')}.pdf` }],
      });
      console.log(`✅ Agreement email sent`);
    } catch (mailErr) {
      emailSent = false;
      console.error('⚠️ Agreement email failed (acceptance still recorded):', mailErr.message);
    }

    return res.status(200).json({
      success: true,
      emailSent,
      message: emailSent ? 'Agreement recorded and emailed' : 'Agreement recorded (confirmation email failed)'
    });
  } catch (error) {
    console.error('❌ Agreement submit error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send agreement email',
      error: error.message
    });
  }
});

router.get('/check', async (req, res) => {
  try {
    const { email, role } = req.query;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Missing email or role' });
    }

    const normalizedEmail = email.toLowerCase();
    let userDoc = null;

    switch (role.toLowerCase()) {
      case 'recruiter':
        userDoc = await recruiterF.findRecruiterByEmail(normalizedEmail);
        break;
      case 'coach':
        userDoc = await coachF.findCoachByEmail(normalizedEmail);
        break;
      case 'expert':
        userDoc = await expertF.findExpertByEmail(normalizedEmail);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const submitted = !!(userDoc?.agreementSigned);
    res.json({
      success: true,
      submitted,
      signedAt: userDoc?.agreementSignedAt || null,
      role: userDoc?.roleCategory || role,
      pdfBase64: userDoc?.agreementPdfBase64 || null
    });
  } catch (error) {
    console.error('Agreement check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
