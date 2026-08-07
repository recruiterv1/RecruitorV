const express = require('express');
const router  = express.Router();

// ── Personal info extractor ───────────────────────────────────────────────────
function extractPersonalInfo(text) {
  if (!text) return {};
  const info = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // ── Email ──────────────────────────────────────────────────────────────────
  const emailMatch = text.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) info.emails = emailMatch[0].toLowerCase();

  // ── Phone ─────────────────────────────────────────────────────────────────
  // Indian: optional +91 / 91 prefix, then 10-digit number starting 6-9
  const phoneMatch = text.match(/(?:\+91[\s\-.]?|91[\s\-.]?)?([6-9]\d{9})/);
  if (phoneMatch) info.mob = phoneMatch[1];

  // ── Date of Birth ─────────────────────────────────────────────────────────
  // Look for DOB / Date of Birth / Born label followed by a date
  const dobLabelRe = /(?:d\.?o\.?b\.?|date\s+of\s+birth|born\s+on|birth\s+date)\s*[:\-]?\s*(\d{1,2}[\s\/\-\.]\w+[\s\/\-\.]\d{2,4}|\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/i;
  const dobLabelMatch = text.match(dobLabelRe);
  if (dobLabelMatch) {
    const parsed = parseDateToISO(dobLabelMatch[1]);
    if (parsed) info.dob = parsed;
  }

  // ── Current Employer ──────────────────────────────────────────────────────
  // Patterns: "currently working at X", "current company: X", "employer: X",
  //           experience section line that ends with "present" / "current"
  const currEmpPatterns = [
    /(?:currently\s+working\s+(?:at|with|in)|current\s+(?:company|employer|organisation|organization|workplace))\s*[:\-]?\s*([A-Z][^\n,]{2,50})/i,
    /(?:employer|company)\s*[:\-]\s*([A-Z][^\n,]{2,40})/i,
  ];
  for (const re of currEmpPatterns) {
    const m = text.match(re);
    if (m) { info.curr_emp = m[1].trim().replace(/\s+/g, ' '); break; }
  }
  // Fallback: find experience lines that end with "Present" / "Current"
  if (!info.curr_emp) {
    for (const line of lines) {
      if (/present|current/i.test(line) && line.length < 120) {
        // Try to extract company name — typically "Company Name | City | Jan 2020 – Present"
        const compMatch = line.match(/^([A-Z][A-Za-z0-9\s&.,'-]{2,40?}?)(?:\s*[|\-–—|,])/);
        if (compMatch) { info.curr_emp = compMatch[1].trim(); break; }
      }
    }
  }

  // ── Full Name ─────────────────────────────────────────────────────────────
  // Strategy 1: explicit "Name:" label
  const nameLabelMatch = text.match(/^(?:name|full\s+name)\s*[:\-]\s*([A-Z][a-zA-Z .'-]{2,50})/im);
  if (nameLabelMatch) {
    info.candidate = toTitleCase(nameLabelMatch[1].trim());
  }

  // Strategy 2: first 1-3 lines — pick a line that looks like a person name
  // (2-4 words, all capitalised, no digits, not a common header word)
  if (!info.candidate) {
    const skipWords = new Set(['resume', 'curriculum', 'vitae', 'cv', 'profile', 'objective', 'summary', 'contact', 'about', 'introduction', 'details', 'bio']);
    for (const line of lines.slice(0, 6)) {
      // Strip leading/trailing punctuation
      const clean = line.replace(/^[^A-Za-z]+|[^A-Za-z.'-\s]+$/g, '').trim();
      const words = clean.split(/\s+/);
      if (
        words.length >= 2 && words.length <= 5 &&
        /^[A-Z]/.test(clean) &&
        !/\d/.test(clean) &&
        !skipWords.has(clean.toLowerCase()) &&
        !words.some(w => skipWords.has(w.toLowerCase())) &&
        words.every(w => /^[A-Za-z.'-]+$/.test(w))
      ) {
        info.candidate = toTitleCase(clean);
        break;
      }
    }
  }

  return info;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function parseDateToISO(raw) {
  // Normalise separators
  const s = raw.trim().replace(/[\.\-\/]/g, '-').replace(/\s+/g, '-');
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12 };
  // DD-MM-YYYY or DD-MM-YY
  const dmy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yr = y.length === 2 ? (parseInt(y) > 30 ? `19${y}` : `20${y}`) : y;
    return `${yr}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  // DD-MonthName-YYYY
  const dsy = s.match(/^(\d{1,2})-([a-z]+)-(\d{2,4})$/i);
  if (dsy) {
    const [, d, mon, y] = dsy;
    const mNum = months[mon.toLowerCase()];
    if (mNum) {
      const yr = y.length === 2 ? (parseInt(y) > 30 ? `19${y}` : `20${y}`) : y;
      return `${yr}-${String(mNum).padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
  }
  return null;
}

// ── POST /api/direct-apply/match-positions ────────────────────────────────────
// Accepts { filename, contentType, base64 }
// Extracts text from PDF / DOCX, scores every active position, returns ranked list
// Build a lookup of { companyNameLower -> photoRequired } from Company_Overview,
// so a list of positions can be tagged with photoRequired in a single read.
async function buildPhotoRequiredMap() {
  // Map of companyNameLower -> { photoRequired, questions } from Company_Overview.
  const map = {};
  try {
    const { getAllCompanies } = require('../model_fire/companyF');
    const companies = await getAllCompanies();
    companies.forEach(c => {
      const entry = {
        photoRequired: c.photoRequired === true,
        questions: Array.isArray(c.questions) ? c.questions : [],
      };
      if (c.lower) map[String(c.lower).toLowerCase().trim()] = entry;
      if (c.name)  map[String(c.name).toLowerCase().trim()]  = entry;
    });
  } catch (_) { /* empty map => nothing required */ }
  return map;
}

router.post('/match-positions', async (req, res) => {
  try {
    const { filename: origName = '', contentType = '', base64 } = req.body;
    if (!base64) return res.status(400).json({ success: false, message: 'base64 is required.' });

    const { db } = require('./firebase_ad');
    const buffer = Buffer.from(base64, 'base64');

    // ── Extract text ─────────────────────────────────────────────────────────
    let rawText = '';
    const isPdf  = contentType.includes('pdf')  || origName.toLowerCase().endsWith('.pdf');
    const isDocx = contentType.includes('word') || origName.toLowerCase().endsWith('.docx') || origName.toLowerCase().endsWith('.doc');

    try {
      if (isPdf) {
        const pdfParse = require('pdf-parse');
        const parsed   = await pdfParse(buffer);
        rawText = parsed.text || '';
      } else if (isDocx) {
        const mammoth = require('mammoth');
        const result  = await mammoth.extractRawText({ buffer });
        rawText = result.value || '';
      } else {
        rawText = buffer.toString('utf8');
      }
    } catch (parseErr) {
      console.warn('resume parse warning:', parseErr.message);
      rawText = '';
    }

    const textLower = rawText.toLowerCase();

    // ── Load active positions ──────────────────────────────────────────────
    const snap = await db.collection('admin_AddPos').get();
    const positions = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id:             d.id,
          pos_id:         data.pos_id,
          position:       data.position || '',
          client:         data.client || '',
          location:       data.location || [],
          experience:     data.experience || '',
          skill_category: data.skill_category || '',
          pos_cat:        data.pos_cat || '',
          ctcStart:       data.ctcStart || '',
          ctcEnd:         data.ctcEnd || '',
          description:    data.job_desc || data.description || '',
          m_have:         data.m_have || '',
          status:         data.status || '',
          datePosted:     data.datePosted || null,
          client_questions: Array.isArray(data.client_questions) ? data.client_questions : [],
        };
      })
      .filter(p => {
        const st = (p.status || '').toLowerCase().trim();
        return st === '' || st.includes('active');
      });

    // ── Score each position ───────────────────────────────────────────────
    // Build a token set from the resume text
    const tokens = new Set(
      textLower
        .replace(/[^a-z0-9\s.#+]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );

    const scored = positions.map(pos => {
      let score = 0;

      // Helper: count matches of a multi-word string (phrase or individual words)
      const countMatches = (str) => {
        if (!str) return 0;
        const words = str.toLowerCase().replace(/[^a-z0-9\s.#+]/g, ' ').split(/\s+/).filter(w => w.length > 2);
        let hits = 0;
        // Phrase match (higher weight)
        if (textLower.includes(str.toLowerCase())) hits += 3;
        // Word-level match
        words.forEach(w => { if (tokens.has(w)) hits += 1; });
        return hits;
      };

      score += countMatches(pos.skill_category) * 5;  // strongest signal
      score += countMatches(pos.position)        * 3;
      score += countMatches(pos.pos_cat)         * 3;
      score += countMatches(pos.m_have)          * 2;
      score += countMatches(pos.description)     * 1;

      // Exact client name match bonus
      if (pos.client && textLower.includes(pos.client.toLowerCase())) score += 4;

      return { ...pos, _score: score };
    });

    // Sort: scored positions first (desc by score), then unscored positions newest-first
    scored.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      const at = a.datePosted?._seconds || 0;
      const bt = b.datePosted?._seconds || 0;
      return bt - at;
    });

    // Tag each position with whether its company requires a candidate photo
    const photoMap = await buildPhotoRequiredMap();
    // Return all positions with scores so client can decide cut-off
    const result = scored.map(({ _score, client_questions, ...rest }) => {
      const co = photoMap[String(rest.client || '').toLowerCase().trim()] || {};
      return {
        ...rest,
        matchScore: _score,
        photoRequired: co.photoRequired === true,
        clientQuestions: [
          ...(Array.isArray(co.questions) ? co.questions : []),
          ...(Array.isArray(client_questions) ? client_questions : []),
        ],
      };
    });

    // ── Extract personal info from resume text ────────────────────────────
    const extractedInfo = extractPersonalInfo(rawText);

    return res.json({ success: true, positions: result, resumeTextLength: rawText.length, extractedInfo });
  } catch (err) {
    console.error('match-positions error:', err.message, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/direct-apply/upload-cv — public, no auth
// Accepts { filename, contentType, base64 } JSON — avoids multipart parsing issues in Cloud Run
router.post('/upload-cv', async (req, res) => {
  try {
    const { filename: origName, contentType, base64 } = req.body;
    if (!base64 || !origName) {
      return res.status(400).json({ success: false, message: 'filename and base64 are required.' });
    }

    const admin  = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');

    const buffer   = Buffer.from(base64, 'base64');
    const bucket   = admin.storage().bucket();
    const token    = uuidv4();
    const safeName = origName.replace(/\s+/g, '_');
    const filepath = `resumes/direct/${Date.now()}_${safeName}`;
    const fileRef  = bucket.file(filepath);

    await fileRef.save(buffer, {
      contentType: contentType || 'application/octet-stream',
      resumable:   false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });

    const downloadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(filepath)}?alt=media&token=${token}`;

    return res.json({ success: true, url: downloadUrl });
  } catch (err) {
    console.error('upload-cv error:', err.message, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/direct-apply/position/:pos_id — full position details for JD view (public, no auth)
// Returns ALL fields from admin_AddPos except hr_name, clientspoc (internal contact details)
router.get('/position/:pos_id', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { pos_id } = req.params;
    const snap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    if (snap.empty) return res.status(404).json({ success: false, message: 'Position not found.' });
    const data = snap.docs[0].data();

    // Confirm still active
    const st = (data.status || '').toLowerCase().trim();
    const isActive = st === '' || st.includes('active');
    if (!isActive) return res.status(404).json({ success: false, message: 'Position is no longer active.' });
    // Firm-private positions are not publicly viewable unless open-to-all.
    if (data.consultingFirmId && data.openToAll !== true) return res.status(404).json({ success: false, message: 'Position not found.' });

    // Does this position's company require a candidate photo? Also pull the
    // company's client-requirement questions (merged with the position's own).
    let photoRequired = false;
    let companyQuestions = [];
    let companyCandidateInstructions = '';
    try {
      if (data.client) {
        const { fetchCompanyOverview } = require('../model_fire/companyF');
        const co = await fetchCompanyOverview(data.client);
        photoRequired = co?.photoRequired === true;
        if (Array.isArray(co?.questions)) companyQuestions = co.questions;
        companyCandidateInstructions = co?.candidateInstructions || '';
      }
    } catch (_) { /* default false */ }
    const clientQuestions = [
      ...companyQuestions,
      ...(Array.isArray(data.client_questions) ? data.client_questions : []),
    ];

    return res.json({
      success: true,
      position: {
        pos_id:         data.pos_id,
        position:       data.position || '',
        client:         data.client || '',
        photoRequired,
        location:       data.location || [],
        experience:     data.experience || '',
        skill_category: data.skill_category || '',
        pos_cat:        data.pos_cat || '',
        ctcStart:       data.ctcStart || '',
        ctcEnd:         data.ctcEnd || '',
        // commison intentionally omitted — internal recruiter field
        job_desc:       data.job_desc || data.description || '',
        key_res:        data.key_res || '',
        m_have:         data.m_have || '',
        g_have:         data.g_have || '',
        compet:         data.compet || '',
        comp_view:      data.comp_view || '',
        candidate_instructions: (data.candidate_instructions || '').trim() || companyCandidateInstructions,
        status:         data.status || 'Active',
        datePosted:     data.datePosted || null,
        clientQuestions,
        // hr_name and clientspoc intentionally omitted
      },
    });
  } catch (err) {
    console.error('direct-apply/position error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/direct-apply/positions — public, no auth
// Shows exactly the same positions the admin Position Report counts as "Active"
// Logic mirrors StatusBadge in PositionReport.jsx:
//   status empty → treated as "Active"  ✓
//   status.toLowerCase().includes('active') → Active  ✓
//   anything else (closed, hold, filled…) → excluded  ✗

router.get('/positions', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('admin_AddPos').get();
    const photoMap = await buildPhotoRequiredMap();

    const positions = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id:             d.id,
          pos_id:         data.pos_id,
          position:       data.position,
          client:         data.client || '',
          location:       data.location || data.loc || '',
          experience:     data.experience || data.exp || '',
          skill_category: data.skill_category || '',
          description:    data.description || data.job_description || '',
          status:         data.status || '',
          datePosted:     data.datePosted || null,
          consultingFirmId: data.consultingFirmId || null,
          openToAll:      data.openToAll === true,
          photoRequired:  (photoMap[String(data.client || '').toLowerCase().trim()] || {}).photoRequired === true,
          clientQuestions: [
            ...((photoMap[String(data.client || '').toLowerCase().trim()] || {}).questions || []),
            ...(Array.isArray(data.client_questions) ? data.client_questions : []),
          ],
          // clientspoc and hr_name intentionally omitted from public response
        };
      })
      .filter(p => {
        // Exact same rule as PositionReport StatusBadge + filter:
        // empty status → "Active"; otherwise must include the word "active"
        const st = (p.status || '').toLowerCase().trim();
        if (!(st === '' || st.includes('active'))) return false;
        // Firm-private positions are hidden from the public list unless open-to-all.
        if (p.consultingFirmId && p.openToAll !== true) return false;
        return true;
      });

    // Sort newest first
    positions.sort((a, b) => {
      const at = a.datePosted?._seconds || 0;
      const bt = b.datePosted?._seconds || 0;
      return bt - at;
    });

    return res.json({ success: true, positions });
  } catch (err) {
    console.error('direct-apply/positions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/direct-apply/check-applied — public, no auth
// Check if a candidate (by email) has an active (non-rejected) application for a position
router.post('/check-applied', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { pos_id, emails } = req.body;
    if (!pos_id || !emails) return res.json({ applied: false });

    const REJECTED_STATUSES = new Set([
      'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
      'background verification reject', 'negotiation reject', 'test reject',
      'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
    ]);

    const snap = await db.collection('candidate_db')
      .where('pos_id', '==', pos_id)
      .where('emails', '==', emails)
      .get();

    const existing = snap.docs.find(d => d.data().source === 'direct_apply');
    if (!existing) return res.json({ applied: false });

    const status = (existing.data().statusa || '').toLowerCase().trim();
    const isRejected = REJECTED_STATUSES.has(status);
    return res.json({
      applied: !isRejected,
      status: existing.data().statusa || 'Submitted',
      canReapply: isRejected,
    });
  } catch (err) {
    console.error('check-applied error:', err.message);
    return res.json({ applied: false }); // fail open — let submit handle it
  }
});

// POST /api/direct-apply/submit — public, no auth required
// Candidate submits their own application
router.post('/submit', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { FieldValue } = require('firebase-admin/firestore');
    const candida = require('../model_fire/candidateF');
    const ad_Pos = require('../model_fire/adminF');

    const {
      pos_id,
      rec,   // recruiter email from share link — if present, application is attributed to that recruiter
      candidate, mob, emails, dob,
      rel_exp, total_exp, current_ctc, exp_ctc,
      curr_state, curr_loc, pref_state, pref_loc,
      curr_emp, notice_period, last_day,
      offer_hand, offer_amt, self_rate,
      skill_type,
      tech_category, tech_subcategory, tech_skill, tech_exp,
      nontech_category, nontech_subcategory, nontech_skill, nontech_exp,
      highest_education, cv_url, pan_number, photo_url,
      client_answers,
    } = req.body;

    // Client-requirement answers: [{ question, type, answer }]. Sanitized so we
    // only persist question text + the candidate's answer (string or array).
    const clientAnswers = Array.isArray(client_answers)
      ? client_answers
          .map(a => ({
            question: String(a.question || '').slice(0, 500),
            type: String(a.type || 'subjective'),
            answer: Array.isArray(a.answer)
              ? a.answer.map(x => String(x)).slice(0, 30)
              : String(a.answer || '').slice(0, 1000),
          }))
          .filter(a => a.question)
          .slice(0, 50)
      : [];

    if (!pos_id || !candidate || !mob || !emails) {
      return res.status(400).json({ success: false, message: 'pos_id, candidate name, mobile, and email are required.' });
    }

    // Validate position is active — same rule as the listing endpoint:
    // empty status → active, or status must include the word "active"
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found.' });
    const posData = posSnap.docs[0].data();
    const posStatus = (posData.status || '').toLowerCase().trim();
    const isActive = posStatus === '' || posStatus.includes('active');
    if (!isActive) {
      return res.status(400).json({ success: false, message: 'This position is no longer accepting applications.' });
    }

    // If this position's company requires a candidate photo, enforce it.
    let companyPhotoRequired = false;
    try {
      if (posData.client) {
        const { fetchCompanyOverview } = require('../model_fire/companyF');
        const co = await fetchCompanyOverview(posData.client);
        companyPhotoRequired = co?.photoRequired === true;
      }
    } catch (_) { /* default false */ }
    if (companyPhotoRequired && !photo_url) {
      return res.status(400).json({ success: false, message: 'A candidate photo is required for this position. Please upload a photo.' });
    }

    // Statuses that count as "rejected" — candidate is allowed to re-apply
    const REJECTED_STATUSES = new Set([
      'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
      'background verification reject', 'negotiation reject', 'test reject',
      'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
    ]);

    // Check for existing direct application for this email + position
    const dupSnap = await db.collection('candidate_db')
      .where('pos_id', '==', pos_id)
      .where('emails', '==', emails)
      .get();

    const existingDirect = dupSnap.docs.find(d => d.data().source === 'direct_apply');
    if (existingDirect) {
      const existingStatus = (existingDirect.data().statusa || '').toLowerCase().trim();
      const isRejected = REJECTED_STATUSES.has(existingStatus);
      if (!isRejected) {
        // Block re-application — application is still active
        return res.status(409).json({
          success: false,
          message: `You have already applied for this position. Your current application status is "${existingDirect.data().statusa || 'Submitted'}". You can apply again only if your application is rejected.`,
        });
      }
      // Status is rejected — allow re-application (fall through)
    }

    let techSkillParsed = tech_skill;
    let techExpParsed = tech_exp;
    let nontechSkillParsed = nontech_skill;
    let nontechExpParsed = nontech_exp;
    if (typeof tech_skill === 'string') techSkillParsed = JSON.parse(tech_skill || '[]');
    if (typeof tech_exp === 'string') techExpParsed = JSON.parse(tech_exp || '[]');
    if (typeof nontech_skill === 'string') nontechSkillParsed = JSON.parse(nontech_skill || '[]');
    if (typeof nontech_exp === 'string') nontechExpParsed = JSON.parse(nontech_exp || '[]');

    // If shared via a recruiter's link, look up that recruiter for proper attribution
    let recEmail = emails;   // default: candidate's own email (anonymous direct apply)
    let recName  = candidate;
    let recRole  = 'Candidate';
    let recId    = 'direct';
    // When the application came from a recruiter's share link, we ALSO stamp the
    // candidate as a referral of that recruiter — so it appears in their
    // "My Referrals" and any future use of this candidate credits them.
    let referralFields = {};
    if (rec) {
      try {
        // The share link's email may belong to a recruiter, a coach, or an expert.
        // Resolve against all three so their direct applicants are attributed to them.
        const recLc = String(rec).toLowerCase().trim();
        const lookups = [
          { collection: 'recruiter_db', role: 'Recruiter' },
          { collection: 'coach_db',     role: 'Coach' },
          { collection: 'expert_db',    role: 'Expert' },
        ];
        let rd = null, matched = null;
        for (const l of lookups) {
          const snap = await db.collection(l.collection).where('email', '==', rec).limit(1).get();
          if (!snap.empty) { rd = { id: snap.docs[0].id, ...snap.docs[0].data() }; matched = l; break; }
        }
        if (rd && matched) {
          const referrerEmail = (rd.email || rec).toLowerCase().trim();
          recEmail = referrerEmail;   // lowercased so the direct-candidates fetch (by login email) matches
          recName  = rd.name  || rec;
          recRole  = matched.role;
          recId    = rd.id;

          const referrerPhone = rd.mob || rd.phone || rd.mobile || '';
          const referrerPlan  = rd.planType !== undefined ? String(rd.planType) : '';
          referralFields = {
            referredBy:      referrerEmail,
            referredById:    recId,
            referredByName:  recName,
            referredByRole:  rd.roleCategory || rd.role || matched.role,
            referredByPhone: referrerPhone,
            referredByPlan:  referrerPlan,
            referrerProfile: {
              id:         recId,
              name:       recName,
              email:      referrerEmail,
              phone:      referrerPhone,
              role:       rd.roleCategory || rd.role || matched.role,
              planType:   referrerPlan,
              collection: matched.collection,
            },
            referredViaDirectApply: true,   // arrived via share link, not a manual upload
            referredAt: FieldValue.serverTimestamp(),
          };
        }
      } catch (_) { /* use defaults */ }
    }

    const user = await candida.createCandidate({
      ...referralFields,
      recId,
      recEmail,
      recName,
      recRole,
      source: 'direct_apply', // KEY FIELD to identify direct applications
      clientspoc: posData.clientspoc || '',   // always from DB, never from client
      client:     posData.client || '',        // always from DB
      hr_name:    posData.hr_name || '',       // always from DB
      pos_id,
      pos_name: posData.position || '',
      candidate,
      mob,
      emails,
      dob: dob || '',
      rel_exp: rel_exp || '',
      total_exp: total_exp || '',
      current_ctc: current_ctc || '',
      exp_ctc: exp_ctc || '',
      curr_state: curr_state || '',
      curr_loc: curr_loc || '',
      pref_state: pref_state || '',
      pref_loc: pref_loc || '',
      curr_emp: curr_emp || '',
      notice_period: notice_period || '',
      last_day: last_day || '',
      offer_hand: offer_hand || '',
      offer_amt: offer_amt || '',
      self_rate: self_rate || '',
      skill_type: skill_type || '',
      tech_category: tech_category || '',
      tech_subcategory: tech_subcategory || '',
      tech_skill: techSkillParsed || [],
      tech_exp: techExpParsed || [],
      nontech_category: nontech_category || '',
      nontech_subcategory: nontech_subcategory || '',
      nontech_skill: nontechSkillParsed || [],
      nontech_exp: nontechExpParsed || [],
      highest_education: highest_education || '',
      cv_data: cv_url || '',
      client_answers: clientAnswers,   // candidate's answers to client-requirement questions
      statusa: rec ? 'Applied' : 'Submitted',  // 'Applied' when from recruiter share link
      jr_number: '',
      pan_number: pan_number || '',
      photo_url: photo_url || '',
      rh_id: '',
      id: '',
    });

    // Send beautiful notification email — recruiter if shared via their link, else clientspoc
    try {
      const { sendEmailFull, templates, renderEmail } = require('../utils/email');
      const frontUrl = process.env.FRONTURL || 'https://www.recruiterv.com';
      const posTitle = posData.position || pos_id;

      const candidateInfo = {
        name:         candidate,
        email:        emails,
        phone:        mob,
        currentCTC:   current_ctc || '',
        experience:   total_exp   || '',
        noticePeriod: notice_period || '',
        location:     curr_loc    || '',
      };
      const baseVars = {
        candidateName: candidate, candidateEmail: emails, candidatePhone: mob,
        positionTitle: posTitle, client: posData.client || '',
      };

      if (rec && recRole !== 'Candidate') {
        // ── Recruiter / Coach / Expert shared link → notify the sharer ─────────
        const isCoachExpert = recRole === 'Coach' || recRole === 'Expert';
        const dashboardUrl = `${frontUrl}/${isCoachExpert ? 'coach-expert-direct-applicants' : 'recruiter-direct-applicants'}`;
        const _r = await renderEmail('directApplicantNotification',
          { ...baseVars, recipientName: recName, recipientType: 'recruiter', dashboardUrl },
          { subject: `🎯 New Direct Application — ${posTitle} | ${candidate}`,
            htmlContent: templates.directApplicantNotification(recName, 'recruiter', candidateInfo, posTitle, posData.client || '', dashboardUrl) });
        await sendEmailFull({ to: recEmail, toName: recName, subject: _r.subject, htmlContent: _r.htmlContent });
      } else {
        // ── Anonymous / ClientSPOC link → notify clientspoc ───────────────────
        const spocEmail = posData.clientspoc;
        if (spocEmail) {
          const dashboardUrl = `${frontUrl}/clientspoc-direct-applications`;
          // Try to get SPOC name
          let spocName = 'Hiring Manager';
          try {
            const { db } = require('./firebase_ad');
            const spocSnap = await db.collection('clientspoc_db').where('email', '==', spocEmail).limit(1).get();
            if (!spocSnap.empty) spocName = spocSnap.docs[0].data().name || spocName;
          } catch (_) {}

          const _r = await renderEmail('directApplicantNotification',
            { ...baseVars, recipientName: spocName, recipientType: 'clientspoc', dashboardUrl },
            { subject: `🎯 New Direct Application — ${posTitle} | ${candidate}`,
              htmlContent: templates.directApplicantNotification(spocName, 'clientspoc', candidateInfo, posTitle, posData.client || '', dashboardUrl) });
          await sendEmailFull({ to: spocEmail, toName: spocName, subject: _r.subject, htmlContent: _r.htmlContent });
        }
      }
    } catch (emailErr) {
      console.error('direct-apply email error:', emailErr.message);
    }

    return res.json({ success: true, message: 'Application submitted successfully!', id: user.id });
  } catch (err) {
    console.error('direct-apply/submit error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/direct-apply/parse-resume ───────────────────────────────────────
// Extracts candidate details from an uploaded resume so a form can pre-fill.
// Body: { filename, contentType, base64 }
//
// Deliberately lightweight — it only parses the document (no position scoring,
// unlike /match-positions) so it stays fast enough to run inline while the user
// is still filling the form. Anything it can't find is simply omitted, so the
// user completes the rest by hand.
router.post('/parse-resume', async (req, res) => {
  try {
    const { filename: origName = '', contentType = '', base64 } = req.body || {};
    if (!base64) return res.status(400).json({ success: false, message: 'base64 is required.' });

    const buffer = Buffer.from(base64, 'base64');
    const isPdf  = contentType.includes('pdf')  || origName.toLowerCase().endsWith('.pdf');
    const isDocx = contentType.includes('word') || /\.docx?$/i.test(origName);

    let text = '';
    try {
      if (isPdf) {
        const pdfParse = require('pdf-parse');
        text = (await pdfParse(buffer)).text || '';
      } else if (isDocx) {
        const mammoth = require('mammoth');
        text = (await mammoth.extractRawText({ buffer })).value || '';
      } else {
        text = buffer.toString('utf8');
      }
    } catch (parseErr) {
      console.warn('parse-resume extract warning:', parseErr.message);
      return res.json({ success: true, info: {}, parsed: false, message: 'Could not read this file.' });
    }

    // Base fields (name / email / phone / DOB / employer) — shared with SmartApply.
    const info = extractPersonalInfo(text) || {};

    // ── Additional fields useful for a referral ───────────────────────────────
    const pick = (re, group = 1) => { const m = text.match(re); return m ? m[group].trim().replace(/\s+/g, ' ') : ''; };

    // Notice period — "Notice Period: 30 days" / "serving 60 days notice" / "immediate joiner"
    if (/immediate\s*(joiner|joining|available)/i.test(text)) info.notice_period = 'Immediate';
    else {
      const np = pick(/notice\s*period\s*[:\-]?\s*([^\n,;]{1,25})/i)
              || pick(/(\d{1,3})\s*days?\s+notice/i);
      if (np) info.notice_period = /^\d+$/.test(np) ? `${np} days` : np;
    }

    // Current / expected CTC — "Current CTC: 18 LPA", "Expected CTC - 24 LPA"
    const ctc = (label) => pick(new RegExp(label + `\\s*(?:ctc|salary|package)?\\s*[:\\-]?\\s*(?:inr|rs\\.?|₹)?\\s*([\\d.,]+\\s*(?:lpa|lakhs?|l\\b|cr)?)`, 'i'));
    const cur = ctc('current'); if (cur) info.current_ctc = cur;
    const exp = ctc('expected'); if (exp) info.exp_ctc = exp;

    // Location — "Location: Bangalore" / "Current Location - Pune"
    const loc = pick(/(?:current\s+)?location\s*[:\-]\s*([A-Za-z][A-Za-z\s,]{2,40})/i)
             || pick(/\b(?:based\s+(?:in|at))\s+([A-Z][A-Za-z]{2,25})/);
    if (loc) info.curr_loc = loc.split(',')[0].trim();

    // Highest education — first recognised qualification mentioned
    const degree = pick(/\b(B\.?\s?Tech|B\.?\s?E\b|M\.?\s?Tech|MBA|MCA|BCA|B\.?\s?Sc|M\.?\s?Sc|B\.?\s?Com|M\.?\s?Com|Ph\.?\s?D|Bachelor[^\n,]{0,20}|Master[^\n,]{0,20})/i);
    if (degree) info.highest_education = degree.replace(/\s+/g, ' ');

    // Total experience — "7 years of experience" / "Total Experience: 5.5 yrs"
    const yrs = pick(/(?:total\s+)?experience\s*[:\-]?\s*([\d.]+)\s*\+?\s*(?:years?|yrs?)/i)
             || pick(/([\d.]+)\s*\+?\s*(?:years?|yrs?)\s+of\s+(?:total\s+)?experience/i);
    if (yrs) {
      const n = parseFloat(yrs);
      if (!isNaN(n)) { info.total_exp_year = String(Math.floor(n)); info.total_exp_months = String(Math.round((n % 1) * 12)); }
    }

    const parsed = Object.keys(info).length > 0;
    return res.json({ success: true, parsed, info, textLength: text.length });
  } catch (err) {
    console.error('parse-resume error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
