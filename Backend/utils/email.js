const axios = require('axios');

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

/**
 * Core send function — all fields optional except to/subject/htmlContent.
 * @param {Object} opts
 * @param {string|string[]} opts.to            recipient email or array of {email,name} objects
 * @param {string}          opts.subject
 * @param {string}          opts.htmlContent
 * @param {string}          [opts.fromEmail]
 * @param {string}          [opts.fromName]
 * @param {Array}           [opts.cc]          array of {email} objects
 * @param {string}          [opts.replyTo]     reply-to email address
 * @param {Array}           [opts.attachment]  array of {content (base64), name} objects
 */
const sendEmailFull = async ({
  to,
  subject,
  htmlContent,
  fromEmail = 'noreply@recruiterv.com',
  fromName = 'RecruiterV',
  cc,
  replyTo,
  attachment,
}) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set');

  // Normalise `to` — accept a plain string or an array of {email[,name]} objects
  const toList = Array.isArray(to)
    ? to
    : [{ email: to }];

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: toList,
    subject,
    htmlContent,
  };
  if (cc && cc.length) payload.cc = cc;
  if (replyTo) payload.replyTo = { email: replyTo };
  if (attachment && attachment.length) payload.attachment = attachment;

  try {
    const response = await axios.post(BREVO_API, payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });
    const messageId = response.data?.messageId;
    const toAddr = Array.isArray(to) ? to.map(t => t.email || t).join(', ') : to;
    console.log(`✅ Email sent to ${toAddr}: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    console.error(`❌ Email failed:`, error.response?.data || error.message);
    throw new Error(`Email send failed: ${msg}`);
  }
};

/** Convenience wrapper for simple single-recipient emails (backwards-compatible). */
const sendEmail = async (to, subject, htmlContent, fromEmail, fromName) =>
  sendEmailFull({ to, subject, htmlContent, fromEmail, fromName });

// Pre-defined templates
const templates = {
  forgotPassword: (resetLink, userName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your RecruiterV Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
        <hr style="margin: 30px 0;">
        <p>Best,<br><strong>RecruiterV Team</strong></p>
      </div>
    </body>
  </html>
  `,

  welcome: (userName, roleCategory, loginUrl) => {
    const role = (roleCategory || 'Recruiter').trim();

    const roleConfig = {
      Coach: {
        gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
        accent: '#0284c7',
        accentLight: '#e0f2fe',
        accentDark: '#075985',
        icon: '🎓',
        tagline: 'Empower candidates with your expertise',
        steps: [
          { icon: '👤', title: 'Complete Your Profile', desc: 'Add your expertise, certifications and bio so recruiters can match you to the right positions.' },
          { icon: '📋', title: 'Review Assigned Positions', desc: 'Check your dashboard for positions you\'ve been assigned to coach candidates on.' },
          { icon: '🤝', title: 'Start Coaching', desc: 'Connect with candidates, prepare them and track their progress from your dashboard.' },
        ],
      },
      Expert: {
        gradient: 'linear-gradient(135deg, #713f12 0%, #d97706 100%)',
        accent: '#d97706',
        accentLight: '#fef3c7',
        accentDark: '#92400e',
        icon: '⭐',
        tagline: 'Share your domain knowledge and drive results',
        steps: [
          { icon: '👤', title: 'Complete Your Profile', desc: 'Showcase your domain expertise, industry experience and achievements.' },
          { icon: '📋', title: 'Review Assigned Positions', desc: 'Check your dashboard for positions where your expertise is needed.' },
          { icon: '💡', title: 'Provide Expert Guidance', desc: 'Evaluate candidates, share insights and help close positions faster.' },
        ],
      },
      Recruiter: {
        gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        accent: '#2563eb',
        accentLight: '#eff6ff',
        accentDark: '#1e40af',
        icon: '🚀',
        tagline: 'Connect top talent with the right opportunities',
        steps: [
          { icon: '👤', title: 'Complete Your Profile', desc: 'Fill in your experience, skills and commission preferences to get matched with the best positions.' },
          { icon: '📝', title: 'Sign Your Agreement', desc: 'Review and sign your recruiter agreement to unlock access to all open positions.' },
          { icon: '💼', title: 'Browse Open Positions', desc: 'Explore active positions and start submitting your strongest candidates today.' },
        ],
      },
    };

    const cfg = roleConfig[role] || roleConfig['Recruiter'];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RecruiterV!</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:${cfg.gradient};padding:44px 40px 36px;text-align:center;">
            <div style="font-size:52px;margin-bottom:12px;">${cfg.icon}</div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              Welcome to RecruiterV!
            </h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">${cfg.tagline}</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e3a5f;">
              Hi ${userName || 'there'} 👋
            </p>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
              Your account has been verified and you're all set! You've joined as a
              <strong style="color:${cfg.accent};">${role}</strong> on RecruiterV —
              India's growing talent network. Here's how to hit the ground running:
            </p>
          </td>
        </tr>

        <!-- Role badge -->
        <tr>
          <td style="padding:20px 40px 0;">
            <div style="display:inline-block;background:${cfg.accentLight};border:1.5px solid ${cfg.accent}33;border-radius:50px;padding:7px 20px;">
              <span style="color:${cfg.accentDark};font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                ${role} Account
              </span>
            </div>
          </td>
        </tr>

        <!-- Steps -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
              Your Next Steps
            </p>
            ${cfg.steps.map((step, i) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr>
                <td style="width:44px;vertical-align:top;padding-top:2px;">
                  <div style="width:38px;height:38px;background:${cfg.accentLight};border-radius:12px;text-align:center;line-height:38px;font-size:20px;">
                    ${step.icon}
                  </div>
                </td>
                <td style="padding-left:14px;vertical-align:top;">
                  <div style="font-size:14px;font-weight:700;color:#1e3a5f;margin-bottom:3px;">
                    ${i + 1}. ${step.title}
                  </div>
                  <div style="font-size:13px;color:#64748b;line-height:1.6;">
                    ${step.desc}
                  </div>
                </td>
              </tr>
            </table>`).join('')}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0 0 20px;font-size:15px;color:#475569;">
              Your account is ready. Jump in and explore your dashboard!
            </p>
            <a href="${loginUrl || 'https://www.recruiterv.com/'}"
               style="display:inline-block;background:${cfg.gradient};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px ${cfg.accent}44;">
              Go to My Dashboard →
            </a>
          </td>
        </tr>

        <!-- Help note -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
                <strong style="color:#1e3a5f;">Need help?</strong> Reply to this email or reach us at
                <a href="mailto:support@recruiterv.com" style="color:${cfg.accent};text-decoration:none;font-weight:600;">support@recruiterv.com</a>.
                We're happy to help you get started.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
              Sent with ❤️ by the <strong style="color:#64748b;">RecruiterV Team</strong>
            </p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              © ${new Date().getFullYear()} RecruiterV · All rights reserved
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  positionAssigned: (positionName, recruiterName, dashboardUrl) => `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>New Assignment!</title></head>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">New Position: ${positionName}</h2>
        <p>Hi ${recruiterName}, you've been assigned to a new position!</p>
        <a href="${dashboardUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Positions</a>
      </div>
    </body>
    </html>
  `,

  candidateSubmitted: (candidateName, positionName, clientSpocEmail, dashboardUrl) => `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>New Candidate!</title></head>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">New Candidate: ${candidateName}</h2>
        <p>New candidate ${candidateName} submitted for ${positionName}.</p>
        <a href="${dashboardUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Review Candidates</a>
      </div>
    </body>
    </html>
  `,

  candidateStatusUpdated: (recruiterName, candidateName, positionTitle, clientName, newStatus, dashboardUrl) => {
    const statusMap = {
      hired:                { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '🎉', label: 'Hired' },
      selected:             { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '✅', label: 'Selected' },
      shortlisted:          { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: '⭐', label: 'Shortlisted' },
      'interview scheduled':{ bg: '#e0f2fe', text: '#075985', border: '#7dd3fc', icon: '📅', label: 'Interview Scheduled' },
      rejected:             { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '❌', label: 'Rejected' },
      'not selected':       { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '❌', label: 'Not Selected' },
      pending:              { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: '⏳', label: 'Pending' },
      'on hold':            { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '⏸️', label: 'On Hold' },
      submitted:            { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd', icon: '📤', label: 'Submitted' },
    };
    const s = statusMap[(newStatus || '').toLowerCase()] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '📌', label: newStatus || 'Updated' };

    const isPositive = ['hired','selected','shortlisted','interview scheduled'].includes((newStatus || '').toLowerCase());
    const headerGradient = isPositive
      ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)'
      : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Status Update – RecruiterV</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <tr>
          <td style="background:${headerGradient};padding:40px 40px 32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">${s.icon}</div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Candidate Status Updated</h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">RecruiterV — Recruitment Management</p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 8px;font-size:19px;font-weight:700;color:#1e3a5f;">Hi ${recruiterName || 'there'} 👋</p>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
              The status of a candidate you submitted has been updated by the Client SPOC. Here are the details:
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:16px;padding:22px 26px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Candidate</p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:#1e3a5f;">${candidateName || '—'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:14px;border-top:1px solid #f1f5f9;padding-top:14px;">
                    <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Position</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#374151;">${positionTitle || '—'}</p>
                    ${clientName ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b;">Client: ${clientName}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #f1f5f9;padding-top:14px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">New Status</p>
                    <span style="display:inline-block;background:${s.bg};color:${s.text};border:2px solid ${s.border};border-radius:50px;padding:7px 22px;font-size:15px;font-weight:800;letter-spacing:0.3px;">
                      ${s.icon}&nbsp; ${s.label}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div></td></tr>

        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0 0 20px;font-size:15px;color:#475569;">
              Log in to your dashboard to view the full candidate profile and next steps.
            </p>
            <a href="${dashboardUrl || 'https://www.recruiterv.com/'}"
               style="display:inline-block;background:${headerGradient};color:#ffffff;text-decoration:none;padding:13px 34px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
              View on Dashboard →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f8fafc;border-radius:12px;padding:14px 20px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
                <strong style="color:#1e3a5f;">Need help?</strong> Reach us at
                <a href="mailto:support@recruiterv.com" style="color:#2563eb;text-decoration:none;font-weight:600;">support@recruiterv.com</a>.
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 40px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Sent with ❤️ by the <strong style="color:#64748b;">RecruiterV Team</strong></p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} RecruiterV · All rights reserved</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  positionDirectAssigned: (positionTitle, userType, userName, dashboardUrl, clientName) => {
    const cfg = {
      Recruiter: {
        gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        accent: '#2563eb', accentLight: '#eff6ff', accentDark: '#1e40af',
        icon: '💼',
        message: 'A new position has been assigned to you by the admin team. This is your opportunity to connect top talent with a great opportunity.',
        cta: 'View Assigned Positions',
        steps: [
          { icon: '📋', title: 'Review the Position', desc: 'Log in and check the full position details, requirements and compensation.' },
          { icon: '🔍', title: 'Source Candidates', desc: 'Identify and reach out to the best-fit candidates from your network.' },
          { icon: '📤', title: 'Submit Candidates', desc: 'Submit shortlisted profiles directly from your recruiter dashboard.' },
        ],
      },
      Coach: {
        gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
        accent: '#0284c7', accentLight: '#e0f2fe', accentDark: '#075985',
        icon: '🎓',
        message: 'The admin team has assigned you as a Coach for a new position. Your expertise will help candidates prepare and succeed.',
        cta: 'View My Assignments',
        steps: [
          { icon: '📋', title: 'Review the Position', desc: 'Understand the role requirements, expectations and candidate criteria.' },
          { icon: '👥', title: 'Connect with Candidates', desc: 'Reach out to candidates assigned to you and schedule coaching sessions.' },
          { icon: '🏆', title: 'Track Progress', desc: 'Monitor candidate readiness and provide feedback from your dashboard.' },
        ],
      },
      Expert: {
        gradient: 'linear-gradient(135deg, #713f12 0%, #d97706 100%)',
        accent: '#d97706', accentLight: '#fef3c7', accentDark: '#92400e',
        icon: '⭐',
        message: 'Your domain expertise is needed! The admin team has assigned you as an Expert for a new position.',
        cta: 'View My Assignments',
        steps: [
          { icon: '📋', title: 'Review the Role', desc: 'Familiarise yourself with the position requirements and technical expectations.' },
          { icon: '💡', title: 'Provide Guidance', desc: 'Share your insights with the team and help evaluate candidate suitability.' },
          { icon: '📊', title: 'Drive Results', desc: 'Use your expertise to help close the position faster and more effectively.' },
        ],
      },
      ClientSPOC: {
        gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
        accent: '#059669', accentLight: '#d1fae5', accentDark: '#065f46',
        icon: '🏢',
        message: 'You have been assigned as the Client SPOC for a new position. You will oversee candidate submissions and manage the hiring process.',
        cta: 'View Dashboard',
        steps: [
          { icon: '📋', title: 'Review the Position', desc: 'Check the position details and confirm the hiring requirements.' },
          { icon: '👤', title: 'Review Candidates', desc: 'Evaluate incoming candidate submissions and provide timely feedback.' },
          { icon: '✅', title: 'Manage the Process', desc: 'Approve or reject candidates and coordinate with the recruiting team.' },
        ],
      },
    }[userType] || {
      gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      accent: '#2563eb', accentLight: '#eff6ff', accentDark: '#1e40af',
      icon: '📌', message: 'You have been assigned to a new position.',
      cta: 'View Dashboard', steps: [],
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Position Assignment – RecruiterV</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <tr>
          <td style="background:${cfg.gradient};padding:44px 40px 36px;text-align:center;">
            <div style="font-size:52px;margin-bottom:12px;">${cfg.icon}</div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">New Position Assignment!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">You've been assigned to a new position on RecruiterV</p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e3a5f;">Hi ${userName || 'there'} 👋</p>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">${cfg.message}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:${cfg.accentLight};border:1.5px solid ${cfg.accent}33;border-radius:16px;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${cfg.accentDark};letter-spacing:1px;text-transform:uppercase;">Position Assigned</p>
              <h2 style="margin:0 0 ${clientName ? '8px' : '0'};font-size:20px;font-weight:800;color:#1e3a5f;">${positionTitle || '—'}</h2>
              ${clientName ? `<p style="margin:0;font-size:14px;color:#64748b;"><strong style="color:#374151;">Client:</strong> ${clientName}</p>` : ''}
              <div style="margin-top:14px;display:inline-block;background:${cfg.gradient};color:#ffffff;border-radius:20px;padding:5px 18px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${userType}</div>
            </div>
          </td>
        </tr>

        ${cfg.steps.length ? `
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Your Next Steps</p>
            ${cfg.steps.map((step, i) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr>
                <td style="width:44px;vertical-align:top;padding-top:2px;">
                  <div style="width:38px;height:38px;background:${cfg.accentLight};border-radius:12px;text-align:center;line-height:38px;font-size:20px;">${step.icon}</div>
                </td>
                <td style="padding-left:14px;vertical-align:top;">
                  <div style="font-size:14px;font-weight:700;color:#1e3a5f;margin-bottom:3px;">${i + 1}. ${step.title}</div>
                  <div style="font-size:13px;color:#64748b;line-height:1.6;">${step.desc}</div>
                </td>
              </tr>
            </table>`).join('')}
          </td>
        </tr>` : ''}

        <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div></td></tr>

        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0 0 20px;font-size:15px;color:#475569;">Log in to your dashboard to view the full details and get started right away.</p>
            <a href="${dashboardUrl || 'https://www.recruiterv.com/'}"
               style="display:inline-block;background:${cfg.gradient};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px ${cfg.accent}44;">
              ${cfg.cta} →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;border:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;">
                <strong style="color:#1e3a5f;">Need help?</strong> Reply to this email or reach us at
                <a href="mailto:support@recruiterv.com" style="color:${cfg.accent};text-decoration:none;font-weight:600;">support@recruiterv.com</a>.
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 40px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">Sent with ❤️ by the <strong style="color:#64748b;">RecruiterV Team</strong></p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} RecruiterV · All rights reserved</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  // ── Registration Pending / Under Review ────────────────────────────────────
  registrationPending(name, userType) {
    const cfg = {
      Recruiter: { gradient:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', accent:'#2563eb', icon:'💼', badge:'RECRUITER' },
      Coach:     { gradient:'linear-gradient(135deg,#0369a1 0%,#0ea5e9 100%)', accent:'#0284c7', icon:'🎓', badge:'COACH'     },
      Expert:    { gradient:'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)', accent:'#d97706', icon:'⭐', badge:'EXPERT'    },
    };
    const c = cfg[userType] || cfg['Recruiter'];
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr><td style="background:${c.gradient};padding:40px 40px 32px;text-align:center;">
          <div style="font-size:50px;margin-bottom:10px;">${c.icon}</div>
          <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:4px 16px;font-size:11px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:14px;">${c.badge} REGISTRATION</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.25;">Registration Received! 🎉</h1>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Thank you for joining RecruiterV</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#1f2937;">Hello, ${name}!</p>
          <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.75;">
            Thank you for registering on <strong style="color:${c.accent};">RecruiterV</strong>. We have received your registration request and we're excited to have you on board!
          </p>

          <!-- Status card -->
          <div style="background:#f8fafc;border-left:4px solid ${c.accent};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;">Current Status</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#1f2937;">⏳ Under Review</p>
            <p style="margin:6px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">Our technical team is carefully reviewing your details.</p>
          </div>

          <!-- What happens next -->
          <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">What happens next?</p>
          ${[
            ['📧','Review Notification','You will receive an email once your account is approved or if we need more information.'],
            ['✅','Account Activation','Once approved, you can log in and start using all RecruiterV features.'],
            ['🚀','Get Started','Complete your profile and begin working with positions right away.'],
          ].map(([ico, title, desc]) => `
          <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
            <div style="font-size:22px;flex-shrink:0;margin-top:2px;">${ico}</div>
            <div>
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1f2937;">${title}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.55;">${desc}</p>
            </div>
          </div>`).join('')}
        </td></tr>

        <!-- Help note -->
        <tr><td style="padding:0 40px 32px;">
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#92400e;">Have questions? Reply to this email or contact us — we're happy to help!</p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1.5px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Sent by the <strong style="color:#64748b;">RecruiterV Team</strong></p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} RecruiterV · All rights reserved</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  // ── Account Approved email ──────────────────────────────────────────────────
  accountRejected(name, userType) {
    const cfg = {
      Recruiter: { gradient: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', icon: '💼', badge: 'RECRUITER APPLICATION' },
      Coach:     { gradient: 'linear-gradient(135deg,#0369a1 0%,#0ea5e9 100%)', icon: '🎓', badge: 'COACH APPLICATION'     },
      Expert:    { gradient: 'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)', icon: '⭐', badge: 'EXPERT APPLICATION'    },
    };
    const c = cfg[userType] || cfg['Recruiter'];
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr><td style="background:${c.gradient};padding:40px 40px 36px;text-align:center;">
          <div style="font-size:52px;margin-bottom:12px;">${c.icon}</div>
          <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:4px 16px;font-size:11px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:16px;">${c.badge}</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.3;">Application Update</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">
          <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#1f2937;">Hello, ${name},</p>
          <p style="margin:0 0 18px;font-size:15px;color:#4b5563;line-height:1.8;">
            Thank you for registering on <strong>RecruiterV</strong> and showing your interest in joining our platform as a <strong>${userType}</strong>.
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#4b5563;line-height:1.8;">
            We're sorry to inform you that at this time, <strong>we do not have open positions that match your profile</strong>. As a result, we are unable to onboard you at this stage and will be removing your registration data from our system.
          </p>

          <!-- Notice box -->
          <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;letter-spacing:0.8px;text-transform:uppercase;">Please Note</p>
            <ul style="margin:0;padding-left:20px;font-size:14px;color:#78350f;line-height:1.9;">
              <li>All your data has been deleted from our system.</li>
              <li>You are welcome to re-apply after <strong>90 days</strong>.</li>
              <li>We encourage you to revisit us when new positions open up.</li>
            </ul>
          </div>

          <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.8;">
            We appreciate your patience and wish you all the best in your journey. We hope to work with you in the future when the right opportunity arises.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1.5px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Sent by the <strong style="color:#64748b;">RecruiterV Team</strong></p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} RecruiterV · All rights reserved</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },

  accountApproved(name, userType, loginUrl) {
    const cfg = {
      Recruiter: {
        gradient: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)',
        accent: '#2563eb',
        icon: '💼',
        badge: 'RECRUITER ACCOUNT',
        tagline: 'Start finding the best talent today.',
        steps: [
          'Log in with your registered credentials',
          'Complete your recruiter profile & upload your agreement',
          'Browse open positions and start submitting candidates',
        ],
        cta: 'Login to Recruiter Dashboard',
      },
      Coach: {
        gradient: 'linear-gradient(135deg,#0369a1 0%,#0ea5e9 100%)',
        accent: '#0284c7',
        icon: '🎓',
        badge: 'COACH ACCOUNT',
        tagline: 'Your coaching journey on RecruiterV begins now.',
        steps: [
          'Log in and complete your profile',
          'Review open position requests assigned to you',
          'Start coaching candidates toward their success',
        ],
        cta: 'Login to Coach Dashboard',
      },
      Expert: {
        gradient: 'linear-gradient(135deg,#92400e 0%,#f59e0b 100%)',
        accent: '#d97706',
        icon: '⭐',
        badge: 'EXPERT ACCOUNT',
        tagline: 'Share your expertise and create real impact.',
        steps: [
          'Log in and finish setting up your expert profile',
          'Accept position assignments that match your skills',
          'Guide candidates with your industry knowledge',
        ],
        cta: 'Login to Expert Dashboard',
      },
    };
    const c = cfg[userType] || cfg['Recruiter'];
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr><td style="background:${c.gradient};padding:40px 40px 36px;text-align:center;">
          <div style="font-size:52px;margin-bottom:12px;">${c.icon}</div>
          <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:4px 16px;font-size:11px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:16px;">${c.badge}</div>
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;line-height:1.2;">Account Approved! 🎉</h1>
          <p style="margin:10px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${c.tagline}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:36px 40px 0;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1f2937;">Hello, ${name}!</p>
          <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7;">
            We're excited to let you know that your <strong>${userType}</strong> account on <strong>RecruiterV</strong> has been reviewed and <span style="color:${c.accent};font-weight:700;">approved</span> by our team. You can now log in and get started.
          </p>
        </td></tr>

        <!-- Steps -->
        <tr><td style="padding:28px 40px 0;">
          <div style="background:#f8fafc;border-radius:14px;padding:24px 28px;border:1.5px solid #e2e8f0;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">What to do next</p>
            ${c.steps.map((s, i) => `
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:${i < c.steps.length - 1 ? '14px' : '0'};">
              <div style="width:28px;height:28px;min-width:28px;border-radius:50%;background:${c.gradient};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;">${i + 1}</div>
              <p style="margin:4px 0 0;font-size:14px;color:#374151;line-height:1.5;">${s}</p>
            </div>`).join('')}
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:32px 40px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;background:${c.gradient};color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);">${c.cta} →</a>
          <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;">Or copy this link: <a href="${loginUrl}" style="color:${c.accent};">${loginUrl}</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-top:1.5px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">Sent by the <strong style="color:#64748b;">RecruiterV Team</strong></p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} RecruiterV · All rights reserved</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  },
  // ── Direct Applicant Notification ────────────────────────────────────────────
  // Sent to recruiter (if shared via their link) or to ClientSPOC (if anonymous)
  directApplicantNotification: (recipientName, recipientType, candidate, positionTitle, client, dashboardUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Direct Application</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 60%,#c2410c 100%);padding:36px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <img src="https://www.recruiterv.com/recruitorV.png" alt="RecruiterV" height="36" style="display:block;margin-bottom:16px;" />
                  <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:30px;padding:5px 16px;font-size:12px;color:#fff;font-weight:700;letter-spacing:1px;margin-bottom:12px;">NEW DIRECT APPLICATION</div>
                  <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;line-height:1.2;">🎯 ${candidate.name} applied!</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">for <strong>${positionTitle}</strong>${client ? ` at <strong>${client}</strong>` : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px 40px;">

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Hi <strong>${recipientName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              A candidate just applied directly via ${recipientType === 'recruiter' ? 'your shared position link' : 'the public position page'}. Here are their details:
            </p>

            <!-- Candidate card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;margin-bottom:24px;">
              <tr><td style="padding:22px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:52px;vertical-align:top;">
                      <div style="width:48px;height:48px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;text-align:center;line-height:48px;">
                        ${(candidate.name || 'C')[0].toUpperCase()}
                      </div>
                    </td>
                    <td style="padding-left:14px;vertical-align:top;">
                      <div style="font-size:18px;font-weight:800;color:#1f2937;margin-bottom:2px;">${candidate.name}</div>
                      <div style="font-size:13px;color:#6b7280;">Direct Applicant</div>
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                  ${candidate.email ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.email}</span></td></tr>` : ''}
                  ${candidate.phone ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Phone</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.phone}</span></td></tr>` : ''}
                  ${candidate.currentCTC ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Current CTC</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.currentCTC}</span></td></tr>` : ''}
                  ${candidate.experience ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Experience</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.experience}</span></td></tr>` : ''}
                  ${candidate.noticePeriod ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Notice Period</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.noticePeriod}</span></td></tr>` : ''}
                  ${candidate.location ? `<tr><td style="padding:5px 0;"><span style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Location</span><br/><span style="font-size:14px;color:#374151;font-weight:600;">${candidate.location}</span></td></tr>` : ''}
                </table>
              </td></tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;padding:0;">
                  <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.3px;">
                    View &amp; Review Application →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
              ${recipientType === 'recruiter' ? 'This candidate applied via your shared position link. Review, edit, and submit them from your Direct Applicants dashboard.' : 'This candidate applied directly via the public position page.'}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © 2026 RecruiterV · <a href="https://www.recruiterv.com" style="color:#f97316;text-decoration:none;">recruiterv.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
};

// Resolve an email's { subject, htmlContent } for a template key:
//  - if a SuperAdmin has customized + enabled it (Firestore email_templates),
//    use that (with {{variables}} substituted);
//  - otherwise use the provided code fallback (original templates.* output),
//    so emails never break if nothing has been customized.
const renderEmail = async (key, vars = {}, fallback = {}) => {
  try {
    const { db } = require('../router/firebase_ad');
    const { substitute } = require('./emailTemplates');
    const doc = await db.collection('email_templates').doc(key).get();
    if (doc.exists) {
      const t = doc.data();
      if (t && t.enabled && t.htmlBody) {
        return {
          subject: substitute(t.subject || fallback.subject || '', vars),
          htmlContent: substitute(t.htmlBody, vars),
        };
      }
    }
  } catch (e) {
    console.error('renderEmail fallback (' + key + '):', e.message);
  }
  return { subject: fallback.subject || '', htmlContent: fallback.htmlContent || '' };
};

module.exports = {
  sendEmail,
  sendEmailFull,
  templates,
  renderEmail,
};
