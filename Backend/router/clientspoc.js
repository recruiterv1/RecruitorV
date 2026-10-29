const express=require('express');
const router=express.Router();
const jwt = require('jsonwebtoken');

const bcrypt=require('bcryptjs')


const clientspocModel=require('../model_fire/clientspocF')
const clientspoc=clientspocModel
const { getAllCompanies } = require('../model_fire/companyF')
const { computeMatchTokens, invalidateCache: invalidateBankCache } = require('../utils/resumeBankMatch')


router.post('/add', async (req, res) => {
  const { name, email, codPass, userType, recruiterQuantity } = req.body;

  if (!userType || !["Admin", "ClientSPOC", "Vendor"].includes(userType)) {
    return res.status(400).json({ message: "Invalid user type. Must be Admin, ClientSPOC, or Vendor." });
  }

  if (userType === "Vendor") {
    const qty = parseInt(recruiterQuantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: "Recruiter quantity must be at least 1 for Vendor accounts." });
    }
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(codPass, salt);

    const data = {
      name,
      email: email.toLowerCase().trim(),
      codPass: hashPass,
      role: userType,
      roleCategory: userType,
      createdAt: new Date(),
    };

    if (userType === "Vendor") {
      data.recruiterQuantity = parseInt(recruiterQuantity, 10);
    }

    await clientspoc.createRecruiter(data);

    res.json({ message: `${userType} added successfully!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

/**
 * GET /clientspoc/companies
 * Returns all company names from Company_Overview for dynamic dropdowns
 */
router.get('/companies', async (req, res) => {
    try {
        const companies = await getAllCompanies();
        console.log(`Company_Overview docs found: ${companies.length}`);
        const names = companies
            .map(c => c.name || c.companyName || c.company_name)
            .filter(Boolean)
            .sort();
        console.log(`Company names returned: ${names.length}`, names);
        return res.json({ success: true, companies: names });
    } catch (err) {
        console.error('Error fetching companies:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /clientspoc/companies-full
 * Returns full company records (name, lower, commission, overview) for the
 * SuperAdmin "All Companies" view.
 */
router.get('/companies-full', async (req, res) => {
    try {
        const companies = await getAllCompanies();
        return res.json({ success: true, companies });
    } catch (err) {
        console.error('Error fetching full companies:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Sanitize client-requirement questions. Returns undefined when the field was
// not sent (leave stored value untouched) or a clean array otherwise.
const QUESTION_TYPES = new Set(['subjective', 'yesno', 'multiselect']);
// Per-company "mandatory fields in the submit form": [{ key, label, required }].
// key is a slug; label is what recruiters see; required toggles enforcement.
function sanitizeRequiredFields(fields) {
  if (!Array.isArray(fields)) return undefined;
  const seen = new Set();
  return fields
    .map(f => ({
      key: String(f.key || f.label || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      label: String(f.label || '').trim(),
      required: f.required === true || f.required === 'true',
    }))
    .filter(f => f.key && f.label && !seen.has(f.key) && seen.add(f.key))
    .slice(0, 30);
}

function sanitizeQuestions(questions) {
  if (questions === undefined) return undefined;
  if (!Array.isArray(questions)) return [];
  return questions
    .map(q => ({
      type: QUESTION_TYPES.has(String(q.type || '').trim()) ? String(q.type).trim() : 'subjective',
      question: String(q.question || '').trim().slice(0, 500),
      options: q.type === 'multiselect' && Array.isArray(q.options)
        ? q.options.map(o => String(o || '').trim()).filter(Boolean).slice(0, 30)
        : [],
    }))
    .filter(q => q.question)
    .slice(0, 50);
}

router.post('/companyAdd',async (req,res)=>{

    let { commisson,lower,name,overview,photoRequired,commissionType,commissionTiers,questions,candidateInstructions,audioText,requiredFields}=req.body;

    try{

        // Tier-based commission: each row carries its own type ('fixed'|'percentage')
        // plus { tier, value }. Stored alongside the legacy `commisson`/`commissionType`
        // fields (= first tier's) so existing consumers keep working.
        const tiers = Array.isArray(commissionTiers)
          ? commissionTiers
              .map(t => ({ type: String(t.type || '').trim(), tier: String(t.tier || '').trim(), value: String(t.value || '').trim() }))
              .filter(t => t.type && t.tier && t.value)
          : [];

        // Client-requirement questions: subjective | yesno | multiselect (with options).
        const qs = sanitizeQuestions(questions);

        user = await clientspoc.createCompany({
                commisson,
                lower,
                name,
                overview,
                photoRequired: photoRequired === true || photoRequired === 'true',
                ...(commissionType ? { commissionType: String(commissionType) } : {}),
                ...(tiers.length ? { commissionTiers: tiers } : {}),
                ...(qs !== undefined ? { questions: qs } : {}),
                ...(candidateInstructions !== undefined ? { candidateInstructions: String(candidateInstructions) } : {}),
                ...(audioText !== undefined ? { audioText: String(audioText) } : {}),
                ...(sanitizeRequiredFields(requiredFields) !== undefined ? { requiredFields: sanitizeRequiredFields(requiredFields) } : {}),

        })

        res.json({ message: `Company Added!` });
    }
    catch(err){
        res.status(500).json({error: err.message})
    }

    


})

/**
 * GET /clientspoc/company-settings?name=CompanyName
 * Returns company settings (e.g. photoRequired) for a given company name.
 * Used by the candidate submission form to enforce company-specific rules.
 */
router.get('/company-settings', async (req, res) => {
  try {
    const { fetchCompanyOverview } = require('../model_fire/companyF');
    const name = (req.query.name || '').trim();
    if (!name) return res.json({ photoRequired: false });
    const company = await fetchCompanyOverview(name);
    const requiredFields = Array.isArray(company?.requiredFields) ? company.requiredFields : [];
    // photoRequired stays for backward compat; also honour a 'photo' entry in requiredFields.
    const photoField = requiredFields.find(f => f.key === 'photo');
    const photoRequired = company?.photoRequired === true || (photoField ? photoField.required === true : false);
    return res.json({ photoRequired, requiredFields });
  } catch (err) {
    console.error('company-settings error:', err);
    return res.json({ photoRequired: false, requiredFields: [] });
  }
});

/**
 * PUT /clientspoc/company/:id
 * Update an existing company's details.
 */
router.put('/company/:id', async (req, res) => {
  try {
    const { updateCompany } = require('../model_fire/companyF');
    const { id } = req.params;
    const { commisson, lower, name, overview, photoRequired, commissionType, commissionTiers, questions, candidateInstructions, audioText, requiredFields } = req.body;
    if (!id) return res.status(400).json({ message: 'Company ID required' });
    // Sanitize tier rows when provided (same shape as companyAdd).
    const tiers = Array.isArray(commissionTiers)
      ? commissionTiers
          .map(t => ({ type: String(t.type || '').trim(), tier: String(t.tier || '').trim(), value: String(t.value || '').trim() }))
          .filter(t => t.type && t.tier && t.value)
      : undefined;
    const qs = sanitizeQuestions(questions);
    const updated = await updateCompany(id, {
      ...(commisson  !== undefined && { commisson }),
      ...(lower      !== undefined && { lower: lower.trim() }),
      ...(name       !== undefined && { name: name.trim() }),
      ...(overview   !== undefined && { overview }),
      ...(commissionType !== undefined && { commissionType: String(commissionType) }),
      ...(tiers !== undefined && { commissionTiers: tiers }),
      ...(qs !== undefined && { questions: qs }),
      ...(candidateInstructions !== undefined && { candidateInstructions: String(candidateInstructions) }),
      ...(audioText !== undefined && { audioText: String(audioText) }),
      ...(sanitizeRequiredFields(requiredFields) !== undefined && { requiredFields: sanitizeRequiredFields(requiredFields) }),
      photoRequired: photoRequired === true || photoRequired === 'true',
    });
    return res.json({ success: true, company: updated });
  } catch (err) {
    console.error('company update error:', err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * GET /clientspoc/all
 * Get all Client SPOCs with their names and emails
 */
router.get('/all', async (req, res) => {
    try {
        const spocs = await clientspoc.getAllClientSpocs();
        res.json({
            success: true,
            data: spocs
        });
    } catch (err) {
        console.error("Error getting all client spocs:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /clientspoc/stats
 * Get all Client SPOCs with position counts, last active date, and per-position recruiter counts
 */
router.get('/stats', async (req, res) => {
    try {
        const { cached } = require('../utils/cache');
        const spocs = await cached('spocAllStats', 3 * 60 * 1000, () => clientspocModel.getAllClientSpocsWithStats());
        res.json({ success: true, data: spocs });
    } catch (err) {
        console.error("Error getting client spoc stats:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /clientspoc/by-email
 * Get a single Client SPOC by email, including mobile number
 */
router.get('/by-email', async (req, res) => {
    try {
        const email = (req.query.email || '').toLowerCase();
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        const spoc = await clientspoc.findClientSpocByEmail(email);
        if (!spoc) {
            return res.status(404).json({ success: false, message: 'Client SPOC not found' });
        }
        const phone =
            spoc.mobile ||
            spoc.phone ||
            spoc.mob ||
            spoc.contact ||
            spoc.contactNumber ||
            null;
        res.json({
            success: true,
            data: {
                id: spoc.id,
                name: spoc.name || email.split('@')[0],
                email: spoc.email,
                company: spoc.company || null,
                mobile: phone
            }
        });
    } catch (err) {
        console.error("Error getting client spoc by email:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* NEW REPORTS ENDPOINTS FOR CLIENTSPOC */

// Middleware for ClientSpoc auth
const isClientSpocLoggedIn = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify user is ClientSpoc from admin_db
    const clientspocModel = require('../model_fire/clientspocF');
    const spoc = await clientspocModel.findClientSpocByEmail(userEmail);
    
    if (!spoc) {
      return res.status(403).json({ success: false, message: 'ClientSpoc access required' });
    }

    req.clientspoc = spoc;
    next();
  } catch (error) {
    console.error('ClientSpoc auth error:', error);
    res.status(500).json({ success: false, error: 'Auth check failed' });
  }
};

// Basic auth middleware using cookie session like other routers
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.__session;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token found' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// 1. GET /clientspoc/reports/positions - Get ClientSpoc positions for dropdown
router.get('/reports/positions', authMiddleware, isClientSpocLoggedIn, async (req, res) => {
  try {
    const clientSpocEmail = req.clientspoc.email;

    const { candidate } = require('../model_fire/candidateF');
    const snapshot = await candidate
      .where('clientspoc', '==', clientSpocEmail)
      .select('pos_id', 'pos_name', 'client')
      .limit(200)
      .get();

    const positionsMap = new Map();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const posId = data.pos_id;
      if (posId && !positionsMap.has(posId)) {
        positionsMap.set(posId, {
          pos_id: posId,
          pos_name: data.pos_name || 'Unnamed Position',
          client: data.client || 'N/A',
          status: 'active'
        });
      }
    });

    // Enrich with status from admin_AddPos (in batches of 10)
    const { db } = require('./firebase_ad');
    const positionsDb = db.collection('admin_AddPos');
    const posIds = Array.from(positionsMap.keys());
    for (let i = 0; i < posIds.length; i += 10) {
      const batch = posIds.slice(i, i + 10);
      const snap = await positionsDb.where('pos_id', 'in', batch).get();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (positionsMap.has(d.pos_id)) {
          const existing = positionsMap.get(d.pos_id);
          positionsMap.set(d.pos_id, {
            ...existing,
            pos_name: d.position || existing.pos_name,
            client: d.client || existing.client,
            status: d.status || 'active'
          });
        }
      });
    }

    const positions = Array.from(positionsMap.values());
    res.json({ success: true, data: positions, count: positions.length });
  } catch (error) {
    console.error('Error fetching ClientSpoc positions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /clientspoc/reports/candidates - Get filtered candidates for table
// Accepts pos_ids (comma-separated) or single pos_id
router.get('/reports/candidates', authMiddleware, isClientSpocLoggedIn, async (req, res) => {
  try {
    const { pos_id, pos_ids, startDate, endDate } = req.query;
    const clientSpocEmail = req.clientspoc.email;

    const posIdList = pos_ids
      ? pos_ids.split(',').map(s => s.trim()).filter(Boolean)
      : pos_id
      ? [pos_id]
      : [];

    if (!posIdList.length) {
      return res.status(400).json({ success: false, message: 'pos_id or pos_ids required' });
    }

    const { candidate } = require('../model_fire/candidateF');

    // Firestore 'in' supports up to 10 values; batch if more
    let candidates = [];
    for (let i = 0; i < posIdList.length; i += 10) {
      const batch = posIdList.slice(i, i + 10);
      let query = candidate
        .where('pos_id', 'in', batch)
        .where('clientspoc', '==', clientSpocEmail)
        .orderBy('datePosted', 'desc')
        .limit(500);

      const snapshot = await query.get();
      candidates = candidates.concat(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // Group by recruiter
    const recruiterGroups = {};
    candidates.forEach(cand => {
      const recruiter = cand.recName || cand.recEmail || 'Unknown Recruiter';
      if (!recruiterGroups[recruiter]) {
        recruiterGroups[recruiter] = [];
      }
      recruiterGroups[recruiter].push(cand);
    });

    const groupedData = Object.entries(recruiterGroups).map(([recruiterName, candidates]) => ({
      recruiterName,
      candidateCount: candidates.length,
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.candidate,
        email: c.emails,
        phone: c.mob,
        currentCTC: c.current_ctc,
        expectedCTC: c.exp_ctc,
        experience: `${c.rel_exp || 'N/A'} (Total: ${c.total_exp || 'N/A'})`,
        status: c.statusa || 'Submitted',
        submittedDate: c.datePosted ? new Date(c.datePosted._seconds * 1000).toLocaleDateString() : 'N/A',
        cvUrl: c.cv_data,
        skills: c.tech_skill?.join(', ') || c.nontech_skill?.join(', ') || 'N/A'
      }))
    }));

    res.json({
      success: true,
      data: groupedData,
      totalCandidates: candidates.length,
      filters: { pos_id, startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching ClientSpoc candidates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /clientspoc/reports/export/:pos_id - Download XLS
router.get('/reports/export/:pos_id', authMiddleware, isClientSpocLoggedIn, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const { startDate, endDate } = req.query;
    const clientSpocEmail = req.clientspoc.email;

    const { candidate } = require('../model_fire/candidateF');
    
    let query = candidate
      .where('pos_id', '==', pos_id)
      .where('clientspoc', '==', clientSpocEmail)
      .orderBy('datePosted', 'desc');

    if (startDate && endDate) {
      const startTimestamp = new Date(startDate).getTime() / 1000;
      const endTimestamp = new Date(endDate).getTime() / 1000 + 86400;
      query = query
        .where('datePosted._seconds', '>=', startTimestamp)
        .where('datePosted._seconds', '<=', endTimestamp);
    }

    const snapshot = await query.limit(10000).get(); // Max 10k rows
    const candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Flatten for XLS (one row per candidate)
    const exportData = candidates.map(c => ({
      'Candidate ID': c.id,
      'Candidate Name': c.candidate,
      'Recruiter Name': c.recName || c.recEmail || 'N/A',
      'Email': c.emails,
      'Phone': c.mob,
      'Current CTC': c.current_ctc ? `₹${parseInt(c.current_ctc).toLocaleString()}` : '',
      'Expected CTC': c.exp_ctc ? `₹${parseInt(c.exp_ctc).toLocaleString()}` : '',
      'Relevant Exp': c.rel_exp || '',
      'Total Exp': c.total_exp || '',
      'Status': c.statusa || 'Submitted',
      'Submitted Date': c.datePosted ? new Date(c.datePosted._seconds * 1000).toLocaleDateString() : '',
      'Position ID': c.pos_id,
      'Client': c.client,
      'Location': `${c.curr_loc || ''}, ${c.pref_loc || ''}`.trim() || 'N/A',
      'Skills': (Array.isArray(c.tech_skill) ? c.tech_skill.join(', ') : c.tech_skill) || '',
      'CV URL': c.cv_data || ''
    }));

    // Generate XLS
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Candidates Report');
    const xls = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `clientspoc-report-${pos_id}-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(xls);
  } catch (error) {
    console.error('Error generating XLS export:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /clientspoc/direct-applications — candidates who applied directly for this SPOC's positions
router.get('/direct-applications', authMiddleware, isClientSpocLoggedIn, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const clientSpocEmail = req.clientspoc.email;
    const { pos_id } = req.query;

    // Single where clause to avoid composite index requirement — filter source in JS
    let query = db.collection('candidate_db')
      .where('clientspoc', '==', clientSpocEmail);

    if (pos_id) query = query.where('pos_id', '==', pos_id);

    const snap = await query.get();
    const applications = snap.docs
      .filter(d => d.data().source === 'direct_apply' && d.data().recRole !== 'Recruiter')   // pure self-applies only; recruiter-link submissions go to ad_panel
      .map(d => {
        const data = d.data();
        // Serialise Firestore Timestamp so frontend receives _seconds/_nanoseconds correctly
        const serializeTs = (ts) => {
          if (!ts) return null;
          if (ts._seconds !== undefined) return { _seconds: ts._seconds, _nanoseconds: ts._nanoseconds };
          if (ts.seconds  !== undefined) return { _seconds: ts.seconds,  _nanoseconds: ts.nanoseconds };
          if (ts.toDate)  return { _seconds: Math.floor(ts.toDate().getTime() / 1000), _nanoseconds: 0 };
          return ts;
        };
        return {
          id: d.id,
          candidate: data.candidate,
          emails: data.emails,
          mob: data.mob,
          pos_id: data.pos_id,
          pos_name: data.pos_name,
          client: data.client,
          statusa: data.statusa || 'Submitted',
          current_ctc: data.current_ctc,
          exp_ctc: data.exp_ctc,
          notice_period: data.notice_period,
          curr_loc: data.curr_loc,
          rel_exp: data.rel_exp,
          total_exp: data.total_exp,
          highest_education: data.highest_education,
          skill_type: data.skill_type,
          tech_skill: data.tech_skill,
          cv_data: data.cv_data,
          datePosted: serializeTs(data.datePosted),
          updatedAt:  serializeTs(data.updatedAt),
          source: 'direct_apply',
        };
      });

    // Sort newest first
    applications.sort((a, b) => {
      const at = a.datePosted?._seconds || 0;
      const bt = b.datePosted?._seconds || 0;
      return bt - at;
    });

    return res.json({ success: true, applications });
  } catch (err) {
    console.error('direct-applications error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ════════════════════════════════════════════════════════════════════════════
   BULK RESUME UPLOAD (ClientSPOC)
   Parse up to 10 resumes, extract name/email/phone/skills, store with a
   mandatory skill category into the candidate bank for future use.
   ════════════════════════════════════════════════════════════════════════════ */

// Curated skill keywords used to detect skills mentioned anywhere in a resume.
const SKILL_KEYWORDS = [
  'java','python','javascript','typescript','c++','c#','c programming','golang','go','ruby','php','swift','kotlin','scala','rust','perl','objective-c','dart','r programming','matlab','vba',
  'react','react.js','reactjs','angular','vue','vue.js','next.js','nextjs','node','node.js','nodejs','express','express.js','redux','jquery','html','html5','css','css3','sass','scss','tailwind','bootstrap','material ui',
  'spring','spring boot','hibernate','.net','asp.net','django','flask','fastapi','laravel','rails','graphql','rest api','restful',
  'sql','mysql','postgresql','postgres','mongodb','oracle','redis','elasticsearch','cassandra','dynamodb','sqlite','firebase','firestore','snowflake','bigquery',
  'aws','azure','gcp','google cloud','docker','kubernetes','k8s','terraform','ansible','jenkins','ci/cd','git','github','gitlab','bitbucket','linux','unix','bash','shell scripting',
  'machine learning','deep learning','data science','data analysis','data analytics','nlp','computer vision','tensorflow','pytorch','keras','pandas','numpy','scikit-learn','tableau','power bi','excel','powerpoint',
  'android','ios','flutter','react native','xamarin',
  'devops','microservices','kafka','rabbitmq','spark','hadoop','hive','airflow',
  'selenium','cypress','junit','testng','jest','mocha','manual testing','automation testing','qa',
  'agile','scrum','jira','project management','product management','business analysis',
  'sales','marketing','digital marketing','seo','sem','content writing','accounting','finance','recruitment','hr','operations','customer support','communication','leadership',
  'figma','adobe xd','photoshop','illustrator','ui/ux','ui design','ux design','wireframing','prototyping',
  'salesforce','sap','servicenow','workday','tally',
];

// Section headers that introduce a list of skills in a resume.
const SKILL_SECTION_RE = /(technical\s+skills|key\s+skills|core\s+competenc(?:y|ies)|skills?\s*(?:&|and)?\s*(?:expertise|summary)?|areas\s+of\s+expertise|technologies|tech\s+stack)\s*[:\-]?\s*/i;

function extractSkills(text) {
  if (!text) return [];
  const found = new Set();
  const lower = text.toLowerCase();

  // 1) Keyword scan across the whole document (word-boundary-ish)
  for (const kw of SKILL_KEYWORDS) {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-zA-Z0-9+#.])${esc}([^a-zA-Z0-9+#]|$)`, 'i');
    if (re.test(lower)) found.add(kw);
  }

  // 2) Skills section: capture items listed after a "Skills" header
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (SKILL_SECTION_RE.test(lines[i])) {
      // gather this line (after the header) plus the next few lines
      let chunk = lines[i].replace(SKILL_SECTION_RE, ' ');
      for (let j = 1; j <= 4 && i + j < lines.length; j++) {
        const nxt = lines[i + j].trim();
        if (!nxt) break;
        // stop if it looks like a new section header (Title Case word followed by colon)
        if (/^[A-Z][A-Za-z ]{2,30}:\s*$/.test(nxt)) break;
        chunk += ', ' + nxt;
      }
      chunk.split(/[,;|•·•\t]|\s{2,}/).forEach(tok => {
        const t = tok.trim().replace(/^[-–—\s]+|[-–—\s]+$/g, '');
        if (t.length >= 2 && t.length <= 30 && /[a-zA-Z]/.test(t) && !/^(and|with|in|of|the)$/i.test(t)) {
          found.add(t.toLowerCase());
        }
      });
    }
  }

  // Title-case for display, cap at 25
  const pretty = [...found].slice(0, 25).map(s =>
    s.replace(/\b\w/g, c => c.toUpperCase())
     .replace(/\bMl\b/, 'ML').replace(/\bAi\b/, 'AI').replace(/\bApi\b/, 'API')
     .replace(/\bSql\b/, 'SQL').replace(/\bAws\b/, 'AWS').replace(/\bGcp\b/, 'GCP')
     .replace(/\bUi\b/, 'UI').replace(/\bUx\b/, 'UX').replace(/\bHr\b/, 'HR').replace(/\bQa\b/, 'QA')
  );
  return [...new Set(pretty)];
}

// Lightweight name/email/phone extractor (mirrors the direct-apply logic).
// Words that disqualify a line from being a person's name (titles, section
// headings, contact labels, etc.) — these are what the old detector mistook for
// names ("Senior Software Engineer", "Curriculum Vitae", "Contact Details"…).
const NAME_STOPWORDS = new Set([
  'resume','curriculum','vitae','cv','profile','objective','summary','contact','about','details','bio',
  'address','phone','mobile','email','e-mail','tel','telephone','linkedin','github','portfolio','website',
  'dob','gender','nationality','marital','status','languages','language','skills','skill','experience',
  'education','projects','project','certifications','certification','career','professional','personal',
  'information','declaration','references','reference','hobbies','interests','achievements','awards',
  // common job-title tokens
  'engineer','developer','manager','analyst','consultant','intern','trainee','executive','officer','lead',
  'senior','junior','sr','jr','specialist','architect','administrator','associate','head','director',
  'designer','tester','programmer','scientist','accountant','recruiter','coordinator','assistant',
  'fresher','graduate','student','technician','support','operations','marketing','sales','finance',
]);

const toTitle = (s) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

// Is this line plausibly a human name (2–4 alphabetic words, no titles/digits)?
function looksLikeName(raw) {
  const clean = (raw || '').replace(/^[^A-Za-z]+|[^A-Za-z.'\-\s]+$/g, '').trim();
  if (!clean || clean.length > 40 || /\d|@/.test(clean)) return null;
  const words = clean.split(/\s+/);
  if (words.length < 2 || words.length > 4) return null;
  if (!words.every(w => /^[A-Za-z][A-Za-z.'-]*$/.test(w))) return null;
  if (words.some(w => NAME_STOPWORDS.has(w.toLowerCase()))) return null;
  // Each word should start uppercase (handles "John Doe" and "JOHN DOE").
  if (!words.every(w => /^[A-Z]/.test(w))) return null;
  return toTitle(clean);
}

function extractContactInfo(text) {
  const info = { candidate: '', emails: '', mob: '' };
  if (!text) return info;

  const emailMatch = text.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) info.emails = emailMatch[0].toLowerCase();

  // 10-digit Indian mobile (optionally +91/91), bounded so it isn't pulled out
  // of the middle of a longer number (Aadhaar, dates, IDs…).
  const phoneMatch = text.match(/(?<!\d)(?:\+?91[\s\-.]?)?([6-9]\d{9})(?!\d)/);
  if (phoneMatch) info.mob = phoneMatch[1];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1) Explicit "Name:" / "Full Name:" label wins.
  const nameLabel = text.match(/^\s*(?:name|full\s+name|candidate\s+name)\s*[:\-]\s*([A-Z][a-zA-Z .'-]{2,50})/im);
  if (nameLabel && looksLikeName(nameLabel[1])) {
    info.candidate = looksLikeName(nameLabel[1]);
  }

  // 2) Otherwise scan the first lines for a line that looks like a name.
  if (!info.candidate) {
    for (const line of lines.slice(0, 10)) {
      const name = looksLikeName(line);
      if (name) { info.candidate = name; break; }
    }
  }

  // 3) Last resort: derive a readable name from the email local-part
  //    (e.g. "john.doe92@…" → "John Doe"), but only if it yields ≥2 words.
  if (!info.candidate && info.emails) {
    const local = info.emails.split('@')[0].replace(/\d+/g, ' ').replace(/[._\-]+/g, ' ').trim();
    const parts = local.split(/\s+/).filter(w => w.length > 1);
    if (parts.length >= 2 && parts.length <= 4) info.candidate = toTitle(parts.join(' '));
  }

  return info;
}

// Load skill categories (parent + flattened child specialization names).
async function loadSkillCategories() {
  const { db } = require('./firebase_ad');
  const snap = await db.collection('skill_categories').get();
  return snap.docs.filter(d => d.data().parent).map(d => {
    const raw = d.data().children || [];
    const children = [];
    raw.forEach(c => {
      if (typeof c === 'string' && c.trim()) children.push(c.trim());
      else if (c && typeof c === 'object') {
        if (c.name) children.push(String(c.name).trim());
        (c.subChildren || []).forEach(s => { if (typeof s === 'string' && s.trim()) children.push(s.trim()); });
      }
    });
    return { parent: d.data().parent, children };
  });
}

// Pick the best-matching parent category for a resume from its text + skills.
function suggestCategory(text, skills, cats) {
  const hay = (text || '').toLowerCase();
  const skillSet = (skills || []).map(s => String(s).toLowerCase());
  let best = '', bestScore = 0;
  for (const c of cats) {
    let score = 0;
    const terms = [{ t: c.parent, w: 1 }, ...c.children.map(ch => ({ t: ch, w: 2 }))];
    for (const { t: term, w } of terms) {
      const t = String(term).toLowerCase().trim();
      if (!t || t.length < 2) continue;
      if (hay.includes(t)) score += w;
      for (const sk of skillSet) {
        if (sk && (sk === t || t.includes(sk) || sk.includes(t))) { score += 2; break; }
      }
    }
    if (score > bestScore) { bestScore = score; best = c.parent; }
  }
  return bestScore > 0 ? best : '';
}

// AI-based contact + skills extraction — far more reliable than regex. Reads the
// PDF directly (so it works even on image/scanned PDFs); for docx/text it uses
// the already-extracted text. Returns { candidate, emails, mob, skills } or null
// (no key / no credits / error) so the caller can fall back to the regex parser.
const CONTACT_TOOL = {
  name: 'emit_contact',
  description: 'Return the candidate contact details and key skills parsed from the resume.',
  input_schema: {
    type: 'object',
    properties: {
      name:   { type: 'string', description: "Candidate's full name. Empty string if not clearly present." },
      email:  { type: 'string', description: 'Primary email address, or empty string.' },
      phone:  { type: 'string', description: 'Primary phone number (digits, with country code if shown), or empty string.' },
      skills: { type: 'array', items: { type: 'string' }, description: 'Up to 15 key technical/professional skills.' },
    },
    required: ['name', 'email', 'phone', 'skills'],
  },
};

async function extractContactAI(buffer, contentType, name, fallbackText) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const isPdf = (contentType || '').includes('pdf') || (name || '').toLowerCase().endsWith('.pdf');
  const prompt = 'Extract the candidate\'s full name, primary email, primary phone number and key skills '
    + 'from this resume. The name is the person\'s name — never a job title, heading or company. '
    + 'Then call emit_contact.';

  let content;
  if (isPdf) {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } },
      { type: 'text', text: prompt },
    ];
  } else {
    const text = (fallbackText || '').trim();
    if (!text) return null;
    content = [{ type: 'text', text: `Resume text:\n\n${text.slice(0, 24000)}\n\n${prompt}` }];
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 600,
      tools: [CONTACT_TOOL],
      tool_choice: { type: 'tool', name: 'emit_contact' },
      messages: [{ role: 'user', content }],
    });
    const t = (msg.content || []).find(b => b.type === 'tool_use');
    if (!t || !t.input) return null;
    const digits = (t.input.phone || '').replace(/\D/g, '');
    return {
      candidate: (t.input.name || '').trim(),
      emails:    (t.input.email || '').trim().toLowerCase(),
      mob:       digits.length > 10 ? digits.slice(-10) : digits,
      skills:    Array.isArray(t.input.skills) ? t.input.skills.map(s => String(s).trim()).filter(Boolean).slice(0, 15) : [],
    };
  } catch (e) {
    console.error('extractContactAI error:', e.message);
    return null;
  }
}

async function resumeTextFromBuffer(buffer, contentType, name) {
  const isPdf = (contentType || '').includes('pdf') || (name || '').toLowerCase().endsWith('.pdf');
  const isDocx = (contentType || '').includes('word') || (name || '').toLowerCase().endsWith('.docx') || (name || '').toLowerCase().endsWith('.doc');
  try {
    if (isPdf) {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(buffer);
      return parsed.text || '';
    }
    if (isDocx) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    return buffer.toString('utf8');
  } catch (e) {
    console.error('resume parse error:', e.message);
    return '';
  }
}

// POST /clientspoc/bulk-resume/parse — parse a single resume + store the file.
// Find an existing bulk resume (uploaded by the same ClientSPOC) whose email AND
// phone both match. Returns the matching doc snapshot or null. A duplicate
// requires both fields to be present and equal.
const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '');
async function findBulkDuplicate(db, addedBy, emails, mob, excludeId) {
  const email = (emails || '').trim().toLowerCase();
  const phone = onlyDigits(mob);
  if (!email || !phone) return null;
  const snap = await db.collection('candidate_db')
    .where('addedBy', '==', addedBy)
    .where('emails', '==', email)
    .get();
  return snap.docs.find(d => {
    if (d.id === excludeId) return false;
    const c = d.data();
    return c.source === 'clientspoc_bulk' && onlyDigits(c.mob) === phone;
  }) || null;
}

// Derive a candidate name from a resume filename when text extraction fails.
// e.g. "Naukri_BanuGangaG[5y_7m].pdf" → "Banu Ganga G". Returns '' if nothing usable.
function nameFromFilename(fn) {
  let s = (fn || '').replace(/\.[a-z0-9]+$/i, '');          // drop extension
  s = s.replace(/\[[^\]]*\]/g, ' ');                         // drop "[5y_7m]" style tags
  s = s.replace(/[_\-.]+/g, ' ').replace(/\d+/g, ' ');       // separators + digits first
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');                // then split camelCase
  s = s.replace(/\b(naukri|resume|cv|profile|updated|final|new|copy|monster|shine|indeed)\b/gi, ' '); // then portal/junk words
  s = s.replace(/\s+/g, ' ').trim();
  if (!s || s.length < 2) return '';
  return s.split(' ').filter(Boolean).slice(0, 4)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Body: { filename, contentType, base64 }
router.post('/bulk-resume/parse', authMiddleware, async (req, res) => {
  try {
    const { filename, contentType, base64 } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ success: false, message: 'filename and base64 are required.' });
    }
    const buffer = Buffer.from(base64, 'base64');

    // Extract text first (used by the regex fallback and by AI for docx/text).
    const text = await resumeTextFromBuffer(buffer, contentType, filename);

    // Deterministic (free) extraction first — handles the large majority of
    // resumes with no AI cost.
    const regexInfo   = extractContactInfo(text);
    const regexSkills = extractSkills(text);

    // Only fall back to AI for the hard cases the regex parser couldn't crack
    // (no name, or neither email nor phone found). This keeps Anthropic usage to
    // a small fraction of uploads. Set BULK_PARSE_AI=off to disable AI entirely.
    const aiEnabled = process.env.BULK_PARSE_AI !== 'off';
    const needsAI = aiEnabled && (!regexInfo.candidate || (!regexInfo.emails && !regexInfo.mob));
    const ai = needsAI ? await extractContactAI(buffer, contentType, filename, text) : null;

    // Prefer the deterministic values; use AI only to fill blanks; finally fall back
    // to the filename (Naukri exports are named "Naukri_<Name>[<exp>].pdf", so the
    // name is right there even when the resume text has no clear name line).
    const info = {
      candidate: regexInfo.candidate || (ai && ai.candidate) || nameFromFilename(filename) || '',
      emails:    regexInfo.emails    || (ai && ai.emails)    || '',
      mob:       regexInfo.mob       || (ai && ai.mob)       || '',
    };
    const skills = (regexSkills && regexSkills.length) ? regexSkills : ((ai && ai.skills) || []);

    // Auto-suggest the skill category from the detected skills/text
    let suggestedCategory = '';
    try {
      const cats = await loadSkillCategories();
      suggestedCategory = suggestCategory(text, skills, cats);
    } catch (e) { /* non-fatal */ }

    // Store the file in Firebase Storage (resume bank)
    const admin = require('firebase-admin');
    const { v4: uuidv4 } = require('uuid');
    const bucket = require('../utils/localBucket').bucket();
    const token = uuidv4();
    const safeName = filename.replace(/\s+/g, '_');
    const filepath = `resumes/bulk/${Date.now()}_${safeName}`;
    await bucket.file(filepath).save(buffer, {
      contentType: contentType || 'application/octet-stream',
      resumable: false,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    const url = `${bucket.base}/v0/b/${bucket.name}/o/${encodeURIComponent(filepath)}?alt=media&token=${token}`;

    // Duplicate check — same email AND phone already in this SPOC's bank.
    let duplicate = null;
    try {
      const { db } = require('./firebase_ad');
      const addedBy = (req.user?.email || '').toLowerCase();
      const dup = await findBulkDuplicate(db, addedBy, info.emails, info.mob);
      if (dup) duplicate = { id: dup.id, candidate: dup.data().candidate || '' };
    } catch (e) { /* non-fatal */ }

    return res.json({
      success: true,
      filename,
      candidate: info.candidate || '',
      emails: info.emails || '',
      mob: info.mob || '',
      skills,
      skillCategory: suggestedCategory,
      cv_data: url,
      parsed: !!text,
      resumeText: (text || '').slice(0, 20000),
      duplicate: !!duplicate,
      duplicateId: duplicate ? duplicate.id : '',
      duplicateName: duplicate ? duplicate.candidate : '',
    });
  } catch (err) {
    console.error('bulk-resume/parse error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /clientspoc/bulk-resume/save — save reviewed candidates to the bank.
// Body: { candidates: [{ candidate, emails, mob, skills[], skillCategory, cv_data }] }
router.post('/bulk-resume/save', authMiddleware, async (req, res) => {
  try {
    const { candidates } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ success: false, message: 'No candidates provided.' });
    }
    if (candidates.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 resumes at a time.' });
    }
    // Skill category is mandatory for every candidate
    const missing = candidates.findIndex(c => !c.skillCategory || !String(c.skillCategory).trim());
    if (missing !== -1) {
      return res.status(400).json({ success: false, message: `Skill category is required for resume #${missing + 1}.` });
    }

    const { db } = require('./firebase_ad');
    const col = db.collection('candidate_db');
    const addedBy = (req.user?.email || '').toLowerCase();
    const now = new Date();

    const batch = db.batch();
    let saved = 0, overwritten = 0;
    const skipped = [];   // duplicates not overwritten → rejected

    for (const c of candidates) {
      const emails = (c.emails || '').trim().toLowerCase();
      const mob = (c.mob || '').trim();
      const skillsArr = Array.isArray(c.skills) ? c.skills.filter(Boolean) : [];

      // Authoritative duplicate check (email AND phone) against existing bank.
      const dup = await findBulkDuplicate(db, addedBy, emails, mob);

      if (dup && !c.overwrite) {
        skipped.push(c.candidate || emails || 'Unnamed');
        continue;   // reject the duplicate
      }

      const common = {
        candidate: (c.candidate || '').trim(),
        emails,
        mob,
        skills: skillsArr,
        skillsText: skillsArr.join(', '),
        skillCategory: String(c.skillCategory).trim(),
        resumeText: String(c.resumeText || '').slice(0, 20000),
        matchTokens: computeMatchTokens(c.resumeText, { skills: skillsArr, skillsText: skillsArr.join(', '), skillCategory: c.skillCategory, candidate: c.candidate }),
        cv_data: c.cv_data || '',
        source: 'clientspoc_bulk',
        addedBy,
        addedByRole: 'ClientSPOC',
        clientspoc: addedBy,
        statusa: 'Resume Bank',
        updatedAt: now,
      };

      if (dup && c.overwrite) {
        // Overwrite the existing record (keep its id + original datePosted).
        batch.set(col.doc(dup.id), { ...common, id: dup.id }, { merge: true });
        overwritten++;
      } else {
        const ref = col.doc();
        batch.set(ref, { ...common, id: ref.id, datePosted: now });
        saved++;
      }
    }
    await batch.commit();
    try { invalidateBankCache(); } catch { /* non-fatal */ }

    return res.json({ success: true, saved, overwritten, skipped });
  } catch (err) {
    console.error('bulk-resume/save error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /clientspoc/bulk-resume/list — resumes this ClientSPOC uploaded in bulk.
router.get('/bulk-resume/list', authMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const email = (req.user?.email || '').toLowerCase();
    // Single-field equality query (no composite index needed); filter source in JS.
    const snap = await db.collection('candidate_db').where('addedBy', '==', email).get();
    const rows = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => r.source === 'clientspoc_bulk')
      .map(r => ({
        id: r.id,
        candidate: r.candidate || '',
        emails: r.emails || '',
        mob: r.mob || '',
        skills: Array.isArray(r.skills) ? r.skills : (r.skillsText ? r.skillsText.split(',').map(s => s.trim()).filter(Boolean) : []),
        skillCategory: r.skillCategory || '',
        cv_data: r.cv_data || '',
        datePosted: r.datePosted && r.datePosted._seconds ? new Date(r.datePosted._seconds * 1000) : (r.datePosted || null),
      }));
    rows.sort((a, b) => (new Date(b.datePosted || 0)) - (new Date(a.datePosted || 0)));
    return res.json({ success: true, resumes: rows });
  } catch (err) {
    console.error('bulk-resume/list error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /clientspoc/bulk-resume/:id — edit one of this ClientSPOC's bulk resumes.
// Body may include: { candidate, emails, mob, skills[], skillCategory }
router.patch('/bulk-resume/:id', authMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const email = (req.user?.email || '').toLowerCase();
    const ref = db.collection('candidate_db').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Resume not found.' });

    const data = doc.data();
    // Ownership guard — only the uploading ClientSPOC may edit their bulk resume.
    if (data.source !== 'clientspoc_bulk' || (data.addedBy || '').toLowerCase() !== email) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    const b = req.body || {};
    const update = { updatedAt: new Date() };
    if (b.candidate !== undefined) update.candidate = String(b.candidate).trim();
    if (b.emails    !== undefined) update.emails    = String(b.emails).trim().toLowerCase();
    if (b.mob       !== undefined) update.mob       = String(b.mob).trim();
    if (b.skillCategory !== undefined) {
      const cat = String(b.skillCategory).trim();
      if (!cat) return res.status(400).json({ success: false, message: 'Skill category cannot be empty.' });
      update.skillCategory = cat;
    }
    if (b.skills !== undefined) {
      const skillsArr = Array.isArray(b.skills) ? b.skills.map(s => String(s).trim()).filter(Boolean) : [];
      update.skills = skillsArr;
      update.skillsText = skillsArr.join(', ');
    }

    await ref.update(update);
    try { invalidateBankCache(); } catch { /* non-fatal */ }
    return res.json({ success: true });
  } catch (err) {
    console.error('bulk-resume/update error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /clientspoc/bulk-resume/:id — delete one of this ClientSPOC's bulk resumes.
router.delete('/bulk-resume/:id', authMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const email = (req.user?.email || '').toLowerCase();
    const ref = db.collection('candidate_db').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Resume not found.' });

    const data = doc.data();
    if (data.source !== 'clientspoc_bulk' || (data.addedBy || '').toLowerCase() !== email) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    // Best-effort: remove the stored CV file too.
    if (data.cv_data) {
      try {
        const admin = require('firebase-admin');
        const m = String(data.cv_data).match(/\/o\/([^?]+)/);
        if (m) await require('../utils/localBucket').bucket().file(decodeURIComponent(m[1])).delete().catch(() => {});
      } catch (_) { /* non-fatal */ }
    }

    await ref.delete();
    try { invalidateBankCache(); } catch { /* non-fatal */ }
    return res.json({ success: true });
  } catch (err) {
    console.error('bulk-resume/delete error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports=router;
