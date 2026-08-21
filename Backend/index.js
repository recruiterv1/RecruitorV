const functions = require("firebase-functions");
const express = require("express");
const app = express();

// Force deployment timestamp: Wed May 20 2026 - BREVO_API_KEY new key v11 no IP restriction

app.set("trust proxy", 1);

const cors = require("cors");
// Preserve the raw body so webhook signatures (e.g. Razorpay) can be verified.
app.use(express.json({ limit: '10mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));

// CORS configuration - handle both simple and preflight requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow these origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://recruitorv-1291c.web.app',
      'https://www.recruiterv.com',
      'https://recruitorv-1291c--www-recruiterv-com-xxvlyqb4.web.app',
      undefined // for file:// protocol
    ];
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.googleusercontent.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}));

// Handle OPTIONS preflight requests - use middleware instead of route
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // CORS preflight request
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
      return;
    }
  }
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Load Firebase secrets
const { loadSecretsIntoProcessEnv, SECRETS } = require("./loadSecrets.js");

// Local .env support
if (!process.env.K_SERVICE) {
  const dotenv = require("dotenv");
  const path = require("path");
  // .env.local is ignored by Firebase CLI (won't be uploaded as plain env vars)
  dotenv.config({ path: path.resolve(__dirname, ".env.local") });
  console.log("Loaded .env.local for local development");
}


// Routers
const authGoogla = require("./router/authGoogle");
const authLink = require("./router/authLink");
const admin = require("./router/admin");
const adminFixEmail = require("./router/adminFixEmail");
const recReg = require("./router/rout");
const position = require("./router/position");
const candi = require("./router/candidate");
const download = require("./router/download");
const clientspoc=require("./router/clientspoc.js")
const recruiterStats=require("./router/recruiterStats.js")
const clientspocStats=require("./router/clientspocStats.js")
const positionStats=require("./router/positionStats.js")
const dashboardStats=require("./router/dashboardStats.js")
const candidateStats=require("./router/candidateStats.js")
const clientStats=require("./router/clientStats.js")
const blog = require("./router/blog.js");
const positionAccess = require("./router/positionAccess.js");
const recruiterEarnings = require("./router/recruiterEarnings.js");
const coachExpert = require("./router/coachExpert.js");
const profile = require("./router/profile.js");
const adminModel = require("./model_fire/adminF");
const agreement = require("./router/agreement.js");
const recruiterEmail = require("./router/recruiterEmail.js");
const inboxAccess = require("./router/inboxAccess.js");
const inboxPayment = require("./router/inboxPayment.js");
const companyPortal = require("./router/company.js");
const publicJob = require("./router/publicJob.js");
const consulting = require("./router/consulting.js");
const directCoachRequest = require("./router/directCoachRequest.js");
const reports = require("./router/reports.js");
const vendor = require("./router/vendor.js");


const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Mobile / native-app auth: web views can't send the cross-site `__session`
// cookie, so the app sends the JWT as `Authorization: Bearer <token>`. Copy it
// into req.cookies.__session so every existing cookie-based auth check works
// unchanged (the website continues to use the cookie).
app.use((req, res, next) => {
  if (!req.cookies) req.cookies = {};
  if (!req.cookies.__session) {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth && /^Bearer\s+/i.test(auth)) {
      req.cookies.__session = auth.replace(/^Bearer\s+/i, '').trim();
    }
  }
  next();
});

app.use("/auth", recReg);
app.use("/api/profile", profile);
app.use("/admin", admin);
app.use("/admin-fix-email", adminFixEmail);
app.use("/candidate", position);
app.use("/addit", candi);
app.use("/download", download);
app.use("/api/linkedin", authLink);
app.use("/api/googla", authGoogla);
app.use("/clientspoc",clientspoc);
app.use("/recruiterstats",recruiterStats);
app.use("/clientspocstats",clientspocStats);
app.use("/clientstats",clientStats);
app.use("/positionstats",positionStats);
app.use("/dashboardstats",dashboardStats);
app.use("/candidatestats",candidateStats);
app.use("/blog", blog);
app.use("/api/position-access", positionAccess);
app.use("/api/recruiter-earnings", recruiterEarnings);
app.use("/api/notifications", require("./router/notification"));
app.use("/api/coach-expert", coachExpert);
app.use("/api/briefing", require("./router/briefing"));
console.log("Coach/Expert router mounted.");
console.log("Coach/Expert stats route ready");
app.use("/api/debug", require("./router/checkUser"));
app.use("/api/agreement", agreement);
app.use("/api/recruiter-email", recruiterEmail);
app.use("/api/inbox-access", inboxAccess);
app.use("/api/tts", require("./router/tts"));
app.use("/api/inbox-payment", inboxPayment);
app.use("/api/company", companyPortal);
app.use("/api/public-job", publicJob);
app.use("/api/consulting", consulting);
app.use("/api/direct-coach-request", directCoachRequest);
app.use("/api/reports", reports);
app.use("/vendor", vendor);
const directApply = require("./router/directApply.js");
app.use("/api/direct-apply", directApply);
const referral = require("./router/referral.js");
app.use("/api/referral", referral);
const referer = require("./router/referer.js");
app.use("/api/referer", referer);
app.use("/api/ai-report", require("./router/aiReport"));
app.use("/api/chat", require("./router/chat"));
app.use("/api/cv-match", require("./router/cvMatch"));
app.use("/api/email-templates", require("./router/emailTemplates"));
app.use("/api/manager", require("./router/manager"));
app.use("/activity", require("./router/activity"));
app.use("/api/app", require("./router/appMobile"));


app.get("/", (req, res) => {
  res.cookie("name", "utkarsg");
  res.send("RecruitorV Backend is running on Firebase!");
});

// ---- SOCIAL SHARE META TAGS for shared position links (/position/:pos_id) ----
// Crawlers (WhatsApp/LinkedIn/Facebook) don't run JS, so OG tags must be in the
// server HTML. We fetch the SPA shell and inject per-position meta tags.
const adminPosModel = require("./model_fire/adminF");
const SITE_ORIGIN = "https://www.recruiterv.com";
const SHARE_LOGO = `${SITE_ORIGIN}/recruitorV.png`;
let _shellHtmlCache = { html: null, at: 0 };

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getShellHtml = async () => {
  const now = Date.now();
  // Short cache so we never serve a shell that points to a purged (old) asset hash.
  if (_shellHtmlCache.html && now - _shellHtmlCache.at < 60 * 1000) {
    return _shellHtmlCache.html;
  }
  // Fetch the CURRENT SPA shell from the site root (served fresh, no 301 redirect,
  // no-cache). Root "/" is served by Hosting's index.html, not this function.
  const resp = await fetch(`${SITE_ORIGIN}/`, {
    headers: { "User-Agent": "recruiterv-og-injector", "Cache-Control": "no-cache" },
    redirect: "follow"
  });
  const html = await resp.text();
  // Only cache/return if it looks like a valid SPA shell with a real asset reference,
  // so a transient bad response can never cause a white screen.
  if (html.includes('id="root"') && /assets\/index-[A-Za-z0-9_]+\.js/.test(html)) {
    _shellHtmlCache = { html, at: now };
    return html;
  }
  return _shellHtmlCache.html || html;
};

const renderPositionShare = async (req, res) => {
  const { pos_id } = req.params;
  try {
    const [position, shell] = await Promise.all([
      adminPosModel.findPositionByPosId(pos_id),
      getShellHtml()
    ]);

    const title = position?.position
      ? `${position.position} - RecruiterV`
      : "RecruiterV";

    // 50 words from job description, HTML stripped
    const plain = (position?.job_desc || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = plain ? plain.split(" ").slice(0, 50).join(" ") : "";
    const description = words || "Explore this opportunity and apply on RecruiterV.";

    const url = `${SITE_ORIGIN}${req.path}`;
    const t = escapeHtml(title);
    const d = escapeHtml(description);

    const metaTags = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="RecruiterV" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${SHARE_LOGO}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${SHARE_LOGO}" />
    `;

    // Replace the default <title> and inject OG/meta tags into <head>
    let html = shell.replace(/<title>.*?<\/title>/i, "");
    html = html.replace(/<head>/i, `<head>${metaTags}`);

    res.set("Cache-Control", "public, max-age=60, s-maxage=60");
    res.status(200).send(html);
  } catch (err) {
    console.error("Error rendering share meta for position:", err);
    try {
      const shell = await getShellHtml();
      return res.status(200).send(shell);
    } catch (_) {
      return res.status(500).send("Failed to load position");
    }
  }
};

// Public share URL and the dashboard view URL both get per-position meta tags.
app.get("/position/:pos_id", renderPositionShare);
app.get("/dash_view/:pos_id", renderPositionShare);

app.get("/api/health/brevo", (req, res) => {
  const loaded = !!process.env.BREVO_API_KEY;
  res.status(200).json({ success: true, brevoKeyLoaded: loaded });
});

app.get("/api/health/brevo/position/:pos_id", async (req, res) => {
  try {
    const { pos_id } = req.params;
    const position = await adminModel.findPositionByPosId(pos_id);
    if (!position) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }
    const to = position.clientspoc || null;
    const subjectPreview = `🎯 New Candidate Submitted for ${position.position || 'Position'} - {candidateName}`;
    res.status(200).json({
      success: true,
      brevoKeyLoaded: !!process.env.BREVO_API_KEY,
      to,
      client: position.client || null,
      positionTitle: position.position || null,
      subjectPreview
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch position", error: err.message });
  }
});
// ---- TEST EMAIL ----
app.post('/api/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ success: false, message: 'Provide { "to": "your@email.com" }' });
  const { sendEmail, templates } = require('./utils/email');
  try {
    const result = await sendEmail(to, '✅ RecruiterV Email Test', templates.welcome('Test User', 'http://localhost:5173'));
    res.json({ success: true, message: `Email sent to ${to}`, messageId: result.messageId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- TEST ALL EMAILS ----
app.post('/api/test-email-all', async (req, res) => {
  const { sendEmailFull, templates } = require('./utils/email');
  const recipients = ['ikumarmrigank@gmail.com', 'roshan@freepathshala.org'];
  const loginUrl = 'https://www.recruiterv.com/log_rec';
  const allTemplates = [
    { subject: '[TEST] Welcome — Recruiter',       html: templates.welcome('Test User', 'Recruiter', loginUrl) },
    { subject: '[TEST] Welcome — Coach',           html: templates.welcome('Test User', 'Coach', loginUrl) },
    { subject: '[TEST] Welcome — Expert',          html: templates.welcome('Test User', 'Expert', loginUrl) },
    { subject: '[TEST] Account Approved — Recruiter', html: templates.accountApproved('Test User', 'Recruiter', loginUrl) },
    { subject: '[TEST] Account Approved — Coach',     html: templates.accountApproved('Test User', 'Coach', loginUrl) },
    { subject: '[TEST] Account Approved — Expert',    html: templates.accountApproved('Test User', 'Expert', loginUrl) },
    { subject: '[TEST] Account Rejected — Recruiter', html: templates.accountRejected('Test User', 'Recruiter') },
    { subject: '[TEST] Account Rejected — Coach',     html: templates.accountRejected('Test User', 'Coach') },
    { subject: '[TEST] Account Rejected — Expert',    html: templates.accountRejected('Test User', 'Expert') },
  ];
  const results = [];
  for (const to of recipients) {
    for (const t of allTemplates) {
      try {
        await sendEmailFull({ to, subject: t.subject, htmlContent: t.html });
        results.push({ to, subject: t.subject, ok: true });
      } catch (err) {
        results.push({ to, subject: t.subject, ok: false, error: err.message });
      }
    }
  }
  res.json({ results });
});

// ---- BREVO DIAGNOSTIC ----
app.get('/api/debug/brevo', async (req, res) => {
  const axios = require('axios');
  const key = process.env.BREVO_API_KEY || '';
  const keyInfo = {
    length: key.length,
    starts: key.substring(0, 12),
    ends: key.substring(key.length - 6),
    hasNewline: key.includes('\n'),
    hasSpace: key.includes(' '),
  };
  try {
    const r = await axios.get('https://api.brevo.com/v3/account', {
      headers: { 'api-key': key, accept: 'application/json' }
    });
    res.json({ keyInfo, brevoStatus: r.status, email: r.data.email });
  } catch (err) {
    res.json({ keyInfo, brevoError: err.response?.status, brevoMsg: err.response?.data?.message || err.message });
  }
});

// ---- LOCAL DEVELOPMENT SERVER ----
if (!process.env.K_SERVICE) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: Local Development`);
  });
}



// ---- FINAL EXPORT (CommonJS, working) ----
exports.api = functions.https.onRequest(
  {
    secrets: SECRETS.map(s => s.secret),
    region: 'us-central1',
    invoker: 'public',
    timeoutSeconds: 300,
    // Performance: keep one instance warm so users never hit a multi-second cold
    // start, give it more CPU (memory scales CPU in Cloud Functions), and let a
    // single warm instance serve many requests at once instead of spinning up new
    // (cold) instances under normal load.
    memory: '1GiB',
    minInstances: 1,
    concurrency: 80
  },
  (req, res) => {
    loadSecretsIntoProcessEnv();
    app(req, res);
  }
);

// ---- Scheduled: auto-suspend inactive recruiters (daily) ----
const { onSchedule } = require('firebase-functions/v2/scheduler');
exports.suspendInactiveRecruiters = onSchedule(
  {
    schedule: 'every day 02:30',
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const { suspendInactiveRecruiters, suspendInactiveCoachesExperts } = require('./model_fire/inactivityF');
    const rec = await suspendInactiveRecruiters();
    const ce = await suspendInactiveCoachesExperts();
    console.log('🕑 Inactivity sweep complete:', JSON.stringify({ recruiters: rec, coachesExperts: ce }));
  }
);


// ---- Scheduled: auto Screen Reject stale candidates (hourly) ----
// 'Applied' untouched for 48h and 'Submitted' untouched for 72h are moved to
// Screen Reject so they stop holding position slots and become visible in the
// Resume Bank. Controlled by Firestore app_config/auto_screen_reject.
exports.autoScreenRejectSweep = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const { runAutoScreenReject } = require('./utils/autoScreenReject');
    const r = await runAutoScreenReject();
    console.log('🧹 Auto screen-reject sweep:', JSON.stringify(r));
  }
);

// ---- Scheduled: delete candidate submission drafts older than 72h ----
exports.cleanupCandidateDrafts = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    const snap = await db.collection('candidate_drafts').where('expiresAt', '<', new Date()).get();
    let n = 0;
    // Batch deletes (Firestore caps a batch at 500 ops).
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = db.batch();
      snap.docs.slice(i, i + 450).forEach(d => { batch.delete(d.ref); n++; });
      await batch.commit();
    }
    console.log('🧹 Expired candidate drafts deleted:', n);
  }
);

// ---- Scheduled: daily 7 AM IST direct-applicant digest ----
exports.dailyDirectApplicantDigest = onSchedule(
  {
    schedule: 'every day 07:00',
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
    secrets: SECRETS.map(s => s.secret), // Brevo key for sending
  },
  async () => {
    loadSecretsIntoProcessEnv();
    const { sendDailyDirectApplicantDigest } = require('./utils/directApplicantDigest');
    const result = await sendDailyDirectApplicantDigest(24);
    console.log('📬 Direct-applicant digest sent:', JSON.stringify(result));
  }
);
