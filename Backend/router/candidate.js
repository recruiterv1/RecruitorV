const express=require('express');
const router=express.Router();
const app=express()
const jwt=require('jsonwebtoken')

const {admin} =require('../router/firebase_ad')
const recruiter=require('../model_fire/recruiterF')
const google=require('../model_fire/googleF')
const candida=require('../model_fire/candidateF')
const linkwa=require('../auth/linkControl')
const companyOver=require('../model_fire/companyF')
const path=require('path');
const ad_Pos = require('../model_fire/adminF')
const positionAccess = require('../model_fire/positionAccessF')
const notificationModel = require('../model_fire/notificationF')
const clientspocModel = require('../model_fire/clientspocF')
const emailModel = require('../model_fire/recruiterEmailF')
const { sendEmail, sendEmailFull, renderEmail } = require('../utils/email');
const { sendPushToEmails } = require('../utils/push');
const { TEMPLATE_MAP, substitute } = require('../utils/emailTemplates');

/**
 * Send email to ClientSPOC about new candidate submission
 */
const sendClientSpocEmailForNewCandidate = async (data) => {
  console.log(`📧 sendClientSpocEmailForNewCandidate → to: ${data.clientspocEmail}`);

  const {
    clientspocEmail,
    clientspocName,
    positionTitle,
    positionId,
    clientName,
    candidateName,
    candidateEmail,
    candidateMobile,
    relExp,
    totalExp,
    currentCTC,
    expectedCTC,
    noticePeriod,
    currentEmployer,
    rhId,
    highestEducation,
    currentLocation,
    preferredLocation,
    techSkills,
    nonTechSkills,
    recruiterName,
    recruiterEmail,
    recruiterPhone,
    dateSubmitted,
  } = data;

  const row = (label, value) =>
    value
      ? `<tr>
           <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:170px;vertical-align:top;">${label}</td>
           <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500;">${value}</td>
         </tr>`
      : '';

  const skillBadge = (s) =>
    `<span style="display:inline-block;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;
      border-radius:20px;padding:2px 10px;font-size:12px;margin:2px;">${s}</span>`;

  const allSkills = [
    ...(Array.isArray(techSkills) ? techSkills : techSkills ? [techSkills] : []),
    ...(Array.isArray(nonTechSkills) ? nonTechSkills : nonTechSkills ? [nonTechSkills] : []),
  ].filter(Boolean);

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:620px;margin:30px auto;background:#ffffff;border-radius:16px;
       overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb 0%,#f97316 100%);padding:32px 30px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">🎯</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
        New Candidate Submitted
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
        RecruiterV &mdash; Recruitment Management System
      </p>
    </div>

    <!-- Body -->
    <div style="padding:30px;">
      <p style="margin:0 0 20px;color:#374151;font-size:14px;">
        Dear <strong>${clientspocName || 'ClientSPOC'}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#374151;font-size:14px;">
        A new candidate profile has been submitted for your position. Please find the complete details below.
      </p>

      <!-- Position Info -->
      <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.8px;">Position</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1e3a8a;">${positionTitle || '—'}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#3b82f6;">ID: ${positionId || '—'} &nbsp;|&nbsp; Client: ${clientName || '—'}</p>
      </div>

      <!-- Candidate Details -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
        <div style="background:#f9fafb;padding:10px 16px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">
            👤 Candidate Details
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', `<strong>${candidateName || '—'}</strong>`)}
          ${row('Email', candidateEmail || '—')}
          ${row('Mobile', candidateMobile || '—')}
          ${row('RH ID', rhId || '—')}
          ${row('Current Employer', currentEmployer || '—')}
          ${row('Highest Education', highestEducation || '—')}
          ${row('Current Location', currentLocation || '—')}
          ${row('Preferred Location', preferredLocation || '—')}
          ${row('Relevant Experience', relExp ? `${relExp} yrs` : '—')}
          ${row('Total Experience', totalExp ? `${totalExp} yrs` : '—')}
          ${row('Current CTC', currentCTC ? `₹${currentCTC} LPA` : '—')}
          ${row('Expected CTC', expectedCTC ? `₹${expectedCTC} LPA` : '—')}
          ${row('Notice Period', noticePeriod ? `${noticePeriod} days` : '—')}
        </table>
      </div>

      <!-- Skills -->
      ${allSkills.length > 0 ? `
      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">
          🛠️ Skills
        </p>
        <div>${allSkills.map(skillBadge).join('')}</div>
      </div>` : ''}

      <!-- Recruiter & Date -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#f9fafb;padding:10px 16px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">
            📋 Submission Info
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Recruiter Name', recruiterName || '—')}
          ${row('Recruiter Email', recruiterEmail || '—')}
          ${row('Recruiter Phone', recruiterPhone || '—')}
          ${row('Date Submitted', dateSubmitted || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }))}
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://www.recruiterv.com"
           style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#2563eb,#f97316);
             color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Review on Dashboard →
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;color:#9ca3af;font-size:11px;">
        <p style="margin:0 0 4px;font-weight:700;font-size:14px;
          background:linear-gradient(135deg,#2563eb,#f97316);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          RecruiterV
        </p>
        <p style="margin:0;">This is an automated notification. Please do not reply to this email.</p>
        <p style="margin:4px 0 0;">© ${new Date().getFullYear()} RecruiterV. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const _r = await renderEmail('candidateSubmitted',
      { candidateName, positionName: positionTitle, dashboardUrl: 'https://www.recruiterv.com/ad_panel#candidates' },
      { subject: `New Candidate Submitted — ${positionTitle} | ${candidateName}`, htmlContent });
    const result = await sendEmail(clientspocEmail, _r.subject, _r.htmlContent, 'admin@recruiterv.com', 'RecruiterV');
    console.log(`✅ ClientSPOC email sent to ${clientspocEmail} — messageId: ${result?.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ ClientSPOC email error:', error.message);
    return false;
  }
};

/**
 * Statuses that indicate a position is CLOSED and cannot accept new candidates
 */
const CLOSED_POSITION_STATUSES = [
  'rejected',
  'pending',
  'hold',
  'paused',
  'inactive',
  'closed',
  'on hold',
  'closed - filled',
  'closed - cancelled'
];

/**
 * Helper function to validate if a position is active and can accept candidates
 * @param {string} pos_id - Position ID
 * @param {string} recruiterEmail - Recruiter's email to check access request status
 * @returns {object} { valid: boolean, message: string, position: object }
 */
const validatePositionForCandidateSubmission = async (pos_id, recruiterEmail) => {
  try {
    if (!pos_id) {
      return { valid: false, message: "Position ID is required" };
    }

    // Find the position
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return { valid: false, message: "Position not found" };
    }

    // Check if position status is closed/rejected/pending
    const positionStatus = (position.status || '').toLowerCase();
    const isClosed = CLOSED_POSITION_STATUSES.some(status => 
      positionStatus.includes(status.toLowerCase())
    );

    if (isClosed) {
      return { 
        valid: false, 
        message: `Cannot submit candidates. This position has status: "${position.status}". Only active positions accept new candidates.`,
        position 
      };
    }

    // Check if the recruiter has a rejected access request for this position
    if (recruiterEmail) {
      try {
        const accessRequests = await positionAccess.getRecruiterRequests(recruiterEmail);
        const relevantRequest = accessRequests.find(
          req => req.positionId === pos_id && req.status === 'rejected'
        );

        if (relevantRequest) {
          return {
            valid: false,
            message: `Cannot submit candidates. Your access request for this position was rejected by the ClientSPOC. Please contact the ClientSPOC if you believe this is an error.`,
            position
          };
        }
      } catch (accessError) {
        console.error("Error checking access request status:", accessError);
        // Continue without blocking on access check error
      }
    }

    return { valid: true, position };
  } catch (error) {
    console.error("Error validating position:", error);
    return { valid: false, message: "Failed to validate position status" };
  }
};


const isLoggedIn = async (req, res, next) => {
  try {
    // 1️⃣ Check if JWT is present in cookies (normal login)
    const jwtToken = req.cookies?.__session;

    if (jwtToken) {
      try {
        const data = jwt.verify(jwtToken, process.env.SECKEY);
        req.user = data; // { email, name, etc. }
        return next(); // ✅ verified via JWT
      } catch (err) {
        console.warn("JWT verification failed, falling back to Firebase token...");
      }
    }

    // 2️⃣ If not JWT, check Authorization header (Google/Firebase login)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains { uid, email, name, picture, ... }

    return next(); // ✅ verified via Firebase
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};



// True if a candidate with this email or phone has ALREADY been submitted to
// this position (any status). Resume-bank template records (source
// 'clientspoc_bulk') are ignored since they are not position submissions.
// Statuses that mean the candidate is no longer active on a position, so they
// may be submitted to it again (e.g. a rejected candidate can be re-submitted).
const CANDIDATE_REJECTED_STATUSES = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'rejected', 'client drop', 'candidate drop', 'duplicate', 'offer declined',
]);

async function alreadySubmittedToPosition(pos_id, emails, mob, candidate, recEmail) {
  const { db } = require('../router/firebase_ad');
  const email = (emails || '').trim().toLowerCase();
  const phone = (mob || '').toString().replace(/\D/g, '');
  const name = (candidate || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
  const rec = (recEmail || '').toString().toLowerCase().trim();
  if (!pos_id) return false;
  const hasIdentity = !!(email || phone);
  // Nothing to match on at all → can't detect a duplicate.
  if (!hasIdentity && !name) return false;
  const snap = await db.collection('candidate_db').where('pos_id', '==', pos_id).get();
  return snap.docs.some(d => {
    const c = d.data();
    if (c.source === 'clientspoc_bulk') return false;
    // A rejected/inactive record on this position does NOT block re-submission.
    if (CANDIDATE_REJECTED_STATUSES.has((c.statusa || '').toLowerCase().trim())) return false;
    const e = (c.emails || '').trim().toLowerCase();
    const p = (c.mob || '').toString().replace(/\D/g, '');
    if (hasIdentity) return (email && e === email) || (phone && p && p === phone);
    // No email/phone on the incoming candidate → fall back to name + same recruiter
    // (covers email/WhatsApp-sourced entries that carry no contact fields).
    const cn = (c.candidate || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
    return name && cn === name && rec && (c.recEmail || '').toString().toLowerCase().trim() === rec;
  });
}

router.post('/data/candi', isLoggedIn, async (req,res)=>{
  try {
    let news = (await recruiter.findRecruiterByEmail(req.user.email)) ||
               (await google.findByEmail(req.user.email)) ||
               (await linkwa.findByEmails(req.user.email));

    let isCoachOrExpert = false;
    let submitterRole = 'Recruiter';
    if (!news) {
      const coachModel = require('../model_fire/coachF');
      news = await coachModel.findCoachByEmail(req.user.email);
      if (news) { isCoachOrExpert = true; submitterRole = 'Coach'; }
    }
    if (!news) {
      const expertModel = require('../model_fire/expertF');
      news = await expertModel.findExpertByEmail(req.user.email);
      if (news) { isCoachOrExpert = true; submitterRole = 'Expert'; }
    }

    if(!news) return res.status(400).json({ message : "User Not Found!"});

let {
      id,statusa,clientspoc,client,hr_name,pos_name,candidate,rel_exp,total_exp,current_ctc,self_rate,
      notice_period,last_day,exp_ctc,curr_state,curr_loc,pref_state,pref_loc,offer_hand,offer_amt,curr_emp,skill_type,
      tech_category,tech_subcategory,tech_skill,tech_exp,nontech_category,nontech_subcategory,nontech_skill,nontech_exp,
      mob,pos_id,emails,cv_url,photo_url,dob,jr_number,pan_number,rh_id,highest_education,client_answers
    } = req.body;

    // For coach/expert: verify they have access to this position. Access can come
    // from either collection — a direct request raised to the SPOC
    // (coach_expert_direct_requests, 'approved') or the coach/expert assigning the
    // position to themselves (coach_expert_requests, 'accepted'). Checking only the
    // first blocked every self-assigned coach from submitting.
    if (isCoachOrExpert) {
      const { db } = require('../router/firebase_ad');
      const emailLower = req.user.email.toLowerCase();
      // 2-field queries (avoid composite index requirement); status filtered in JS
      const [directSnap, assignSnap] = await Promise.all([
        db.collection('coach_expert_direct_requests')
          .where('coachExpertEmail', '==', emailLower)
          .where('positionId', '==', pos_id).get(),
        db.collection('coach_expert_requests')
          .where('coachExpertEmail', '==', emailLower)
          .where('positionId', '==', pos_id).get(),
      ]);
      const hasAccess =
        directSnap.docs.some(d => d.data().status === 'approved') ||
        assignSnap.docs.some(d => ['accepted', 'approved'].includes(d.data().status));
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have approved access to submit candidates for this position." });
      }
    }

    // 🔒 VALIDATION: Check if position is active and recruiter has access
    const positionValidation = await validatePositionForCandidateSubmission(pos_id, news.email);
    if (!positionValidation.valid) {
      return res.status(400).json({
        message: positionValidation.message,
        positionStatus: positionValidation.position?.status || 'unknown'
      });
    }

    // 🔒 Free-plan limit: a free recruiter can work on a maximum of 4 positions
    // (positions with at least 1 active candidate, excluding released ones). Block
    // submitting a candidate to a NEW position once they already have 4 working
    // positions. (Coaches/Experts exempt.)
    if (!isCoachOrExpert && news.planType === 0) {
      const { count, posIds } = await positionAccess.countActiveWorkingPositions(news.email);
      if (!posIds.has(pos_id) && count >= 4) {
        return res.status(403).json({
          errorCode: "REQUEST_LIMIT_REACHED",
          message: "Free plan limit reached: you can work on a maximum of 4 positions (those with at least 1 active candidate). Release a position from My Access Requests before submitting candidates to a new one."
        });
      }
      // Submitting a candidate re-engages a previously released position so it counts again.
      await positionAccess.reengageReleasedPosition(news.email, pos_id);
    }

    if (typeof tech_skill === "string") tech_skill = JSON.parse(tech_skill);
    if (typeof tech_exp === "string") tech_exp = JSON.parse(tech_exp);
    if (typeof nontech_skill === "string") nontech_skill = JSON.parse(nontech_skill);
    if (typeof nontech_exp === "string") nontech_exp = JSON.parse(nontech_exp);
    if (typeof client_answers === "string") { try { client_answers = JSON.parse(client_answers); } catch (_) { client_answers = []; } }
    if (!Array.isArray(client_answers)) client_answers = [];

    // 🔒 A candidate already submitted to this position cannot be submitted again.
    if (await alreadySubmittedToPosition(pos_id, emails, mob, candidate, news.email)) {
      return res.status(409).json({
        message: "This candidate has already been submitted to this position and cannot be submitted again.",
      });
    }

    // 🎁 Carry referral attribution forward. If this candidate was originally
    // referred — a manual marketplace upload OR a direct applicant who arrived
    // via a recruiter's share link — copy the referral owner onto this new
    // submission so their commission follows any future use by any recruiter.
    let carryReferral = {};
    try {
      const runs = [];
      if (emails) runs.push(db.collection('candidate_db').where('emails', '==', emails).get());
      if (mob)    runs.push(db.collection('candidate_db').where('mob', '==', mob).get());
      const snaps = await Promise.all(runs);
      let origin = null;
      for (const s of snaps) {
        for (const doc of s.docs) {
          const dd = doc.data();
          if (dd.referredBy) { origin = dd; break; }
        }
        if (origin) break;
      }
      if (origin && origin.referredBy) {
        carryReferral = {
          referredBy:      origin.referredBy,
          referredById:    origin.referredById   || '',
          referredByName:  origin.referredByName  || '',
          referredByRole:  origin.referredByRole  || '',
          referredByPhone: origin.referredByPhone || '',
          referredByPlan:  origin.referredByPlan  || '',
          referrerProfile: origin.referrerProfile || {},
          referralCarried: true,   // commission owner inherited from an earlier referral
        };
      }
    } catch (_) { /* attribution is best-effort; never block a submission */ }


    const user = await candida.createCandidate({
      ...carryReferral,
      id,
      recId: news.id,
      clientspoc,
      recEmail: (news.email || '').toLowerCase().trim(),
      recName: news.name,
      recPhone: news.phone || news.mobile || news.mob || news.contact || '',
      recRole: submitterRole,
      source: news.source,
      hr_name,
      pos_id,
      pos_name,
      current_ctc,
      exp_ctc,
      curr_state,
      curr_loc,
      pref_loc,
      pref_state,
      offer_hand,
      offer_amt,
      self_rate,
      notice_period,
      last_day,
      rel_exp,
      total_exp,
      candidate,
      cv_data: cv_url, //🔥 ONLY URL STORED
      curr_emp,
      client,
      skill_type,
      tech_category,
      tech_subcategory,
      tech_skill,
      tech_exp,
      nontech_category,
      nontech_subcategory,
      nontech_skill,
      nontech_exp,
      mob,
      emails,
      statusa:'Submitted',
      dob,
      jr_number,
      pan_number,
      rh_id: rh_id || '',
      highest_education: highest_education || '',
      photo_url: photo_url || '',
      client_answers
    });

    // 🔒 Race-safe de-dupe: two near-simultaneous submits can both pass the pre-check
    // above before either writes. Immediately after writing, reconcile — if more than
    // one ACTIVE record now exists for this candidate on this position, keep only the
    // earliest and delete the rest. Every racer runs the same logic and converges on
    // the same survivor, so no duplicate is left. If OURS wasn't the survivor, we tell
    // the recruiter it was already submitted.
    try {
      const { db } = require('../router/firebase_ad');
      const emailLc = (emails || '').trim().toLowerCase();
      const phoneD = (mob || '').toString().replace(/\D/g, '');
      const nameLc = (candidate || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
      const recLc = (news.email || '').toString().toLowerCase().trim();
      const hasIdentity = !!(emailLc || phoneD);
      const snap = await db.collection('candidate_db').where('pos_id', '==', pos_id).get();
      const active = snap.docs.filter(d => {
        const c = d.data();
        if (c.source === 'clientspoc_bulk') return false;
        if (CANDIDATE_REJECTED_STATUSES.has((c.statusa || '').toLowerCase().trim())) return false;
        const e = (c.emails || '').trim().toLowerCase();
        const p = (c.mob || '').toString().replace(/\D/g, '');
        if (hasIdentity) return (emailLc && e === emailLc) || (phoneD && p && p === phoneD);
        const cn = (c.candidate || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
        return nameLc && cn === nameLc && recLc && (c.recEmail || '').toString().toLowerCase().trim() === recLc;
      });
      if (active.length > 1) {
        const ms = (d) => { const t = d.data().datePosted; return t?._seconds ? t._seconds * 1000 : (t ? new Date(t).getTime() : 0); };
        active.sort((a, b) => ms(a) - ms(b) || a.id.localeCompare(b.id));   // deterministic across racers
        const survivor = active[0].id;
        for (const d of active.slice(1)) { try { await d.ref.delete(); } catch (_) {} }
        if (survivor !== user.id) {
          return res.status(409).json({ message: 'This candidate has already been submitted to this position and cannot be submitted again.' });
        }
      }
    } catch (_) { /* reconciliation is best-effort */ }

    // 🔔 Push to the coach/expert who assigned this position to the submitting recruiter
    if (!isCoachOrExpert) {
      try {
        const { db } = require('../router/firebase_ad');
        const craSnap = await db.collection('coach_recruiter_assignments')
          .where('recruiterEmail', '==', news.email)
          .where('positionId', '==', pos_id)
          .get();
        const coachEmails = [...new Set(craSnap.docs
          .filter(d => (d.data().status || '').toLowerCase() !== 'rejected')
          .map(d => d.data().coachEmail).filter(Boolean))];
        if (coachEmails.length) {
          sendPushToEmails(coachEmails, {
            title: 'New candidate submitted',
            body: `${news.name || 'A recruiter'} submitted ${candidate || 'a candidate'} for "${pos_name || ''}"`,
            data: { type: 'candidate', posId: pos_id || '' },
          }).catch(() => {});
        }
      } catch (_) { /* ignore */ }
    }

    // 🔔 Send notification and email to ClientSPOC about new candidate submission
    try {
      // Get position details
      const position = positionValidation.position;
      
      // Get recruiter details
      const recruiterName = news.name || news.firstName || req.user.email.split('@')[0];
      const recruiterPhone = news.phone || news.mobile || news.mob || '';
      
      // Get ClientSPOC name
      let clientspocName = null;
      try {
        const clientspocUser = await clientspocModel.findClientSpocByEmail(position.clientspoc);
        clientspocName = clientspocUser?.name || null;
      } catch (e) {
        console.log('Could not fetch ClientSPOC name');
      }
      
      // Get candidate skills for the email
      let candidateSkills = '';
      if (tech_skill && Array.isArray(tech_skill)) {
        candidateSkills = tech_skill.join(', ');
      } else if (tech_skill) {
        candidateSkills = String(tech_skill);
      }
      
      // Send notification to ClientSPOC
      if (position && position.clientspoc) {
        await notificationModel.notifyClientSpocNewCandidate({
          clientspocEmail: position.clientspoc,
          clientspocName: clientspocName,
          positionId: pos_id,
          positionTitle: position.position,
          clientName: position.client,
          candidateName: candidate,
          candidateId: id,
          recruiterEmail: news.email,
          recruiterName: recruiterName
        });
        console.log(`✅ Notification sent to ClientSPOC ${position.clientspoc} for new candidate ${candidate}`);
        
        // Send email to ClientSPOC
        console.log(`📧 Sending candidate submission email to ClientSPOC: ${position.clientspoc}`);
        const emailSent = await sendClientSpocEmailForNewCandidate({
          clientspocEmail: position.clientspoc,
          clientspocName: clientspocName,
          positionTitle: position.position,
          positionId: pos_id,
          clientName: position.client,
          candidateName: candidate,
          candidateEmail: emails || '',
          candidateMobile: mob || '',
          relExp: rel_exp || '',
          totalExp: total_exp || '',
          currentCTC: current_ctc || '',
          expectedCTC: exp_ctc || '',
          noticePeriod: notice_period || '',
          currentEmployer: curr_emp || '',
          rhId: rh_id || '',
          highestEducation: highest_education || '',
          currentLocation: curr_loc ? `${curr_loc}${curr_state ? ', ' + curr_state : ''}` : '',
          preferredLocation: pref_loc ? `${pref_loc}${pref_state ? ', ' + pref_state : ''}` : '',
          techSkills: Array.isArray(tech_skill) ? tech_skill : (tech_skill ? [tech_skill] : []),
          nonTechSkills: Array.isArray(nontech_skill) ? nontech_skill : (nontech_skill ? [nontech_skill] : []),
          recruiterName: recruiterName,
          recruiterEmail: news.email,
          recruiterPhone: recruiterPhone,
          dateSubmitted: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }),
        });
        console.log(`📧 Email to ClientSPOC result: ${emailSent ? 'sent' : 'failed/skipped'}`);

        // Save notification to ClientSPOC's in-app inbox
        const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
        await emailModel.createEmail({
          recruiterEmail: position.clientspoc.toLowerCase(),
          folder: 'inbox',
          from: 'noreply@recruiterv.com',
          fromName: `RecruiterV – ${recruiterName}`,
          to: position.clientspoc.toLowerCase(),
          toName: clientspocName || '',
          subject: `New Candidate Submitted — ${position.position} (${pos_id}) | ${candidate}`,
          body: `Position: ${position.position}\nPosition ID: ${pos_id}\nClient: ${position.client || '—'}\n\nCandidate Name: ${candidate}\nCandidate Email: ${emails || '—'}\nCandidate Phone: ${mob || '—'}\nRH ID: ${rh_id || '—'}\nCurrent Employer: ${curr_emp || '—'}\nHighest Education: ${highest_education || '—'}\nCurrent Location: ${curr_loc || '—'}\nRelevant Exp: ${rel_exp || '—'} yrs\nTotal Exp: ${total_exp || '—'} yrs\nCurrent CTC: ${current_ctc ? '₹' + current_ctc + ' LPA' : '—'}\nExpected CTC: ${exp_ctc ? '₹' + exp_ctc + ' LPA' : '—'}\nNotice Period: ${notice_period || '—'} days\n\nRecruiter Name: ${recruiterName}\nRecruiter Email: ${news.email}\nRecruiter Phone: ${recruiterPhone || '—'}\n\nDate Submitted: ${dateStr}`,
          read: false,
        });
        console.log(`📥 In-app inbox message saved for ClientSPOC ${position.clientspoc}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending notification/email:", notificationError);
      // Don't fail the main request if notification fails
    }

    // 📧 "Candidate and JD" — email the CANDIDATE with the role-aware position/JD
    // link (attributed to the submitter via ?rec=), full submitted details and
    // resume. A copy is stored in the submitter's Inbox → Sent so they have a
    // record. Fully isolated: never fails the submission.
    try {
      const candidateEmail = (emails || '').toString().trim();
      if (candidateEmail) {
        const position = positionValidation.position || {};
        const dash = '—';
        const skillsStr = (arr) => (Array.isArray(arr) && arr.length ? arr.join(', ') : (arr ? String(arr) : dash));
        const positionLink = `https://www.recruiterv.com/position/${encodeURIComponent(pos_id || '')}?view=share&rec=${encodeURIComponent((news.email || '').toLowerCase())}`;
        const dateSubmitted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

        const vars = {
          submitterName: news.name || (news.email || '').split('@')[0],
          submitterRole: submitterRole,
          positionTitle: pos_name || position.position || dash,
          positionId: pos_id || dash,
          clientName: client || position.client || dash,
          positionLink,
          candidateName: candidate || dash,
          candidateEmail: candidateEmail,
          candidatePhone: mob || dash,
          relExp: rel_exp || dash,
          totalExp: total_exp || dash,
          currentCTC: current_ctc ? `₹${current_ctc} LPA` : dash,
          expectedCTC: exp_ctc ? `₹${exp_ctc} LPA` : dash,
          noticePeriod: notice_period ? `${notice_period} days` : dash,
          currentEmployer: curr_emp || dash,
          currentLocation: curr_loc ? `${curr_loc}${curr_state ? ', ' + curr_state : ''}` : dash,
          preferredLocation: pref_loc ? `${pref_loc}${pref_state ? ', ' + pref_state : ''}` : dash,
          highestEducation: highest_education || dash,
          techSkills: skillsStr(tech_skill),
          nonTechSkills: skillsStr(nontech_skill),
          rhId: rh_id || dash,
          resumeUrl: cv_url || '',
          dateSubmitted,
        };

        const def = TEMPLATE_MAP.candidateAndJd;
        const _r = await renderEmail('candidateAndJd', vars, {
          subject: substitute(def.subject, vars),
          htmlContent: substitute(def.body, vars),
        });

        // Send to the candidate; reply-to = submitter's real email so replies reach them.
        await sendEmailFull({
          to: [{ email: candidateEmail, name: candidate || undefined }],
          subject: _r.subject,
          htmlContent: _r.htmlContent,
          fromEmail: 'noreply@recruiterv.com',
          fromName: news.name || 'RecruiterV',
          replyTo: (news.email || '').toLowerCase() || undefined,
        });

        // Store a copy in the submitter's Inbox → Sent (ownerEmail = derived @recruiterv.com).
        const senderAddr = emailModel.getRecruiterSenderEmail(news.name);
        await emailModel.createEmail({
          ownerId: news.id,
          ownerEmail: senderAddr,
          folder: 'sent',
          from: senderAddr,
          fromName: news.name || 'RecruiterV',
          to: candidateEmail,
          toName: candidate || '',
          subject: _r.subject,
          body: _r.htmlContent,
          isHtml: true,
          read: true,
        });
        console.log(`📧 Candidate-and-JD email sent to ${candidateEmail}; Sent copy stored for ${senderAddr}`);
      }
    } catch (candJdErr) {
      console.error('❌ Candidate-and-JD email error:', candJdErr.message);
    }

    return res.status(200).json({
      message : "Candidate Added Successfully!",
      data : user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


router.get('/stats/recruiter', isLoggedIn, async (req,res)=>{

  try {
    let recData = (await recruiter.findRecruiterByEmail(req.user.email)) ||
                  (await google.findByEmail(req.user.email)) ||
                  (await linkwa.findByEmails(req.user.email));

    if(!recData) return res.status(402).json({message:"Recruiter not found"});

    const candidates = await candida.findCandidateById(recData.id);

    const totalSubmitted = candidates.length;
    const accepted = candidates.filter(c => c.statusa === "Accepted").length;
    const rejected = candidates.filter(c => c.statusa === "Rejected").length;

    const score = totalSubmitted > 0 
      ? ((accepted / totalSubmitted) * 10).toFixed(1)
      : 0;

    res.json({
      totalSubmitted,
      accepted,
      rejected,
      score
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({error:"Server error"});
  }

});





router.get('/show/candi',isLoggedIn,async (req,res)=>{
    try{
        let recData= (await recruiter.findRecruiterByEmail(req.user.email)) ||
                     (await google.findByEmail(req.user.email)) ||
                     (await linkwa.findByEmails(req.user.email))
        if(!recData) return res.status(402).json({  message: "Recruiter not found"  })
        
        const candidates= await candida.findCandidateById(recData.id)
        res.status(200).json(candidates)
    }
    catch(error){
        console.error("Error while Showing candidate:", error);
        res.status(500).json({ error: error.message });
    }

})

router.get('/show/all/candi', async(req,res)=>{
  try{
    const canudo= await candida.showAllCandidate()
    // Strip very large fields (full resume text + match tokens) so the response
    // stays within Cloud Function size/time limits. Skill fields (skills,
    // skillsText, skillCategory) are kept so keyword search still works.
    const slim = canudo.map(({ resumeText, matchTokens, skillsTextTokens, ...rest }) => rest);
    return res.status(200).json(slim)

  } catch(error){
    console.log("Error while showing all candidate:",error)
    res.status(500).json({ error: error.message });
  }
})

// GET /candidate/lookup-by-email?email=xxx
// Returns the most recent candidate_db record matching that email so the
// submit-candidate form can be pre-filled.
router.get('/lookup-by-email', async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ found: false, message: 'Email required' });

    const snap = await db.collection('candidate_db')
      .where('emails', '==', email)
      .limit(5)
      .get();

    if (snap.empty) return res.json({ found: false });

    // Pick the most recently posted doc among results (no orderBy to avoid index requirement)
    const sorted = snap.docs.sort((a, b) => {
      const aS = a.data().datePosted?._seconds || 0;
      const bS = b.data().datePosted?._seconds || 0;
      return bS - aS;
    });
    const d = sorted[0].data();
    // Return all fields that the submit-candidate form can use
    return res.json({
      found: true,
      candidate: {
        candidate:        d.candidate        || '',
        mob:              d.mob              || '',
        dob:              d.dob              || '',
        curr_emp:         d.curr_emp         || '',
        highest_education: d.highest_education || '',
        current_ctc:      d.current_ctc      || '',
        exp_ctc:          d.exp_ctc          || '',
        total_exp:        d.total_exp        || '',
        rel_exp:          d.rel_exp          || '',
        notice_period:    d.notice_period    || '',
        curr_state:       d.curr_state       || '',
        curr_loc:         d.curr_loc         || '',
        pref_state:       d.pref_state       || '',
        pref_loc:         d.pref_loc         || '',
        skill_type:       d.skill_type       || '',
        tech_category:    d.tech_category    || '',
        tech_subcategory: d.tech_subcategory || '',
        tech_skill:       d.tech_skill       || [],
        tech_exp:         d.tech_exp         || [],
        nontech_category:    d.nontech_category    || '',
        nontech_subcategory: d.nontech_subcategory || '',
        nontech_skill:    d.nontech_skill    || [],
        nontech_exp:      d.nontech_exp      || [],
        self_rate:        d.self_rate        || '',
        pan_number:       d.pan_number       || '',
        jr_number:        d.jr_number        || '',
        cv_data:          d.cv_data          || '',
      }
    });
  } catch (err) {
    console.error('lookup-by-email error:', err.message);
    return res.status(500).json({ found: false, message: err.message });
  }
});

// Candidates submitted by the logged-in Recruiter — only those whose recEmail matches
router.get('/show/recruiter/candi', async (req, res) => {
  try {
    const token = req.cookies?.__session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.SECKEY);
    const email = (decoded.email || '').toLowerCase().trim();
    const { db } = require('../router/firebase_ad');
    const snap = await db.collection('candidate_db')
      .where('recEmail', '==', email)
      .get();
    const candidates = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return res.status(200).json(candidates);
  } catch (error) {
    console.log('Error fetching recruiter candidates:', error);
    res.status(500).json({ error: error.message });
  }
})

// Candidates for the logged-in ClientSpoc — only those whose clientspoc field matches
// Lightweight positions cache (pos_id + clientspoc only) — the ClientSPOC candidate
// list scans all positions to find the SPOC's own; cache it briefly so repeat loads
// don't re-scan the whole collection.
let _spocPosLite = { t: 0, docs: null };
const SPOC_POS_TTL = 60 * 1000;
async function getPositionsLite(db) {
  if (_spocPosLite.docs && Date.now() - _spocPosLite.t < SPOC_POS_TTL) return _spocPosLite.docs;
  const snap = await db.collection('admin_AddPos').select('pos_id', 'clientspoc').get();
  const docs = snap.docs.map(d => d.data());
  _spocPosLite = { t: Date.now(), docs };
  return docs;
}

// Cached email→phone directory across recruiter/coach/expert (for back-filling
// recPhone on older candidate records). Three parallel .select() scans, cached.
let _submitterPhoneDir = { t: 0, map: null };
const PHONE_DIR_TTL = 5 * 60 * 1000;
async function getSubmitterPhoneDir(db) {
  if (_submitterPhoneDir.map && Date.now() - _submitterPhoneDir.t < PHONE_DIR_TTL) return _submitterPhoneDir.map;
  const snaps = await Promise.all(['recruiter_db', 'coach_db', 'expert_db'].map(c =>
    db.collection(c).select('email', 'phone', 'mobile', 'mob', 'contact').get().catch(() => ({ docs: [] }))));
  const map = {};
  snaps.forEach(snap => snap.docs.forEach(d => {
    const r = d.data(); const e = (r.email || '').toLowerCase().trim();
    if (e && !map[e]) { const ph = r.phone || r.mobile || r.mob || r.contact || ''; if (ph) map[e] = ph; }
  }));
  _submitterPhoneDir = { t: Date.now(), map };
  return map;
}

router.get('/show/clientspoc/candi', async (req, res) => {
  try {
    const token = req.cookies?.__session;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.SECKEY);
    const email = (decoded.email || '').toLowerCase().trim();
    const { db } = require('../router/firebase_ad');
    const lc = (s) => (s || '').toString().toLowerCase().trim();

    // Resolve the canonical ClientSPOC email from admin_db (candidate.clientspoc is
    // stored in that exact case — must match it, not just the lowercased login email).
    let recEmail = decoded.email;
    try {
      let admSnap = await db.collection('admin_db').where('email', '==', decoded.email).limit(1).get();
      if (admSnap.empty) admSnap = await db.collection('admin_db').where('email', '==', email).limit(1).get();
      if (!admSnap.empty) recEmail = admSnap.docs[0].data().email || decoded.email;
    } catch { /* fall back to token email */ }

    const accepted = new Set([email, lc(recEmail)]);
    const byId = {};

    // Fetch the SPOC-matched candidates and the (cached) positions list in parallel.
    const variants = [...new Set([recEmail, decoded.email, email].filter(Boolean))].slice(0, 10);
    const [spocSnap, posDocs] = await Promise.all([
      variants.length
        ? db.collection('candidate_db').where('clientspoc', 'in', variants).get().catch(() => ({ docs: [] }))
        : Promise.resolve({ docs: [] }),
      getPositionsLite(db),
    ]);
    spocSnap.docs.forEach(doc => { byId[doc.id] = { ...doc.data(), id: doc.id }; });

    // 2) Plus all candidates on positions owned by this ClientSPOC (case-insensitive).
    const myPosIds = [...new Set(
      posDocs.filter(p => accepted.has(lc(p.clientspoc))).map(p => p.pos_id).filter(Boolean)
    )];
    const batchQueries = [];
    for (let i = 0; i < myPosIds.length; i += 10) {
      const batch = myPosIds.slice(i, i + 10);
      if (batch.length) batchQueries.push(db.collection('candidate_db').where('pos_id', 'in', batch).get());
    }
    const batchSnaps = await Promise.all(batchQueries);
    batchSnaps.forEach(snap => snap.docs.forEach(doc => { byId[doc.id] = byId[doc.id] || { ...doc.data(), id: doc.id }; }));

    const list = Object.values(byId);

    // Back-fill submitter phone for older records (missing recPhone) from the cached
    // recruiter/coach/expert directory — no per-request collection queries.
    if (list.some(c => !c.recPhone && c.recEmail)) {
      const phoneDir = await getSubmitterPhoneDir(db);
      list.forEach(c => { if (!c.recPhone && c.recEmail) c.recPhone = phoneDir[lc(c.recEmail)] || ''; });
    }

    return res.status(200).json(list);
  } catch (error) {
    console.log('Error fetching clientspoc candidates:', error);
    res.status(500).json({ error: error.message });
  }
})


// Reject-type statuses that require a rejection reason (matches the frontend set).
const REJECT_STATUSES = new Set([
  'screen reject', 'l1 reject', 'l2 reject', 'l3 reject', 'hr reject',
  'background verification reject', 'negotiation reject', 'test reject',
  'client drop', 'candidate drop', 'duplicate', 'offer declined', 'position on hold',
]);

router.patch("/update/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { statusa, rejectReason } = req.body;

    if (!statusa) {
      return res.status(400).json({ error: "Status is required" });
    }

    // A rejection reason is mandatory for any reject-type status.
    const isReject = REJECT_STATUSES.has(String(statusa).toLowerCase().trim());
    if (isReject && !(rejectReason || '').toString().trim()) {
      return res.status(400).json({ error: "A rejection reason is required for this status." });
    }

    // Best-effort: identify who is changing the status (from the session cookie).
    let changedBy = '';
    let changedByName = '';
    try {
      const token = req.cookies?.__session;
      if (token) {
        const decoded = jwt.verify(token, process.env.SECKEY);
        changedBy = decoded.email || '';
        changedByName = decoded.name || decoded.firstName ||
          (decoded.email ? decoded.email.split('@')[0] : '');
      }
    } catch { /* unauthenticated / invalid token — leave changer blank */ }

    const updated = await candida.updatePositionStatus(id, statusa, {
      changedBy, changedByName,
      rejectReason: isReject ? String(rejectReason).trim() : '',
    });

    // ── Send email to recruiter about status change ──────────────────────────
    try {
      const recEmail = updated.recEmail || updated.recruiterEmail;
      const recName  = updated.recName  || updated.recruiterName || 'Recruiter';
      const candName = updated.candidate || updated.candidateName || '—';
      const posId    = updated.pos_id;

      if (recEmail) {
        let positionTitle = updated.pos_name || posId || '—';
        let clientName    = updated.client   || '';

        // Try to get full position details
        if (posId) {
          try {
            const pos = await ad_Pos.findPositionByPosId(posId);
            if (pos) {
              positionTitle = pos.position || positionTitle;
              clientName    = pos.client   || clientName;
            }
          } catch (_) {}
        }

        const { templates, renderEmail } = require('../utils/email');
        const { REASON_TEXTS } = require('../utils/screenRejectReasons');
        const isScreenReject = String(statusa).toLowerCase().trim() === 'screen reject';
        const reasonKey = String(rejectReason || '').trim();
        const reasonText = isScreenReject ? REASON_TEXTS[reasonKey] : null;

        if (reasonText) {
          // ── Screen-reject with a specific reason → send the reason guidance ──
          const paras = reasonText.split('\n\n').map(p =>
            `<p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.6">${p.replace(/\n/g, '<br/>')}</p>`
          ).join('');
          const htmlContent = `
            <div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:22px 26px;color:#fff">
                <h2 style="margin:0;font-size:19px">Screening Feedback — ${reasonKey}</h2>
              </div>
              <div style="padding:24px 26px">
                <p style="margin:0 0 14px;color:#1f2937;font-size:14px">Dear <strong>${recName}</strong>,</p>
                <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:0 0 18px;font-size:13px;color:#475569">
                  <div><strong>Candidate:</strong> ${candName}</div>
                  <div><strong>Position:</strong> ${positionTitle}${clientName ? ` (${clientName})` : ''}</div>
                  <div><strong>Status:</strong> Screen Reject &middot; <strong>Reason:</strong> ${reasonKey}</div>
                </div>
                ${paras}
                <p style="margin:18px 0 0;color:#374151;font-size:14px">Best regards,<br/>The Talent Acquisition Team<br/>RecruiterV</p>
              </div>
            </div>`;
          const _r = await renderEmail(`screenReject_${reasonKey.replace(/\s+/g, '')}`,
            { recruiterName: recName, candidateName: candName, positionTitle, client: clientName, reason: reasonKey },
            { subject: `Screening Feedback: ${candName} — ${reasonKey} | ${positionTitle}`, htmlContent });
          await sendEmailFull({
            to: recEmail, toName: recName, subject: _r.subject, htmlContent: _r.htmlContent,
            fromEmail: 'noreply@recruiterv.com', fromName: 'RecruiterV',
          });
          console.log(`✅ Screen-reject reason email (${reasonKey}) sent to recruiter ${recEmail}`);
        } else {
          const _vars = {
            recruiterName: recName, candidateName: candName, positionTitle,
            clientName: clientName ? ` (${clientName})` : '', newStatus: statusa,
            dashboardUrl: 'https://www.recruiterv.com/',
          };
          const _r = await renderEmail('candidateStatusUpdated', _vars, {
            subject: `Candidate Status Update: ${candName} → ${statusa} | ${positionTitle}`,
            htmlContent: templates.candidateStatusUpdated(recName, candName, positionTitle, clientName, statusa, 'https://www.recruiterv.com/'),
          });
          await sendEmailFull({
            to: recEmail,
            subject: _r.subject,
            htmlContent: _r.htmlContent,
            fromEmail: 'noreply@recruiterv.com',
            fromName: 'RecruiterV',
          });
          console.log(`✅ Status-update email sent to recruiter ${recEmail} — status: ${statusa}`);
        }
      }
    } catch (emailErr) {
      console.error('❌ Recruiter status-update email failed:', emailErr.message);
      // Don't fail the main request
    }

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /addit/bulk-screen-reject — ClientSPOC bulk-rejects non-matching direct
// applicants: sets status "Screen Reject" and emails each candidate.
// Body: { ids: [<candidate ids>], rejectReason }
router.post('/bulk-screen-reject', async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const { ids, rejectReason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No candidates selected.' });
    }
    const reason = (rejectReason || '').toString().trim() ||
      'Your profile did not match the current screening criteria for this position.';

    // Identify the ClientSPOC from the session and the positions they own, so a
    // SPOC can only reject candidates that belong to them.
    const token = req.cookies?.__session;
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.SECKEY);
    const lc = (s) => (s || '').toString().toLowerCase().trim();
    const loginEmail = lc(decoded.email);

    let canonEmail = decoded.email;
    try {
      let admSnap = await db.collection('admin_db').where('email', '==', decoded.email).limit(1).get();
      if (admSnap.empty) admSnap = await db.collection('admin_db').where('email', '==', loginEmail).limit(1).get();
      if (!admSnap.empty) canonEmail = admSnap.docs[0].data().email || decoded.email;
    } catch { /* fall back to token email */ }
    const accepted = new Set([loginEmail, lc(canonEmail)]);

    // Positions owned by this SPOC (case-insensitive) — for candidates whose own
    // clientspoc field may be blank but sit on the SPOC's position.
    const posSnap = await db.collection('admin_AddPos').get();
    const ownedPosIds = new Set(
      posSnap.docs.map(d => d.data()).filter(p => accepted.has(lc(p.clientspoc))).map(p => p.pos_id).filter(Boolean)
    );

    const changedBy = decoded.email || '';
    const changedByName = decoded.name || (decoded.email ? decoded.email.split('@')[0] : '');

    let rejected = 0, emailed = 0, skipped = 0;
    const { sendEmailFull, renderEmail } = require('../utils/email');

    for (const id of ids) {
      try {
        const doc = await db.collection('candidate_db').doc(id).get();
        if (!doc.exists) { skipped++; continue; }
        const c = doc.data();

        // Ownership guard
        const owns = accepted.has(lc(c.clientspoc)) || ownedPosIds.has(c.pos_id);
        if (!owns) { skipped++; continue; }

        // Don't re-reject someone already in a reject/terminal status
        if (REJECT_STATUSES.has(lc(c.statusa))) { skipped++; continue; }

        await candida.updatePositionStatus(id, 'Screen Reject', {
          changedBy, changedByName, rejectReason: reason,
        });
        rejected++;

        // Email the candidate
        const candEmail = c.emails;
        const candName  = c.candidate || 'Candidate';
        const posTitle  = c.pos_name || c.pos_id || 'the position';
        const client    = c.client || '';
        if (candEmail) {
          try {
            const fallbackHtml = `
              <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px 28px;color:#fff">
                  <h2 style="margin:0;font-size:20px">Application Update</h2>
                </div>
                <div style="padding:24px 28px;color:#1f2937;font-size:14px;line-height:1.6">
                  <p>Dear <strong>${candName}</strong>,</p>
                  <p>Thank you for your interest in the <strong>${posTitle}</strong>${client ? ` role with ${client}` : ''} and for taking the time to apply.</p>
                  <p>After careful review of the applications received, we regret to inform you that your profile has not been shortlisted for this position at this stage.</p>
                  <p style="background:#f9fafb;border-left:3px solid #f97316;padding:10px 14px;border-radius:6px"><strong>Reason:</strong> ${reason}</p>
                  <p>We truly appreciate your effort and encourage you to apply for other opportunities that match your profile in the future. We wish you all the best in your job search.</p>
                  <p style="margin-top:20px">Warm regards,<br/>The Talent Acquisition Team<br/>RecruiterV</p>
                </div>
              </div>`;
            const _r = await renderEmail('screenRejectNotification',
              { candidateName: candName, positionTitle: posTitle, client, rejectReason: reason },
              { subject: `Update on your application — ${posTitle}`, htmlContent: fallbackHtml });
            await sendEmailFull({
              to: candEmail, toName: candName, subject: _r.subject, htmlContent: _r.htmlContent,
              fromEmail: 'noreply@recruiterv.com', fromName: 'RecruiterV',
            });
            emailed++;
          } catch (mailErr) {
            console.error('bulk-screen-reject email failed for', candEmail, mailErr.message);
          }
        }
      } catch (rowErr) {
        console.error('bulk-screen-reject row error for', id, rowErr.message);
        skipped++;
      }
    }

    return res.json({ success: true, rejected, emailed, skipped });
  } catch (err) {
    console.error('bulk-screen-reject error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /addit/update/direct-applicant/:id — recruiter edits a direct applicant's details
router.patch('/update/direct-applicant/:id', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const id = req.params.id;
    const allowed = [
      'candidate','emails','mob','curr_emp','highest_education',
      'current_ctc','exp_ctc','total_exp','rel_exp','notice_period',
      'curr_state','curr_loc','pref_state','pref_loc','self_rate',
      'skill_type','tech_category','tech_subcategory','tech_skill','tech_exp',
      'nontech_category','nontech_subcategory','nontech_skill','nontech_exp','dob',
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date();
    await db.collection('candidate_db').doc(id).update(update);
    return res.json({ success: true, message: 'Candidate updated' });
  } catch (err) {
    console.error('update/direct-applicant error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/data/check", isLoggedIn, async (req, res) => {
  try {
    

    let email = req.body.emails?.trim().toLowerCase();
    let mob = req.body.mob?.trim();
    let pan = req.body.pan_number?.trim();


    if (!email && !mob && !pan) {
      return res.status(400).json({ error: "Email, phone or PAN required" });
    }

    const [emailExists, phoneExists, panExists] = await Promise.all([
      candida.findCandidateByEmail(email),
      candida.findCandidateByPhone(mob),
      candida.findCandidateByPan(pan),
    ]);

    const match = emailExists || phoneExists || panExists || null;

    // Existing behaviour: does this candidate exist anywhere in the system?
    const payload = {
      emailExists: !!emailExists,
      phoneExists: !!phoneExists,
      panExists: !!panExists,
      exists: !!match,
    };

    // Autofill source — the known details of the matched candidate, so the form
    // can prefill and the user only completes what's missing. Only safe,
    // form-relevant fields are returned (no internal/system metadata).
    if (match) {
      const pick = (k) => (match[k] === undefined || match[k] === null ? '' : match[k]);
      payload.match = {
        candidate: pick('candidate'), emails: pick('emails'), mob: pick('mob'),
        dob: pick('dob'), pan_number: pick('pan_number'), curr_emp: pick('curr_emp'),
        highest_education: pick('highest_education'), current_ctc: pick('current_ctc'),
        exp_ctc: pick('exp_ctc'), total_exp: pick('total_exp'), rel_exp: pick('rel_exp'),
        notice_period: pick('notice_period'), last_day: pick('last_day'),
        curr_state: pick('curr_state'), curr_loc: pick('curr_loc'),
        pref_state: pick('pref_state'), pref_loc: pick('pref_loc'),
        offer_hand: pick('offer_hand'), offer_amt: pick('offer_amt'),
        self_rate: pick('self_rate'), skill_type: pick('skill_type'),
        tech_category: pick('tech_category'), tech_subcategory: pick('tech_subcategory'),
        tech_skill: pick('tech_skill'), tech_exp: pick('tech_exp'),
        nontech_category: pick('nontech_category'), nontech_subcategory: pick('nontech_subcategory'),
        nontech_skill: pick('nontech_skill'), nontech_exp: pick('nontech_exp'),
        cv_data: pick('cv_data'), photo_url: pick('photo_url'),
        source: pick('source'),
      };
    }

    // Same-position duplicate: has this candidate already been submitted for THIS
    // position by anyone? Existing elsewhere is fine (and is what enables reuse of
    // a referred candidate) — only a clash on the same position blocks submission.
    const posId = (req.body.pos_id || '').toString().trim();
    if (posId) {
      const { db } = require('../router/firebase_ad');
      const seen = new Set();
      const dupDocs = [];
      const runs = [
        email ? db.collection('candidate_db').where('pos_id', '==', posId).where('emails', '==', email).get() : null,
        mob ? db.collection('candidate_db').where('pos_id', '==', posId).where('mob', '==', mob).get() : null,
        pan ? db.collection('candidate_db').where('pos_id', '==', posId).where('pan_number', '==', pan).get() : null,
      ].filter(Boolean);
      const snaps = await Promise.all(runs);
      snaps.forEach(s => s.docs.forEach(d => {
        if (seen.has(d.id)) return;
        const c = d.data();
        // A rejected/inactive record on this position is not an active clash —
        // the candidate can be re-submitted, so don't count it.
        if (CANDIDATE_REJECTED_STATUSES.has((c.statusa || '').toLowerCase().trim())) return;
        seen.add(d.id); dupDocs.push(c);
      }));

      if (dupDocs.length) {
        const d = dupDocs[0];
        payload.duplicateOnPosition = true;
        payload.duplicateInfo = {
          submittedBy: d.recName || d.recEmail || 'another user',
          submittedByEmail: d.recEmail || '',
          status: d.statusa || 'Submitted',
          candidate: d.candidate || '',
        };
      } else {
        payload.duplicateOnPosition = false;
      }
    }

    return res.json(payload);

  } catch (err) {
    console.error("Duplicate check error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get('/overview/:name', async (req, res) => {
  try {
    const data = await companyOver.fetchCompanyOverview(req.params.name);

    if (!data) return res.json({ found: false, data: null });

    res.json({ found: true, data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});






/**
 * POST /addit/send/email
 * Send email to candidate with optional CC to recruiter and HR using Brevo
 */
router.post('/send/email', async (req, res) => {
  try {
    const {
      to,
      subject,
      message,
      candidateId,
      candidateName,
      position,
      client,
      ccRecruiter,
      recName,
      ccHR
    } = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, message'
      });
    }

    const ccList = [];
    if (ccRecruiter) ccList.push({ email: ccRecruiter });
    if (ccHR) ccList.push({ email: ccHR });

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .details-box {
            background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
          .details-item {
            margin: 8px 0;
            display: flex;
            align-items: center;
          }
          .details-label {
            font-weight: 600;
            color: #1f2937;
            min-width: 100px;
            font-size: 14px;
          }
          .details-value {
            color: #4b5563;
            font-size: 14px;
          }
          .message-body {
            white-space: pre-wrap;
            line-height: 1.8;
            color: #374151;
            font-size: 15px;
            margin: 25px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 3px solid #f97316;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 15px 0;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>🎯 RecruiterV</h1>
            <p>Recruitment Management System</p>
          </div>
          
          <div class="content">
            ${position && client && candidateName ? `
            <div class="details-box">
              <div class="details-item">
                <span class="details-label">👤 Candidate:</span>
                <span class="details-value">${candidateName}</span>
              </div>
              <div class="details-item">
                <span class="details-label">💼 Position:</span>
                <span class="details-value">${position}</span>
              </div>
              <div class="details-item">
                <span class="details-label">🏢 Client:</span>
                <span class="details-value">${client}</span>
              </div>
            </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <div class="message-body">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <div class="footer-logo">RecruiterV</div>
              <p>This is an automated email from the Recruitment Management System.</p>
              <p>Please do not reply directly to this email.</p>
              <p style="margin-top: 15px; color: #9ca3af;">
                © ${new Date().getFullYear()} RecruiterV. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version (fallback)
    const textContent = `
RecruiterV - Recruitment Management System

${position && client && candidateName ? `
Candidate: ${candidateName}
Position: ${position}
Client: ${client}

---
` : ''}

${message}

---
This is an automated email from the Recruitment Management System.
Please do not reply directly to this email.

© ${new Date().getFullYear()} RecruiterV. All rights reserved.
    `.trim();

    const response = await sendEmailFull({
      to: [{ email: to, name: recName || '' }],
      subject,
      htmlContent,
      fromEmail: 'admin@recruiterv.com',
      fromName: 'RecruiterV Team',
      cc: ccList.length ? ccList : undefined,
    });

    console.log('✅ Email sent successfully:', response.messageId);

    // Optional: Log email activity to database
    // await logEmailActivity({
    //   candidateId,
    //   to,
    //   subject,
    //   sentAt: new Date(),
    //   messageId: response.messageId,
    //   status: 'sent'
    // });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: response.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * POST /addit/send/bulk-email
 * Send email to multiple candidates at once using Brevo
 */
router.post('/send/bulk-email', async (req, res) => {
  try {
    const { recipients, subject, message, position, client } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    const results = [];
    
    // Send emails one by one (Brevo doesn't support true bulk in transactional API)
    for (const recipient of recipients) {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .email-wrapper {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
              }
              .content {
                padding: 40px 30px;
              }
              .message-body {
                white-space: pre-wrap;
                line-height: 1.8;
                color: #374151;
                font-size: 15px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border-left: 3px solid #f97316;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <h1>🎯 RecruiterV</h1>
              </div>
              <div class="content">
                <div class="message-body">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const response = await sendEmail(recipient.email, subject, htmlContent, 'admin@recruiterv.com', 'RecruiterV Team');
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
          messageId: response.messageId
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Sent ${successCount} of ${recipients.length} emails (${failCount} failed)`,
      summary: {
        total: recipients.length,
        successful: successCount,
        failed: failCount
      },
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk email:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

/**
 * POST /addit/send/status-update
 * Send status update email to candidate
 */
router.post('/send/status-update', async (req, res) => {
  try {
    const { candidateId, email, name, position, client, oldStatus, newStatus } = req.body;

    if (!email || !name || !position || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Status-specific messages and colors
    const getStatusDetails = (status) => {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('accept') || statusLower.includes('joining')) {
        return { emoji: '🎉', color: '#10b981', message: 'Congratulations!' };
      }
      if (statusLower.includes('reject') || statusLower.includes('decline')) {
        return { emoji: '📋', color: '#ef4444', message: 'Application Update' };
      }
      if (statusLower.includes('schedule')) {
        return { emoji: '📅', color: '#f59e0b', message: 'Interview Schedule' };
      }
      if (statusLower.includes('offer')) {
        return { emoji: '🎁', color: '#8b5cf6', message: 'Great News!' };
      }
      return { emoji: '📢', color: '#3b82f6', message: 'Status Update' };
    };

    const statusDetails = getStatusDetails(newStatus);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .status-badge {
            display: inline-block;
            padding: 10px 20px;
            background-color: ${statusDetails.color};
            color: white;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 20px 0;
          }
          .details-box {
            background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>${statusDetails.emoji} ${statusDetails.message}</h1>
            <p>RecruiterV - Recruitment Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${recName}</strong>,</p>
            
            <p>Your application status has been updated:</p>
            
            <div class="details-box">
              <div><strong>Position:</strong> ${position}</div>
              ${client ? `<div><strong>Client:</strong> ${client}</div>` : ''}
              <div style="margin-top: 15px;">
                ${oldStatus ? `<div><strong>Previous Status:</strong> ${oldStatus}</div>` : ''}
                <div><strong>Current Status:</strong> <span class="status-badge">${newStatus}</span></div>
              </div>
            </div>
            
            <p>If you have any questions, please feel free to reach out to your recruiter.</p>
            
            <p>Best regards,<br>RecruiterV Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const _r = await renderEmail('applicationStatusUpdate',
      { candidateName: name || 'Candidate', position, client: client || '', oldStatus: oldStatus || '', newStatus },
      { subject: `Application Status Update - ${position}`, htmlContent });
    const response = await sendEmail(email, _r.subject, _r.htmlContent, 'admin@recruiterv.com', 'RecruiterV Team');

    console.log('✅ Status update email sent:', response.messageId);

    res.status(200).json({
      success: true,
      message: 'Status update email sent successfully',
      messageId: response.messageId
    });

  } catch (error) {
    console.error('❌ Error sending status update:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send status update email',
      details: error.message
    });
  }
});


// ─── Resume-bank "Matching Candidates" tab (Submit Candidate modal) ──────────

// GET /addit/bank-candidate/:id — full details of a matching/bank candidate
// (for the "View details" modal).
router.get('/bank-candidate/:id', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const doc = await db.collection('candidate_db').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, candidate: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('bank-candidate get error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /addit/bank-candidate/:id — recruiter edits a matching candidate's
// details and saves. Only a safe set of fields can be changed.
router.patch('/bank-candidate/:id', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const { computeMatchTokens, invalidateCache } = require('../utils/resumeBankMatch');
    const ref = db.collection('candidate_db').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Candidate not found' });
    const existing = snap.data();

    const b = req.body || {};
    const update = { updatedAt: new Date() };
    // All editable candidate fields (mirrors the submission form).
    const strFields = ['candidate', 'emails', 'mob', 'curr_loc', 'pref_loc', 'curr_state', 'pref_state',
      'total_exp', 'rel_exp', 'current_ctc', 'exp_ctc', 'notice_period', 'curr_emp', 'last_day',
      'offer_hand', 'offer_amt', 'self_rate', 'dob', 'jr_number', 'pan_number', 'rh_id',
      'skill_type', 'tech_category', 'tech_subcategory', 'nontech_category', 'nontech_subcategory',
      'highest_education', 'skillCategory'];
    for (const f of strFields) if (b[f] !== undefined) update[f] = String(b[f]).trim();
    if (b.emails !== undefined) update.emails = String(b.emails).trim().toLowerCase();

    // Array fields (skills + tech/non-tech skill & experience lists).
    const arrFields = ['skills', 'tech_skill', 'tech_exp', 'nontech_skill', 'nontech_exp'];
    for (const f of arrFields) {
      if (b[f] !== undefined) {
        update[f] = Array.isArray(b[f]) ? b[f].map(s => String(s).trim()).filter(Boolean) : [];
      }
    }
    if (update.skills) update.skillsText = update.skills.join(', ');
    // Recompute the match-tokens blob so future match counts reflect the edit.
    const merged = { ...existing, ...update };
    update.matchTokens = computeMatchTokens(merged.resumeText, merged);

    await ref.update(update);
    invalidateCache();   // refresh match counts / list after an edit
    res.json({ success: true });
  } catch (err) {
    console.error('bank-candidate patch error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Candidate submission DRAFTS ───────────────────────────────────────────────
// A recruiter can save an in-progress submission (e.g. photo not ready yet) as a
// draft and finish it later. Drafts live in their OWN collection `candidate_drafts`
// — deleting or expiring a draft NEVER touches candidate_db, so a candidate reused
// from the resume/matching bank is unaffected. Drafts auto-expire after 72 hours.
const DRAFT_TTL_MS = 72 * 60 * 60 * 1000;

// POST /addit/draft/candidate — create or update a draft (pass id to update).
router.post('/draft/candidate', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const recEmail = (req.user.email || '').toLowerCase();
    const b = req.body || {};
    if (!b.pos_id) return res.status(400).json({ success: false, message: 'pos_id is required' });
    const now = Date.now();
    const form = (b.form && typeof b.form === 'object') ? b.form : {};
    const base = {
      recEmail,
      pos_id: String(b.pos_id),
      pos_name: b.pos_name || '', client: b.client || '', clientspoc: b.clientspoc || '', hr_name: b.hr_name || '',
      form,
      cv_url: b.cv_url || '',
      photo_url: b.photo_url || '',
      candidate: b.candidate || form.candidate || '',
      emails: (b.emails || form.emails || '').toLowerCase(),
      mob: b.mob || form.mob || '',
      updatedAt: new Date(now),
      expiresAt: new Date(now + DRAFT_TTL_MS),
    };
    let id = b.id;
    if (id) {
      const ref = db.collection('candidate_drafts').doc(id);
      const doc = await ref.get();
      if (doc.exists && (doc.data().recEmail || '').toLowerCase() !== recEmail) {
        return res.status(403).json({ success: false, message: 'Not your draft' });
      }
      await ref.set(base, { merge: true });
    } else {
      const ref = await db.collection('candidate_drafts').add({ ...base, createdAt: new Date(now) });
      id = ref.id;
    }
    return res.json({ success: true, id, expiresAt: base.expiresAt });
  } catch (e) {
    console.error('draft save error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET /addit/draft/candidates?pos_id= — the recruiter's non-expired drafts.
router.get('/draft/candidates', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const recEmail = (req.user.email || '').toLowerCase();
    const snap = await db.collection('candidate_drafts').where('recEmail', '==', recEmail).get();
    const now = Date.now();
    const out = [];
    snap.docs.forEach(d => {
      const x = d.data();
      const exp = x.expiresAt?.toMillis ? x.expiresAt.toMillis() : new Date(x.expiresAt).getTime();
      if (exp && exp < now) { d.ref.delete().catch(() => {}); return; }   // lazy-expire
      out.push({ id: d.id, ...x, expiresAtMs: exp });
    });
    let list = out;
    if (req.query.pos_id) list = list.filter(x => String(x.pos_id) === String(req.query.pos_id));
    list.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    return res.json({ success: true, drafts: list });
  } catch (e) {
    console.error('draft list error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /addit/draft/candidate/:id — delete own draft only. Never touches candidate_db.
router.delete('/draft/candidate/:id', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const recEmail = (req.user.email || '').toLowerCase();
    const ref = db.collection('candidate_drafts').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.json({ success: true });
    if ((doc.data().recEmail || '').toLowerCase() !== recEmail) {
      return res.status(403).json({ success: false, message: 'Not your draft' });
    }
    await ref.delete();
    return res.json({ success: true });
  } catch (e) {
    console.error('draft delete error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// POST /addit/pos/:pos_id/submit-from-bank — submit up to 2 selected matching
// candidates against the position, attributed to the logged-in recruiter, with
// their details auto-filled. Mirrors the /data/candi validations.
router.post('/pos/:pos_id/submit-from-bank', isLoggedIn, async (req, res) => {
  try {
    const { db } = require('../router/firebase_ad');
    const { pos_id } = req.params;
    let ids = Array.isArray(req.body?.candidateIds) ? req.body.candidateIds.filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'No candidates selected.' });
    if (ids.length > 2) return res.status(400).json({ success: false, message: 'You can submit a maximum of 2 candidates at a time.' });

    // Identify the submitter (recruiter / coach / expert) — same as /data/candi.
    let news = (await recruiter.findRecruiterByEmail(req.user.email)) ||
               (await google.findByEmail(req.user.email)) ||
               (await linkwa.findByEmails(req.user.email));
    let submitterRole = 'Recruiter';
    if (!news) { const cm = require('../model_fire/coachF'); news = await cm.findCoachByEmail(req.user.email); if (news) submitterRole = 'Coach'; }
    if (!news) { const em = require('../model_fire/expertF'); news = await em.findExpertByEmail(req.user.email); if (news) submitterRole = 'Expert'; }
    if (!news) return res.status(400).json({ success: false, message: 'User Not Found!' });

    // Position must be active + accessible to this recruiter.
    const positionValidation = await validatePositionForCandidateSubmission(pos_id, news.email);
    if (!positionValidation.valid) {
      return res.status(400).json({ success: false, message: positionValidation.message });
    }
    const posSnap = await db.collection('admin_AddPos').where('pos_id', '==', pos_id).limit(1).get();
    const pos = posSnap.empty ? {} : posSnap.docs[0].data();

    // If the position's company requires a candidate photo, only candidates that
    // already have a photo can be submitted from the bank (same rule as the
    // "Use your own" form, where a photo must be uploaded).
    let photoRequired = false;
    if (pos.client) {
      try {
        const { fetchCompanyOverview } = require('../model_fire/companyF');
        const comp = await fetchCompanyOverview(pos.client);
        photoRequired = comp?.photoRequired === true;
      } catch (_) { /* non-fatal */ }
    }

    // Free-plan 4-position cap (recruiters only) — same rule as /data/candi.
    if (submitterRole === 'Recruiter' && news.planType === 0) {
      const { count, posIds } = await positionAccess.countActiveWorkingPositions(news.email);
      if (!posIds.has(pos_id) && count >= 4) {
        return res.status(403).json({
          success: false, errorCode: 'REQUEST_LIMIT_REACHED',
          message: 'Free plan limit reached: you can work on a maximum of 4 positions. Release one before submitting to a new position.',
        });
      }
      await positionAccess.reengageReleasedPosition(news.email, pos_id);
    }

    const submitted = [], skipped = [];
    for (const id of ids) {
      const cdoc = await db.collection('candidate_db').doc(id).get();
      if (!cdoc.exists) { skipped.push({ id, reason: 'not found' }); continue; }
      const c = cdoc.data();
      const emails = (c.emails || '').trim().toLowerCase();

      // The bank record must have at least a name — bulk-uploaded resumes often have
      // only email/phone/CV, and submitting them creates a nameless, detail-less
      // candidate. Require the recruiter to complete the profile first.
      if (!(c.candidate || '').trim()) {
        skipped.push({ id, candidate: emails, reason: 'candidate name/details missing — open View details to complete the profile before submitting' });
        continue;
      }

      // A candidate already submitted to this position cannot be submitted again.
      if (await alreadySubmittedToPosition(pos_id, emails, c.mob, c.candidate, news.email)) {
        skipped.push({ id, candidate: c.candidate || emails, reason: 'already submitted to this position' });
        continue;
      }

      // Enforce the company photo requirement.
      if (photoRequired && !(c.photo_url || c.photo)) {
        skipped.push({ id, candidate: c.candidate || emails, reason: 'candidate photo required — add it via View details' });
        continue;
      }

      // Carry referral attribution forward from the source candidate so any
      // future use credits the original referrer (see the single-submit path).
      const bulkCarry = c.referredBy ? {
        referredBy:      c.referredBy,
        referredById:    c.referredById   || '',
        referredByName:  c.referredByName  || '',
        referredByRole:  c.referredByRole  || '',
        referredByPhone: c.referredByPhone || '',
        referredByPlan:  c.referredByPlan  || '',
        referrerProfile: c.referrerProfile || {},
        referralCarried: true,
      } : {};

      const created = await candida.createCandidate({
        ...bulkCarry,
        recId: news.id,
        recEmail: (news.email || '').toLowerCase().trim(),
        recName: news.name,
        recPhone: news.phone || news.mobile || news.mob || news.contact || '',
        recRole: submitterRole,
        source: news.source,
        clientspoc: pos.clientspoc || '',
        client: pos.client || '',
        hr_name: pos.hr_name || '',
        pos_id,
        pos_name: pos.position || '',
        candidate: c.candidate || '',
        emails,
        mob: c.mob || '',
        photo_url: c.photo_url || c.photo || '',
        cv_data: c.cv_data || c.cv_url || '',
        curr_loc: c.curr_loc || '',
        pref_loc: c.pref_loc || '',
        total_exp: c.total_exp || '',
        rel_exp: c.rel_exp || '',
        current_ctc: c.current_ctc || '',
        exp_ctc: c.exp_ctc || '',
        notice_period: c.notice_period || '',
        curr_emp: c.curr_emp || '',
        highest_education: c.highest_education || '',
        skill_type: c.skill_type || '',
        tech_category: c.skillCategory || c.tech_category || '',
        tech_skill: Array.isArray(c.skills) ? c.skills : [],
        tech_exp: [],
        nontech_skill: [],
        nontech_exp: [],
        statusa: 'Submitted',
        fromResumeBank: true,
        bankSourceId: id,
        rh_id: '',
      });
      submitted.push({ id, newId: created.id, candidate: c.candidate || emails });
    }

    if (submitted.length) {
      try { require('../utils/resumeBankMatch').invalidateCache(); } catch { /* non-fatal */ }
    }
    res.json({ success: true, submitted, skipped });
  } catch (err) {
    console.error('submit-from-bank error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports=router;
