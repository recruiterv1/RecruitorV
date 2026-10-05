const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../router/firebase_ad');
const { sendEmail, renderEmail } = require('../utils/email');
const { sendPushToEmails } = require('../utils/push');

const directRequestsDb = db.collection('coach_expert_direct_requests');
const coachExpertRequestsDb = db.collection('coach_expert_requests');
const positionsDb = db.collection('admin_AddPos');

function authMiddleware(req, res, next) {
  const token = req.cookies.__session;
  if (!token) return res.status(401).json({ message: 'Unauthorized - No token found' });
  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// POST / — Coach/Expert clicks "Assign Me" on a position

// Assign a coach or expert to a position, exactly as the self-assign route does:
// the request record plus the assignment record that makes it appear under their
// Assigned Positions. Extracted so registration can assign the position someone
// picked while signing up without the two paths drifting apart.
//
// Returns null when there is nothing to do (already assigned, position missing);
// throws only on a genuine fault.
async function assignCoachExpertToPosition({ userDoc, roleCategory, positionId, note = '' }) {
  const userEmail = String(userDoc?.email || '').toLowerCase();
  if (!userEmail || !positionId) return null;
  if (!['Coach', 'Expert'].includes(roleCategory)) return null;

  const posSnap = await positionsDb.where('pos_id', '==', positionId).limit(1).get();
  if (posSnap.empty) return null;
  const position = posSnap.docs[0].data();

  const existing = await directRequestsDb
    .where('coachExpertEmail', '==', userEmail)
    .where('positionId', '==', positionId).limit(1).get();
  if (!existing.empty) return null;   // already theirs

  const requestData = {
    coachExpertId: userDoc.id,
    coachExpertType: roleCategory,
    coachExpertName: userDoc.name || '',
    coachExpertEmail: userEmail,
    coachExpertPhone: userDoc.phone || userDoc.mobile || '',
    coachExpertSpecialization: userDoc.specialization || '',
    positionId,
    positionTitle: position.position || '',
    client: position.client || '',
    clientspocEmail: (position.clientspoc || '').toLowerCase(),
    clientspocName: position.clientspoc_name || position.hr_name || '',
    status: 'approved',
    note,
    createdAt: new Date(),
    updatedAt: new Date(),
    respondedAt: new Date(),
    respondedBy: 'auto',
  };
  const docRef = await directRequestsDb.add(requestData);

  await coachExpertRequestsDb.add({
    coachExpertId: userDoc.id,
    coachExpertType: roleCategory,
    coachExpertName: userDoc.name || '',
    coachExpertEmail: userEmail,
    coachExpertPhone: userDoc.phone || userDoc.mobile || '',
    recruiterId: 'direct_request',
    recruiterName: 'Direct Request',
    recruiterEmail: userEmail,
    recruiterPhone: '',
    positionId,
    positionTitle: position.position || '',
    status: 'accepted',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id: docRef.id, ...requestData };
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { positionId, roleCategory } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!['Coach', 'Expert'].includes(roleCategory)) {
      return res.status(400).json({ success: false, message: 'Only Coach or Expert can use this feature.' });
    }

    // Look up coach/expert profile
    let userDoc = null;
    if (roleCategory === 'Coach') {
      const coachModel = require('../model_fire/coachF');
      userDoc = await coachModel.findCoachByEmail(userEmail);
    } else {
      const expertModel = require('../model_fire/expertF');
      userDoc = await expertModel.findExpertByEmail(userEmail);
    }
    if (!userDoc) return res.status(404).json({ success: false, message: 'Your profile was not found.' });

    // Get position details
    const posSnap = await positionsDb.where('pos_id', '==', positionId).limit(1).get();
    if (posSnap.empty) return res.status(404).json({ success: false, message: 'Position not found.' });
    const position = posSnap.docs[0].data();

    // Prevent duplicate requests
    const existing = await directRequestsDb
      .where('coachExpertEmail', '==', userEmail)
      .where('positionId', '==', positionId)
      .limit(1)
      .get();
    if (!existing.empty) {
      const s = existing.docs[0].data().status;
      return res.status(400).json({ success: false, message: `You already have a ${s} request for this position.`, status: s });
    }

    const clientspocEmail = (position.clientspoc || '').toLowerCase();
    const requestData = {
      coachExpertId: userDoc.id,
      coachExpertType: roleCategory,
      coachExpertName: userDoc.name || '',
      coachExpertEmail: userEmail,
      coachExpertPhone: userDoc.phone || userDoc.mobile || '',
      coachExpertSpecialization: userDoc.specialization || '',
      positionId,
      positionTitle: position.position || '',
      client: position.client || '',
      clientspocEmail,
      clientspocName: position.clientspoc_name || position.hr_name || '',
      // Auto-approved: coaches/experts self-assign instantly — no ClientSPOC approval step.
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      respondedAt: new Date(),
      respondedBy: 'auto',
    };

    const docRef = await directRequestsDb.add(requestData);

    // Immediately add the coach/expert to the position (same record the approval
    // step used to create) so it shows up under their Assigned Positions.
    try {
      await coachExpertRequestsDb.add({
        coachExpertId: userDoc.id,
        coachExpertType: roleCategory,
        coachExpertName: userDoc.name || '',
        coachExpertEmail: userEmail,
        coachExpertPhone: userDoc.phone || userDoc.mobile || '',
        recruiterId: 'direct_request',
        recruiterName: 'Direct Request',
        recruiterEmail: userEmail,
        recruiterPhone: '',
        positionId,
        positionTitle: position.position || '',
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (e) { console.error('auto-assign coach_expert_requests failed:', e.message); }

    // FYI email to ClientSPOC (informational — no action needed).
    if (clientspocEmail) {
      const subject = `${roleCategory} self-assigned — ${requestData.positionTitle}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#2563eb;">${roleCategory} Assigned to Your Position</h2>
          <p><strong>${requestData.coachExpertName}</strong> (${roleCategory}) has self-assigned to your open position and can now support it. No action is required.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#f3f4f6;"><td style="padding:10px;font-weight:bold;">Position</td><td style="padding:10px;">${requestData.positionTitle}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Client</td><td style="padding:10px;">${requestData.client}</td></tr>
            <tr style="background:#f3f4f6;"><td style="padding:10px;font-weight:bold;">Email</td><td style="padding:10px;">${requestData.coachExpertEmail}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:14px;">— RecruiterV Team</p>
        </div>`;
      try {
        const _sa = await renderEmail('coachSelfAssigned',
          { roleCategory, positionTitle: requestData.positionTitle || '',
            userName: requestData.coachExpertName || '', dashboardUrl: 'https://www.recruiterv.com' },
          { subject, htmlContent: html });
        if (_sa.htmlContent) await sendEmail(clientspocEmail, _sa.subject, _sa.htmlContent);
      }
      catch (e) { console.error('ClientSPOC FYI email failed:', e.message); }
    }

    res.status(201).json({ success: true, message: 'Assigned! This position is now in your Assigned Positions.', status: 'approved', data: { id: docRef.id, ...requestData } });
  } catch (error) {
    console.error('Error creating direct request:', error);
    res.status(500).json({ success: false, message: 'Failed to send request.', error: error.message });
  }
});

// GET /assigned-positions — Coach/Expert sees positions where their request was approved
router.get('/assigned-positions', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();

    // All approved direct requests for this user
    let snap;
    try {
      snap = await directRequestsDb
        .where('coachExpertEmail', '==', userEmail)
        .where('status', '==', 'approved')
        .orderBy('createdAt', 'desc')
        .get();
    } catch {
      snap = await directRequestsDb
        .where('coachExpertEmail', '==', userEmail)
        .where('status', '==', 'approved')
        .get();
    }

    if (snap.empty) return res.json({ success: true, positions: [] });

    const approvedRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const positionIds = [...new Set(approvedRequests.map(r => r.positionId))];

    // Fetch position details in batches (Firestore limit: 10 per 'in' query)
    const positions = [];
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const posSnap = await positionsDb.where('pos_id', 'in', batch).get();
      posSnap.docs.forEach(doc => positions.push({ id: doc.id, ...doc.data() }));
    }

    // Fetch candidates submitted for these positions
    const candidateDb = db.collection('candidate_db');
    let allCandidates = [];
    for (let i = 0; i < positionIds.length; i += 10) {
      const batch = positionIds.slice(i, i + 10);
      const candSnap = await candidateDb.where('pos_id', 'in', batch).get();
      allCandidates.push(...candSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    const REJECTION_STATUSES = [
      'Screen Reject', 'L1 Reject', 'L2 Reject', 'L3 Reject',
      'HR Reject', 'Background Verification Reject', 'Negotiation Reject', 'Offer Declined',
    ];

    const enriched = positions.map(pos => {
      const req = approvedRequests.find(r => r.positionId === pos.pos_id);
      const posAllCandidates = allCandidates.filter(
        c => c.pos_id === pos.pos_id && !REJECTION_STATUSES.includes(c.statusa)
      );
      const myCandidates = posAllCandidates.filter(
        c => (c.recEmail || '').toLowerCase() === userEmail
      );
      const maxCandidate = pos.maxCandidate || 10;
      const remaining = Math.max(0, maxCandidate - posAllCandidates.length);

      return {
        id: pos.id,
        pos_id: pos.pos_id,
        position: pos.position,
        status: pos.status || '',   // so the UI can show active vs Paused
        client: pos.client,
        hr_name: pos.hr_name,
        clientspoc: pos.clientspoc,
        clientspoc_name: pos.clientspoc_name,
        location: pos.location,
        experience: pos.experience,
        ctcStart: pos.ctcStart,
        ctcEnd: pos.ctcEnd,
        commison: pos.commison,
        commission_type: pos.commission_type || '',
        datePosted: pos.datePosted,
        pos_cat: pos.pos_cat,
        maxCandidate,
        candidateCount: posAllCandidates.length,
        myCandidateCount: myCandidates.length,
        remaining,
        isFull: posAllCandidates.length >= maxCandidate,
        approvedAt: req?.respondedAt,
        myCandidates: myCandidates.map(c => ({
          candidateName: c.candidate || c.name || 'N/A',
          status: c.statusa || 'N/A',
          dateAdded: c.datePosted,
          lastUpdated: c.updatedAt || c.statusaDate || c.datePosted,
        })),
      };
    });

    res.json({ success: true, positions: enriched });
  } catch (error) {
    console.error('Error fetching assigned positions for coach/expert:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assigned positions.', error: error.message });
  }
});

// GET /my-requests — Coach/Expert sees their own sent requests
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    let snap;
    try {
      snap = await directRequestsDb.where('coachExpertEmail', '==', userEmail).orderBy('createdAt', 'desc').get();
    } catch {
      snap = await directRequestsDb.where('coachExpertEmail', '==', userEmail).get();
    }
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching my direct requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
});

// GET /clientspoc — ClientSPOC sees all incoming requests
router.get('/clientspoc', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    let snap;
    try {
      snap = await directRequestsDb.where('clientspocEmail', '==', userEmail).orderBy('createdAt', 'desc').get();
    } catch {
      snap = await directRequestsDb.where('clientspocEmail', '==', userEmail).get();
    }
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching clientspoc direct requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
});

// PUT /:id/status — ClientSPOC approves / rejects / waitlists
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!['approved', 'rejected', 'waitlist'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use approved / rejected / waitlist.' });
    }

    const docRef = directRequestsDb.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Request not found.' });

    const r = doc.data();
    if (r.clientspocEmail !== userEmail) return res.status(403).json({ success: false, message: 'Unauthorized.' });

    await docRef.update({ status, respondedAt: new Date(), respondedBy: userEmail, updatedAt: new Date() });

    // 🔔 Push to the coach/expert about the outcome (approved)
    if (status === 'approved') {
      sendPushToEmails([r.coachExpertEmail], {
        title: 'Request accepted',
        body: `You're approved to work on "${r.positionTitle}"${r.client ? ` · ${r.client}` : ''}.`,
        data: { type: 'request-approved', posId: r.positionId || '' },
      }).catch(() => {});
    }

    // If approved — add coach/expert to position via coach_expert_requests
    if (status === 'approved') {
      await coachExpertRequestsDb.add({
        coachExpertId: r.coachExpertId,
        coachExpertType: r.coachExpertType,
        coachExpertName: r.coachExpertName,
        coachExpertEmail: r.coachExpertEmail,
        coachExpertPhone: r.coachExpertPhone || '',
        recruiterId: 'direct_request',
        recruiterName: 'Direct Request',
        recruiterEmail: userEmail,
        recruiterPhone: '',
        positionId: r.positionId,
        positionTitle: r.positionTitle,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Email Coach/Expert with outcome
    const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
    const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Waitlisted';
    const bodyText = status === 'approved'
      ? `Congratulations! You have been approved to work on <strong>${r.positionTitle}</strong>. You are now added to this position.`
      : status === 'rejected'
        ? `We regret to inform you that your request for <strong>${r.positionTitle}</strong> was not accepted at this time. You may apply for other open positions.`
        : `Your request for <strong>${r.positionTitle}</strong> has been placed on the waitlist. We will notify you if a spot becomes available.`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:${statusColor};">Position Request — ${statusLabel}</h2>
        <p>Dear ${r.coachExpertName},</p>
        <p>${bodyText}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr style="background:#f3f4f6;"><td style="padding:10px;font-weight:bold;">Position</td><td style="padding:10px;">${r.positionTitle}</td></tr>
          <tr><td style="padding:10px;font-weight:bold;">Client</td><td style="padding:10px;">${r.client}</td></tr>
          <tr style="background:#f3f4f6;"><td style="padding:10px;font-weight:bold;">Status</td><td style="padding:10px;color:${statusColor};font-weight:bold;">${statusLabel.toUpperCase()}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;">— RecruiterV Team</p>
      </div>`;

    try {
      const _r = await renderEmail('directCoachRequestStatus', {
        coachExpertName: r.coachExpertName, positionTitle: r.positionTitle, client: r.client, statusLabel,
      }, { subject: `Your Request for "${r.positionTitle}" — ${statusLabel}`, htmlContent: emailHtml });
      await sendEmail(r.coachExpertEmail, _r.subject, _r.htmlContent);
    } catch (e) { console.error('Coach/Expert status email failed:', e.message); }

    try {
      const { notify } = require('../utils/internalMessage');
      await notify('positionAccessDecided', {
        fromEmail: 'support@recruiterv.com',
        toEmail: r.coachExpertEmail,
        vars: {
          recruiterName: r.coachExpertName || 'there',
          positionName: r.positionTitle || '', positionId: r.positionId || '',
          clientName: r.client || '', newStatus: statusLabel, reason: r.reason || '',
        },
        senderRole: 'clientspoc',
        recipientRole: (r.coachExpertType || 'coach').toLowerCase().replace(/\s/g, ''),
      });
    } catch (_) { /* never block the decision */ }

    res.json({ success: true, message: `Request ${statusLabel.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('Error updating direct request status:', error);
    res.status(500).json({ success: false, message: 'Failed to update request.', error: error.message });
  }
});

module.exports = router;
module.exports.assignCoachExpertToPosition = assignCoachExpertToPosition;
