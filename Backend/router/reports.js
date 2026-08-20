const express = require('express');
const router = express.Router();
const { db } = require('./firebase_ad');
const recruiterF = require('../model_fire/recruiterF');

const candidateDb = db.collection('candidate_db');
const positionsDb = db.collection('admin_AddPos');
const coachExpertRequestsDb = db.collection('coach_expert_requests');

const toIso = (val) => {
  if (!val) return null;
  if (val.toDate) return val.toDate().toISOString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const strArr = (val) => {
  if (Array.isArray(val)) return val.join(', ');
  return val || '';
};

/**
 * GET /api/reports/candidates
 */
// Building this report reads 21.6k candidates and serialises ~20MB, which takes
// ~13s. The underlying data changes slowly, so a short cache makes repeat opens
// and tab switches instant without risking a stale-looking report.
let _reportCache = { at: 0, body: null };
const REPORT_CACHE_MS = 2 * 60 * 1000;

router.get('/candidates', async (req, res) => {
  try {
    if (_reportCache.body && Date.now() - _reportCache.at < REPORT_CACHE_MS
        && String(req.query.refresh || '') !== '1') {
      return res.json(_reportCache.body);
    }
    // 1. Fetch all candidates — projected. Reading whole documents pulled ~162MB
    // for 21.5k candidates (resumeText/matchTokens dominate) and timed out as a 503.
    const CANDIDATE_REPORT_FIELDS = [
      'pos_id', 'pos_name', 'client', 'recEmail', 'recruiterEmail', 'recName', 'recPhone',
      'candidate', 'emails', 'mob', 'rel_exp', 'relExp', 'total_exp', 'totalExp',
      'current_ctc', 'currentCTC', 'exp_ctc', 'expectedCTC', 'notice_period', 'noticePeriod',
      'curr_emp', 'currentEmployer', 'rh_id', 'highest_education', 'curr_loc', 'currentLocation',
      'pref_loc', 'preferredLocation', 'tech_skill', 'techSkills', 'nontech_skill', 'nonTechSkills',
      'statusa', 'status', 'datePosted', 'createdAt', 'updatedAt',
    ];
    const candidateSnap = await candidateDb.select(...CANDIDATE_REPORT_FIELDS).get();
    const candidates = candidateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (candidates.length === 0) return res.json({ success: true, data: [] });

    // 2. Collect unique position IDs and recruiter emails
    const posIds = [...new Set(candidates.map(c => c.pos_id).filter(Boolean))];
    const recruiterEmails = [...new Set(candidates.map(c => c.recEmail || c.recruiterEmail).filter(Boolean))];

    // 3. Fetch full position details in batches of 10
    const positionMap = {};
    const posBatches = [];
    for (let i = 0; i < posIds.length; i += 10) posBatches.push(posIds.slice(i, i + 10));
    // Run the ~40 batches together rather than one after another.
    await Promise.all(posBatches.map(async (batch) => {
      const snap = await positionsDb.where('pos_id', 'in', batch).get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        positionMap[d.pos_id] = {
          positionTitle:  d.position || '',
          client:         d.client || '',
          skill_category: d.skill_category || '',
          clientspocEmail: d.clientspoc || '',
          clientspocName: d.clientspoc_name || d.clientspoc || '',
          location:       strArr(d.location) || strArr(d.state) || '',
          experience:     d.experience || '',
          ctcStart:       d.ctcStart || '',
          ctcEnd:         d.ctcEnd || '',
          commison:       d.commison || '',
          jobDesc:        d.job_desc || '',
          keyRes:         d.key_res || '',
          mustHave:       d.m_have || '',
          goodToHave:     d.g_have || '',
          competencies:   d.compet || '',
          companyOverview:d.comp_view || '',
          posCategory:    d.pos_cat || '',
          workType:       d.workType || '',
          openings:       d.openings || '',
          hrName:         d.hr_name || '',
          deadline:       toIso(d.deadline),
          postedAt:       toIso(d.datePosted),
        };
      });
    }));

    // 4. Recruiter details. This used to be 300 sequential findRecruiterByEmail
    // round trips; one projected scan of recruiter_db is far cheaper.
    const recruiterMap = {};
    const wanted = new Set(recruiterEmails.map(e => String(e).toLowerCase()));
    const recSnap = await db.collection('recruiter_db')
      .select('name', 'email', 'mobile', 'phone', 'experienceCategory', 'location',
              'roleCategory', 'commisiontype', 'agreementSigned', 'registrationDate')
      .get();
    recSnap.docs.forEach(doc => {
      const rec = doc.data();
      const email = String(rec.email || '').toLowerCase();
      if (!email || !wanted.has(email)) return;
      recruiterMap[email] = {
        name:               rec.name || '',
        email:              rec.email || email,
        mobile:             rec.mobile || rec.phone || '',
        experienceCategory: rec.experienceCategory || '',
        location:           rec.location || '',
        roleCategory:       rec.roleCategory || '',
        commisiontype:      rec.commisiontype || '',
        agreementSigned:    !!rec.agreementSigned,
        registrationDate:   toIso(rec.registrationDate),
      };
    });

    // 5. Fetch all coach/expert requests grouped by positionId
    const requestsSnap = await coachExpertRequestsDb.get();
    const coachExpertByPosition = {};
    requestsSnap.docs.forEach(doc => {
      const r = doc.data();
      const pid = r.positionId;
      if (!pid) return;
      if (!coachExpertByPosition[pid]) coachExpertByPosition[pid] = { coaches: [], experts: [] };
      const entry = {
        id:     r.coachExpertId || '',
        name:   r.coachExpertName || '',
        email:  r.coachExpertEmail || '',
        phone:  r.coachExpertPhone || '',
        type:   r.coachExpertType || '',
        status: r.status || '',
        requestedAt: toIso(r.createdAt),
      };
      if (r.coachExpertType === 'Coach')  coachExpertByPosition[pid].coaches.push(entry);
      else if (r.coachExpertType === 'Expert') coachExpertByPosition[pid].experts.push(entry);
    });

    // 6. Build enriched rows
    const rows = candidates.map(c => {
      const pos = positionMap[c.pos_id] || {};
      const ce  = coachExpertByPosition[c.pos_id] || { coaches: [], experts: [] };
      const recEmail = (c.recEmail || c.recruiterEmail || '').toLowerCase();
      const rec = recruiterMap[recEmail] || {};

      const skills = (arr) => {
        if (Array.isArray(arr)) return arr;
        if (typeof arr === 'string' && arr) return arr.split(',').map(s => s.trim()).filter(Boolean);
        return [];
      };

      return {
        id: c.id,
        // Position
        positionId:    c.pos_id || '',
        positionTitle: pos.positionTitle || c.pos_name || '',
        // The position modal fetches /candidate/position/:id on demand, so the full
        // object is not repeated on all 21.5k rows.
        positionDetail: null,
        client:        pos.client || c.client || '',
        skill_category: pos.skill_category || '',
        clientspocName:  pos.clientspocName || '',
        clientspocEmail: pos.clientspocEmail || '',
        // Recruiter
        recruiterName:  c.recName || rec.name || '',
        recruiterEmail: recEmail || '',
        recruiterPhone: rec.mobile || c.recPhone || '',
        recruiterExpCategory: rec.experienceCategory || '',
        recruiterLocation:    rec.location || '',
        recruiterCommType:    rec.commisiontype || '',
        recruiterJoined:      rec.registrationDate || null,
        // Coach / Expert
        coaches: ce.coaches,
        experts: ce.experts,
        // Candidate
        candidateName:      c.candidate || '',
        candidateEmail:     c.emails || '',
        candidateMobile:    c.mob || '',
        relExp:             c.rel_exp || c.relExp || '',
        totalExp:           c.total_exp || c.totalExp || '',
        currentCTC:         c.current_ctc || c.currentCTC || '',
        expectedCTC:        c.exp_ctc || c.expectedCTC || '',
        noticePeriod:       c.notice_period || c.noticePeriod || '',
        currentEmployer:    c.curr_emp || c.currentEmployer || '',
        rhId:               c.rh_id || '',
        highestEducation:   c.highest_education || '',
        currentLocation:    c.curr_loc || c.currentLocation || '',
        preferredLocation:  c.pref_loc || c.preferredLocation || '',
        techSkills:         skills(c.tech_skill || c.techSkills),
        nonTechSkills:      skills(c.nontech_skill || c.nonTechSkills),
        // Status
        status:          c.statusa || c.status || '',
        submittedAt:     toIso(c.datePosted || c.createdAt),
        statusUpdatedAt: toIso(c.updatedAt),
      };
    });

    const body = { success: true, count: rows.length, data: rows };
    _reportCache = { at: Date.now(), body };
    res.json(body);
  } catch (error) {
    console.error('Reports candidates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report data', error: error.message });
  }
});

/**
 * GET /api/reports/recruiter?email=...
 * Returns full recruiter_db record for the given email (used by SuperAdmin modals)
 */
router.get('/recruiter', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'email required' });

    const rec = await recruiterF.findRecruiterByEmail(email);
    if (!rec) return res.json({ success: false, message: 'Not found' });

    const toIsoSafe = (val) => {
      if (!val) return null;
      if (val.toDate) return val.toDate().toISOString();
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    res.json({
      success: true,
      data: {
        id:                   rec.id || '',
        name:                 rec.name || '',
        email:                rec.email || email,
        mobile:               rec.mobile || rec.phone || '',
        location:             rec.location || '',
        country:              rec.country || '',
        bio:                  rec.bio || '',
        linkedin:             rec.linkedin || '',
        website:              rec.website || '',
        currentCompany:       rec.currentCompany || '',
        currentTitle:         rec.currentTitle || '',
        roleCategory:         rec.roleCategory || '',
        experienceCategory:   rec.experienceCategory || '',
        yearsOfExperience:    rec.yearsOfExperience || '',
        specialization:       rec.specialization || rec.specialisation || '',
        commisiontype:        rec.commisiontype || '',
        planType:             rec.planType !== undefined ? rec.planType : '',
        planExpiryDate:       toIsoSafe(rec.planExpiryDate),
        agreementSigned:      !!rec.agreementSigned,
        isVerified:           !!rec.isVerified,
        registrationDate:     toIsoSafe(rec.registrationDate),
        skills:               Array.isArray(rec.skills) ? rec.skills : [],
        targetIndustries:     Array.isArray(rec.targetIndustries) ? rec.targetIndustries : [],
        recruitmentMethods:   Array.isArray(rec.recruitmentMethods) ? rec.recruitmentMethods : [],
        workExperience:       Array.isArray(rec.workExperience) ? rec.workExperience : [],
        education:            Array.isArray(rec.education) ? rec.education : [],
        totalCandidates:      rec.totalCandidates || 0,
        totalPositions:       rec.totalPositions || 0,
      }
    });
  } catch (error) {
    console.error('Reports recruiter error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recruiter', error: error.message });
  }
});

/**
 * GET /api/reports/candidate?id=...
 * Returns full candidate_db record for the given document ID (used by SuperAdmin modals)
 */
router.get('/candidate', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const doc = await candidateDb.doc(id).get();
    if (!doc.exists) return res.json({ success: false, message: 'Not found' });

    const c = doc.data();

    const skills = (arr) => {
      if (Array.isArray(arr)) return arr;
      if (typeof arr === 'string' && arr) return arr.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    res.json({
      success: true,
      data: {
        id:                  doc.id,
        name:                c.candidate || '',
        email:               c.emails || '',
        mobile:              c.mob || '',
        status:              c.statusa || c.status || '',
        currentEmployer:     c.curr_emp || c.currentEmployer || '',
        rhId:                c.rh_id || '',
        highestEducation:    c.highest_education || '',
        currentLocation:     c.currentLocation || c.curr_loc || '',
        currentState:        c.curr_state || '',
        preferredLocation:   c.preferredLocation || c.pref_loc || '',
        preferredState:      c.pref_state || '',
        relExp:              c.relExp || c.rel_exp || '',
        totalExp:            c.totalExp || c.total_exp || '',
        currentCTC:          c.currentCTC || c.current_ctc || '',
        expectedCTC:         c.expectedCTC || c.exp_ctc || '',
        noticePeriod:        c.noticePeriod || c.notice_period || '',
        lastWorkingDay:      c.last_day || '',
        techSkills:          skills(c.techSkills || c.tech_skill),
        nonTechSkills:       skills(c.nonTechSkills || c.nontech_skill),
        skillType:           c.skill_type || '',
        techCategory:        c.tech_category || '',
        techSubcategory:     c.tech_subcategory || '',
        techExp:             c.tech_exp || '',
        nonTechCategory:     c.nontech_category || '',
        nonTechSubcategory:  c.nontech_subcategory || '',
        nonTechExp:          c.nontech_exp || '',
        selfRate:            c.self_rate || '',
        offerInHand:         c.offer_hand || '',
        offerAmount:         c.offer_amt || '',
        dob:                 c.dob || '',
        jrNumber:            c.jr_number || '',
        panNumber:           c.pan_number || '',
        hrName:              c.hr_name || '',
        recruiterName:       c.recName || '',
        recruiterEmail:      c.recEmail || c.recruiterEmail || '',
        positionName:        c.pos_name || '',
        positionId:          c.pos_id || '',
        client:              c.client || '',
        clientspoc:          c.clientspoc || '',
        cvUrl:               c.cv_data || '',
        submittedAt:         toIso(c.datePosted || c.createdAt),
        statusUpdatedAt:     toIso(c.updatedAt),
      }
    });
  } catch (error) {
    console.error('Reports candidate error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candidate', error: error.message });
  }
});

module.exports = router;
