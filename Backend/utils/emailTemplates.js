/**
 * Default (code) email templates + variable metadata for the SuperAdmin
 * Email Template Designer.
 *
 * Each entry is the editable starting point shown in the designer. Templates are
 * stored in Firestore (collection `email_templates`) only once a SuperAdmin
 * customizes them; until then the live code templates in utils/email.js remain
 * the source of truth (see renderEmail() fallback), so nothing changes visually
 * until someone edits a template here.
 *
 * Bodies use {{variable}} placeholders. brandWrap() applies the shared shell.
 */

const brandWrap = (inner) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:24px 0;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#2563eb,#f97316);padding:18px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:.3px;">RecruiterV</span>
      </div>
      <div style="padding:24px;color:#1f2937;font-size:14px;line-height:1.65;">
        ${inner}
      </div>
      <div style="padding:14px 24px;border-top:1px solid #f0f0f0;color:#9ca3af;font-size:11px;">
        © RecruiterV · This is an automated message, please do not reply.
      </div>
    </div>
  </div>`;

const TEMPLATES = [
  {
    key: 'candidateStatusUpdated', name: 'Candidate status updated', recipient: 'Recruiter',
    subject: 'Status update — {{candidateName}} | {{positionTitle}}',
    variables: ['recruiterName', 'candidateName', 'positionTitle', 'clientName', 'newStatus', 'dashboardUrl'],
    sample: { recruiterName: 'Aisha', candidateName: 'Rohan Mehta', positionTitle: 'Java Developer', clientName: 'Acme Corp', newStatus: 'L2 Scheduled', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{recruiterName}},</p>
      <p>The status of your candidate <b>{{candidateName}}</b> for <b>{{positionTitle}}</b>{{clientName}} has been updated to:</p>
      <p style="font-size:16px;font-weight:700;color:#2563eb;">{{newStatus}}</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">View in dashboard</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'positionDirectAssigned', name: 'Position directly assigned', recipient: 'Coach / Expert',
    subject: 'New position assigned — {{positionTitle}}',
    variables: ['userName', 'userType', 'positionTitle', 'clientName', 'dashboardUrl'],
    sample: { userName: 'Priya', userType: 'Coach', positionTitle: 'DevOps Engineer', clientName: 'Globex', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>A new position <b>{{positionTitle}}</b>{{clientName}} has been assigned to you as {{userType}}.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open position</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'registrationPending', name: 'Registration pending', recipient: 'New registrant',
    subject: 'Your RecruiterV registration is received',
    variables: ['name', 'userType'],
    sample: { name: 'Sanjay', userType: 'Recruiter' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Thank you for registering on RecruiterV as a {{userType}}. Your account is pending review by our team.</p>
      <p>You'll receive another email once your account is approved.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'registrationPendingRecruiter', name: 'Registration received — Recruiter', recipient: 'Recruiter',
    subject: "We've received your RecruiterV registration — under review",
    variables: ['name', 'userType'],
    sample: { name: 'Sanjay', userType: 'Recruiter' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Thank you for registering on RecruiterV as a <strong>Recruiter</strong>. Your account is currently under review by our team.</p>
      <p>Once approved you can start working on open positions and submitting candidates.</p>
      <p>You'll receive another email as soon as your account is approved.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'registrationPendingCoach', name: 'Registration received — Coach', recipient: 'Coach',
    subject: "We've received your RecruiterV registration — under review",
    variables: ['name', 'userType'],
    sample: { name: 'Sanjay', userType: 'Coach' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Thank you for registering on RecruiterV as a <strong>Coach</strong>. Your account is currently under review by our team.</p>
      <p>Once approved you can build your team of recruiters and guide them on live positions.</p>
      <p>You'll receive another email as soon as your account is approved.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'registrationPendingExpert', name: 'Registration received — Expert', recipient: 'Expert',
    subject: "We've received your RecruiterV registration — under review",
    variables: ['name', 'userType'],
    sample: { name: 'Sanjay', userType: 'Expert' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Thank you for registering on RecruiterV as a <strong>Expert</strong>. Your account is currently under review by our team.</p>
      <p>Once approved you can support recruiters with your domain expertise on live positions.</p>
      <p>You'll receive another email as soon as your account is approved.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'vendorWelcome', name: 'Vendor welcome (account ready)', recipient: 'Vendor recruiter',
    subject: 'Your RecruiterV Recruiter Account is Ready',
    variables: ['name', 'email', 'password', 'loginUrl', 'vendorName'],
    sample: { name: 'Sanjay', email: 'sanjay@acme.com', password: 'Temp@1234', loginUrl: 'https://www.recruiterv.com/log_rec', vendorName: 'Acme Staffing' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Your RecruiterV account has been created by <strong>{{vendorName}}</strong> and is ready to use.</p>
      <p><strong>Login:</strong> {{loginUrl}}<br/>
      <strong>Email:</strong> {{email}}<br/>
      <strong>Password:</strong> {{password}}</p>
      <p>Please change your password after your first sign-in.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'companyApproved', name: 'Company approved (login + SPOC)', recipient: 'Company',
    subject: 'Your RecruiterV company account is approved',
    variables: ['companyName', 'email', 'password', 'loginUrl', 'spocDetails'],
    sample: { companyName: 'Acme Technologies', email: 'hr@acme.com', password: 'Temp@1234', loginUrl: 'https://www.recruiterv.com/company', spocDetails: 'Chandan Dhami — chandan@changeleaders.in — 9876543210' },
    body: brandWrap(`
      <p>Hello {{companyName}},</p>
      <p>Your position on RecruiterV has been <strong>approved</strong>. You can now sign in to manage your positions and candidates.</p>
      <p><strong>Login:</strong> {{loginUrl}}<br/>
      <strong>Email:</strong> {{email}}<br/>
      <strong>Password:</strong> {{password}}</p>
      <p><strong>Your Client SPOC(s)</strong><br/>{{spocDetails}}</p>
      <p>Please change your password after your first sign-in.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'companySpocAssigned', name: 'ClientSPOC assigned to a company', recipient: 'ClientSPOC',
    subject: "You've been assigned to {{companyName}}",
    variables: ['spocName', 'companyName', 'positionTitle', 'companyEmail', 'postedBy'],
    sample: { spocName: 'Chandan', companyName: 'Acme Technologies', positionTitle: 'Wealth Manager', companyEmail: 'hr@acme.com', postedBy: 'Priya — 9876543210 — priya@acme.com' },
    body: brandWrap(`
      <p>Hi {{spocName}},</p>
      <p>You've been assigned as a <strong>Client SPOC</strong> for <strong>{{companyName}}</strong>. A position they posted (<strong>{{positionTitle}}</strong>) is now in your approval queue.</p>
      <p><strong>Company login email:</strong> {{companyEmail}}<br/>
      <strong>Posted by:</strong> {{postedBy}}</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'employerSubmissionReceived', name: 'Employer — position received', recipient: 'Employer',
    subject: 'We received your position — RecruiterV',
    variables: ['posterName', 'positionTitle', 'companyName'],
    sample: { posterName: 'Priya', positionTitle: 'Wealth Manager', companyName: 'Acme Technologies' },
    body: brandWrap(`
      <p>Hi {{posterName}},</p>
      <p>Thank you for posting <strong>{{positionTitle}}</strong> for <strong>{{companyName}}</strong> on RecruiterV. Your application has been <strong>received</strong> and is pending review by our team.</p>
      <p>Once approved, we'll email you the login details so you can manage this position and its candidates.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'employerSubmissionRejected', name: 'Employer — position not taken forward', recipient: 'Employer',
    subject: 'Update on your position — RecruiterV',
    variables: ['posterName', 'positionTitle', 'companyName', 'reason'],
    sample: { posterName: 'Priya', positionTitle: 'Wealth Manager', companyName: 'Acme Technologies', reason: 'Outside our current hiring focus.' },
    body: brandWrap(`
      <p>Hi {{posterName}},</p>
      <p>Thank you for your interest in RecruiterV and for submitting <strong>{{positionTitle}}</strong> for <strong>{{companyName}}</strong>.</p>
      <p>We're sorry to let you know that we're unable to take this position forward at this time.</p>
      <p><strong>Note from our team:</strong> {{reason}}</p>
      <p>You're welcome to submit again in the future.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'accountApproved', name: 'Account approved', recipient: 'New user',
    subject: 'Your RecruiterV account is approved 🎉',
    variables: ['name', 'userType', 'loginUrl'],
    sample: { name: 'Sanjay', userType: 'Recruiter', loginUrl: 'https://www.recruiterv.com/log_rec' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Great news — your RecruiterV {{userType}} account has been approved. You can now sign in and get started.</p>
      <p><a href="{{loginUrl}}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Sign in</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'accountRejected', name: 'Account rejected', recipient: 'New user',
    subject: 'Update on your RecruiterV registration',
    variables: ['name', 'userType'],
    sample: { name: 'Sanjay', userType: 'Recruiter' },
    body: brandWrap(`
      <p>Dear {{name}},</p>
      <p>Thank you for your interest in RecruiterV. After reviewing your {{userType}} registration, we're unable to approve your account at this time.</p>
      <p>If you believe this is a mistake, please reach out to our support team.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'directApplicantNotification', name: 'Direct applicant notification', recipient: 'Recruiter / ClientSPOC',
    subject: '🎯 New direct application — {{positionTitle}} | {{candidateName}}',
    variables: ['recipientName', 'recipientType', 'candidateName', 'candidateEmail', 'candidatePhone', 'positionTitle', 'client', 'dashboardUrl'],
    sample: { recipientName: 'Hiring Manager', recipientType: 'clientspoc', candidateName: 'Neha Gupta', candidateEmail: 'neha@example.com', candidatePhone: '9876543210', positionTitle: 'Frontend Developer', client: 'Acme Corp', dashboardUrl: 'https://www.recruiterv.com/clientspoc-direct-applications' },
    body: brandWrap(`
      <p>Dear {{recipientName}},</p>
      <p>A new candidate has applied directly for <b>{{positionTitle}}</b> ({{client}}):</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:4px 0;color:#6b7280;">Name</td><td style="padding:4px 0;font-weight:600;">{{candidateName}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;">{{candidateEmail}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;">{{candidatePhone}}</td></tr>
      </table>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Review application</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'welcome', name: 'Welcome', recipient: 'New user',
    subject: 'Welcome to RecruiterV',
    variables: ['userName', 'roleCategory', 'loginUrl'],
    sample: { userName: 'Sanjay', roleCategory: 'Recruiter', loginUrl: 'https://www.recruiterv.com/log_rec' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>Welcome to RecruiterV! Your {{roleCategory}} account is ready.</p>
      <p><a href="{{loginUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Get started</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'forgotPassword', name: 'Forgot password', recipient: 'Any user',
    subject: 'Reset your RecruiterV password',
    variables: ['userName', 'resetLink'],
    sample: { userName: 'Sanjay', resetLink: 'https://www.recruiterv.com/reset?token=…' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>We received a request to reset your RecruiterV password. Click below to set a new one. This link expires shortly.</p>
      <p><a href="{{resetLink}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Reset password</a></p>
      <p style="color:#6b7280;">If you didn't request this, you can safely ignore this email.</p>`),
  },
  {
    key: 'positionAssigned', name: 'Position assigned (recruiter)', recipient: 'Recruiter',
    subject: 'New position assigned — {{positionName}}',
    variables: ['recruiterName', 'positionName', 'dashboardUrl'],
    sample: { recruiterName: 'Aisha', positionName: 'Backend Engineer', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{recruiterName}},</p>
      <p>A new position <b>{{positionName}}</b> has been assigned to you.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">View position</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'candidateAndJd', name: 'Candidate and JD', recipient: 'Candidate',
    subject: 'Your profile has been submitted — {{positionTitle}}',
    variables: [
      'submitterName', 'submitterRole', 'positionTitle', 'positionId', 'clientName', 'positionLink',
      'candidateName', 'candidateEmail', 'candidatePhone', 'relExp', 'totalExp', 'currentCTC', 'expectedCTC',
      'noticePeriod', 'currentEmployer', 'currentLocation', 'preferredLocation', 'highestEducation',
      'techSkills', 'nonTechSkills', 'rhId', 'resumeUrl', 'dateSubmitted',
    ],
    sample: {
      submitterName: 'Aisha', submitterRole: 'Recruiter', positionTitle: 'Java Developer', positionId: 'POS123',
      clientName: 'Acme Corp', positionLink: 'https://www.recruiterv.com/position/POS123?view=share&rec=aisha%40example.com',
      candidateName: 'Rohan Mehta', candidateEmail: 'rohan@example.com', candidatePhone: '9876543210',
      relExp: '4', totalExp: '6', currentCTC: '₹12 LPA', expectedCTC: '₹18 LPA', noticePeriod: '30 days',
      currentEmployer: 'Globex', currentLocation: 'Bengaluru, KA', preferredLocation: 'Bengaluru, KA',
      highestEducation: 'B.Tech (CSE)', techSkills: 'Java, Spring Boot, SQL', nonTechSkills: 'Communication',
      rhId: 'RH-556', resumeUrl: 'https://www.recruiterv.com/resume/sample.pdf',
      dateSubmitted: '24 July 2026, 12:30 pm',
    },
    body: brandWrap(`
      <p>Dear {{candidateName}},</p>
      <p>Your profile has been submitted for the position below by <b>{{submitterName}}</b> ({{submitterRole}}). A copy of the submitted details is included for your reference.</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:12px 0;background:#f9fafb;border-radius:10px;">
        <tr><td colspan="2" style="padding:10px 12px;font-weight:800;color:#2563eb;border-bottom:1px solid #eef2f7;">Position</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;width:42%;">Title</td><td style="padding:6px 12px;font-weight:600;">{{positionTitle}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Position ID</td><td style="padding:6px 12px;">{{positionId}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Client</td><td style="padding:6px 12px;">{{clientName}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Submitted as</td><td style="padding:6px 12px;">{{submitterRole}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Submitted on</td><td style="padding:6px 12px;">{{dateSubmitted}}</td></tr>
      </table>
      <p style="margin:14px 0;"><a href="{{positionLink}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">View Position &amp; JD</a></p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:12px 0;background:#f9fafb;border-radius:10px;">
        <tr><td colspan="2" style="padding:10px 12px;font-weight:800;color:#2563eb;border-bottom:1px solid #eef2f7;">Candidate details</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;width:42%;">Name</td><td style="padding:6px 12px;font-weight:600;">{{candidateName}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Email</td><td style="padding:6px 12px;">{{candidateEmail}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Phone</td><td style="padding:6px 12px;">{{candidatePhone}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">RH ID</td><td style="padding:6px 12px;">{{rhId}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Current employer</td><td style="padding:6px 12px;">{{currentEmployer}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Highest education</td><td style="padding:6px 12px;">{{highestEducation}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Relevant experience</td><td style="padding:6px 12px;">{{relExp}} yrs</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Total experience</td><td style="padding:6px 12px;">{{totalExp}} yrs</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Current CTC</td><td style="padding:6px 12px;">{{currentCTC}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Expected CTC</td><td style="padding:6px 12px;">{{expectedCTC}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Notice period</td><td style="padding:6px 12px;">{{noticePeriod}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Current location</td><td style="padding:6px 12px;">{{currentLocation}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Preferred location</td><td style="padding:6px 12px;">{{preferredLocation}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Technical skills</td><td style="padding:6px 12px;">{{techSkills}}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Other skills</td><td style="padding:6px 12px;">{{nonTechSkills}}</td></tr>
      </table>
      <p style="margin:14px 0;"><a href="{{resumeUrl}}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Download resume</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'candidateSubmitted', name: 'Candidate submitted', recipient: 'ClientSPOC',
    subject: 'New candidate submitted — {{candidateName}} | {{positionName}}',
    variables: ['candidateName', 'positionName', 'dashboardUrl'],
    sample: { candidateName: 'Rohan Mehta', positionName: 'Java Developer', dashboardUrl: 'https://www.recruiterv.com/ad_panel#candidates' },
    body: brandWrap(`
      <p>Hello,</p>
      <p>A new candidate <b>{{candidateName}}</b> has been submitted for <b>{{positionName}}</b>.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Review candidate</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'otpCode', name: 'OTP verification code', recipient: 'Any user',
    subject: 'Your RecruiterV OTP Code',
    variables: ['otp'],
    sample: { otp: '482913' },
    body: brandWrap(`
      <p>Welcome to RecruiterV! Use the code below to verify your account:</p>
      <div style="font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;padding:18px;background:#eff6ff;border-radius:12px;color:#1d4ed8;margin:18px 0;">{{otp}}</div>
      <p style="color:#6b7280;font-size:13px;">This code expires in 5 minutes. Do not share it with anyone.</p>`),
  },
  {
    key: 'applicationStatusUpdate', name: 'Application status update', recipient: 'Candidate',
    subject: 'Application status update — {{position}}',
    variables: ['candidateName', 'position', 'client', 'oldStatus', 'newStatus'],
    sample: { candidateName: 'Neha Gupta', position: 'Frontend Developer', client: 'Acme Corp', oldStatus: 'Submitted', newStatus: 'L1 Scheduled' },
    body: brandWrap(`
      <p>Dear {{candidateName}},</p>
      <p>Your application status has been updated:</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:4px 0;color:#6b7280;">Position</td><td style="padding:4px 0;font-weight:600;">{{position}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Client</td><td style="padding:4px 0;">{{client}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Current status</td><td style="padding:4px 0;font-weight:700;color:#2563eb;">{{newStatus}}</td></tr>
      </table>
      <p style="margin-top:18px;">Best regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'aiAutoReject', name: 'AI screening — not selected', recipient: 'Candidate',
    subject: 'Update on your application — {{position}}',
    variables: ['candidateName', 'position'],
    sample: { candidateName: 'Neha Gupta', position: 'Frontend Developer' },
    body: brandWrap(`
      <p>Dear {{candidateName}},</p>
      <p>Thank you for applying for <b>{{position}}</b> at RecruiterV.</p>
      <p>After reviewing your profile against the job requirements, we're sorry to share that your profile is not a match for this role at this time.</p>
      <p>We've kept your resume on file and will reach out if a suitable position appears.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'coachHelpRequest', name: 'Coach/Expert help request', recipient: 'Coach / Expert',
    subject: 'New help request — {{positionTitle}}',
    variables: ['coachExpertName', 'positionTitle', 'client', 'recruiterName', 'recruiterEmail'],
    sample: { coachExpertName: 'Priya', positionTitle: 'DevOps Engineer', client: 'Globex', recruiterName: 'Aisha', recruiterEmail: 'aisha@example.com' },
    body: brandWrap(`
      <p>Dear {{coachExpertName}},</p>
      <p>A recruiter has requested your assistance for the position below:</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:4px 0;color:#6b7280;">Position</td><td style="padding:4px 0;font-weight:600;">{{positionTitle}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Client</td><td style="padding:4px 0;">{{client}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Recruiter</td><td style="padding:4px 0;">{{recruiterName}} ({{recruiterEmail}})</td></tr>
      </table>
      <p>Log in to your dashboard to respond.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'directCoachRequestClientspoc', name: 'Direct coach/expert request (to SPOC)', recipient: 'ClientSPOC',
    subject: 'New coach/expert request — {{positionTitle}}',
    variables: ['coachExpertName', 'coachExpertEmail', 'coachExpertPhone', 'specialization', 'positionTitle', 'client'],
    sample: { coachExpertName: 'Priya', coachExpertEmail: 'priya@example.com', coachExpertPhone: '9876543210', specialization: 'Cloud / DevOps', positionTitle: 'DevOps Engineer', client: 'Globex' },
    body: brandWrap(`
      <p>Hello,</p>
      <p>A coach/expert has requested to work on your position:</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:4px 0;color:#6b7280;">Name</td><td style="padding:4px 0;font-weight:600;">{{coachExpertName}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;">{{coachExpertEmail}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;">{{coachExpertPhone}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Specialization</td><td style="padding:4px 0;">{{specialization}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Position</td><td style="padding:4px 0;">{{positionTitle}} ({{client}})</td></tr>
      </table>
      <p>Open your ClientSPOC dashboard → Direct Coach/Expert Requests to Approve, Reject, or Waitlist.</p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'directCoachRequestStatus', name: 'Coach/expert request decision', recipient: 'Coach / Expert',
    subject: 'Your request for "{{positionTitle}}" — {{statusLabel}}',
    variables: ['coachExpertName', 'positionTitle', 'client', 'statusLabel'],
    sample: { coachExpertName: 'Priya', positionTitle: 'DevOps Engineer', client: 'Globex', statusLabel: 'Approved' },
    body: brandWrap(`
      <p>Dear {{coachExpertName}},</p>
      <p>Your request for the position below has been <b>{{statusLabel}}</b>:</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;margin:8px 0;">
        <tr><td style="padding:4px 0;color:#6b7280;">Position</td><td style="padding:4px 0;font-weight:600;">{{positionTitle}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Client</td><td style="padding:4px 0;">{{client}}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Status</td><td style="padding:4px 0;font-weight:700;color:#2563eb;">{{statusLabel}}</td></tr>
      </table>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },

  // ── Previously hardcoded in the source ──────────────────────────────────────
  // These seven were written in the code that sends them, so nobody could
  // reword them or switch them off. Each send site now asks for a template and
  // keeps its original wording as the fallback, so adding them here changes
  // nothing until somebody edits one.
  {
    key: 'certificateIssued', name: 'Certification issued', recipient: 'Recruiter / Coach / Expert',
    subject: "You're Certified — your RecruiterV certificate ({{certificateId}})",
    variables: ['userName', 'certificateId', 'tier', 'percent', 'certificateUrl'],
    sample: { userName: 'Aisha', certificateId: 'RV-2026-0IS8QI', tier: 'Certified', percent: '92', certificateUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>You have passed the eligibility assessment with <b>{{percent}}%</b> and are now a <b>{{tier}}</b> member.</p>
      <p>Your certificate number is <b>{{certificateId}}</b>.</p>
      <p><a href="{{certificateUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">View your certificate</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'agreementSubmitted', name: 'Agreement submitted', recipient: 'Any user',
    subject: 'Agreement submitted — {{role}}',
    variables: ['userName', 'role', 'agreementVersion', 'dashboardUrl'],
    sample: { userName: 'Aisha', role: 'Recruiter', agreementVersion: 'v1.0', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>We have received your signed {{role}} agreement ({{agreementVersion}}). Nothing further is needed from you.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Go to your dashboard</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'vendorUpgradeRequest', name: 'Vendor upgrade requested', recipient: 'Admin',
    subject: 'Vendor upgrade request — {{userName}}',
    variables: ['userName', 'userEmail', 'companyName', 'dashboardUrl'],
    sample: { userName: 'Aisha Khan', userEmail: 'aisha@example.com', companyName: 'Acme Staffing', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>A vendor upgrade has been requested.</p>
      <p><b>{{userName}}</b> ({{userEmail}}){{companyName}}</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Review the request</a></p>`),
  },
  {
    key: 'coachHelpRequestRaised', name: 'Help request raised on a position', recipient: 'Coach / Expert',
    subject: 'New help request — {{positionTitle}}',
    variables: ['userName', 'positionTitle', 'clientName', 'recruiterName', 'dashboardUrl'],
    sample: { userName: 'Rahul', positionTitle: 'Java Developer', clientName: 'Acme Corp', recruiterName: 'Aisha', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p><b>{{recruiterName}}</b> has asked for help on <b>{{positionTitle}}</b>{{clientName}}.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open the request</a></p>
      <p style="margin-top:18px;">Warm regards,<br/>Team RecruiterV</p>`),
  },
  {
    key: 'binCvWaiting', name: 'Review Bin — a CV is waiting', recipient: 'Coach / Expert',
    subject: 'A CV is waiting for your review',
    variables: ['userName', 'positionTitle', 'clientName', 'hours', 'slot', 'dashboardUrl'],
    sample: { userName: 'Rahul', positionTitle: 'Java Developer', clientName: 'Acme Corp', hours: '4', slot: '6 PM - 8 PM', dashboardUrl: 'https://www.recruiterv.com/coach-bin' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>A CV has come in for <b>{{positionTitle}}</b>{{clientName}}. It is claimable for the next {{hours}} hours; after that it goes to the client without your review.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open the Review Bin</a></p>
      <p style="color:#888;font-size:12px">You are getting this because {{slot}} is one of your available hours.</p>`),
  },

  // The two scheduled digests. They sent with wording fixed in the code, which
  // also meant they could not be paused — "stop all email" would have left them
  // going out on a timer with nobody able to switch them off.
  {
    key: 'directApplicantDigest', name: 'Daily direct-applicant digest', recipient: 'Recruiter / ClientSPOC',
    subject: 'Your direct applicants — {{count}} today',
    variables: ['userName', 'count', 'dashboardUrl'],
    sample: { userName: 'Aisha', count: '3', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>You received <b>{{count}}</b> direct application(s) today.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">View them</a></p>`),
  },
  {
    key: 'rejectionDigest', name: 'Monthly rejection digest', recipient: 'Recruiter',
    subject: 'Why your CVs came back this month',
    variables: ['userName', 'total', 'days', 'dashboardUrl'],
    sample: { userName: 'Aisha', total: '7', days: '30', dashboardUrl: 'https://www.recruiterv.com/my-submissions' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>Over the last {{days}} days, {{total}} of your candidates were turned down at review.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">See your submissions</a></p>`),
  },

  // The last of the emails whose wording lived in the code. Each send keeps its
  // original body as the fallback, so adding them here changes nothing until
  // somebody edits one — but they can now be reworded or paused like the rest.
  {
    key: 'accountReassigned', name: 'Account reassigned to another role', recipient: 'Any user',
    subject: 'Your RecruiterV account has been reassigned to {{toLabel}}',
    variables: ['userName', 'toLabel', 'dashboardUrl'],
    sample: { userName: 'Aisha', toLabel: 'Coach', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>Your RecruiterV account has been reassigned to <b>{{toLabel}}</b>.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open your dashboard</a></p>`),
  },
  {
    key: 'referrerInvite', name: 'Invitation to earn as a referrer', recipient: 'Any user',
    subject: 'Your RecruiterV path — a new earning opportunity',
    variables: ['userName', 'dashboardUrl'],
    sample: { userName: 'Aisha', dashboardUrl: 'https://www.recruiterv.com/refer-and-earn' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p>You can now refer candidates on RecruiterV and earn when another recruiter places them.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">See Refer &amp; Earn</a></p>`),
  },
  {
    key: 'companyHrAccount', name: 'Company HR account created', recipient: 'Company HR',
    subject: 'Your RecruiterV HR account for {{companyName}}',
    variables: ['userName', 'companyName', 'dashboardUrl'],
    sample: { userName: 'Aisha', companyName: 'Acme Corp', dashboardUrl: 'https://www.recruiterv.com/company' },
    body: brandWrap(`
      <p>Hi {{userName}},</p>
      <p>An HR account has been created for you on RecruiterV for <b>{{companyName}}</b>.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Sign in</a></p>`),
  },
  {
    key: 'portalAccountDecision', name: 'Portal account approved / declined', recipient: 'Company / Vendor / Consulting',
    subject: '{{decisionSubject}}',
    variables: ['userName', 'applicantName', 'decisionSubject', 'dashboardUrl'],
    sample: { userName: 'Aisha', applicantName: 'Rahul', decisionSubject: 'Your RecruiterV account is approved', dashboardUrl: 'https://www.recruiterv.com/company' },
    body: brandWrap(`
      <p>Hi {{userName}},</p>
      <p>{{applicantName}} — there is an update on this RecruiterV account.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Open RecruiterV</a></p>`),
  },
  {
    key: 'positionPaused', name: 'Position paused', recipient: 'Recruiter',
    subject: 'Position paused — {{positionTitle}}',
    variables: ['userName', 'positionTitle', 'clientName', 'dashboardUrl'],
    sample: { userName: 'Aisha', positionTitle: 'Java Developer', clientName: 'Acme Corp', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p>Dear {{userName}},</p>
      <p><b>{{positionTitle}}</b>{{clientName}} has been paused. Please hold further submissions for now.</p>`),
  },
  {
    key: 'coachSelfAssigned', name: 'Coach/Expert self-assigned to a position', recipient: 'ClientSPOC',
    subject: '{{roleCategory}} self-assigned — {{positionTitle}}',
    variables: ['roleCategory', 'positionTitle', 'userName', 'dashboardUrl'],
    sample: { roleCategory: 'Coach', positionTitle: 'Java Developer', userName: 'Rahul', dashboardUrl: 'https://www.recruiterv.com' },
    body: brandWrap(`
      <p><b>{{userName}}</b> ({{roleCategory}}) has self-assigned to <b>{{positionTitle}}</b>.</p>
      <p><a href="{{dashboardUrl}}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;">Review it</a></p>`),
  },
];

const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map(t => [t.key, t]));

// Replace {{var}} tokens. Unknown vars become empty strings.
const substitute = (str, vars = {}) =>
  (str || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));

// Recipient types selectable when creating a template.
const RECIPIENT_OPTIONS = [
  'Recruiter', 'Coach', 'Expert', 'Coach / Expert', 'Vendor', 'ClientSPOC',
  'Candidate', 'Admin', 'SuperAdmin', 'New user', 'New registrant', 'Any user', 'Custom',
];

// Master catalog of variables available across email templates. Shown in the
// designer so admins know what {{tokens}} they can insert.
const VARIABLE_CATALOG = [
  { name: 'candidateName', desc: 'Candidate full name' },
  { name: 'candidateEmail', desc: 'Candidate email' },
  { name: 'candidatePhone', desc: 'Candidate phone' },
  { name: 'positionTitle', desc: 'Position title' },
  { name: 'position', desc: 'Position title (alt)' },
  { name: 'positionName', desc: 'Position name (alt)' },
  { name: 'client', desc: 'Client name' },
  { name: 'clientName', desc: 'Client name (alt)' },
  { name: 'recruiterName', desc: 'Recruiter name' },
  { name: 'recruiterEmail', desc: 'Recruiter email' },
  { name: 'coachExpertName', desc: 'Coach / Expert name' },
  { name: 'coachExpertEmail', desc: 'Coach / Expert email' },
  { name: 'coachExpertPhone', desc: 'Coach / Expert phone' },
  { name: 'specialization', desc: 'Coach / Expert specialization' },
  { name: 'clientspocName', desc: 'ClientSPOC name' },
  { name: 'recipientName', desc: 'Recipient name' },
  { name: 'userName', desc: 'Recipient name (alt)' },
  { name: 'name', desc: 'Recipient name (alt)' },
  { name: 'userType', desc: 'Recipient role / type' },
  { name: 'roleCategory', desc: 'Recipient role category' },
  { name: 'newStatus', desc: 'New / current status' },
  { name: 'oldStatus', desc: 'Previous status' },
  { name: 'statusLabel', desc: 'Status label (Approved / Rejected / …)' },
  { name: 'submitterName', desc: 'Recruiter/Coach/Expert who submitted' },
  { name: 'submitterRole', desc: 'Submitter role (Recruiter/Coach/Expert)' },
  { name: 'positionLink', desc: 'Role-aware position/JD share link (attributed to submitter)' },
  { name: 'positionId', desc: 'Position ID' },
  { name: 'resumeUrl', desc: 'Candidate resume download link' },
  { name: 'relExp', desc: 'Relevant experience (yrs)' },
  { name: 'totalExp', desc: 'Total experience (yrs)' },
  { name: 'currentCTC', desc: 'Current CTC' },
  { name: 'expectedCTC', desc: 'Expected CTC' },
  { name: 'noticePeriod', desc: 'Notice period' },
  { name: 'currentEmployer', desc: 'Current employer' },
  { name: 'currentLocation', desc: 'Current location' },
  { name: 'preferredLocation', desc: 'Preferred location' },
  { name: 'highestEducation', desc: 'Highest education' },
  { name: 'techSkills', desc: 'Technical skills' },
  { name: 'nonTechSkills', desc: 'Other / non-technical skills' },
  { name: 'rhId', desc: 'RH ID' },
  { name: 'dateSubmitted', desc: 'Submission date/time' },
  { name: 'dashboardUrl', desc: 'Link to the dashboard' },
  { name: 'loginUrl', desc: 'Link to sign in' },
  { name: 'resetLink', desc: 'Password reset link' },
  { name: 'otp', desc: 'One-time verification code' },
];

module.exports = { TEMPLATES, TEMPLATE_MAP, substitute, brandWrap, RECIPIENT_OPTIONS, VARIABLE_CATALOG };
