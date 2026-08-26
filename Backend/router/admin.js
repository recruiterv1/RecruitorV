const express=require('express');
const router=express.Router();
const jwt=require('jsonwebtoken');

const adminVerify=require('../model_fire/adminCF');

/**
 * Admin middleware - verify __session cookie and super admin role
 */
const adminAuthMiddleware = async (req, res, next) => {
  const token = req.cookies.__session;
  if (!token) {
    return res.status(401).json({ message: "No admin session" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    console.log('🔍 Admin auth email:', decoded.email);

    // Primary: admin_db check — any record in admin_db is a valid admin
    let result = await adminVerify.checkData(decoded.email);
    let admin = result.admin;
    let fromAdminDb = result.success;

    // Fallback: Check recruiter_db — only allow Super Admin role
    if (!result.success) {
      console.log('Admin not found in admin_db, checking recruiter_db...');
      const recruiterF = require('../model_fire/recruiterF');
      const recruiterResult = await recruiterF.findRecruiterByEmail(decoded.email);
      console.log('🔍 recruiterResult:', recruiterResult ? `${recruiterResult.name} (${recruiterResult.role})` : 'null');
      if (recruiterResult && (recruiterResult.role === 'Super Admin' || recruiterResult.roleCategory === 'SuperAdmin')) {
        console.log('✅ Super Admin found in recruiter_db');
        admin = recruiterResult;
        result.success = true;
      }
    }

    if (!result.success) {
      console.log('❌ No admin found in admin_db OR recruiter_db');
      return res.status(401).json({ message: "Admin not found in any collection" });
    }

    // For recruiter_db fallback users, enforce Super Admin role
    if (!fromAdminDb && admin.role !== 'Super Admin' && admin.roleCategory !== 'SuperAdmin') {
      return res.status(403).json({ message: "Super admin access required" });
    }

    console.log('✅ Admin auth passed for:', admin.email);
    req.user = admin;
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const handleAdminLogin = async (req, res) => {
  console.log("Request body:", req.body);
  const {email,pass}=req.body;
  const result= await adminVerify.checkCredentials(email,pass);
  if(!result.success) {
    return res.status(400).json({ message: result.message });
  }
  const admin = result.admin;
  await adminVerify.updateAdmin(email, { lastActive: new Date() });
  const token= jwt.sign({email : email, portal: 'admin'}, process.env.SECKEY, {expiresIn: '30d'})
  const isLocal = !process.env.K_SERVICE;
  res.cookie("__session", token, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? "lax" : "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(isLocal ? {} : { domain: ".recruiterv.com" })
  });
  const rawRole = admin.roleCategory || admin.role || 'Admin';
  const roleCategory = rawRole === 'Super Admin' ? 'SuperAdmin' : rawRole;
  const loginPayload = {
    message: "Verified Successfully",
    email: admin.email,
    name: admin.name,
    roleCategory: roleCategory,
    role: admin.role || roleCategory,
    // Returned so the native app can authenticate via Authorization header
    // (the cross-site __session cookie isn't sent from the app web view).
    token,
  };
  if (roleCategory === 'Vendor') {
    loginPayload.recruiterQuantity = admin.recruiterQuantity || 0;
  }
  return res.json(loginPayload);
};

// '/login' is the real endpoint. '/ad' is kept as an alias only because some
// installed native-app builds still call it — do not remove. Browser ad blockers
// (uBlock/AdBlock filter lists) treat any "/ad" URL segment as an ad-network
// request and silently drop it, which was making every website admin/clientspoc/
// vendor login fail with no request ever reaching the server.
router.post('/login', handleAdminLogin);
router.post('/ad', handleAdminLogin);

router.post('/adlogout', (req, res) => {
  const isLocal = !process.env.K_SERVICE;
  res.clearCookie("__session", {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? "lax" : "none",
    path: "/",
    ...(isLocal ? {} : { domain: ".recruiterv.com" })
  });
  return res.json({ message: "Logged out successfully" });
});

router.get("/authcheck", async (req, res) => {
  const token = req.cookies.__session;
  if (!token) {
    return res.status(401).json({ message: "No admin session" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    // If this session was created via the recruiter/coach/expert portal, don't
    // resolve it as an admin/clientspoc — even if the same email also exists in
    // admin_db (dual-account users). Legacy tokens (no portal claim) are allowed.
    if (decoded.portal === 'user') {
      return res.status(401).json({ message: "Not an admin session" });
    }
    const result = await adminVerify.checkData(decoded.email)
    if(!result.success){
      return res.status(401).json({ message: "Admin not found" });
    }
    const admin=result.admin
    const rawRole = admin.roleCategory || admin.role || 'Admin';
    const roleCategory = rawRole === 'Super Admin' ? 'SuperAdmin' : rawRole;
    const userPayload = {
      email: admin.email,
      name: admin.name,
      type: "admin",
      roleCategory: roleCategory,
      role: admin.role || roleCategory,
      isEmployee: !!admin.isEmployee,
      designation: admin.designation || ''
    };
    if (roleCategory === 'Vendor') {
      userPayload.recruiterQuantity = admin.recruiterQuantity || 0;
    }
    return res.json({ message: "Admin authenticated", user: userPayload });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Admin endpoint to update user roleCategory (for fixing sidebar menu visibility)
router.post('/update-user-role', async (req, res) => {
  try {
    const { email, roleCategory } = req.body;
    if (!email || !roleCategory) {
      return res.status(400).json({
        success: false,
        message: 'Email and roleCategory are required'
      });
    }
    const result = await adminVerify.updateAdmin(email, {
      roleCategory: roleCategory,
      role: roleCategory
    });
    if (result.success) {
      return res.json({
        success: true,
        message: `User role updated to: ${roleCategory}`,
        email: email,
        roleCategory: roleCategory
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Admin endpoint to get user role (for debugging)
router.get('/get-user-role/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    const result = await adminVerify.getAdminByEmail(email);
    if (result.success) {
      return res.json({
        success: true,
        user: {
          email: result.admin.email,
          name: result.admin.name,
          role: result.admin.role,
          roleCategory: result.admin.roleCategory
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error getting user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user role',
      error: error.message
    });
  }
});

/**
 * GET /admin/assigned-positions ⭐ NEW ENDPOINT
 * Super admin dashboard - All positions with assigned recruiters, coaches, experts
 * Supports rowspan table: clientspoc, recruiters (multiple), coach/expert (multiple), 
 * status (request sent/approved), dates (created, request sent, approved)
 */
// POST /admin/impersonate { email } — SuperAdmin only.
// Issues a session for the target user (recruiter/coach/expert/clientspoc/vendor)
// so the SuperAdmin can log in as them to inspect/fix their account. This REPLACES
// the SuperAdmin's own session cookie — log back in as admin afterwards.
router.post('/impersonate', adminAuthMiddleware, async (req, res) => {
  try {
    // Strict SuperAdmin-only guard (adminAuthMiddleware also lets clientspoc/vendor through).
    const callerRole = (req.user?.roleCategory || req.user?.role || '').toString().toLowerCase().replace(/\s/g, '');
    if (callerRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only a Super Admin can log in as another user.' });
    }

    const email = (req.body?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const { db } = require('./firebase_ad');
    const recruiterF = require('../model_fire/recruiterF');
    const coachF = require('../model_fire/coachF');
    const expertF = require('../model_fire/expertF');
    const clientspocF = require('../model_fire/clientspocF');

    let target = null, portal = 'user', redirect = '/dash_rec', roleCategory = '';

    const rec = await recruiterF.findRecruiterByEmail(email);
    if (rec) {
      target = rec;
      roleCategory = rec.roleCategory || 'Recruiter';
      const rc = String(roleCategory).toLowerCase();
      if (rc === 'coach') redirect = '/coach-dashboard';
      else if (rc === 'expert') redirect = '/expert-dashboard';
      else redirect = '/dash_rec';
      portal = 'user';
    }
    if (!target) { const c = await coachF.findCoachByEmail(email); if (c) { target = c; roleCategory = 'Coach'; portal = 'user'; redirect = '/coach-dashboard'; } }
    if (!target) { const e = await expertF.findExpertByEmail(email); if (e) { target = e; roleCategory = 'Expert'; portal = 'user'; redirect = '/expert-dashboard'; } }
    if (!target) {
      const spoc = await clientspocF.findClientSpocByEmail(email);
      if (spoc) {
        target = spoc;
        roleCategory = spoc.roleCategory || spoc.role || 'ClientSpoc';
        portal = 'admin';
        redirect = String(roleCategory).toLowerCase() === 'vendor' ? '/vendor-dashboard' : '/ad_panel';
      }
    }
    if (!target) return res.status(404).json({ success: false, message: 'No account found for that email.' });

    const token = jwt.sign({ email, portal, impersonatedBy: req.user?.email || '' }, process.env.SECKEY, { expiresIn: '30d' });
    const isLocal = !process.env.K_SERVICE;
    res.cookie('__session', token, {
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'lax' : 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
      ...(isLocal ? {} : { domain: '.recruiterv.com' }),
    });

    try { await db.collection('impersonation_logs').add({ adminEmail: req.user?.email || '', targetEmail: email, roleCategory, at: new Date() }); } catch (_) {}
    console.log(`🔐 IMPERSONATION: ${req.user?.email} → ${email} (${roleCategory})`);
    return res.json({ success: true, redirect, roleCategory, email });
  } catch (e) {
    console.error('impersonate error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

// GET/POST /admin/zapier-config — read / set the Zapier LinkedIn webhook.
router.get('/zapier-config', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const doc = await db.collection('app_config').doc('zapier').get();
    const c = doc.exists ? doc.data() : {};
    // Never echo the full URL back to the UI — just whether it's set.
    return res.json({ success: true, enabled: c.enabled !== false && !!c.webhookUrl, hasUrl: !!c.webhookUrl });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});
router.post('/zapier-config', adminAuthMiddleware, async (req, res) => {
  try {
    const { webhookUrl, enabled } = req.body || {};
    // Accept Make (hook*.make.com / integromat.com), Zapier (hooks.zapier.com),
    // or any other HTTPS automation webhook.
    if (webhookUrl && !/^https:\/\/[^\s]+/i.test(String(webhookUrl))) {
      return res.status(400).json({ success: false, message: 'The webhook must be a valid https:// URL (e.g. your Make custom-webhook URL).' });
    }
    const { db } = require('./firebase_ad');
    const patch = { updatedAt: new Date(), updatedBy: req.user?.email || '' };
    if (webhookUrl !== undefined) patch.webhookUrl = String(webhookUrl || '');
    if (enabled !== undefined) patch.enabled = !!enabled;
    await db.collection('app_config').doc('zapier').set(patch, { merge: true });
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// POST /admin/suspend-inactive-recruiters — run the inactivity sweep on demand.
router.post('/suspend-inactive-recruiters', adminAuthMiddleware, async (req, res) => {
  try {
    const { suspendInactiveRecruiters, suspendInactiveCoachesExperts } = require('../model_fire/inactivityF');
    const result = await suspendInactiveRecruiters();
    const coachExpert = await suspendInactiveCoachesExperts();
    try { require('../utils/cache').invalidate('rec'); } catch (_) {}
    return res.json({ success: true, ...result, coachExpert });
  } catch (e) {
    console.error('manual inactivity sweep error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/assigned-positions', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('🚀 /admin/assigned-positions HIT for SuperAdmin');
    
    const ad_Pos = require('../model_fire/adminF');
    const positionAccess = require('../model_fire/positionAccessF');
    const recruiterModel = require('../model_fire/recruiterF');
    const coachModel = require('../model_fire/coachF');
    const expertModel = require('../model_fire/expertF');
    const clientspocModel = require('../model_fire/clientspocF');
    const adminModel = require('../model_fire/adminF'); // fallback

    // 1. Get ALL positions (super admin sees everything, including hidden)
    const positions = await ad_Pos.getAllPosition(true);
    console.log('📊 Positions found:', positions.length);

    const enrichedPositions = [];


    for (const position of positions) {
      const pos_id = position.pos_id;

      // 2. Get APPROVED assignments for recruiters
      const recruiterAssignments = await positionAccess.getPositionAssignees(pos_id);
      const recruiters = await Promise.all(
        recruiterAssignments.map(async (assign) => {
          const recruiter = await recruiterModel.findRecruiterByEmail(assign.recruiterEmail);
          return {
            name: recruiter?.name || recruiter?.firstName || assign.recruiterName || 'Unknown',
            email: assign.recruiterEmail,
            phone: recruiter?.phone || 'N/A',
            role: 'Recruiter',
            requestSent: assign.requestedAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            approvedAt: assign.respondedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
          };
        })
      );

      // 3. Get APPROVED coaches
      const coaches = await Promise.all(
        recruiterAssignments.map(async (assign) => {
          const coach = await coachModel.findCoachByEmail(assign.recruiterEmail);
          if (!coach) return null;
          return {
            name: coach.name,
            email: assign.recruiterEmail,
            phone: coach.phone || 'N/A',
            role: 'Coach',
            requestSent: assign.requestedAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            approvedAt: assign.respondedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
          };
        })
      ).then(results => results.filter(Boolean));

      // 4. Get APPROVED experts  
      const experts = await Promise.all(
        recruiterAssignments.map(async (assign) => {
          const expert = await expertModel.findExpertByEmail(assign.recruiterEmail);
          if (!expert) return null;
          return {
            name: expert.name,
            email: assign.recruiterEmail,
            phone: expert.phone || 'N/A',
            role: 'Expert',
            requestSent: assign.requestedAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            approvedAt: assign.respondedAt?.toDate?.()?.toLocaleDateString() || 'N/A'
          };
        })
      ).then(results => results.filter(Boolean));

      const coachExperts = [...coaches, ...experts];

      // 5. Clientspoc lookup (name/phone)
      const clientspocEmail = position.clientspoc?.toLowerCase();
      let clientspocInfo = { name: position.clientspoc_name || clientspocEmail || 'N/A', phone: 'N/A', email: clientspocEmail };

      try {
        const clientspoc = await clientspocModel.findClientSpocByEmail(clientspocEmail);
        if (clientspoc) {
          clientspocInfo = {
            name: clientspoc.name || clientspoc.firstName || clientspocEmail,
            phone: clientspoc.phone || 'N/A',
            email: clientspocEmail
          };
        }
      } catch (e) {
        // Fallback: check admin collection
        try {
          const adminUser = await adminModel.findAdminByEmail(clientspocEmail);
          if (adminUser) {
            clientspocInfo = {
              name: adminUser.name || adminUser.firstName || clientspocEmail,
              phone: adminUser.phone || 'N/A', 
              email: clientspocEmail
            };
          }
        } catch (e2) {
          console.log(`No clientspoc details for ${clientspocEmail}`);
        }
      }

      // 6. Status logic
      const totalAssignees = recruiters.length + coachExperts.length;
      let status = 'open';
      if (totalAssignees > 0) {
        status = recruiters.length > 0 && coachExperts.length > 0 ? 'fully_assigned' : 'partially_assigned';
      }

      enrichedPositions.push({
        pos_id,
        position: position.position,
        client: position.client || 'N/A',
        clientspoc_name: clientspocInfo.name,
        clientspoc_email: clientspocInfo.email,
        clientspoc_phone: clientspocInfo.phone,
        dateCreated: position.datePosted ? position.datePosted.toDate().toLocaleDateString() : 'N/A',
        recruiters,
        coachExperts,
        status,
        totalAssignees
      });
    }

    // Sort by date created (newest first)
    enrichedPositions.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

    res.json({
      success: true,
      count: enrichedPositions.length,
      positions: enrichedPositions
    });
  } catch (error) {
    console.error('Error in /admin/assigned-positions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assigned positions',
      error: error.message 
    });
  }
});

/**
 * GET /admin/users-for-assignment
 * Returns all available recruiters, coaches, experts, clientspocs for the edit-assignments dropdown
 */
router.get('/users-for-assignment', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [recSnap, coachSnap, expertSnap, spocSnap] = await Promise.all([
      db.collection('recruiter_db').where('isVerified', '==', true).get(),
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
      db.collection('admin_db').get(),
    ]);

    const pick = (snap, phoneField) => snap.docs.map(d => {
      const data = d.data();
      const sc = data.skillCategory || data.skill_category || '';
      const skillCategory = Array.isArray(sc) ? sc : (sc ? [sc] : []);
      return {
        id: d.id,
        name: data.name || '',
        email: (data.email || '').toLowerCase(),
        phone: data[phoneField] || data.phone || data.mobile || '',
        skillCategory,
      };
    }).filter(u => u.email);

    res.json({
      success: true,
      recruiters:  pick(recSnap,   'mobile'),
      coaches:     pick(coachSnap, 'phone'),
      experts:     pick(expertSnap,'phone'),
      clientspocs: pick(spocSnap,  'phone'),
    });
  } catch (error) {
    console.error('Error in /admin/users-for-assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/position-current-assignments?posId=...
 * Returns the current clientspoc, recruiters, coaches, experts for a position
 */
router.get('/position-current-assignments', adminAuthMiddleware, async (req, res) => {
  try {
    const { posId } = req.query;
    if (!posId) return res.status(400).json({ success: false, message: 'posId required' });

    const { db } = require('./firebase_ad');

    const [posSnap, recruiterSnap, ceSnap] = await Promise.all([
      db.collection('admin_AddPos').where('pos_id', '==', posId).limit(1).get(),
      db.collection('position_access_requests')
        .where('positionId', '==', posId).where('type', '==', 'assign').where('status', '==', 'approved').get(),
      db.collection('coach_expert_requests').where('positionId', '==', posId).get(),
    ]);

    const pos = posSnap.empty ? {} : posSnap.docs[0].data();
    const now = new Date();

    const recruiters = [];
    recruiterSnap.docs.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);
      if (!expiresAt || now <= expiresAt) {
        recruiters.push({ email: data.recruiterEmail, name: data.recruiterName || data.recruiterEmail });
      }
    });

    const coaches = [], experts = [];
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const entry = { email: data.coachExpertEmail, name: data.coachExpertName || data.coachExpertEmail };
      if (data.coachExpertType === 'Coach')  coaches.push(entry);
      else if (data.coachExpertType === 'Expert') experts.push(entry);
    });

    res.json({
      success: true,
      clientspoc: { email: pos.clientspoc || '', name: pos.clientspoc_name || pos.clientspoc || '' },
      recruiters,
      coaches,
      experts,
    });
  } catch (error) {
    console.error('Error in /admin/position-current-assignments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/update-position-assignments
 * Update clientspoc, recruiters, coaches, experts for a position; email newly added people
 */
router.post('/update-position-assignments', adminAuthMiddleware, async (req, res) => {
  try {
    const { posId, positionTitle, clientspocEmail, clientspocName, recruiterEmails = [], coachEmails = [], expertEmails = [] } = req.body;
    if (!posId) return res.status(400).json({ success: false, message: 'posId required' });

    const { db } = require('./firebase_ad');
    const { sendEmailFull, templates, renderEmail } = require('../utils/email');
    const positionsDb   = db.collection('admin_AddPos');
    const posAccess     = db.collection('position_access_requests');
    const ceRequests    = db.collection('coach_expert_requests');

    const posSnap = await positionsDb.where('pos_id', '==', posId).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found' });
    const posDoc  = posSnap.docs[0];
    const posData = posDoc.data();
    const title   = positionTitle || posData.position || '';
    const client  = posData.client || '';

    const newlyAdded = []; // { type, email, name }

    // ── 1. ClientSPOC ──────────────────────────────────────────────────────────
    const oldSpoc = (posData.clientspoc || '').toLowerCase();
    const newSpoc = (clientspocEmail || '').toLowerCase();
    if (newSpoc && newSpoc !== oldSpoc) {
      await posDoc.ref.update({ clientspoc: newSpoc, clientspoc_name: clientspocName || newSpoc, updatedAt: new Date() });
      newlyAdded.push({ type: 'ClientSPOC', email: newSpoc, name: clientspocName || newSpoc });
    }

    // ── 2. Recruiters ──────────────────────────────────────────────────────────
    const now = new Date();
    const [curRecSnap] = await Promise.all([
      posAccess.where('positionId', '==', posId).where('type', '==', 'assign').where('status', '==', 'approved').get(),
    ]);

    const curRecEmails = new Set();
    curRecSnap.docs.forEach(d => {
      const e = (d.data().recruiterEmail || '').toLowerCase();
      const exp = d.data().expiresAt?.toDate ? d.data().expiresAt.toDate() : (d.data().expiresAt ? new Date(d.data().expiresAt) : null);
      if (!exp || now <= exp) curRecEmails.add(e);
    });
    const newRecEmails = new Set(recruiterEmails.map(e => e.toLowerCase()));

    // Remove
    for (const d of curRecSnap.docs) {
      const e = (d.data().recruiterEmail || '').toLowerCase();
      if (!newRecEmails.has(e)) await d.ref.update({ status: 'removed', updatedAt: new Date() });
    }
    // Add
    for (const email of newRecEmails) {
      if (curRecEmails.has(email)) continue;
      const rSnap = await db.collection('recruiter_db').where('email', '==', email).limit(1).get();
      const rData = rSnap.empty ? {} : rSnap.docs[0].data();
      const expiry = new Date(); expiry.setDate(expiry.getDate() + 90);
      await posAccess.add({
        type: 'assign', recruiterEmail: email,
        recruiterName: rData.name || email.split('@')[0],
        positionId: posId, positionTitle: title, client,
        clientspoc: newSpoc || oldSpoc, status: 'approved',
        requestedAt: now, respondedAt: now, respondedBy: 'admin',
        expiresAt: expiry, createdAt: now, updatedAt: now, adminAssigned: true,
      });
      newlyAdded.push({ type: 'Recruiter', email, name: rData.name || email.split('@')[0] });
    }

    // ── 3. Coaches & Experts ───────────────────────────────────────────────────
    const ceSnap = await ceRequests.where('positionId', '==', posId).get();
    const curCoachEmails = new Set(), curExpertEmails = new Set();
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const e = (data.coachExpertEmail || '').toLowerCase();
      if (data.coachExpertType === 'Coach')  curCoachEmails.add(e);
      if (data.coachExpertType === 'Expert') curExpertEmails.add(e);
    });

    const newCoachEmails  = new Set(coachEmails.map(e => e.toLowerCase()));
    const newExpertEmails = new Set(expertEmails.map(e => e.toLowerCase()));

    // Remove coaches/experts no longer in list
    for (const d of ceSnap.docs) {
      const data = d.data();
      const e = (data.coachExpertEmail || '').toLowerCase();
      if (data.coachExpertType === 'Coach'  && !newCoachEmails.has(e))  await d.ref.delete();
      if (data.coachExpertType === 'Expert' && !newExpertEmails.has(e)) await d.ref.delete();
    }

    // Add new coaches
    for (const email of newCoachEmails) {
      if (curCoachEmails.has(email)) continue;
      const cSnap = await db.collection('coach_db').where('email', '==', email).limit(1).get();
      const cData = cSnap.empty ? {} : cSnap.docs[0].data();
      await ceRequests.add({
        positionId: posId, positionTitle: title, client,
        coachExpertId: cSnap.empty ? email : cSnap.docs[0].id,
        coachExpertEmail: email,
        coachExpertName: cData.name || email.split('@')[0],
        coachExpertPhone: cData.phone || cData.mobile || '',
        coachExpertType: 'Coach', status: 'assigned', assignedBy: 'admin',
        createdAt: now, updatedAt: now,
      });
      newlyAdded.push({ type: 'Coach', email, name: cData.name || email.split('@')[0] });
    }

    // Add new experts
    for (const email of newExpertEmails) {
      if (curExpertEmails.has(email)) continue;
      const eSnap = await db.collection('expert_db').where('email', '==', email).limit(1).get();
      const eData = eSnap.empty ? {} : eSnap.docs[0].data();
      await ceRequests.add({
        positionId: posId, positionTitle: title, client,
        coachExpertId: eSnap.empty ? email : eSnap.docs[0].id,
        coachExpertEmail: email,
        coachExpertName: eData.name || email.split('@')[0],
        coachExpertPhone: eData.phone || eData.mobile || '',
        coachExpertType: 'Expert', status: 'assigned', assignedBy: 'admin',
        createdAt: now, updatedAt: now,
      });
      newlyAdded.push({ type: 'Expert', email, name: eData.name || email.split('@')[0] });
    }

    // ── 4. Send emails ─────────────────────────────────────────────────────────
    const dashUrls = {
      Recruiter:  'https://www.recruiterv.com/',
      Coach:      'https://www.recruiterv.com/',
      Expert:     'https://www.recruiterv.com/',
      ClientSPOC: 'https://www.recruiterv.com/clientspoc',
    };
    await Promise.all(newlyAdded.map(async ({ type, email, name }) => {
      const _r = await renderEmail('positionDirectAssigned', {
        userName: name, userType: type, positionTitle: title,
        clientName: client ? ` (${client})` : '', dashboardUrl: dashUrls[type],
      }, {
        subject: `You've been assigned to: ${title}`,
        htmlContent: templates.positionDirectAssigned(title, type, name, dashUrls[type], client),
      });
      return sendEmailFull({ to: email, subject: _r.subject, htmlContent: _r.htmlContent })
        .catch(err => console.error(`Email to ${email} failed:`, err.message));
    }));

    console.log(`✅ Assignments updated for ${posId}. Newly added: ${newlyAdded.length}`);
    res.json({ success: true, message: 'Assignments updated', emailsSent: newlyAdded.length, newlyAdded });
  } catch (error) {
    console.error('Error in /admin/update-position-assignments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/cleanup-duplicate-recruiters
 * Finds recruiter records sharing the same email+phone, keeps the best one
 * (verified > unverified; newest by otpExpires/createdAt), deletes the rest.
 */
router.post('/cleanup-duplicate-recruiters', async (req, res) => {
  try {
    const recruiterF = require('../model_fire/recruiterF');
    const { db } = require('./firebase_ad');
    const normalisePhone = recruiterF.normalisePhone;

    const snap = await db.collection('recruiter_db').get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Group by "normalisedEmail::normalisedPhone"
    const groups = {};
    for (const rec of all) {
      const emailKey = (rec.email || '').toLowerCase().trim();
      const phoneKey = normalisePhone(rec.mobile || rec.phone || rec.mob || '') || 'NOPHONE';
      const key = `${emailKey}::${phoneKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
    }

    const deleted = [];
    const kept = [];
    const toDeleteIds = [];

    for (const [, group] of Object.entries(groups)) {
      if (group.length <= 1) continue;

      // Keep: verified first, then newest by otpExpires or createdAt
      group.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        const tA = Number(a.otpExpires || 0) || (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const tB = Number(b.otpExpires || 0) || (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return tB - tA;
      });

      const [winner, ...losers] = group;
      kept.push({ id: winner.id, email: winner.email, isVerified: winner.isVerified });

      for (const loser of losers) {
        toDeleteIds.push(loser.id);
        deleted.push({ id: loser.id, email: loser.email, isVerified: loser.isVerified });
      }
    }

    // Batch delete in chunks of 500 (Firestore batch limit)
    const col = db.collection('recruiter_db');
    for (let i = 0; i < toDeleteIds.length; i += 500) {
      const batch = db.batch();
      toDeleteIds.slice(i, i + 500).forEach(id => batch.delete(col.doc(id)));
      await batch.commit();
      console.log(`🗑 Batch deleted ${Math.min(i + 500, toDeleteIds.length)} / ${toDeleteIds.length}`);
    }

    console.log(`✅ Cleanup done. Deleted: ${deleted.length}`);
    return res.json({
      success: true,
      message: `Cleanup complete. Deleted ${deleted.length} duplicate record(s).`,
      deleted,
      kept
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER ACCOUNT STATUS  (approve / waitlist / reject)
// approve  → set accountStatus:'approved'  + send email
// waitlist → set accountStatus:'waitlist'
// reject   → delete document entirely
// ─────────────────────────────────────────────────────────────────────────────
// List recruiters/coaches/experts for the SuperAdmin "Employees" page, with their
// current employee flag + designation.
router.get('/employees-list', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const sources = [
      { col: 'recruiter_db', role: 'Recruiter' },
      { col: 'coach_db', role: 'Coach' },
      { col: 'expert_db', role: 'Expert' },
    ];
    const users = [];
    for (const s of sources) {
      const snap = await db.collection(s.col).get();
      snap.forEach(d => {
        const u = d.data();
        users.push({
          id: d.id,
          userType: s.role.toLowerCase(),
          role: s.role,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || u.mobile || '',
          isEmployee: !!u.isEmployee,
          designation: u.designation || '',
        });
      });
    }
    // ClientSPOCs (from admin_db) — so they can also be designated (e.g. Manager).
    const admSnap = await db.collection('admin_db').get();
    admSnap.forEach(d => {
      const u = d.data();
      if ((u.roleCategory || u.role || '').toLowerCase() !== 'clientspoc') return;
      users.push({
        id: d.id, userType: 'clientspoc', role: 'ClientSPOC',
        name: u.name || '', email: u.email || '', phone: u.mobile || u.phone || '',
        isEmployee: !!u.isEmployee, designation: u.designation || '',
      });
    });
    users.sort((a, b) => (b.isEmployee ? 1 : 0) - (a.isEmployee ? 1 : 0) || (a.name || '').localeCompare(b.name || ''));
    return res.json({ success: true, users });
  } catch (err) {
    console.error('employees-list error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Mark/unmark a recruiter/coach/expert as an employee with a designation.
router.patch('/employee-designation', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { userId, userType, isEmployee, designation } = req.body;
    const collectionMap = { recruiter: 'recruiter_db', coach: 'coach_db', expert: 'expert_db', clientspoc: 'admin_db' };
    const collection = collectionMap[(userType || '').toLowerCase()];
    if (!collection || !userId) return res.status(400).json({ success: false, message: 'Invalid userType or userId' });

    const docRef = db.collection(collection).doc(userId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const emp = !!isEmployee;
    const desig = emp ? (designation || '') : '';
    await docRef.update({ isEmployee: emp, designation: desig, employeeUpdatedAt: new Date() });
    return res.json({ success: true, message: 'Updated', isEmployee: emp, designation: desig });
  } catch (err) {
    console.error('employee-designation error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/user-account-status', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { sendEmailFull, templates, renderEmail } = require('../utils/email');
    const { userId, userType, action } = req.body;

    const collectionMap = { recruiter: 'recruiter_db', coach: 'coach_db', expert: 'expert_db' };
    const collection = collectionMap[userType];
    if (!collection) return res.status(400).json({ success: false, message: 'Invalid userType' });
    // 'block' revokes dashboard access at any time; 'unblock'/'approve' restore it.
    if (!['approve', 'waitlist', 'reject', 'block', 'unblock'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });

    const docRef = db.collection(collection).doc(userId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const userData = snap.data();

    if (action === 'reject') {
      const typeLabel = userType.charAt(0).toUpperCase() + userType.slice(1);
      if (userData.email) {
        try {
          const _r = await renderEmail('accountRejected',
            { name: userData.name || 'there', userType: typeLabel },
            { subject: `Your ${typeLabel} Application on RecruiterV — Update`, htmlContent: templates.accountRejected(userData.name || 'there', typeLabel) });
          await sendEmailFull({ to: userData.email, subject: _r.subject, htmlContent: _r.htmlContent });
        } catch (emailErr) { console.error('Rejection email failed:', emailErr.message); }

        try {
          const { notify } = require('../utils/internalMessage');
          await notify('accountRejected', {
            fromEmail: req.managerEmail || 'support@recruiterv.com',
            toEmail: userData.email,
            vars: {
              name: userData.name || 'there', firstName: (userData.name || '').split(' ')[0],
              email: userData.email, role: userType, reason: req.body?.reason || '',
            },
            recipientRole: String(userType).toLowerCase(),
          });
        } catch (_) { /* never block the rejection */ }
      }
      await docRef.delete();
      return res.json({ success: true, message: 'User rejected and removed' });
    }

    const statusMap = { approve: 'approved', unblock: 'approved', block: 'blocked', waitlist: 'waitlist' };
    const newStatus = statusMap[action];
    await docRef.update({
      accountStatus: newStatus,
      accountStatusUpdatedAt: new Date(),
      ...(action === 'block'
        ? { accessBlockedAt: new Date(), accessBlockedBy: req.user?.email || 'admin' }
        : { accessBlockedAt: null, accessBlockedBy: null }),
    });

    // Send approval email
    if (action === 'approve' && userData.email) {
      const loginUrlMap = { recruiter: 'https://www.recruiterv.com/log_rec', coach: 'https://www.recruiterv.com/log_rec', expert: 'https://www.recruiterv.com/log_rec' };
      const typeLabel = userType.charAt(0).toUpperCase() + userType.slice(1);
      try {
        const _r = await renderEmail('accountApproved',
          { name: userData.name || 'there', userType: typeLabel, loginUrl: loginUrlMap[userType] || 'https://www.recruiterv.com/log_rec' },
          { subject: `🎉 Your ${typeLabel} Account is Approved — RecruiterV`, htmlContent: templates.accountApproved(userData.name || 'there', typeLabel, loginUrlMap[userType]) });
        await sendEmailFull({ to: userData.email, subject: _r.subject, htmlContent: _r.htmlContent });
      } catch (emailErr) { console.error('Approval email failed:', emailErr.message); }

      // Internal message, if a live template covers this event.
      try {
        const { notify } = require('../utils/internalMessage');
        await notify('accountApproved', {
          fromEmail: req.managerEmail || 'support@recruiterv.com',
          toEmail: userData.email,
          vars: {
            name: userData.name || 'there', firstName: (userData.name || '').split(' ')[0],
            email: userData.email, role: userType,
          },
          recipientRole: String(userType).toLowerCase(),
        });
      } catch (_) { /* never block the approval */ }
    }

    return res.json({ success: true, message: `Account ${newStatus}`, accountStatus: newStatus });
  } catch (err) {
    console.error('user-account-status error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/bulk-approve-existing-users
// One-time migration: stamps accountStatus='approved' on every doc that has no accountStatus yet
router.post('/bulk-approve-existing-users', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const collections = ['recruiter_db', 'coach_db', 'expert_db'];
    let total = 0;
    for (const col of collections) {
      const snap = await db.collection(col).get();
      const batch = db.batch();
      snap.docs.forEach(doc => {
        if (!doc.data().accountStatus) {
          batch.update(doc.ref, { accountStatus: 'approved' });
          total++;
        }
      });
      if (total > 0) await batch.commit();
    }
    return res.json({ success: true, message: `Approved ${total} existing users` });
  } catch (err) {
    console.error('bulk-approve error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/reassign-user
// Copy user doc from one type collection to another, then delete from source
router.post('/reassign-user', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { sendEmailFull } = require('../utils/email');
    const { userId, fromType, toType } = req.body;

    const collectionMap = { recruiter: 'recruiter_db', coach: 'coach_db', expert: 'expert_db' };
    const fromCol = collectionMap[fromType];
    const toCol = collectionMap[toType];

    if (!fromCol || !toCol) return res.status(400).json({ success: false, message: 'Invalid userType' });
    if (fromType === toType) return res.status(400).json({ success: false, message: 'Source and target type are the same' });

    const sourceRef = db.collection(fromCol).doc(userId);
    const snap = await sourceRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const userData = snap.data();
    const toLabel = toType.charAt(0).toUpperCase() + toType.slice(1);
    const fromLabel = fromType.charAt(0).toUpperCase() + fromType.slice(1);

    // Copy to target collection (same doc ID), update role fields
    const destRef = db.collection(toCol).doc(userId);
    await destRef.set({
      ...userData,
      roleCategory: toLabel,
      role: toType,
      accountStatus: 'approved',
      reassignedFrom: fromType,
      reassignedAt: new Date(),
    });

    // Delete from source
    await sourceRef.delete();

    // Send email notification
    if (userData.email) {
      const loginUrl = 'https://www.recruiterv.com/log_rec';
      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#f97316 100%);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">&#x1F504;</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Account Role Updated</h1>
          <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your RecruiterV account has been reassigned.</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="font-size:15px;color:#374151;">Hi <strong>${userData.name || 'there'}</strong>,</p>
          <p style="font-size:15px;color:#374151;line-height:1.6;">
            Your account on RecruiterV has been <strong>reassigned</strong> from <strong>${fromLabel}</strong> to <strong>${toLabel}</strong> by an administrator. Your account is now <strong>approved</strong> and ready to use.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">&#x2705; You can now log in as a ${toLabel}</p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">Login to Dashboard</a>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin-top:32px;text-align:center;">If you have questions, contact support at support@recruiterv.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
      try {
        await sendEmailFull({
          to: userData.email,
          subject: `Your RecruiterV Account Has Been Reassigned to ${toLabel}`,
          htmlContent,
        });
      } catch (emailErr) { console.error('Reassign email failed:', emailErr.message); }
    }

    return res.json({ success: true, message: `User reassigned from ${fromLabel} to ${toLabel}` });
  } catch (err) {
    console.error('reassign-user error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/make-referrer
// Move a pending user to referer_db, send beautiful apology + earn email
router.post('/make-referrer', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { sendEmailFull } = require('../utils/email');
    const { userId, fromType } = req.body;

    const collectionMap = { recruiter: 'recruiter_db', coach: 'coach_db', expert: 'expert_db' };
    const fromCol = collectionMap[fromType];
    if (!fromCol) return res.status(400).json({ success: false, message: 'Invalid userType' });

    const sourceRef = db.collection(fromCol).doc(userId);
    const snap = await sourceRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const userData = snap.data();

    // Copy to referer_db
    const refererRef = db.collection('referer_db').doc(userId);
    await refererRef.set({
      ...userData,
      roleCategory: 'Referrer',
      role: 'referrer',
      accountStatus: 'approved',
      previousRole: fromType,
      convertedAt: new Date(),
    });

    // Delete from source collection
    await sourceRef.delete();

    // Send beautiful email
    if (userData.email) {
      const loginUrl = 'https://www.recruiterv.com/log_rec';
      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,0.12);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 55%,#f97316 100%);padding:48px 40px;text-align:center;">
          <div style="width:80px;height:80px;background:rgba(255,255,255,0.18);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:18px;">
            <span style="font-size:38px;">🌟</span>
          </div>
          <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">A New Opportunity Awaits</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.5;">Your RecruiterV journey continues — differently.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:44px 44px 32px;">
          <p style="font-size:16px;color:#374151;margin:0 0 20px;">Hi <strong style="color:#1e293b;">${userData.name || 'there'}</strong>,</p>

          <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
            Thank you for registering on <strong style="color:#2563eb;">RecruiterV</strong> as a <strong>${fromType.charAt(0).toUpperCase() + fromType.slice(1)}</strong>. We truly value your enthusiasm and the time you invested in this process.
          </p>

          <!-- Apology box -->
          <div style="background:#fef2f2;border-left:4px solid #f97316;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
            <p style="margin:0;font-size:14px;color:#7c2d12;line-height:1.7;">
              😔 <strong>We're sorry</strong> — at this time, we were unable to find a suitable placement for the <strong>${fromType}</strong> role you applied for. Our team carefully reviewed your profile, and while we believe in your potential, current platform capacity constraints mean we cannot onboard you in this capacity right now.
            </p>
          </div>

          <!-- Earn with us -->
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:16px;padding:28px;margin:0 0 28px;">
            <h2 style="margin:0 0 14px;font-size:20px;font-weight:800;color:#166534;">💚 But You Can Still Earn with Us!</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">
              We are thrilled to invite you to join RecruiterV as a <strong style="color:#16a34a;">Referrer</strong>. This is your gateway to earning commissions by connecting talented candidates with opportunities on our platform.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:20px;">🎯</span></td>
                <td style="padding:8px 0;padding-left:10px;font-size:14px;color:#374151;line-height:1.6;"><strong>Submit candidate profiles</strong> from your network directly through your dashboard</td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:20px;">💰</span></td>
                <td style="padding:8px 0;padding-left:10px;font-size:14px;color:#374151;line-height:1.6;"><strong>Earn commissions</strong> every time a recruiter places a candidate you referred</td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:20px;">📊</span></td>
                <td style="padding:8px 0;padding-left:10px;font-size:14px;color:#374151;line-height:1.6;"><strong>Track all submissions</strong> and their status in real-time on your personal dashboard</td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:20px;">🔓</span></td>
                <td style="padding:8px 0;padding-left:10px;font-size:14px;color:#374151;line-height:1.6;"><strong>No approvals needed</strong> — your account is active and ready to use right now</td>
              </tr>
            </table>
          </div>

          <!-- How it works -->
          <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;">How It Works — 3 Simple Steps</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${[
              ['1', '#2563eb', 'Login to Your Dashboard', 'Use your existing email and password to log in at recruiterv.com'],
              ['2', '#f97316', 'Add a Candidate', 'Fill in the candidate\'s details and upload their CV through "Add Candidate"'],
              ['3', '#16a34a', 'Track & Earn', 'Monitor your submissions in real-time and earn when they get placed'],
            ].map(([num, color, title, desc]) => `
            <tr>
              <td style="width:40px;vertical-align:top;padding:0 14px 16px 0;">
                <div style="width:36px;height:36px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;">
                  <span style="color:#fff;font-weight:900;font-size:15px;">${num}</span>
                </div>
              </td>
              <td style="padding-bottom:16px;border-bottom:1px solid #f1f5f9;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1e293b;">${title}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
              </td>
            </tr>`).join('')}
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin:0 0 32px;">
            <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;padding:16px 44px;border-radius:14px;font-weight:800;font-size:16px;letter-spacing:0.3px;box-shadow:0 6px 20px rgba(249,115,22,0.4);">
              🚀 Start Earning Now — Login
            </a>
          </div>

          <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              Your login credentials remain the same. Simply visit <a href="${loginUrl}" style="color:#2563eb;font-weight:600;">recruiterv.com/log_rec</a> and you'll be directed to your Referrer Dashboard automatically.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 44px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Questions? We're here to help.</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            <a href="mailto:support@recruiterv.in" style="color:#2563eb;text-decoration:none;">support@recruiterv.in</a>
            &nbsp;·&nbsp;
            <a href="https://www.recruiterv.com" style="color:#2563eb;text-decoration:none;">www.recruiterv.com</a>
          </p>
          <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">© 2025 RecruiterV. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
      try {
        await sendEmailFull({
          to: userData.email,
          subject: `Your RecruiterV Path — A New Earning Opportunity Awaits You 🌟`,
          htmlContent,
        });
      } catch (emailErr) { console.error('make-referrer email failed:', emailErr.message); }
    }

    return res.json({ success: true, message: 'User moved to Referrer successfully' });
  } catch (err) {
    console.error('make-referrer error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/vendors — list all Vendor users with their quota usage
router.get('/vendors', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('admin_db').where('roleCategory', '==', 'Vendor').get();

    // Position assignments are keyed on the recruiter's email, so a vendor is
    // "working a RecruiterV position" when the vendor or one of their recruiters
    // holds a position that vendor did not post themselves.
    const positionAccess = require('../model_fire/positionAccessF');
    const vendors = await Promise.all(snap.docs.map(async doc => {
      const d = doc.data();
      const email = (d.email || '').toLowerCase();
      const [recSnap, ownSnap] = await Promise.all([
        db.collection('recruiter_db').where('vendorEmail', '==', email).get(),
        db.collection('admin_AddPos').where('postedByVendor', '==', email).get(),
      ]);
      const ownPosIds = new Set(ownSnap.docs.map(p => String(p.data().pos_id)));

      const teamEmails = [...new Set([email, ...recSnap.docs.map(r => (r.data().email || '').toLowerCase())])].filter(Boolean);
      const platformPosIds = new Set();
      await Promise.all(teamEmails.map(async (e) => {
        try {
          const asn = await positionAccess.getRecruiterAssignments(e) || [];
          asn.forEach(a => {
            const pid = String(a.positionId || '');
            if (pid && !ownPosIds.has(pid)) platformPosIds.add(pid);
          });
        } catch (_) { /* skip this member */ }
      }));

      return {
        id: doc.id,
        name: d.name,
        email: d.email,
        recruiterQuantity: d.recruiterQuantity || 0,
        recruitersUsed: recSnap.size,
        createdAt: d.createdAt || null,
        upgradedFromCoach: d.upgradedFromCoach === true,
        clientspocs: Array.isArray(d.clientspocs) ? d.clientspocs : [],
        positionsAdded: ownSnap.size,
        platformPositionsWorking: platformPosIds.size,
        allowPlatformPositions: d.allowPlatformPositions !== false,   // default: allowed
      };
    }));
    return res.json({ success: true, data: vendors });
  } catch (err) {
    console.error('vendors list error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/vendor-platform-access { vendorId, allow }
// Controls whether a vendor's team may work positions posted on RecruiterV by
// anyone else. Off means they only ever see the positions their vendor added.
router.patch('/vendor-platform-access', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { vendorId, allow } = req.body || {};
    if (!vendorId) return res.status(400).json({ success: false, message: 'vendorId is required' });
    await db.collection('admin_db').doc(vendorId)
      .set({ allowPlatformPositions: allow === true, allowPlatformPositionsUpdatedAt: new Date() }, { merge: true });
    return res.json({ success: true, allowPlatformPositions: allow === true });
  } catch (err) {
    console.error('vendor-platform-access error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/recruiters/unassociated — recruiters without a vendor
router.get('/recruiters/unassociated', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    // Fetch all recruiters and filter client-side (Firestore can't query for missing field)
    const snap = await db.collection('recruiter_db').get();
    const list = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => !r.vendorEmail)
      .map(r => ({ id: r.id, name: r.name || '', email: r.email || '', mobile: r.mobile || r.phone || '', planType: r.planType }));
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('unassociated-recruiters error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/associate-recruiters — link existing recruiters to a vendor
router.post('/associate-recruiters', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { vendorId, recruiterIds } = req.body;
    if (!vendorId || !Array.isArray(recruiterIds) || !recruiterIds.length) {
      return res.status(400).json({ success: false, message: 'vendorId and recruiterIds[] are required' });
    }
    const vendorDoc = await db.collection('admin_db').doc(vendorId).get();
    if (!vendorDoc.exists) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const vd = vendorDoc.data();
    if (vd.roleCategory !== 'Vendor') return res.status(400).json({ success: false, message: 'Not a vendor' });

    const batch = db.batch();
    for (const rid of recruiterIds) {
      const ref = db.collection('recruiter_db').doc(rid);
      batch.update(ref, {
        vendorEmail: (vd.email || '').toLowerCase(),
        vendorId: vendorId,
        vendorName: vd.name || '',
        planType: 1,
        updatedAt: new Date(),
      });
    }
    await batch.commit();

    // Auto-increase vendor quota if needed
    const afterSnap = await db.collection('recruiter_db').where('vendorEmail', '==', (vd.email || '').toLowerCase()).get();
    const newUsed = afterSnap.size;
    const currentQty = vd.recruiterQuantity || 0;
    if (newUsed > currentQty) {
      await db.collection('admin_db').doc(vendorId).update({ recruiterQuantity: newUsed });
    }

    return res.json({ success: true, message: `${recruiterIds.length} recruiter(s) associated with ${vd.name}`, recruitersUsed: newUsed });
  } catch (err) {
    console.error('associate-recruiters error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/vendors/:vendorId/details — per-recruiter stats for a vendor
router.get('/vendors/:vendorId/details', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { vendorId } = req.params;

    // Get vendor record
    const vendorDoc = await db.collection('admin_db').doc(vendorId).get();
    if (!vendorDoc.exists) return res.status(404).json({ success: false, message: 'Vendor not found' });
    const vendorData = vendorDoc.data();
    if (vendorData.roleCategory !== 'Vendor') return res.status(400).json({ success: false, message: 'Not a vendor' });

    const vendorEmail = (vendorData.email || '').toLowerCase();

    // Get all recruiters for this vendor
    const recSnap = await db.collection('recruiter_db').where('vendorEmail', '==', vendorEmail).get();
    const recruiterEmails = recSnap.docs.map(d => d.data().email).filter(Boolean);
    const recruiterMap = {};
    recSnap.docs.forEach(doc => {
      const d = doc.data();
      recruiterMap[(d.email || '').toLowerCase()] = {
        id: doc.id,
        name: d.name || '',
        email: d.email || '',
        mobile: d.mobile || d.phone || '',
        lastActive: d.lastActive || null,
        createdAt: d.createdAt || null,
      };
    });

    if (!recruiterEmails.length) {
      return res.json({ success: true, vendor: { id: vendorId, name: vendorData.name, email: vendorData.email, recruiterQuantity: vendorData.recruiterQuantity || 0 }, recruiters: [] });
    }

    // Fetch all candidates submitted by these recruiters (batched)
    let allCandidates = [];
    for (let i = 0; i < recruiterEmails.length; i += 30) {
      const batch = recruiterEmails.slice(i, i + 30);
      const snap = await db.collection('candidate_db').where('recEmail', 'in', batch).get();
      allCandidates = allCandidates.concat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // Build per-recruiter stats
    const recruiterStats = Object.values(recruiterMap).map(rec => {
      const recCandidates = allCandidates.filter(c => (c.recEmail || '').toLowerCase() === rec.email.toLowerCase());
      const uniquePositions = new Set(recCandidates.map(c => c.pos_id).filter(Boolean));

      // Last active: max of recruiter.lastActive vs last candidate datePosted
      let lastActiveMs = rec.lastActive ? (rec.lastActive._seconds ? rec.lastActive._seconds * 1000 : new Date(rec.lastActive).getTime()) : 0;
      recCandidates.forEach(c => {
        const ms = c.datePosted?._seconds ? c.datePosted._seconds * 1000 : 0;
        if (ms > lastActiveMs) lastActiveMs = ms;
      });

      return {
        id: rec.id,
        name: rec.name,
        email: rec.email,
        mobile: rec.mobile,
        createdAt: rec.createdAt,
        lastActive: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
        totalCandidates: recCandidates.length,
        totalPositions: uniquePositions.size,
        positions: Array.from(uniquePositions).map(posId => {
          const posCands = recCandidates.filter(c => c.pos_id === posId);
          const first = posCands[0];
          return {
            pos_id: posId,
            pos_name: first?.pos_name || 'N/A',
            client: first?.client || 'N/A',
            candidateCount: posCands.length,
          };
        }),
      };
    });

    return res.json({
      success: true,
      vendor: { id: vendorId, name: vendorData.name, email: vendorData.email, recruiterQuantity: vendorData.recruiterQuantity || 0, recruitersUsed: recruiterEmails.length },
      recruiters: recruiterStats,
    });
  } catch (err) {
    console.error('vendor details error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /admin/vendor-quota — update a vendor's recruiter quantity
router.patch('/vendor-quota', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { vendorId, recruiterQuantity } = req.body;
    const qty = parseInt(recruiterQuantity, 10);
    if (!vendorId || !qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'vendorId and recruiterQuantity (min 1) are required' });
    }
    const docRef = db.collection('admin_db').doc(vendorId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Vendor not found' });
    await docRef.update({ recruiterQuantity: qty, quotaUpdatedAt: new Date() });
    return res.json({ success: true, message: `Quota updated to ${qty}`, recruiterQuantity: qty });
  } catch (err) {
    console.error('vendor-quota error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT
// Collection: skill_categories
// Schema: { parent, children: [{ name, subChildren: [] }], createdAt, createdBy }
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/categories — list all
router.get('/categories', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('skill_categories').orderBy('createdAt', 'desc').get();
    const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, categories: cats });
  } catch (err) {
    console.error('categories fetch error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REPORT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

const REJECT_S = new Set([
  'Screen Reject','L1 Reject','L2 Reject','L3 Reject','HR Reject',
  'Background Verification Reject','Negotiation Reject','Offer Declined',
  'Test Reject','Client Drop','Candidate Drop','Duplicate',
]);

// Shared profile-completion calculator (mirrors profile.js logic)
const calcProfileCompletion = (data) => {
  const phone   = data.phone || data.mobile || '';
  const company = data.company || data.currentCompany || '';
  const title   = data.designation || data.currentTitle || '';
  const fields  = [
    { v: data.name }, { v: data.email }, { v: phone },
    { v: data.yearsOfExperience }, { v: data.location }, { v: data.country },
    { v: data.bio }, { v: company }, { v: title },
    { v: data.linkedin }, { v: data.twitter }, { v: data.website },
    { v: data.skills,          arr: true },
    { v: data.workExperience,  arr: true },
    { v: data.profilePhoto },
  ];
  const weights = [5,5,5,5,3,3,10,5,5,2,1,1,15,20,10];
  let total = 0, filled = 0;
  fields.forEach(({ v, arr }, i) => {
    total += weights[i];
    const ok = arr ? (Array.isArray(v) && v.length > 0) : (v && v.toString().trim() !== '');
    if (ok) filled += weights[i];
  });
  return total > 0 ? Math.round((filled / total) * 100) : 0;
};

// GET /admin/reports/recruiters
// Reports aggregate over candidate_db, which now holds 21.5k+ documents. Reading
// whole documents pulled ~162MB and took ~35s per report — every report tab was
// failing. These are the only candidate fields the reports touch; projecting them
// brings the same read down to ~8MB and ~4s.
const CANDIDATE_REPORT_FIELDS = [
  'candidate', 'emails', 'mob', 'pos_id', 'pos_name', 'client', 'clientspoc',
  'clientspoc_name', 'recEmail', 'recruiterEmail', 'recName', 'recRole', 'recPhone',
  'statusa', 'status', 'source', 'matchPercent', 'rejectReason',
  'coachEmail', 'expertEmail', 'submittedBy',
  'datePosted', 'createdAt', 'updatedAt', 'statusaDate',
  'autoScreenRejected', 'autoRejectedFrom', 'autoRejectedAt',
  // Bulk-upload attribution on the ClientSPOC report — present on most rows, so
  // dropping it made those counts read as zero.
  'addedBy',
];
// `db` is required inside each handler in this file, not at module scope, so it
// has to be resolved here rather than closed over — otherwise this throws
// "db is not defined" the moment any report runs.
const candidatesForReports = () => {
  const { db } = require('./firebase_ad');
  return db.collection('candidate_db').select(...CANDIDATE_REPORT_FIELDS).get();
};

router.get('/reports/recruiters', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [recSnap, posAccSnap, candSnap, posSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('position_access_requests').where('status', '==', 'approved').get(),
      candidatesForReports(),
      db.collection('admin_AddPos').get(),
    ]);

    // Position status map: posId → { status, position, client }
    const posStatusMap = {};
    posSnap.docs.forEach(d => {
      const data = d.data();
      posStatusMap[data.pos_id || ''] = {
        status: data.status || 'Active',
        title:  data.position || '',
        client: data.client || '',
      };
    });

    // Build position access map: email → [{ positionId, positionTitle, client, requestedAt }]
    const posMap = {};
    posAccSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.recruiterEmail || '').toLowerCase();
      if (!email) return;
      if (!posMap[email]) posMap[email] = [];
      posMap[email].push({
        positionId:    data.positionId || '',
        positionTitle: data.positionTitle || '',
        client:        data.client || '',
        requestedAt:   data.requestedAt || null,
      });
    });

    // Build candidate map: (email+posId) → [{ candidateName, status, datePosted, updatedAt }]
    const candMap = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const key = `${(data.recEmail || '').toLowerCase()}::${data.pos_id || ''}`;
      if (!candMap[key]) candMap[key] = [];
      candMap[key].push({
        candidateName: data.candidate || data.name || '',
        email:         data.emails || data.email || '',
        status:        data.statusa || '',
        datePosted:    data.datePosted || null,
        updatedAt:     data.updatedAt || null,
      });
    });

    const rows = recSnap.docs.map(d => {
      const data = d.data();
      const email = (data.email || '').toLowerCase();
      const sc = data.skillCategory;
      const skillCategory = Array.isArray(sc) ? sc.join(', ') : (sc || '');
      const positions = (posMap[email] || []).map(p => {
        const key = `${email}::${p.positionId}`;
        const cands = candMap[key] || [];
        const posInfo = posStatusMap[p.positionId] || {};
        return {
          ...p,
          positionStatus: posInfo.status || 'Active',
          totalCandidates:  cands.length,
          activeCandidates: cands.filter(c => !REJECT_S.has(c.status)).length,
          lastSubmission: cands.reduce((latest, c) => {
            if (!c.datePosted) return latest;
            const ts = c.datePosted._seconds || 0;
            return ts > latest ? ts : latest;
          }, 0),
          candidates: cands,
        };
      });
      return { id: d.id, name: data.name || '', email, skillCategory, positions,
        profileCompletion: calcProfileCompletion(data),
        agreementSigned: data.agreementSigned || false,
      };
    }).filter(r => r.email);

    // Attach session/activity stats (hours today/week/month, active slots, active-now)
    try {
      const { fetchActivityMap } = require('./activity');
      const actMap = await fetchActivityMap(db, rows.map(r => r.email));
      rows.forEach(r => { r.session = actMap[r.email] || { activeNow:false, hoursToday:0, hoursWeek:0, hoursMonth:0, slots:[], lastPing:null }; });
    } catch (actErr) {
      console.error('recruiter report activity merge error:', actErr.message);
      rows.forEach(r => { r.session = { activeNow:false, hoursToday:0, hoursWeek:0, hoursMonth:0, slots:[], lastPing:null }; });
    }

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/recruiters error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Status category sets for the per-recruiter analytics dashboard ────────────
const AD_lc = (s) => (s || '').toString().toLowerCase().trim();
const AD_REJECT = new Set(['screen reject','l1 reject','l2 reject','l3 reject','hr reject',
  'background verification reject','negotiation reject','offer declined','test reject',
  'client drop','candidate drop','duplicate']);
const AD_PENDING = new Set(['','applied','submitted','cv feedback pending']);
// Reached interview = any L1/L2/L3/HR/negotiation/test/BV/offer/joining stage
const AD_INTERVIEW = new Set(['l1 to be schedule','l1 scheduled','l1 feedback pending','l1 reject',
  'l2 to be schedule','l2 scheduled','l2 feedback pending','l2 reject',
  'l3 to be schedule','l3 scheduled','l3 feedback pending','l3 reject',
  'hr to be schedule','hr scheduled','hr feedback pending','hr reject',
  'background verification pending','background verification reject',
  'negotiation scheduled','negotiation reject','test assigned','test select','test reject',
  'to be offered','offer declined','offer accepted','joining']);
const AD_OFFER  = new Set(['to be offered','offer declined','offer accepted','joining']);
const AD_JOINED = new Set(['offer accepted','joining']);
// "Accepted CV" = cleared screening (reached interview or beyond)
const AD_ACCEPTED = AD_INTERVIEW;

const AD_toMs = (t) => (t && t._seconds) ? t._seconds * 1000 : (t ? new Date(t).getTime() : 0);
const AD_IST = 5.5 * 60 * 60 * 1000;
const AD_dateShort = (ms) => ms ? new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
const AD_dateLong  = (ms) => ms ? new Date(ms).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// GET /admin/reports/recruiter-detail/:id — full analytics for one recruiter
router.get('/reports/recruiter-detail/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { id } = req.params;

    const recDoc = await db.collection('recruiter_db').doc(id).get();
    if (!recDoc.exists) return res.status(404).json({ success: false, message: 'Recruiter not found' });
    const rec = recDoc.data();
    const email = AD_lc(rec.email);

    const [posAccSnap, candSnap, posSnap] = await Promise.all([
      // single-field query (no composite index needed); filter approved in JS
      db.collection('position_access_requests').where('recruiterEmail', '==', rec.email).get().catch(() => ({ docs: [] })),
      db.collection('candidate_db').where('recEmail', '==', rec.email).get().catch(() => ({ docs: [] })),
      db.collection('admin_AddPos').get(),
    ]);

    // Position status map
    const posStatusMap = {};
    posSnap.docs.forEach(d => { const x = d.data(); posStatusMap[x.pos_id || ''] = { status: x.status || 'Active', title: x.position || '', client: x.client || '' }; });

    // Assigned positions (approved access requests) — dedupe by positionId
    const posById = {};
    posAccSnap.docs.forEach(d => {
      const x = d.data();
      if (AD_lc(x.status) !== 'approved') return;
      const pid = x.positionId || '';
      if (!pid || posById[pid]) return;
      posById[pid] = { positionId: pid, title: x.positionTitle || posStatusMap[pid]?.title || pid, client: x.client || posStatusMap[pid]?.client || '', assignedMs: AD_toMs(x.requestedAt) };
    });
    const assignedPositions = Object.values(posById);

    // Candidates
    const cands = candSnap.docs.map(d => { const x = d.data(); return {
      status: AD_lc(x.statusa), rawStatus: x.statusa || '', posId: x.pos_id || '',
      submittedMs: AD_toMs(x.datePosted), updatedMs: AD_toMs(x.updatedAt) || AD_toMs(x.statusaDate),
      rejectReason: x.rejectReason || '', source: x.source || '',
    }; });

    const now = Date.now();
    const submitted = cands.length;
    const count = (setOrFn) => cands.filter(c => typeof setOrFn === 'function' ? setOrFn(c) : setOrFn.has(c.status)).length;
    const accepted    = count(AD_ACCEPTED);
    const interviewed = count(AD_INTERVIEW);
    const offers      = count(AD_OFFER);
    const joined      = count(AD_JOINED);
    const rejected    = count(AD_REJECT);
    const pct  = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
    const rate = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

    const acceptanceRate = rate(accepted, submitted);
    const interviewRate  = rate(interviewed, accepted);
    const selectionRate  = rate(offers, interviewed);
    const joiningRate    = rate(joined, offers);
    const offerRate      = rate(offers, submitted);

    // Time windows (rolling)
    const WEEK = 7 * 86400000, MONTH = 30 * 86400000;
    const cvsThisWeek  = cands.filter(c => c.submittedMs && (now - c.submittedMs) <= WEEK).length;
    const cvsThisMonth = cands.filter(c => c.submittedMs && (now - c.submittedMs) <= MONTH).length;
    const directApplicants = cands.filter(c => c.source === 'direct_apply').length;

    // Weekly CV submissions (last 7 weeks, W1 oldest → W7 current)
    const weekly = Array.from({ length: 7 }, (_, i) => ({ label: `W${i + 1}`, value: 0 }));
    cands.forEach(c => { if (!c.submittedMs) return; const wa = Math.floor((now - c.submittedMs) / WEEK); if (wa >= 0 && wa < 7) weekly[6 - wa].value++; });

    // Positions metrics
    const assignedCount = assignedPositions.length;
    const isClosed = (st) => { const s = AD_lc(st); return s.includes('closed') || s.includes('filled'); };
    const activePositions = assignedPositions.filter(p => !isClosed(posStatusMap[p.positionId]?.status)).length;
    const closedPositions = assignedCount - activePositions;

    const candsByPos = {};
    cands.forEach(c => { (candsByPos[c.posId] = candsByPos[c.posId] || []).push(c); });
    const firstCvMs = (pid) => { const cs = candsByPos[pid] || []; const ms = cs.map(c => c.submittedMs).filter(Boolean); return ms.length ? Math.min(...ms) : 0; };
    const firstInterviewMs = (pid) => { const cs = (candsByPos[pid] || []).filter(c => AD_INTERVIEW.has(c.status)); const ms = cs.map(c => c.updatedMs).filter(Boolean); return ms.length ? Math.min(...ms) : 0; };

    const daysBetween = (a, b) => (a && b && b >= a) ? Math.round((b - a) / 86400000) : null;
    const firstCvDays = [], firstIntDays = [];
    assignedPositions.forEach(p => {
      const fcv = firstCvMs(p.positionId);
      const d1 = daysBetween(p.assignedMs, fcv); if (d1 !== null) firstCvDays.push(d1);
      const fin = firstInterviewMs(p.positionId);
      const d2 = daysBetween(fcv, fin); if (d2 !== null) firstIntDays.push(d2);
    });
    const avg = (a) => a.length ? Math.round((a.reduce((s, v) => s + v, 0) / a.length) * 10) / 10 : null;
    const positionsFilled = assignedPositions.filter(p => isClosed(posStatusMap[p.positionId]?.status)).length;

    // Recent positions (latest assigned first, up to 8)
    const recentPositions = [...assignedPositions].sort((a, b) => b.assignedMs - a.assignedMs).slice(0, 8).map(p => ({
      position: p.title, client: p.client,
      assigned: AD_dateShort(p.assignedMs), firstCv: AD_dateShort(firstCvMs(p.positionId)),
      firstInterview: AD_dateShort(firstInterviewMs(p.positionId)),
      cvs: (candsByPos[p.positionId] || []).length,
      status: posStatusMap[p.positionId]?.status || 'Active',
    }));

    // Rejection reasons — keyword-categorize the free-text rejectReason
    const reasonBuckets = { 'Skills mismatch': 0, 'Salary mismatch': 0, 'Notice period': 0, 'Location': 0, 'Communication': 0, 'Other': 0 };
    const rejectedCands = cands.filter(c => AD_REJECT.has(c.status));
    rejectedCands.forEach(c => {
      const r = AD_lc(c.rejectReason);
      if (/skill|experience|tech|qualif/.test(r)) reasonBuckets['Skills mismatch']++;
      else if (/salary|ctc|compensation|pay|budget/.test(r)) reasonBuckets['Salary mismatch']++;
      else if (/notice|joining|availab/.test(r)) reasonBuckets['Notice period']++;
      else if (/location|reloc|onsite|city/.test(r)) reasonBuckets['Location']++;
      else if (/communicat|english|spoke|fluen/.test(r)) reasonBuckets['Communication']++;
      else reasonBuckets['Other']++;
    });
    const totalRej = rejectedCands.length || 1;
    const rejectionReasons = Object.keys(reasonBuckets).map(k => ({ label: k, count: reasonBuckets[k], pct: Math.round((reasonBuckets[k] / totalRej) * 100) }))
      .sort((a, b) => b.count - a.count);

    const clientRej    = count((c) => c.status === 'client drop');
    const dupRej       = count((c) => c.status === 'duplicate');
    const recruiterRej = count((c) => ['screen reject','l1 reject','l2 reject','l3 reject','hr reject','test reject','candidate drop','negotiation reject','background verification reject'].includes(c.status));
    const rejectionBreakdown = [
      { label: 'Recruiter Rejection', pct: pct(recruiterRej, submitted) },
      { label: 'Client Rejection',    pct: pct(clientRej, submitted) },
      { label: 'Duplicate Rejection', pct: pct(dupRej, submitted) },
      { label: 'Incomplete Profile',  pct: 0 },
    ];

    // Session activity + raw daily buckets (for the 7-day login history)
    let session = { activeNow: false, hoursToday: 0, hoursWeek: 0, hoursMonth: 0, slots: [], lastPing: null };
    let dailyActivity = {};
    try { const { fetchActivityMap } = require('./activity'); const m = await fetchActivityMap(db, [email]); session = m[email] || session; } catch (_) {}
    try { const ua = await db.collection('user_activity').doc(email).get(); if (ua.exists) dailyActivity = ua.data().daily || {}; } catch (_) {}

    // Login history — last 7 days (oldest → newest), in IST. "Active" = had any
    // tracked activity that day (heartbeat pings from being signed in).
    const loginHistory = [];
    for (let i = 6; i >= 0; i--) {
      const ist = new Date((now - i * 86400000) + AD_IST);
      const key = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
      const mins = Number(dailyActivity[key]?.m) || 0;
      loginHistory.push({
        date: key,
        weekday: ist.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        day: ist.toLocaleDateString('en-US', { day: '2-digit', month: 'short', timeZone: 'UTC' }),
        active: mins > 0,
        hours: Math.round((mins / 60) * 10) / 10,
      });
    }

    // Profile / login stats
    const joinedMs = AD_toMs(rec.registrationDate) || AD_toMs(rec.createdAt) || AD_toMs(rec.joinDate);
    const daysOnPlatform = joinedMs ? Math.max(1, Math.round((now - joinedMs) / 86400000)) : null;
    const lastActiveMs = Math.max(AD_toMs(rec.lastActive), session.lastPing ? new Date(session.lastPing).getTime() : 0);
    const lastCvMs = cands.reduce((mx, c) => Math.max(mx, c.submittedMs), 0);
    const lastPosMs = assignedPositions.reduce((mx, p) => Math.max(mx, p.assignedMs), 0);
    // Login consistency: rough — active within 3 days = high; scale by recency
    const daysSinceLogin = lastActiveMs ? Math.floor((now - lastActiveMs) / 86400000) : 999;
    const loginConsistency = Math.max(0, Math.min(100, 100 - daysSinceLogin * 8));
    const daysLoggedIn = daysOnPlatform ? Math.round(daysOnPlatform * (loginConsistency / 100)) : null;

    // Overall score (weighted, out of 100)
    const categories = [
      { label: 'Login Consistency', value: Math.round(loginConsistency / 10), max: 10 },
      { label: 'Activity',          value: Math.min(15, Math.round(cvsThisMonth / 2)), max: 15 },
      { label: 'Submission Volume', value: Math.min(15, Math.round(submitted / 10)), max: 15 },
      { label: 'CV Acceptance Rate',value: Math.round(acceptanceRate / 100 * 20), max: 20 },
      { label: 'Interview Rate',    value: Math.round(interviewRate / 100 * 15), max: 15 },
      { label: 'Joining Rate',      value: Math.round(joiningRate / 100 * 15), max: 15 },
      { label: 'Collaboration',     value: 0, max: 5 },
      { label: 'Learning (Coaching)', value: 0, max: 5 },
    ];
    const scMax = categories.reduce((s, c) => s + c.max, 0);
    const scVal = categories.reduce((s, c) => s + c.value, 0);
    const overallScore = Math.round((scVal / scMax) * 100);

    const isActive = daysSinceLogin <= 15;
    const health = {
      level: daysSinceLogin <= 2 && cvsThisWeek > 0 && activePositions > 0 ? 'healthy'
        : daysSinceLogin >= 15 || (lastCvMs && (now - lastCvMs) > MONTH) ? 'critical' : 'warning',
      items: [
        { label: 'Login status', value: daysSinceLogin <= 0 ? 'Logged in today' : daysSinceLogin === 1 ? 'Logged in yesterday' : `Last login ${daysSinceLogin}d ago`, ok: daysSinceLogin <= 2 },
        { label: 'CV activity', value: lastCvMs && (now - lastCvMs) <= WEEK ? 'CV submitted this week' : lastCvMs ? `Last CV ${Math.floor((now - lastCvMs)/86400000)}d ago` : 'No CVs yet', ok: lastCvMs && (now - lastCvMs) <= WEEK },
        { label: 'Active positions', value: `${activePositions} active position${activePositions !== 1 ? 's' : ''}`, ok: activePositions > 0 },
      ],
    };

    const detail = {
      profile: {
        name: rec.name || '', email: rec.email, designation: rec.designation || rec.currentTitle || 'Recruiter',
        status: isActive ? 'Active' : 'Dormant',
        dateJoined: AD_dateLong(joinedMs), daysOnPlatform, daysLoggedIn,
        loginPct: Math.round(loginConsistency), lastLogin: daysSinceLogin <= 0 ? 'Today' : AD_dateLong(lastActiveMs),
        lastPositionAssigned: AD_dateLong(lastPosMs), lastCvSubmitted: lastCvMs && (now - lastCvMs) <= 86400000 ? 'Today' : AD_dateLong(lastCvMs),
        avatarInitials: (rec.name || rec.email || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(),
        profileCompletion: calcProfileCompletion(rec),
        skillCategory: Array.isArray(rec.skillCategory) ? rec.skillCategory.join(', ') : (rec.skillCategory || ''),
        agreementSigned: !!rec.agreementSigned,
        loginHistory,
        // ── Full profile (shown in the profile modal) ──
        phone: rec.phone || rec.mobile || '',
        location: rec.location || '',
        country: rec.country || '',
        bio: rec.bio || '',
        company: rec.currentCompany || rec.company || '',
        currentTitle: rec.currentTitle || rec.designation || '',
        yearsOfExperience: rec.yearsOfExperience || '',
        experienceCategory: rec.experienceCategory || '',
        linkedin: rec.linkedin || '',
        twitter: rec.twitter || '',
        website: rec.website || '',
        skills: Array.isArray(rec.skills) ? rec.skills : (rec.skills ? String(rec.skills).split(',').map(s => s.trim()).filter(Boolean) : []),
        workExperience: Array.isArray(rec.workExperience) ? rec.workExperience : [],
        education: Array.isArray(rec.education) ? rec.education : [],
        profilePhoto: rec.profilePhoto || '',
        resume: rec.resume || '',
        resumeFileName: rec.resumeFileName || '',
        planType: rec.planType,
      },
      kpis: { overallScore, status: isActive ? 'Active' : 'Dormant', loginConsistency: Math.round(loginConsistency),
        positionsAssigned: assignedCount, cvsSubmitted: submitted, acceptanceRate, offerRate, joiningRate,
        avgDaysToFirstCV: avg(firstCvDays), directApplicants, totalSubmissions: submitted },
      score: { overall: overallScore, trend: overallScore >= 60 ? 'Improving' : 'Needs attention', categories },
      health,
      activity: {
        stats: { totalPositionsAssigned: assignedCount, activePositions, closedPositions, totalCvsSubmitted: submitted,
          cvsThisWeek, cvsThisMonth, messagesSent: 0, coachingSessionsJoined: 0, shareableLinksCopied: 0,
          directApplicantsReceived: directApplicants, referralsShared: 0, avgCvsPerPosition: assignedCount ? Math.round((submitted / assignedCount) * 10) / 10 : 0 },
        weekly,
      },
      quality: {
        rates: { cvAcceptance: acceptanceRate, interview: interviewRate, selection: selectionRate, joining: joiningRate },
        cards: { acceptedCvs: accepted, submittedTotal: submitted, offerDropRate: rate(count((c)=>c.status==='offer declined'), offers), duplicateSubmissions: pct(dupRej, submitted), avgCvsForInterview: interviewed ? Math.round((accepted / interviewed) * 10) / 10 : 0 },
        funnel: [
          { label: 'CVs Submitted', count: submitted, pct: 100 },
          { label: 'CVs Accepted', count: accepted, pct: pct(accepted, submitted) },
          { label: 'Interviewed', count: interviewed, pct: pct(interviewed, submitted) },
          { label: 'Offers Made', count: offers, pct: pct(offers, submitted) },
          { label: 'Candidates Joined', count: joined, pct: pct(joined, submitted) },
        ],
      },
      positions: { assigned: assignedCount, filled: positionsFilled, fillRate: pct(positionsFilled, assignedCount),
        avgDaysFirstCv: avg(firstCvDays), avgDaysFirstInterview: avg(firstIntDays), avgDaysClosure: null, recent: recentPositions },
      rejections: { reasons: rejectionReasons, breakdown: rejectionBreakdown, totalRejected: rejectedCands.length },
      collaboration: { coachingSessionsJoined: 0, teamMessagesSent: 0, teamMessagesRead: 0, helpRequestsRaised: 0, positionsShared: 0, cvsSharedWithTeam: 0, cvsUsedByOthers: 0 },
      session,
    };

    return res.json({ success: true, detail });
  } catch (err) {
    console.error('reports/recruiter-detail error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/coaches
router.get('/reports/coaches', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [coachSnap, ceSnap, candSnap] = await Promise.all([
      db.collection('coach_db').get(),
      db.collection('coach_expert_requests').where('coachExpertType', '==', 'Coach').get(),
      candidatesForReports(),
    ]);

    // Candidate map: posId → [{ status, datePosted }]
    const candByPos = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = [];
      candByPos[pid].push({ status: data.statusa || '', datePosted: data.datePosted || null });
    });

    // Coach-position map: email → [{ positionId, positionTitle, client, status }]
    const posMap = {};
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.coachExpertEmail || '').toLowerCase();
      if (!email) return;
      if (!posMap[email]) posMap[email] = [];
      posMap[email].push({
        positionId:    data.positionId || '',
        positionTitle: data.positionTitle || '',
        client:        data.client || '',
        status:        data.status || '',
        assignedBy:    data.assignedBy || '',
      });
    });

    const rows = coachSnap.docs.map(d => {
      const data = d.data();
      const email = (data.email || '').toLowerCase();
      const sc = data.skillCategory;
      const skillCategory = Array.isArray(sc) ? sc.join(', ') : (sc || '');
      const positions = (posMap[email] || []).map(p => {
        const cands = candByPos[p.positionId] || [];
        return {
          ...p,
          totalCandidates:  cands.length,
          activeCandidates: cands.filter(c => !REJECT_S.has(c.status)).length,
        };
      });
      return { id: d.id, name: data.name || '', email, skillCategory, positions,
        profileCompletion: calcProfileCompletion(data),
        agreementSigned: data.agreementSigned || false,
      };
    }).filter(r => r.email);

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/coaches error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/experts
router.get('/reports/experts', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [expertSnap, ceSnap, candSnap] = await Promise.all([
      db.collection('expert_db').get(),
      db.collection('coach_expert_requests').where('coachExpertType', '==', 'Expert').get(),
      candidatesForReports(),
    ]);

    const candByPos = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = [];
      candByPos[pid].push({ status: data.statusa || '', datePosted: data.datePosted || null });
    });

    const posMap = {};
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.coachExpertEmail || '').toLowerCase();
      if (!email) return;
      if (!posMap[email]) posMap[email] = [];
      posMap[email].push({
        positionId: data.positionId || '', positionTitle: data.positionTitle || '',
        client: data.client || '', status: data.status || '',
      });
    });

    const rows = expertSnap.docs.map(d => {
      const data = d.data();
      const email = (data.email || '').toLowerCase();
      const sc = data.skillCategory;
      const skillCategory = Array.isArray(sc) ? sc.join(', ') : (sc || '');
      const positions = (posMap[email] || []).map(p => {
        const cands = candByPos[p.positionId] || [];
        return { ...p, totalCandidates: cands.length, activeCandidates: cands.filter(c => !REJECT_S.has(c.status)).length };
      });
      return { id: d.id, name: data.name || '', email, skillCategory, positions,
        profileCompletion: calcProfileCompletion(data),
        agreementSigned: data.agreementSigned || false,
      };
    }).filter(r => r.email);

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/experts error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/vendors
router.get('/reports/vendors', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [vendorSnap, recSnap, posAccSnap, ceSnap, candSnap] = await Promise.all([
      db.collection('admin_db').where('roleCategory', '==', 'Vendor').get(),
      db.collection('recruiter_db').get(),
      db.collection('position_access_requests').where('status', '==', 'approved').get(),
      db.collection('coach_expert_requests').get(),
      candidatesForReports(),
    ]);

    // recruiterEmail → vendorEmail
    const recVendorMap = {};
    recSnap.docs.forEach(d => {
      const data = d.data();
      if (data.vendorEmail) {
        recVendorMap[(data.email || '').toLowerCase()] = (data.vendorEmail || '').toLowerCase();
      }
    });

    // Position access map: recruiterEmail → Set<positionId>
    const recPosMap = {};
    posAccSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.recruiterEmail || '').toLowerCase();
      if (!recPosMap[email]) recPosMap[email] = new Set();
      recPosMap[email].add(data.positionId || '');
    });

    // Position details map
    const posDetails = {};
    posAccSnap.docs.forEach(d => {
      const data = d.data();
      posDetails[data.positionId] = { positionTitle: data.positionTitle || '', client: data.client || '' };
    });

    // Candidate map: posId → { total, active, lastDate }
    const candByPos = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = { total: 0, active: 0, lastDate: 0 };
      candByPos[pid].total++;
      if (!REJECT_S.has(data.statusa || '')) candByPos[pid].active++;
      const ts = data.datePosted?._seconds || 0;
      if (ts > candByPos[pid].lastDate) candByPos[pid].lastDate = ts;
    });

    // Coach/Expert counts per position
    const cePosMap = {};
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.positionId || '';
      if (!pid) return;
      if (!cePosMap[pid]) cePosMap[pid] = { coaches: new Set(), experts: new Set() };
      if (data.coachExpertType === 'Coach')  cePosMap[pid].coaches.add(data.coachExpertEmail || '');
      if (data.coachExpertType === 'Expert') cePosMap[pid].experts.add(data.coachExpertEmail || '');
    });

    const rows = vendorSnap.docs.map(d => {
      const data = d.data();
      const vendorEmail = (data.email || '').toLowerCase();

      // Find vendor's recruiters
      const vendorRecruiters = recSnap.docs
        .filter(r => (r.data().vendorEmail || '').toLowerCase() === vendorEmail)
        .map(r => (r.data().email || '').toLowerCase());

      // Collect all positions across vendor's recruiters
      const allPosIds = new Set();
      vendorRecruiters.forEach(rEmail => {
        (recPosMap[rEmail] || new Set()).forEach(pid => allPosIds.add(pid));
      });

      const positions = [...allPosIds].map(pid => {
        const det = posDetails[pid] || {};
        const cc = candByPos[pid] || {};
        const ce = cePosMap[pid] || {};
        return {
          positionId: pid,
          positionTitle: det.positionTitle || '',
          client: det.client || '',
          totalCandidates: cc.total || 0,
          activeCandidates: cc.active || 0,
          lastSubmission: cc.lastDate || 0,
          coachCount:  ce.coaches?.size || 0,
          expertCount: ce.experts?.size || 0,
          recruiterCount: vendorRecruiters.filter(re => (recPosMap[re] || new Set()).has(pid)).length,
        };
      });

      return {
        id: d.id,
        name: data.name || '',
        email: vendorEmail,
        totalRecruiters: vendorRecruiters.length,
        positions,
      };
    });

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/vendors error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/clientspocs
router.get('/reports/clientspocs', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [posSnap, posAccSnap, ceSnap, candSnap, spocSnap] = await Promise.all([
      db.collection('admin_AddPos').get(),
      db.collection('position_access_requests').where('status', '==', 'approved').get(),
      db.collection('coach_expert_requests').get(),
      candidatesForReports(),
      db.collection('admin_db').get(),
    ]);

    // Position details: posId → pos data
    const posDetails = {};
    posSnap.docs.forEach(d => {
      const data = d.data();
      posDetails[data.pos_id || ''] = {
        positionTitle:  data.position || '',
        client:         data.client || '',
        skill_category: data.skill_category || '',
        clientspoc:     (data.clientspoc || '').toLowerCase(),
        updatedAt:      data.updatedAt || data.datePosted || null,
        datePosted:     data.datePosted || data.createdAt || null,
        reactivatedAt:  data.reactivatedAt || null,
        status:         data.status || 'Active',
      };
    });

    // Recruiter count per position
    const recByPos = {};
    posAccSnap.docs.forEach(d => {
      const pid = d.data().positionId || '';
      if (!recByPos[pid]) recByPos[pid] = new Set();
      recByPos[pid].add((d.data().recruiterEmail || '').toLowerCase());
    });

    // Coach/Expert per position
    const ceByPos = {};
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.positionId || '';
      if (!ceByPos[pid]) ceByPos[pid] = { coaches: new Set(), experts: new Set() };
      if (data.coachExpertType === 'Coach')  ceByPos[pid].coaches.add(data.coachExpertEmail || '');
      if (data.coachExpertType === 'Expert') ceByPos[pid].experts.add(data.coachExpertEmail || '');
    });

    // Candidate count per position
    const candByPos = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = { total: 0, active: 0 };
      candByPos[pid].total++;
      if (!REJECT_S.has(data.statusa || '')) candByPos[pid].active++;
    });

    // ClientSPOC details from admin_db
    const spocInfo = {};
    spocSnap.docs.forEach(d => {
      const data = d.data();
      const email = (data.email || '').toLowerCase();
      if (!spocInfo[email]) {
        spocInfo[email] = { name: data.name || email, skillCategory: data.skillCategory || '' };
      }
    });

    // Date-wise bulk-uploaded resume counts per ClientSPOC (source=clientspoc_bulk)
    const istKey = (ms) => { const d = new Date(ms + AD_IST); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
    const istLabel = (ms) => new Date(ms + AD_IST).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const bulkBySpoc = {}; // email -> { total, byDate: { key: {label, count} } }
    candSnap.docs.forEach(d => {
      const data = d.data();
      if (data.source !== 'clientspoc_bulk') return;
      const email = (data.clientspoc || data.addedBy || '').toLowerCase();
      if (!email) return;
      const ms = AD_toMs(data.datePosted) || AD_toMs(data.updatedAt);
      const key = ms ? istKey(ms) : '0000-00-00';
      const label = ms ? istLabel(ms) : 'Unknown';
      if (!bulkBySpoc[email]) bulkBySpoc[email] = { total: 0, byDate: {} };
      bulkBySpoc[email].total++;
      if (!bulkBySpoc[email].byDate[key]) bulkBySpoc[email].byDate[key] = { label, count: 0 };
      bulkBySpoc[email].byDate[key].count++;
    });
    const bulkFor = (email) => {
      const b = bulkBySpoc[email];
      if (!b) return { bulkUploads: [], bulkTotal: 0 };
      const bulkUploads = Object.entries(b.byDate)
        .map(([key, v]) => ({ date: key, label: v.label, count: v.count }))
        .sort((a, b2) => (a.date < b2.date ? 1 : -1)); // newest first
      return { bulkUploads, bulkTotal: b.total };
    };

    // Group positions by clientspoc email
    const spocPosMap = {};
    Object.entries(posDetails).forEach(([pid, pos]) => {
      const spocEmail = pos.clientspoc;
      if (!spocEmail) return;
      if (!spocPosMap[spocEmail]) spocPosMap[spocEmail] = [];
      const cc = candByPos[pid] || {};
      const rc = recByPos[pid] || new Set();
      const ce = ceByPos[pid] || {};
      spocPosMap[spocEmail].push({
        positionId:      pid,
        positionTitle:   pos.positionTitle,
        client:          pos.client,
        skill_category:  pos.skill_category,
        status:          pos.status,
        updatedAt:       pos.updatedAt,
        datePosted:      pos.datePosted,
        reactivatedAt:   pos.reactivatedAt,
        totalCandidates: cc.total || 0,
        activeCandidates: cc.active || 0,
        recruiterCount:  rc.size,
        coachCount:      ce.coaches?.size || 0,
        expertCount:     ce.experts?.size || 0,
      });
    });

    // Include SPOCs who uploaded bulk resumes even if they own no positions.
    const allSpocEmails = new Set([...Object.keys(spocPosMap), ...Object.keys(bulkBySpoc)]);
    const rows = [...allSpocEmails].map((email) => {
      const info = spocInfo[email] || {};
      const { bulkUploads, bulkTotal } = bulkFor(email);
      return {
        email,
        name: info.name || email,
        skillCategory: Array.isArray(info.skillCategory) ? info.skillCategory.join(', ') : (info.skillCategory || ''),
        positions: spocPosMap[email] || [],
        bulkUploads,
        bulkTotal,
      };
    });

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/clientspocs error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/registrations — datewise registration counts by role and status
router.get('/reports/registrations', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [recSnap, coachSnap, expertSnap] = await Promise.all([
      db.collection('recruiter_db').get(),
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
    ]);

    const toDate = (ts) => {
      if (!ts) return null;
      if (ts._seconds) return new Date(ts._seconds * 1000);
      if (ts.seconds)  return new Date(ts.seconds  * 1000);
      if (ts.toDate)   return ts.toDate();
      return new Date(ts);
    };
    const toKey = (d) => d ? d.toISOString().slice(0, 10) : 'unknown';

    const dayMap = {}; // date → { recruiters, coaches, experts } → { total, approved, pending, waitlist, signed, unsigned }
    const ensure = (date, role) => {
      if (!dayMap[date]) dayMap[date] = {};
      if (!dayMap[date][role]) dayMap[date][role] = { total: 0, approved: 0, pending: 0, waitlist: 0, signed: 0, unsigned: 0 };
    };

    const processSnap = (snap, role) => {
      snap.docs.forEach(d => {
        const data = d.data();
        const date = toKey(toDate(data.createdAt || data.registrationDate));
        ensure(date, role);
        dayMap[date][role].total++;
        const st = (data.accountStatus || '').toLowerCase();
        if (st === 'approved') dayMap[date][role].approved++;
        else if (st === 'waitlist') dayMap[date][role].waitlist++;
        else dayMap[date][role].pending++;
        if (data.agreementSigned) dayMap[date][role].signed++;
        else dayMap[date][role].unsigned++;
      });
    };

    processSnap(recSnap, 'recruiters');
    processSnap(coachSnap, 'coaches');
    processSnap(expertSnap, 'experts');

    // Flatten to sorted array
    const rows = Object.entries(dayMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, roles]) => ({ date, ...roles }));

    // Grand totals
    const emptyTotals = () => ({ total: 0, approved: 0, pending: 0, waitlist: 0, signed: 0, unsigned: 0 });
    const totals = { recruiters: emptyTotals(), coaches: emptyTotals(), experts: emptyTotals() };
    rows.forEach(r => {
      ['recruiters', 'coaches', 'experts'].forEach(role => {
        if (r[role]) {
          totals[role].total    += r[role].total    || 0;
          totals[role].approved += r[role].approved || 0;
          totals[role].pending  += r[role].pending  || 0;
          totals[role].waitlist += r[role].waitlist || 0;
          totals[role].signed   += r[role].signed   || 0;
          totals[role].unsigned += r[role].unsigned || 0;
        }
      });
    });

    return res.json({ success: true, rows, totals });
  } catch (err) {
    console.error('reports/registrations error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/reports/positions — datewise positions with recruiter/coach/expert/candidate breakdown
router.get('/reports/positions', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const [posSnap, posAccSnap, ceSnap, candSnap] = await Promise.all([
      db.collection('admin_AddPos').get(),
      db.collection('position_access_requests').where('status', '==', 'approved').get(),
      db.collection('coach_expert_requests').get(),
      candidatesForReports(),
    ]);

    // Recruiter count per position
    const recByPos = {};
    posAccSnap.docs.forEach(d => {
      const pid = d.data().positionId || '';
      if (!recByPos[pid]) recByPos[pid] = new Set();
      recByPos[pid].add((d.data().recruiterEmail || '').toLowerCase());
    });

    // Coach/Expert per position
    const ceByPos = {};
    ceSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.positionId || '';
      if (!ceByPos[pid]) ceByPos[pid] = { coaches: new Set(), experts: new Set() };
      if (data.coachExpertType === 'Coach')  ceByPos[pid].coaches.add(data.coachExpertEmail || '');
      if (data.coachExpertType === 'Expert') ceByPos[pid].experts.add(data.coachExpertEmail || '');
    });

    // Candidate counts per position
    const candByPos = {};
    candSnap.docs.forEach(d => {
      const data = d.data();
      const pid = data.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = { total: 0, lastDate: null };
      candByPos[pid].total++;
      const ts = data.datePosted?._seconds ? new Date(data.datePosted._seconds * 1000) : null;
      if (ts && (!candByPos[pid].lastDate || ts > candByPos[pid].lastDate)) candByPos[pid].lastDate = ts;
    });

    const toDate = (ts) => {
      if (!ts) return null;
      if (ts._seconds) return new Date(ts._seconds * 1000);
      if (ts.seconds)  return new Date(ts.seconds  * 1000);
      if (ts.toDate)   return ts.toDate();
      return new Date(ts);
    };

    const rows = posSnap.docs.map(d => {
      const data = d.data();
      const pid = data.pos_id || d.id;
      const cc = candByPos[pid] || {};
      return {
        positionId:    pid,
        positionTitle: data.position || '',
        client:        data.client || '',
        skill_category: data.skill_category || '',
        clientspoc:    data.clientspoc_name || data.clientspoc || '',
        status:        data.status || 'Active',
        datePosted:    toDate(data.datePosted),
        updatedAt:     toDate(data.updatedAt),
        recruiterCount: (recByPos[pid]?.size || 0),
        coachCount:    (ceByPos[pid]?.coaches?.size || 0),
        expertCount:   (ceByPos[pid]?.experts?.size || 0),
        totalCandidates: cc.total || 0,
        lastSubmission: cc.lastDate || null,
      };
    }).sort((a, b) => (b.datePosted || 0) - (a.datePosted || 0));

    return res.json({ success: true, rows });
  } catch (err) {
    console.error('reports/positions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/coach-recruiter-assignments — all coach→recruiter assignment records
router.get('/coach-recruiter-assignments', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('coach_recruiter_assignments').get();
    const assignments = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));

    // Attach each coach's position briefing so the admin table can show its state
    // and play it as audio. Briefing doc id is `${positionId}__${coachEmailLower}`.
    const refById = new Map();
    assignments.forEach(a => {
      const pid = String(a.positionId || ''); const ce = (a.coachEmail || '').toLowerCase();
      if (pid && ce) { const id = `${pid}__${ce}`; if (!refById.has(id)) refById.set(id, db.collection('position_coach_briefing').doc(id)); }
    });
    const briefMap = {};
    if (refById.size) {
      const docs = await db.getAll(...refById.values());
      docs.forEach(d => { if (d.exists) briefMap[d.id] = d.data(); });
    }
    assignments.forEach(a => {
      const pid = String(a.positionId || ''); const ce = (a.coachEmail || '').toLowerCase();
      const b = briefMap[`${pid}__${ce}`] || null;
      a.briefing = b ? {
        briefingText: (b.briefingText || '').toString(),
        winningTip: (b.winningTip || '').toString(),
        coverage: Array.isArray(b.coverage) ? b.coverage : [],
        wordCount: b.wordCount || 0,
        status: b.status || 'draft',
      } : null;
    });

    return res.json({ success: true, assignments });
  } catch (err) {
    console.error('coach-recruiter-assignments error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/teams — all coaches/experts with their team members, request status, positions, CV counts
router.get('/teams', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');

    // Fetch team requests, coach DB, expert DB in parallel
    const [teamSnap, coachSnap, expertSnap, assignSnap] = await Promise.all([
      db.collection('coach_team_requests').get(),
      db.collection('coach_db').get(),
      db.collection('expert_db').get(),
      db.collection('coach_recruiter_assignments').get(),
    ]);

    // Build case-insensitive coach/expert lookup: lowercaseEmail → profile
    const coachMap = {};
    coachSnap.docs.forEach(d => {
      const data = d.data();
      if (data.email) coachMap[data.email.toLowerCase()] = { name: data.name || '', email: data.email, phone: data.phone || data.mobile || '', skillCategory: data.skillCategory, profilePhoto: data.profilePhoto, role: 'Coach' };
    });
    expertSnap.docs.forEach(d => {
      const data = d.data();
      if (data.email) coachMap[data.email.toLowerCase()] = { name: data.name || '', email: data.email, phone: data.phone || data.mobile || '', skillCategory: data.skillCategory, profilePhoto: data.profilePhoto, role: 'Expert' };
    });

    // Group team requests by coachEmail (lowercase)
    const teamsByCoach = {};
    teamSnap.docs.forEach(d => {
      const data = { id: d.id, ...d.data() };
      const ce = (data.coachEmail || '').toLowerCase();
      if (!ce) return;
      if (!teamsByCoach[ce]) teamsByCoach[ce] = [];
      teamsByCoach[ce].push(data);
    });

    // assignmentsByCoachRec: `ceEmailLower::recEmailLower` → [{ positionId, positionTitle }]
    const assignmentsByCoachRec = {};
    assignSnap.docs.forEach(d => {
      const a = d.data();
      const key = `${(a.coachEmail || '').toLowerCase()}::${(a.recruiterEmail || '').toLowerCase()}`;
      if (!assignmentsByCoachRec[key]) assignmentsByCoachRec[key] = [];
      assignmentsByCoachRec[key].push({
        positionId:    a.positionId || '',
        positionTitle: a.positionTitle || a.positionId || '',
      });
    });

    // Collect all recruiter emails from team requests
    const allRecruiterEmails = [...new Set(
      teamSnap.docs.map(d => (d.data().recruiterEmail || '').toLowerCase()).filter(Boolean)
    )];

    // Fetch candidate details for these recruiters
    let allCandidates = [];
    for (let i = 0; i < allRecruiterEmails.length; i += 30) {
      const batch = allRecruiterEmails.slice(i, i + 30);
      const snap = await db.collection('candidate_db').where('recEmail', 'in', batch).get();
      allCandidates = allCandidates.concat(snap.docs.map(d => {
        const data = d.data();
        return {
          recEmail:   (data.recEmail || '').toLowerCase(),
          pos_id:     data.pos_id || '',
          name:       data.candidate || data.name || '—',
          status:     data.statusa || 'Submitted',
          datePosted: data.datePosted || null,
          updatedAt:  data.updatedAt || data.datePosted || null,
        };
      }));
    }

    // candidatesByRecPos: `recEmailLower::pos_id` → [candidate]
    const candidatesByRecPos = {};
    allCandidates.forEach(c => {
      const key = `${c.recEmail}::${c.pos_id}`;
      if (!candidatesByRecPos[key]) candidatesByRecPos[key] = [];
      candidatesByRecPos[key].push(c);
    });

    // Build teams — one entry per unique coachEmail found in team requests
    // Fall back to data from the team request itself if coach not in DB
    const processedEmails = new Set();
    const teams = [];

    teamSnap.docs.forEach(d => {
      const data = d.data();
      const ceEmailLower = (data.coachEmail || '').toLowerCase();
      if (!ceEmailLower || processedEmails.has(ceEmailLower)) return;
      processedEmails.add(ceEmailLower);

      const profile = coachMap[ceEmailLower] || {
        name: data.coachName || data.coachEmail || ceEmailLower,
        email: data.coachEmail || ceEmailLower,
        role: data.coachType || 'Coach',
        skillCategory: null,
        profilePhoto: null,
      };

      const requests = teamsByCoach[ceEmailLower] || [];
      if (requests.length === 0) return; // skip coaches/experts with no team requests at all
      const approvedCount = requests.filter(r => r.status === 'approved').length;

      const members = requests.map(r => {
        const recEmail = (r.recruiterEmail || '').toLowerCase();
        const positions = (assignmentsByCoachRec[`${ceEmailLower}::${recEmail}`] || []).map(p => {
          const candidates = (candidatesByRecPos[`${recEmail}::${p.positionId}`] || []).map(c => ({
            name:       c.name,
            status:     c.status,
            datePosted: c.datePosted,
            updatedAt:  c.updatedAt,
          }));
          return { positionId: p.positionId, positionTitle: p.positionTitle, candidates };
        });
        const cvCount = positions.reduce((sum, p) => sum + p.candidates.length, 0);
        return {
          id:             r.id,
          recruiterId:    r.recruiterId,
          recruiterName:  r.recruiterName || r.recruiterEmail,
          recruiterEmail: r.recruiterEmail,
          status:         r.status,
          sentAt:         r.createdAt,
          positions,
          cvCount,
        };
      });

      teams.push({
        email: profile.email || ceEmailLower,
        name: profile.name,
        phone: profile.phone || '',
        role: profile.role,
        skillCategory: profile.skillCategory,
        profilePhoto: profile.profilePhoto,
        teamSize: approvedCount,
        totalRequests: requests.length,
        members,
      });
    });

    // Sort by teamSize desc
    teams.sort((a, b) => b.teamSize - a.teamSize);

    return res.json({ success: true, teams });
  } catch (err) {
    console.error('admin/teams error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/category-stats — positions + recruiter/coach/expert counts per parent skill category
router.get('/category-stats', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');

    const [posSnap, recSnap, coachSnap, expertSnap] = await Promise.all([
      db.collection('admin_AddPos').select('skill_category').get(),
      db.collection('recruiter_db').select('skillCategory').get(),
      db.collection('coach_db').select('skillCategory').get(),
      db.collection('expert_db').select('skillCategory').get(),
    ]);

    const stats = {};
    const ensure = cat => {
      if (!stats[cat]) stats[cat] = { positions: 0, recruiters: 0, coaches: 0, experts: 0 };
    };

    posSnap.docs.forEach(d => {
      const cat = (d.data().skill_category || '').trim();
      if (cat) { ensure(cat); stats[cat].positions++; }
    });

    const countUsers = (snap, field) => {
      snap.docs.forEach(d => {
        const val = d.data()[field];
        const cats = Array.isArray(val) ? val : (val ? [val] : []);
        cats.forEach(cat => {
          const c = (cat || '').trim();
          if (c) { ensure(c); stats[c][field === 'skillCategory' ? '' : field]++; }
        });
      });
    };

    recSnap.docs.forEach(d => {
      const val = d.data().skillCategory;
      const cats = Array.isArray(val) ? val : (val ? [val] : []);
      cats.forEach(cat => { const c = (cat || '').trim(); if (c) { ensure(c); stats[c].recruiters++; } });
    });
    coachSnap.docs.forEach(d => {
      const val = d.data().skillCategory;
      const cats = Array.isArray(val) ? val : (val ? [val] : []);
      cats.forEach(cat => { const c = (cat || '').trim(); if (c) { ensure(c); stats[c].coaches++; } });
    });
    expertSnap.docs.forEach(d => {
      const val = d.data().skillCategory;
      const cats = Array.isArray(val) ? val : (val ? [val] : []);
      cats.forEach(cat => { const c = (cat || '').trim(); if (c) { ensure(c); stats[c].experts++; } });
    });

    return res.json({ success: true, stats });
  } catch (err) {
    console.error('category-stats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/category — create
router.post('/category', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { FieldValue } = require('firebase-admin/firestore');
    const { parent, children } = req.body;
    if (!parent || !parent.trim()) return res.status(400).json({ success: false, message: 'Parent name is required' });

    const doc = {
      parent: parent.trim(),
      children: (children || []).map(c => ({
        name: (c.name || '').trim(),
        subChildren: (c.subChildren || []).map(s => (s || '').trim()).filter(Boolean),
      })).filter(c => c.name),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: req.user?.email || 'admin',
    };

    const ref = await db.collection('skill_categories').add(doc);
    return res.json({ success: true, id: ref.id, message: 'Category created' });
  } catch (err) {
    console.error('category create error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /admin/category/:id — update
router.put('/category/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const { FieldValue } = require('firebase-admin/firestore');
    const { parent, children } = req.body;
    if (!parent || !parent.trim()) return res.status(400).json({ success: false, message: 'Parent name is required' });

    const doc = {
      parent: parent.trim(),
      children: (children || []).map(c => ({
        name: (c.name || '').trim(),
        subChildren: (c.subChildren || []).map(s => (s || '').trim()).filter(Boolean),
      })).filter(c => c.name),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('skill_categories').doc(req.params.id).update(doc);
    return res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    console.error('category update error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /admin/category/:id
router.delete('/category/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    await db.collection('skill_categories').doc(req.params.id).delete();
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('category delete error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/all-positions-detail — full positions list with candidate & recruiter breakdown
router.get('/all-positions-detail', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const ad_Pos = require('../model_fire/adminF');

    // Get all positions (including hidden/paused)
    const positions = await ad_Pos.getAllPosition(true);

    // Get all candidates in one shot to avoid N+1
    const candSnap = await db.collection('candidate_db').limit(5000).get();
    const allCandidates = candSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Build a pos_id → candidates map
    const candByPos = {};
    allCandidates.forEach(c => {
      const pid = c.pos_id || '';
      if (!pid) return;
      if (!candByPos[pid]) candByPos[pid] = [];
      candByPos[pid].push(c);
    });

    const INACTIVE = ['paused', 'closed', 'on hold', 'hold', 'closed - filled', 'closed - cancelled'];

    const data = positions.map(pos => {
      const cands = candByPos[pos.pos_id] || [];
      const st = (pos.status || '').toLowerCase().trim();
      const isActive = !INACTIVE.some(s => st === s || st.includes(s));

      // Group candidates by recruiter
      const recMap = {};
      cands.forEach(c => {
        const key = c.recEmail || 'unknown';
        if (!recMap[key]) recMap[key] = { recruiterName: c.recName || c.recEmail || 'Unknown', recruiterEmail: c.recEmail || '', candidates: [] };
        recMap[key].candidates.push({
          id: c.id,
          name: c.candidate || 'N/A',
          email: c.emails || '',
          phone: c.mob || '',
          status: c.statusa || 'Submitted',
          submittedDate: c.datePosted?._seconds ? new Date(c.datePosted._seconds * 1000).toLocaleDateString('en-IN') : 'N/A',
          statusUpdatedDate: c.updatedAt?._seconds ? new Date(c.updatedAt._seconds * 1000).toLocaleDateString('en-IN') : (c.datePosted?._seconds ? new Date(c.datePosted._seconds * 1000).toLocaleDateString('en-IN') : 'N/A'),
        });
      });

      return {
        pos_id: pos.pos_id,
        position: pos.position || 'N/A',
        client: pos.client || 'N/A',
        clientspoc: pos.clientspoc || pos.hr_name || 'N/A',
        status: pos.status || 'Active',
        isActive,
        datePosted: pos.datePosted || null,
        experience: pos.experience || '',
        location: Array.isArray(pos.location) ? pos.location.join(', ') : (pos.location || ''),
        ctcStart: pos.ctcStart || '',
        ctcEnd: pos.ctcEnd || '',
        commison: pos.commison || 0,
        commission_type: pos.commission_type || '',
        job_desc: pos.job_desc || '',
        pos_cat: pos.pos_cat || '',
        skill_category: pos.skill_category || '',
        m_have: pos.m_have || '',
        g_have: pos.g_have || '',
        key_res: pos.key_res || '',
        compet: pos.compet || '',
        totalCandidates: cands.length,
        recruitersWorking: Object.keys(recMap).length,
        recruiterBreakdown: Object.values(recMap),
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error('all-positions-detail error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Resume Parsing ───────────────────────────────────────────────────────────
// POST /admin/parse-resume — extract structured fields from a PDF/DOCX resume
// Accepts { filename, contentType, base64 } JSON — avoids Cloud Run multipart issues
router.post('/parse-resume', adminAuthMiddleware, async (req, res) => {
  try {
    const { filename = '', contentType = '', base64 } = req.body;
    if (!base64) return res.status(400).json({ success: false, message: 'No file data provided.' });

    const buffer   = Buffer.from(base64, 'base64');
    const mime     = contentType.toLowerCase();
    const origName = filename.toLowerCase();

    let text = '';
    if (mime.includes('pdf') || origName.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      // pdf-parse v1 exports a function directly: pdfParse(buffer) → { text }
      const parsed = await pdfParse(buffer);
      text = parsed.text || '';
    } else if (mime.includes('word') || origName.endsWith('.docx') || origName.endsWith('.doc')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else {
      text = buffer.toString('utf-8');
    }

    const t = text;

    // ── Helpers ──────────────────────────────────────────────────────────────
    const first = (regex) => { const m = t.match(regex); return m ? (m[1] || m[0]).trim() : ''; };

    // Name: first non-empty line that looks like a name (no @, no digit-heavy)
    const nameCandidate = (() => {
      const lines = t.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines.slice(0, 6)) {
        if (line.length > 2 && line.length < 60 && !/[@\d{4}]/.test(line) && /^[A-Za-z .',-]+$/.test(line)) return line;
      }
      return '';
    })();

    // Email
    const emailMatch = t.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // Phone (Indian 10-digit)
    const phoneMatch = t.match(/(?:\+91[\s\-]?)?[6-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-10) : '';

    // Current employer
    const empMatch = first(/(?:current(?:ly)?\s+(?:working|employed)\s+(?:at|with|in)|employer|company)\s*[:\-]?\s*([^\n,]+)/i)
      || first(/(?:organization|organisation)\s*[:\-]\s*([^\n,]+)/i);

    // Experience (total)
    const expMatch = first(/(?:total\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i)
      || first(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:total\s+)?experience/i);

    // Experience (relevant)
    const relExpMatch = first(/relevant\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i)
      || first(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+)?relevant/i);

    // Notice period
    const noticeMatch = first(/notice\s*period\s*[:\-]?\s*(\d+\s*(?:days?|months?|weeks?))/i)
      || first(/(\d+)\s*(?:days?|months?)\s*notice/i);

    // Current CTC
    const ctcMatch = first(/current\s+(?:ctc|salary|package)\s*[:\-]?\s*([\d.]+\s*(?:lpa|lakhs?|l|lacs?)?)/i)
      || first(/(?:ctc|salary|package)\s*[:\-]?\s*([\d.]+\s*(?:lpa|lakhs?|l)?)/i);

    // Expected CTC
    const expCtcMatch = first(/expected\s+(?:ctc|salary|package)\s*[:\-]?\s*([\d.]+\s*(?:lpa|lakhs?|l|lacs?)?)/i);

    // Location
    const locMatch = first(/(?:location|city|current\s+location)\s*[:\-]\s*([^\n,]+)/i)
      || first(/(?:address|residing\s+at)\s*[:\-]\s*([^\n,]+)/i);

    // Education
    const eduMatch = first(/(?:education|qualification|degree)\s*[:\-]?\s*([^\n]+)/i)
      || (['PhD','Ph.D','MBA','BE','B.E','B.Tech','BTech','MCA','M.Tech','MTech','BSc','B.Sc','MSc','M.Sc','BCA','M.Com','B.Com'].find(d => t.includes(d)) || '');

    // Skills — grab common keyword sets
    const skillSection = t.match(/(?:skills?|technologies?|expertise|tech(?:nical)?\s+skills?)\s*[:\-]?\s*([\s\S]{10,400}?)(?:\n\n|\n[A-Z])/i);
    const skillText = skillSection ? skillSection[1] : '';
    const skills = skillText
      .split(/[\n,|•;\/]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .slice(0, 15);

    return res.json({
      success: true,
      fields: {
        candidate:         nameCandidate,
        emails:            email,
        mob:               phone,
        curr_emp:          empMatch,
        total_exp:         expMatch ? `${expMatch} yr 0 mo` : '',
        total_exp_year:    expMatch || '',
        total_exp_months:  '0',
        rel_exp:           relExpMatch ? `${relExpMatch} yr 0 mo` : '',
        rel_exp_year:      relExpMatch || '',
        rel_exp_months:    '0',
        notice_period:     noticeMatch,
        current_ctc:       ctcMatch,
        exp_ctc:           expCtcMatch,
        curr_loc:          locMatch,
        highest_education: eduMatch,
        extractedSkills:   skills,  // raw list — user maps to skill fields
        rawText:           t.slice(0, 500),  // first 500 chars preview
      },
    });
  } catch (err) {
    console.error('parse-resume error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── SuperAdmin → Candidates ────────────────────────────────────────────────────
// One endpoint behind three tabs (All / Direct / Active). candidate_db holds
// 21k+ documents, so this never ships the whole collection: it projects just the
// list columns with .select(), filters and paginates server-side, and caches the
// projection briefly so paging and filtering don't re-read the collection.

// In play = not parked in the Resume Bank and not closed out.
const INACTIVE_CANDIDATE_STATUSES = new Set([
  'resume bank', 'duplicate', 'client drop', 'candidate drop',
  'position on hold', 'offer declined', 'draft',
]);
const isActiveCandidateStatus = (st) => {
  const s = String(st || '').toLowerCase().trim();
  if (!s) return false;
  if (s.includes('reject')) return false;
  return !INACTIVE_CANDIDATE_STATUSES.has(s);
};

const CANDIDATE_LIST_FIELDS = [
  'candidate', 'emails', 'mob', 'pos_id', 'pos_name', 'client', 'clientspoc',
  'clientspoc_name', 'recName', 'recEmail', 'recRole', 'recPhone', 'statusa',
  'source', 'datePosted', 'updatedAt', 'matchPercent',
];

let _candCache = { at: 0, rows: null };
const CAND_CACHE_MS = 60 * 1000;

const toDate = (v) => {
  if (!v) return null;
  if (v._seconds) return new Date(v._seconds * 1000);
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

async function loadCandidateRows() {
  if (_candCache.rows && Date.now() - _candCache.at < CAND_CACHE_MS) return _candCache.rows;
  const { db } = require('./firebase_ad');
  const snap = await db.collection('candidate_db').select(...CANDIDATE_LIST_FIELDS).get();
  const rows = snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      candidate: d.candidate || '',
      emails: d.emails || '',
      mob: d.mob || '',
      pos_id: d.pos_id || '',
      pos_name: d.pos_name || '',
      client: d.client || '',
      clientspoc: d.clientspoc || '',
      clientspocName: d.clientspoc_name || '',
      recName: d.recName || '',
      recEmail: d.recEmail || '',
      recRole: d.recRole || '',
      recPhone: d.recPhone || '',
      statusa: d.statusa || '',
      source: d.source || '',
      matchPercent: (d.matchPercent === undefined || d.matchPercent === null) ? null : d.matchPercent,
      datePosted: toDate(d.datePosted),
      updatedAt: toDate(d.updatedAt),
    };
  });
  _candCache = { at: Date.now(), rows };
  return rows;
}

// GET /admin/candidates?tab=all|direct|active&q=&status=&position=&client=&recruiter=
//                       &source=&from=&to=&page=1&pageSize=50&sort=landed|updated
router.get('/candidates', adminAuthMiddleware, async (req, res) => {
  try {
    const all = await loadCandidateRows();
    const tab = String(req.query.tab || 'all').toLowerCase();

    let rows = all;
    if (tab === 'direct') rows = rows.filter(r => r.source === 'direct_apply');
    else if (tab === 'active') rows = rows.filter(r => isActiveCandidateStatus(r.statusa));

    // Dropdown choices reflect the tab, so a filter can never select nothing.
    const uniq = (key) => [...new Set(rows.map(r => (r[key] || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const facets = {
      statuses: uniq('statusa'),
      positions: uniq('pos_name'),
      clients: uniq('client'),
      sources: uniq('source'),
      recruiters: [...new Set(rows.map(r => (r.recName || r.recEmail || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    };
    const tabTotal = rows.length;

    const q = String(req.query.q || '').toLowerCase().trim();
    if (q) {
      rows = rows.filter(r =>
        r.candidate.toLowerCase().includes(q) ||
        String(r.emails).toLowerCase().includes(q) ||
        String(r.mob).toLowerCase().includes(q) ||
        String(r.pos_id).toLowerCase().includes(q) ||
        r.pos_name.toLowerCase().includes(q));
    }
    const eq = (val, field) => { const v = String(val || '').trim(); if (v) rows = rows.filter(r => (r[field] || '') === v); };
    eq(req.query.status, 'statusa');
    eq(req.query.position, 'pos_name');
    eq(req.query.client, 'client');
    eq(req.query.source, 'source');
    const rec = String(req.query.recruiter || '').trim();
    if (rec) rows = rows.filter(r => (r.recName || r.recEmail || '') === rec);

    const dateField = tab === 'active' ? 'updatedAt' : 'datePosted';
    const from = req.query.from ? new Date(`${req.query.from}T00:00:00`) : null;
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59`) : null;
    if (from && !isNaN(from)) rows = rows.filter(r => r[dateField] && r[dateField] >= from);
    if (to && !isNaN(to)) rows = rows.filter(r => r[dateField] && r[dateField] <= to);

    const sortField = String(req.query.sort || '') === 'updated' ? 'updatedAt' : dateField;
    rows = [...rows].sort((a, b) => (b[sortField]?.getTime() || 0) - (a[sortField]?.getTime() || 0));

    const filtered = rows.length;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(req.query.pageSize, 10) || 50));
    const start = (page - 1) * pageSize;

    return res.json({
      success: true,
      candidates: rows.slice(start, start + pageSize),
      total: filtered, tabTotal, page, pageSize,
      pages: Math.max(1, Math.ceil(filtered / pageSize)),
      facets,
    });
  } catch (err) {
    console.error('admin/candidates error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/direct-applicants — superadmin: all direct-apply submissions with recruiter/spoc breakdown
router.get('/direct-applicants', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('candidate_db').where('source', '==', 'direct_apply').get();

    const rows = snap.docs.map(doc => {
      const d = doc.data();
      const datePosted  = d.datePosted  ? (d.datePosted._seconds  ? new Date(d.datePosted._seconds  * 1000) : new Date(d.datePosted))  : null;
      const updatedAt   = d.updatedAt   ? (d.updatedAt._seconds   ? new Date(d.updatedAt._seconds   * 1000) : new Date(d.updatedAt))   : null;

      return {
        id:           doc.id,
        candidate:    d.candidate    || '',
        emails:       d.emails       || '',
        mob:          d.mob          || '',
        pos_id:       d.pos_id       || '',
        pos_name:     d.pos_name     || '',
        client:       d.client       || '',
        clientspoc:   d.clientspoc   || '',
        recName:      d.recName      || '',
        recEmail:     d.recEmail     || '',
        recRole:      d.recRole      || '',
        statusa:      d.statusa      || 'Submitted',
        // AI CV-match evaluation (written by utils/cvMatch.runMatchEvaluation)
        matchPercent:    (d.matchPercent === undefined || d.matchPercent === null) ? null : d.matchPercent,
        matchSummary:    d.matchSummary    || '',
        matchReasoning:  d.matchReasoning  || '',
        matchEvaluated:  !!d.matchEvaluated,
        datePosted:   datePosted,
        updatedAt:    updatedAt,
      };
    });

    // Sort newest first
    rows.sort((a, b) => (b.datePosted || 0) - (a.datePosted || 0));

    return res.json({ success: true, applicants: rows });
  } catch (err) {
    console.error('direct-applicants error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Bulk Email ─────────────────────────────────────────────────────────────────

const toMs2 = (ts) => {
  if (!ts) return null;
  if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') return new Date(ts).getTime();
  return null;
};

// POST /admin/bulk-email/preview  — fetch matching emails based on filters
router.post('/bulk-email/preview', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const {
      userType,        // 'Recruiter'|'Coach'|'Expert'|'Clientspoc'|'Vendor'
      lastActiveHours, // 24|48|72|168|720|1440|2160  (number of hours)
      positionCountMin,// 3|5|7|10|12|15
      hasTeam,         // true|false|null
      profilePctOp,    // 'above80'|'above60'|'below40'
      agreementSigned, // true|false|null
    } = req.body;

    const colMap = {
      Recruiter: 'recruiter_db',
      Coach: 'coach_db',
      Expert: 'expert_db',
      Clientspoc: 'clientspoc_db',
      Vendor: 'vendor_db',
    };

    const colName = colMap[userType];
    if (!colName) return res.status(400).json({ success: false, message: 'Invalid user type' });

    const snap = await db.collection(colName).get();
    const now = Date.now();

    const results = [];

    for (const doc of snap.docs) {
      const d = doc.data();
      const email = (d.email || '').toLowerCase().trim();
      if (!email) continue;

      // 1. Last active filter
      if (lastActiveHours) {
        const ms = toMs2(d.lastActive);
        if (!ms || (now - ms) > lastActiveHours * 60 * 60 * 1000) continue;
      }

      // 2. Position count filter (only meaningful for recruiter/coach/expert)
      if (positionCountMin && ['Recruiter', 'Coach', 'Expert'].includes(userType)) {
        const cnt = typeof d.positionCount === 'number' ? d.positionCount : 0;
        if (cnt < positionCountMin) continue;
      }

      // 3. Has team filter (coach/expert: team array length > 0)
      if (hasTeam === true && ['Coach', 'Expert'].includes(userType)) {
        const team = Array.isArray(d.teamMembers) ? d.teamMembers : [];
        if (team.length === 0) continue;
      }

      // 4. Profile % filter
      if (profilePctOp) {
        const pct = typeof d.profileCompletion === 'number' ? d.profileCompletion : 0;
        if (profilePctOp === 'above80' && pct <= 80) continue;
        if (profilePctOp === 'above60' && pct <= 60) continue;
        if (profilePctOp === 'below40' && pct >= 40) continue;
      }

      // 5. Agreement signed filter
      if (agreementSigned === true && !d.agreementSigned) continue;
      if (agreementSigned === false && d.agreementSigned) continue;

      results.push({ email, name: d.name || '' });
    }

    return res.json({ success: true, recipients: results, count: results.length });
  } catch (err) {
    console.error('bulk-email/preview error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/bulk-email/send
router.post('/bulk-email/send', adminAuthMiddleware, async (req, res) => {
  try {
    const { sendEmailFull } = require('../utils/email');
    const { db } = require('./firebase_ad');
    const { recipients, subject, htmlContent } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ success: false, message: 'No recipients' });
    if (!subject || !htmlContent)
      return res.status(400).json({ success: false, message: 'Subject and body are required' });

    let sent = 0;
    let failed = 0;
    const messageIds = [];
    const errors = [];

    // Send one email per recipient so each person gets their own copy
    // and their email address is not visible to others
    for (const r of recipients) {
      try {
        const toObj = r.name ? { email: r.email, name: r.name } : { email: r.email };
        const result = await sendEmailFull({
          to: [toObj],
          subject,
          htmlContent,
          fromEmail: 'noreply@recruiterv.com',
          fromName: 'RecruiterV',
          replyTo: 'support@recruiterv.in',
        });
        if (result.messageId) messageIds.push(result.messageId);
        sent++;
      } catch (err) {
        const detail = err.message || 'Unknown error';
        console.error(`Email to ${r.email} failed:`, detail);
        errors.push({ email: r.email, error: detail });
        failed++;
      }
    }

    // Persist campaign record for history + stats
    await db.collection('email_campaigns').add({
      subject,
      htmlContent,
      sentAt: new Date(),
      recipientEmails: recipients.map(r => r.email),
      recipientCount: recipients.length,
      totalSent: sent,
      totalFailed: failed,
      messageIds,
      delivered: 0,
      opened: 0,
      statsUpdatedAt: null,
    });

    return res.json({ success: true, sent, failed, errors: errors.slice(0, 5) });
  } catch (err) {
    console.error('bulk-email/send error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /admin/bulk-email/history
router.get('/bulk-email/history', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const snap = await db.collection('email_campaigns').orderBy('sentAt', 'desc').limit(100).get();
    const campaigns = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        subject: data.subject || '',
        sentAt: data.sentAt?._seconds ? data.sentAt._seconds * 1000 : null,
        totalSent: data.totalSent || 0,
        totalFailed: data.totalFailed || 0,
        delivered: data.delivered || 0,
        opened: data.opened || 0,
        statsUpdatedAt: data.statsUpdatedAt?._seconds ? data.statsUpdatedAt._seconds * 1000 : null,
        recipientCount: Array.isArray(data.recipientEmails) ? data.recipientEmails.length : 0,
      };
    });
    return res.json({ success: true, campaigns });
  } catch (err) {
    console.error('bulk-email/history error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /admin/bulk-email/stats/:id  — refresh stats from Brevo
router.post('/bulk-email/stats/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { db } = require('./firebase_ad');
    const axios = require('axios');
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'BREVO_API_KEY not set' });

    const doc = await db.collection('email_campaigns').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const campaign = doc.data();
    const messageIds = campaign.messageIds || [];

    let delivered = 0;
    let opened = 0;

    for (const msgId of messageIds) {
      try {
        // Fetch up to 500 events per messageId
        const evRes = await axios.get('https://api.brevo.com/v3/smtp/statistics/events', {
          headers: { 'api-key': apiKey, accept: 'application/json' },
          params: { messageId: msgId, limit: 500 },
        });
        const events = evRes.data.events || [];
        // Deduplicate opens per email
        const openedEmails = new Set();
        events.forEach(e => {
          if (e.event === 'delivered') delivered++;
          if (e.event === 'opened') openedEmails.add(e.email);
        });
        opened += openedEmails.size;
      } catch (err) {
        console.error(`Stats fetch failed for messageId ${msgId}:`, err.message);
      }
    }

    await db.collection('email_campaigns').doc(req.params.id).update({
      delivered,
      opened,
      statsUpdatedAt: new Date(),
    });

    return res.json({ success: true, delivered, opened, sent: campaign.totalSent });
  } catch (err) {
    console.error('bulk-email/stats error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports=router;

