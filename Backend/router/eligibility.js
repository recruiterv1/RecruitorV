const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('./firebase_ad');
const adminVerify = require('../model_fire/adminCF');

// Eligibility check — a public MCQ test a prospective Coach, Expert or Recruiter
// takes before joining. The SuperAdmin owns the questions, the timer, the pass
// mark and the two result messages; every attempt is recorded.
//
// Collections:
//   eligibility_questions — one doc per question, keyed by role
//   eligibility_config    — one doc per role (timer, pass mark, messages)
//   eligibility_attempts  — one doc per attempt, graded server-side
//
// The correct answer NEVER leaves the server for a candidate-facing route.
// Grading happens here, against the stored question, on submit.

const ROLES = ['Coach', 'Expert', 'Recruiter'];
const isRole = (r) => ROLES.includes(String(r || '').trim());

const QUESTIONS = () => db.collection('eligibility_questions');
const CONFIG = () => db.collection('eligibility_config');
const ATTEMPTS = () => db.collection('eligibility_attempts');

// Three outcome tiers rather than a pass/fail line. Everyone gets a path:
//   80–100  Certified          — full access, requisitions immediately
//   50–79   Conditional        — probationary pipeline, capped positions, retake in 1 month
//   0–49    Not Yet Qualified  — not a rejection; retake window opens after 90 days
const DEFAULT_CONFIG = {
  timeLimitMinutes: 10,
  certifiedFrom: 80,
  conditionalFrom: 50,
  conditionalPositionCap: 4,
  conditionalRetakeDays: 30,
  notQualifiedRetakeDays: 90,
  questionCount: 0,          // 0 = ask every active question
  certifiedMessage: 'Congratulations — you are Certified. You have full access: requisitions are assigned immediately and the standard revenue share applies from day one. Your certificate is on its way to your inbox.',
  conditionalMessage: 'You are through on a conditional basis. You are live on a probationary pipeline, capped at {cap} active positions. A retake window opens after {retake} days to move up to Certified.',
  notQualifiedMessage: 'This is not a rejection. A retake window opens after {retake} days, and your scorecard is on its way by email with exactly what to work on first.',
};

const TIERS = {
  certified: { key: 'certified', label: 'Certified' },
  conditional: { key: 'conditional', label: 'Conditional' },
  not_qualified: { key: 'not_qualified', label: 'Not Yet Qualified' },
};

// Which band a score falls into, and what that means.
const tierFor = (percent, cfg) => {
  const p = Number(percent) || 0;
  if (p >= Number(cfg.certifiedFrom)) return 'certified';
  if (p >= Number(cfg.conditionalFrom)) return 'conditional';
  return 'not_qualified';
};

// Certified and Conditional are both "through" — only Not Yet Qualified is not.
const tierAllowsRegistration = (tier) => tier === 'certified' || tier === 'conditional';

// Fill {cap} / {retake} in the configured messages.
const renderTierMessage = (tier, cfg) => {
  const raw = tier === 'certified' ? cfg.certifiedMessage
    : tier === 'conditional' ? cfg.conditionalMessage
    : cfg.notQualifiedMessage;
  return String(raw || '')
    .replace(/\{cap\}/g, cfg.conditionalPositionCap)
    .replace(/\{retake\}/g, tier === 'conditional' ? cfg.conditionalRetakeDays : cfg.notQualifiedRetakeDays);
};

// When may this person sit the assessment again?
const retakeAfter = (tier, cfg, from = new Date()) => {
  if (tier === 'certified') return null;               // no need
  const days = tier === 'conditional' ? cfg.conditionalRetakeDays : cfg.notQualifiedRetakeDays;
  return new Date(from.getTime() + Number(days) * 86400000);
};

// ── SuperAdmin auth ──────────────────────────────────────────────────────────
const adminAuth = async (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) return res.status(401).json({ success: false, message: 'No admin session' });
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    const result = await adminVerify.checkData(decoded.email);
    if (result.success) { req.admin = result.admin; return next(); }

    // Super Admins can also live in recruiter_db.
    const recruiterF = require('../model_fire/recruiterF');
    const rec = await recruiterF.findRecruiterByEmail(decoded.email);
    if (rec && (rec.role === 'Super Admin' || rec.roleCategory === 'SuperAdmin')) {
      req.admin = rec; return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorised' });
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session' });
  }
};

const toIso = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const configFor = async (role) => {
  const doc = await CONFIG().doc(role).get();
  return { role, ...DEFAULT_CONFIG, ...(doc.exists ? doc.data() : {}) };
};

// Fisher-Yates, used to vary which questions a candidate sees.
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ── Public: taking the check ─────────────────────────────────────────────── */

// GET /eligibility/public/config — what a candidate sees before starting.
router.get('/public/config', async (req, res) => {
  try {
    const out = {};
    for (const role of ROLES) {
      const c = await configFor(role);
      const snap = await QUESTIONS().where('role', '==', role).where('active', '==', true).get();
      const available = snap.size;
      const asked = c.questionCount > 0 ? Math.min(c.questionCount, available) : available;
      out[role] = {
        timeLimitMinutes: c.timeLimitMinutes,
        certifiedFrom: c.certifiedFrom,
        conditionalFrom: c.conditionalFrom,
        conditionalPositionCap: c.conditionalPositionCap,
        questionCount: asked,
        ready: asked > 0,
      };
    }
    res.json({ success: true, roles: ROLES, config: out });
  } catch (e) {
    console.error('eligibility/public/config error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /eligibility/public/skill-categories — the parent categories the
// SuperAdmin maintains, so the assessment offers the same list the rest of the
// platform uses rather than a hard-coded one.
router.get('/public/skill-categories', async (req, res) => {
  try {
    const snap = await db.collection('skill_categories').get();
    const names = [...new Set(snap.docs.map(d => String(d.data().parent || '').trim()).filter(Boolean))].sort();
    res.json({ success: true, categories: names });
  } catch (e) {
    console.error('eligibility/skill-categories error:', e.message);
    res.json({ success: true, categories: [] });   // the field is optional
  }
});

// POST /eligibility/public/start { name, email, phone, role }
// Records the attempt and returns the questions WITHOUT their answers.
router.post('/public/start', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const role = String(req.body?.role || '').trim();

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email and phone are required.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!isRole(role)) {
      return res.status(400).json({ success: false, message: 'Please choose a role.' });
    }

    const cfg = await configFor(role);

    // A retake window has to have opened before they can sit it again. Somebody
    // already Certified has no reason to retake.
    try {
      const prior = await ATTEMPTS()
        .where('email', '==', email).where('role', '==', role).where('status', '==', 'submitted').get();
      if (!prior.empty) {
        const latest = prior.docs
          .map(d => d.data())
          .sort((a, b) => (b.submittedAt?._seconds || 0) - (a.submittedAt?._seconds || 0))[0];
        if (latest.tier === 'certified') {
          return res.status(409).json({
            success: false, alreadyCertified: true,
            message: 'You are already Certified for this track — there is no need to sit it again.',
          });
        }
        const opensAt = latest.retakeAfter?._seconds ? new Date(latest.retakeAfter._seconds * 1000) : null;
        if (opensAt && opensAt > new Date()) {
          const days = Math.ceil((opensAt - Date.now()) / 86400000);
          return res.status(429).json({
            success: false, retakeLocked: true, retakeAfter: opensAt.toISOString(),
            message: `Your retake window opens on ${opensAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${days} day${days === 1 ? '' : 's'} from now.`,
          });
        }
      }
    } catch (e) {
      console.error('eligibility retake-window check skipped:', e.message);
    }
    const snap = await QUESTIONS().where('role', '==', role).where('active', '==', true).get();
    if (snap.empty) {
      return res.status(409).json({
        success: false,
        message: 'The eligibility check for this role is not available yet. Please try again later.',
      });
    }

    let pool = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    pool = shuffle(pool);
    if (cfg.questionCount > 0) pool = pool.slice(0, cfg.questionCount);

    const attempt = await ATTEMPTS().add({
      name, email, phone, role,
      // Carried onto the certificate for anyone who reaches Certified.
      skillCategory: String(req.body?.skillCategory || '').trim().slice(0, 120),
      questionIds: pool.map(q => q.id),
      timeLimitMinutes: cfg.timeLimitMinutes,
      passPercent: cfg.passPercent,
      status: 'in_progress',
      startedAt: new Date(),
    });

    res.json({
      success: true,
      attemptId: attempt.id,
      timeLimitMinutes: cfg.timeLimitMinutes,
      passPercent: cfg.passPercent,
      // Options only — the correct index stays on the server.
      questions: pool.map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
      })),
    });
  } catch (e) {
    console.error('eligibility/public/start error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /eligibility/public/submit { attemptId, answers: { questionId: optionIndex }, timedOut }
router.post('/public/submit', async (req, res) => {
  try {
    const attemptId = String(req.body?.attemptId || '');
    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const timedOut = req.body?.timedOut === true;
    if (!attemptId) return res.status(400).json({ success: false, message: 'attemptId is required.' });

    const ref = ATTEMPTS().doc(attemptId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'This attempt was not found.' });
    const a = doc.data();
    if (a.status === 'submitted') {
      return res.status(409).json({ success: false, message: 'This attempt has already been submitted.' });
    }

    // Grade against the stored questions — never against anything the client sent.
    const ids = Array.isArray(a.questionIds) ? a.questionIds : [];
    const qDocs = await Promise.all(ids.map(id => QUESTIONS().doc(id).get()));
    let correct = 0;
    const detail = qDocs.map(qd => {
      if (!qd.exists) return null;
      const q = qd.data();
      const given = answers[qd.id];
      const chosen = Number.isInteger(given) ? given : (given === undefined || given === null ? -1 : parseInt(given, 10));
      const ok = chosen === Number(q.correctIndex);
      if (ok) correct++;
      return { questionId: qd.id, question: q.question, chosen, correctIndex: Number(q.correctIndex), correct: ok };
    }).filter(Boolean);

    const total = detail.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const cfg = await configFor(a.role);
    const tier = tierFor(percent, cfg);
    // `passed` now means "cleared to register" — Certified or Conditional.
    const passed = tierAllowsRegistration(tier);
    const submittedAt = new Date();
    const opensAt = retakeAfter(tier, cfg, submittedAt);

    await ref.update({
      status: 'submitted',
      timedOut,
      correct, total, percent,
      tier,
      passed,
      positionCap: tier === 'conditional' ? Number(cfg.conditionalPositionCap) : null,
      retakeAfter: opensAt,
      detail,
      submittedAt,
    });

    // A Certified result earns a certificate, emailed straight away.
    let certificate = null;
    if (tier === 'certified') {
      try {
        const { issueCertificate } = require('../utils/eligibilityCertificate');
        certificate = await issueCertificate({
          attemptId: ref.id,
          name: a.name, email: a.email, role: a.role,
          skillCategory: a.skillCategory || '',
          percent, issuedAt: submittedAt,
        });
        if (certificate?.certificateId) {
          await ref.update({
            certificateId: certificate.certificateId,
            certificateUrl: certificate.url || '',
            certificateEmailed: certificate.emailed === true,
          });
        }
      } catch (certErr) {
        // The result must stand even if the certificate or its email fails.
        console.error('certificate issue failed:', certErr.message);
      }
    }

    res.json({
      success: true,
      tier,
      tierLabel: TIERS[tier].label,
      passed, percent, correct, total, timedOut,
      certifiedFrom: cfg.certifiedFrom,
      conditionalFrom: cfg.conditionalFrom,
      positionCap: tier === 'conditional' ? Number(cfg.conditionalPositionCap) : null,
      retakeAfter: opensAt ? opensAt.toISOString() : null,
      retakeDays: tier === 'certified' ? null
        : (tier === 'conditional' ? cfg.conditionalRetakeDays : cfg.notQualifiedRetakeDays),
      certificateId: certificate?.certificateId || null,
      certificateEmailed: certificate?.emailed === true,
      message: renderTierMessage(tier, cfg),
    });
  } catch (e) {
    console.error('eligibility/public/submit error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Has this email already cleared the check for this role? Used both by the
// public status endpoint and by registration, which will not create a
// self-registered Coach, Expert or Recruiter without a pass.
const hasPassed = async (email, role) => {
  const e = String(email || '').trim().toLowerCase();
  if (!e || !isRole(role)) return null;
  try {
    const snap = await ATTEMPTS()
      .where('email', '==', e).where('role', '==', role).where('passed', '==', true).get();
    if (snap.empty) return null;
    // Most recent pass wins.
    const best = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.submittedAt?._seconds || 0, tb = b.submittedAt?._seconds || 0;
        return tb - ta;
      })[0];
    return { attemptId: best.id, percent: best.percent, passedAt: toIso(best.submittedAt) };
  } catch (e2) {
    console.error('eligibility hasPassed error:', e2.message);
    return null;
  }
};

// GET /eligibility/public/status?email=&role=
// Lets the registration form tell someone what to do before they fill it in.
router.get('/public/status', async (req, res) => {
  try {
    const role = String(req.query.role || '').trim();
    if (!isRole(role)) return res.status(400).json({ success: false, message: 'Unknown role.' });

    // A role with no questions cannot gate anything — say so plainly rather
    // than locking people out of registering.
    const qSnap = await QUESTIONS().where('role', '==', role).where('active', '==', true).get();
    if (qSnap.empty) {
      return res.json({ success: true, required: false, passed: true, reason: 'no_check_configured' });
    }

    const pass = await hasPassed(req.query.email, role);
    res.json({ success: true, required: true, passed: !!pass, pass: pass || null });
  } catch (e) {
    console.error('eligibility/public/status error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── SuperAdmin: questions ────────────────────────────────────────────────── */

router.get('/admin/questions', adminAuth, async (req, res) => {
  try {
    const role = req.query.role;
    let q = QUESTIONS();
    if (isRole(role)) q = q.where('role', '==', role);
    const snap = await q.get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toIso(d.data().createdAt) }))
      .sort((a, b) => (a.role || '').localeCompare(b.role || '') || (a.order ?? 0) - (b.order ?? 0));
    res.json({ success: true, questions: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

const validateQuestion = (body) => {
  const role = String(body?.role || '').trim();
  const question = String(body?.question || '').trim();
  const options = Array.isArray(body?.options) ? body.options.map(o => String(o || '').trim()) : [];
  const correctIndex = parseInt(body?.correctIndex, 10);

  if (!isRole(role)) return 'Choose a valid role.';
  if (!question) return 'The question text is required.';
  const filled = options.filter(Boolean);
  if (filled.length < 2) return 'Give at least two options.';
  if (options.length !== filled.length) return 'Options cannot be left blank — remove any you do not need.';
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return 'Mark which option is the correct answer.';
  }
  return null;
};

router.post('/admin/questions', adminAuth, async (req, res) => {
  try {
    const err = validateQuestion(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    const { role, question, options, correctIndex, active = true, order = 0 } = req.body;
    const ref = await QUESTIONS().add({
      role, question: String(question).trim(),
      options: options.map(o => String(o).trim()),
      correctIndex: parseInt(correctIndex, 10),
      active: active !== false,
      order: parseInt(order, 10) || 0,
      createdAt: new Date(),
    });
    res.json({ success: true, id: ref.id, message: 'Question added.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admin/questions/:id', adminAuth, async (req, res) => {
  try {
    const err = validateQuestion(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    const { role, question, options, correctIndex, active, order } = req.body;
    await QUESTIONS().doc(req.params.id).update({
      role, question: String(question).trim(),
      options: options.map(o => String(o).trim()),
      correctIndex: parseInt(correctIndex, 10),
      active: active !== false,
      order: parseInt(order, 10) || 0,
      updatedAt: new Date(),
    });
    res.json({ success: true, message: 'Question updated.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/admin/questions/:id', adminAuth, async (req, res) => {
  try {
    await QUESTIONS().doc(req.params.id).delete();
    res.json({ success: true, message: 'Question deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── SuperAdmin: settings per role ────────────────────────────────────────── */

router.get('/admin/config', adminAuth, async (req, res) => {
  try {
    const out = {};
    for (const role of ROLES) {
      const c = await configFor(role);
      const snap = await QUESTIONS().where('role', '==', role).get();
      const active = snap.docs.filter(d => d.data().active !== false).length;
      out[role] = { ...c, totalQuestions: snap.size, activeQuestions: active };
    }
    res.json({ success: true, roles: ROLES, config: out });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/admin/config/:role', adminAuth, async (req, res) => {
  try {
    const role = req.params.role;
    if (!isRole(role)) return res.status(400).json({ success: false, message: 'Unknown role.' });

    const patch = {};
    const num = (v, min, max, fallback) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    if (req.body.timeLimitMinutes !== undefined) patch.timeLimitMinutes = num(req.body.timeLimitMinutes, 1, 240, 15);
    if (req.body.passPercent !== undefined) patch.passPercent = num(req.body.passPercent, 1, 100, 70);
    if (req.body.questionCount !== undefined) patch.questionCount = num(req.body.questionCount, 0, 200, 0);
    if (req.body.successMessage !== undefined) patch.successMessage = String(req.body.successMessage).slice(0, 2000);
    if (req.body.sorryMessage !== undefined) patch.sorryMessage = String(req.body.sorryMessage).slice(0, 2000);

    await CONFIG().doc(role).set({ role, ...patch, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, message: `${role} settings saved.` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── SuperAdmin: results ──────────────────────────────────────────────────── */

router.get('/admin/results', adminAuth, async (req, res) => {
  try {
    const role = req.query.role;
    let q = ATTEMPTS();
    if (isRole(role)) q = q.where('role', '==', role);
    const snap = await q.get();

    // Did they go on to register? Look the email up in the collection that
    // matches the role they took the check for. Fetched once and matched in
    // memory rather than a query per attempt.
    const COLLECTION = { Recruiter: 'recruiter_db', Coach: 'coach_db', Expert: 'expert_db' };
    const accounts = {};
    for (const [r, col] of Object.entries(COLLECTION)) {
      accounts[r] = {};
      try {
        const accSnap = await db.collection(col).select('email', 'isVerified', 'createdAt', 'datePosted').get();
        accSnap.docs.forEach(d => {
          const e = String(d.data().email || '').trim().toLowerCase();
          if (e) accounts[r][e] = { isVerified: d.data().isVerified !== false };
        });
      } catch (e2) {
        console.error(`eligibility results: could not read ${col}:`, e2.message);
      }
    }

    const rows = snap.docs.map(d => {
      const a = d.data();
      const email = String(a.email || '').trim().toLowerCase();
      const acc = accounts[a.role]?.[email] || null;
      return {
        id: d.id,
        name: a.name || '', email: a.email || '', phone: a.phone || '',
        role: a.role || '',
        status: a.status || 'in_progress',
        correct: a.correct ?? null, total: a.total ?? (a.questionIds || []).length,
        percent: a.percent ?? null,
        passed: a.passed === true,
        tier: a.tier || (a.passed === true ? 'certified' : 'not_qualified'),
        tierLabel: TIERS[a.tier]?.label || (a.passed === true ? 'Certified' : 'Not Yet Qualified'),
        positionCap: a.positionCap ?? null,
        retakeAfter: toIso(a.retakeAfter),
        // The certificate issued for a Certified result — downloadable and
        // verifiable straight from the results table.
        certificateId: a.certificateId || null,
        certificateUrl: a.certificateUrl || '',
        certificateEmailed: a.certificateEmailed === true,
        skillCategory: a.skillCategory || '',
        timedOut: a.timedOut === true,
        // Whether the candidate went on to create the account they were cleared for.
        registered: !!acc,
        accountVerified: acc ? acc.isVerified : null,
        startedAt: toIso(a.startedAt),
        submittedAt: toIso(a.submittedAt),
      };
    }).sort((x, y) => (y.startedAt || '').localeCompare(x.startedAt || ''));

    const done = rows.filter(r => r.status === 'submitted');
    res.json({
      success: true,
      results: rows,
      summary: {
        total: rows.length,
        completed: done.length,
        passed: done.filter(r => r.passed).length,
        failed: done.filter(r => !r.passed).length,
        abandoned: rows.length - done.length,
        // Of those cleared to register, how many actually did.
        registered: done.filter(r => r.passed && r.registered).length,
        notRegistered: done.filter(r => r.passed && !r.registered).length,
        certified: done.filter(r => r.tier === 'certified').length,
        conditional: done.filter(r => r.tier === 'conditional').length,
      },
    });
  } catch (e) {
    console.error('eligibility/admin/results error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// One attempt in full, including which questions were answered wrongly.
router.get('/admin/results/:id', adminAuth, async (req, res) => {
  try {
    const doc = await ATTEMPTS().doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Attempt not found.' });
    const a = doc.data();

    // The attempt stores the chosen and correct indexes; pull the option text
    // so the console can show the actual answers rather than "Option 2".
    // A question edited or deleted since simply has no text to show.
    const ids = [...new Set([
      ...(Array.isArray(a.questionIds) ? a.questionIds : []),
      ...((a.detail || []).map(d => d.questionId).filter(Boolean)),
    ])];
    const questionOptions = {};
    const qDocs = await Promise.all(ids.map(id => QUESTIONS().doc(id).get()));
    qDocs.forEach(qd => {
      if (qd.exists && Array.isArray(qd.data().options)) questionOptions[qd.id] = qd.data().options;
    });

    res.json({
      success: true,
      attempt: {
        id: doc.id, ...a,
        questionOptions,
        startedAt: toIso(a.startedAt), submittedAt: toIso(a.submittedAt),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /eligibility/verify/:certificateId — public, so a certificate can be
// checked by anyone holding one. Returns only what a verifier needs.
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const id = String(req.params.certificateId || '').trim().toUpperCase();
    const snap = await ATTEMPTS().where('certificateId', '==', id).limit(1).get();
    if (snap.empty) return res.status(404).json({ success: false, valid: false, message: 'No certificate found with that ID.' });
    const a = snap.docs[0].data();
    res.json({
      success: true, valid: true,
      certificateId: id,
      name: a.name || '',
      role: a.role || '',
      skillCategory: a.skillCategory || '',
      tier: a.tier || 'certified',
      issuedAt: toIso(a.submittedAt),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
// Exported so registration can enforce the gate server-side.
module.exports.hasPassed = hasPassed;
module.exports.ROLES = ROLES;
