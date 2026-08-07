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
router.get('/candidates', async (req, res) => {
  try {
    // 1. Fetch all candidates
    const candidateSnap = await candidateDb.get();
    const candidates = candidateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (candidates.length === 0) return res.json({ success: true, data: [] });

    // 2. Collect unique position IDs and recruiter emails
    const posIds = [...new Set(candidates.map(c => c.pos_id).filter(Boolean))];
    const recruiterEmails = [...new Set(candidates.map(c => c.recEmail || c.recruiterEmail).filter(Boolean))];

    // 3. Fetch full position details in batches of 10
    const positionMap = {};
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
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
    }

    // 4. Fetch full recruiter details (one by one — small set)
    const recruiterMap = {};
    for (const email of recruiterEmails) {
      try {
        const rec = await recruiterF.findRecruiterByEmail(email);
        if (rec) {
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
        }
      } catch (_) {}
    }

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
        positionDetail: Object.keys(pos).length ? pos : null,
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

    res.json({ success: true, count: rows.length, data: rows });
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
