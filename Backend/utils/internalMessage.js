// Internal (in-app chat) message templates.
//
// Four events can send an automatic message into the recipient's Messages inbox.
// A SuperAdmin writes the wording in the Internal Message Templates designer and
// switches it live; until a template exists AND is enabled, nothing is sent —
// so turning a template live is what switches the notification on.
//
// Stored in Firestore `internal_message_templates`, doc id = the trigger key.
// Mirrors the email-template pattern in utils/emailTemplates.js.

const { db } = require('../router/firebase_ad');
const { FieldValue } = require('firebase-admin/firestore');

const lc = (s) => String(s || '').toLowerCase().trim();

const substitute = (str, vars = {}) =>
  String(str || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g,
    (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));

// The four triggers, with the variables each one can offer. `sample` drives the
// preview in the designer.
const TRIGGERS = [
  {
    key: 'candidateSubmitted',
    name: 'Candidate submitted to ClientSPOC',
    description: 'Sent to the ClientSPOC when a recruiter, coach or expert submits a candidate against one of their positions.',
    to: 'ClientSPOC',
    from: 'The submitting recruiter / coach / expert',
    variables: ['spocName', 'recruiterName', 'recruiterRole', 'candidateName', 'positionName', 'positionId', 'clientName'],
    sample: {
      spocName: 'Akansha', recruiterName: 'Rahul Sharma', recruiterRole: 'Recruiter',
      candidateName: 'Priya Nair', positionName: 'Senior Relationship Manager',
      positionId: '1825', clientName: 'Tata Capital',
    },
  },
  {
    key: 'candidateStatusChanged',
    name: 'Candidate status changed',
    description: 'Sent to the recruiter who submitted the candidate when a ClientSPOC changes that candidate’s status.',
    to: 'The submitting recruiter / coach / expert',
    from: 'The ClientSPOC who changed the status',
    variables: ['recruiterName', 'spocName', 'candidateName', 'positionName', 'positionId', 'clientName', 'oldStatus', 'newStatus', 'reason'],
    sample: {
      recruiterName: 'Rahul Sharma', spocName: 'Akansha', candidateName: 'Priya Nair',
      positionName: 'Senior Relationship Manager', positionId: '1825', clientName: 'Tata Capital',
      oldStatus: 'Submitted', newStatus: 'L1 To be Schedule', reason: '',
    },
  },
  {
    key: 'positionAssigned',
    name: 'Position assigned to a recruiter',
    description: 'Sent to the recruiter when a coach, expert or vendor assigns them a position.',
    to: 'The assigned recruiter',
    from: 'The coach / expert / vendor who assigned it',
    variables: ['recruiterName', 'assignerName', 'assignerRole', 'positionName', 'positionId', 'clientName', 'location'],
    sample: {
      recruiterName: 'Rahul Sharma', assignerName: 'Ajitesh Banerjee', assignerRole: 'Coach',
      positionName: 'Senior Relationship Manager', positionId: '1825',
      clientName: 'Tata Capital', location: 'Gurgaon',
    },
  },
  {
    key: 'teamJoinRequest',
    name: 'Team join request',
    description: 'Sent when a coach invites a recruiter to their team, or a recruiter asks to join a coach’s team.',
    to: 'The person receiving the request',
    from: 'The person sending it',
    variables: ['recipientName', 'senderName', 'senderRole', 'direction'],
    sample: {
      recipientName: 'Rahul Sharma', senderName: 'Ajitesh Banerjee', senderRole: 'Coach',
      direction: 'invited you to join their team',
    },
  },
];

const TRIGGER_MAP = Object.fromEntries(TRIGGERS.map(t => [t.key, t]));

/**
 * The live body for a trigger, with variables filled in.
 * @returns {Promise<string|null>} null when no live template exists — the caller
 *   must then send nothing, which is how a SuperAdmin keeps a notification off.
 */
async function renderInternal(key, vars = {}) {
  try {
    const doc = await db.collection('internal_message_templates').doc(key).get();
    if (!doc.exists) return null;
    const t = doc.data();
    if (!t || t.enabled !== true || !String(t.body || '').trim()) return null;
    const text = substitute(t.body, vars).trim();
    return text || null;
  } catch (e) {
    console.error('renderInternal(' + key + '):', e.message);
    return null;
  }
}

const pairKeyOf = (a, b) => [lc(a), lc(b)].sort().join('|');

// Minimal user lookup for the conversation's name/role maps. Kept local so this
// module can be required from any router without a circular import.
async function resolveBasic(email) {
  const e = lc(email);
  const tries = [
    ['recruiter_db', 'recruiter'], ['coach_db', 'coach'],
    ['expert_db', 'expert'], ['admin_db', 'admin'],
  ];
  for (const [col, role] of tries) {
    try {
      const snap = await db.collection(col).where('email', '==', e).limit(1).get();
      if (!snap.empty) {
        const d = snap.docs[0].data();
        const rc = lc(d.roleCategory || d.role || '');
        return { email: e, name: d.name || e.split('@')[0], role: rc || role };
      }
    } catch (_) { /* try the next collection */ }
  }
  return { email: e, name: e.split('@')[0], role: '' };
}

/**
 * Post an internal message into the 1:1 conversation between two people,
 * creating the conversation if they have never spoken. Never throws — a
 * notification failing must not break the action that triggered it.
 */
async function sendInternalMessage({ fromEmail, toEmail, text }) {
  try {
    const from = lc(fromEmail), to = lc(toEmail);
    if (!from || !to || from === to || !String(text || '').trim()) return false;

    const [fromUser, toUser] = await Promise.all([resolveBasic(from), resolveBasic(to)]);
    const pairKey = pairKeyOf(from, to);

    let convId;
    const existing = await db.collection('chat_conversations').where('pairKey', '==', pairKey).limit(1).get();
    if (!existing.empty) {
      convId = existing.docs[0].id;
    } else {
      const created = await db.collection('chat_conversations').add({
        participants: [from, to].sort(),
        pairKey,
        names: { [from]: fromUser.name, [to]: toUser.name },
        roles: { [from]: fromUser.role, [to]: toUser.role },
        lastMessage: '', lastMessageAt: FieldValue.serverTimestamp(), lastSender: '',
        unread: { [from]: 0, [to]: 0 },
        createdAt: FieldValue.serverTimestamp(),
      });
      convId = created.id;
    }

    const body = String(text).trim().slice(0, 4000);
    const now = FieldValue.serverTimestamp();
    await db.collection('chat_messages').add({
      conversationId: convId,
      senderEmail: fromUser.email, senderName: fromUser.name,
      text: body, attachment: null, mentions: [],
      automated: true,                      // so it is clear this was system-sent
      createdAt: now,
    });

    const convRef = db.collection('chat_conversations').doc(convId);
    const conv = await convRef.get();
    const unread = { ...(conv.data().unread || {}) };
    unread[to] = (unread[to] || 0) + 1;
    if (!(from in unread)) unread[from] = 0;
    await convRef.update({
      lastMessage: body.slice(0, 120), lastMessageAt: now, lastSender: from, unread,
    });

    try {
      const { sendPushToEmails } = require('./push');
      sendPushToEmails([to], {
        title: fromUser.name || 'RecruiterV',
        body: body.slice(0, 160),
        data: { type: 'chat', conversationId: convId },
      }).catch(() => {});
    } catch (_) { /* push is best-effort */ }

    return true;
  } catch (e) {
    console.error('sendInternalMessage:', e.message);
    return false;
  }
}

/**
 * Render a trigger's live template and deliver it. Silently does nothing when
 * the SuperAdmin has not made that template live.
 */
async function notify(key, { fromEmail, toEmail, vars = {} }) {
  const text = await renderInternal(key, vars);
  if (!text) return false;
  return sendInternalMessage({ fromEmail, toEmail, text });
}


// ── Custom templates ─────────────────────────────────────────────────────────
// The four triggers above fire on an event. A SuperAdmin can also write their
// own templates, which have no event to hook — those are sent by hand to a
// chosen audience from the designer.

// Audiences a custom message can be sent to.
const AUDIENCES = [
  { key: 'recruiters', label: 'All Recruiters', collection: 'recruiter_db' },
  { key: 'coaches',    label: 'All Coaches',    collection: 'coach_db' },
  { key: 'experts',    label: 'All Experts',    collection: 'expert_db' },
  { key: 'vendors',    label: 'All Vendors',    collection: 'admin_db', roleCategory: 'vendor' },
  { key: 'clientspocs',label: 'All ClientSPOCs',collection: 'admin_db', roleCategory: 'clientspoc' },
  { key: 'custom',     label: 'Specific people (enter emails)', collection: null },
];
const AUDIENCE_MAP = Object.fromEntries(AUDIENCES.map(a => [a.key, a]));

// Variables a custom template may use. Resolved per recipient at send time.
const CUSTOM_VARIABLES = ['name', 'firstName', 'email', 'role'];

/**
 * Everyone in an audience. Only active, non-blocked accounts with an email.
 * @returns {Promise<{email,name,role}[]>}
 */
async function audienceMembers(audienceKey, explicitEmails = []) {
  const a = AUDIENCE_MAP[audienceKey];
  if (!a) return [];

  if (a.key === 'custom') {
    const out = [];
    for (const raw of explicitEmails) {
      const e = lc(raw);
      if (e && !out.some(x => x.email === e)) out.push(await resolveBasic(e));
    }
    return out;
  }

  const snap = await db.collection(a.collection).get();
  const wanted = a.roleCategory;
  return snap.docs
    .map(d => d.data())
    .filter(u => {
      if (!u.email) return false;
      if (lc(u.accountStatus) === 'blocked') return false;
      if (wanted) return lc(u.roleCategory || u.role || '').replace(/\s/g, '') === wanted;
      return true;
    })
    .map(u => ({
      email: lc(u.email),
      name: u.name || lc(u.email).split('@')[0],
      role: lc(u.roleCategory || u.role || ''),
    }));
}

/** Per-recipient variable values for a custom send. */
const varsFor = (person) => ({
  name: person.name || '',
  firstName: (person.name || '').split(' ')[0] || '',
  email: person.email || '',
  role: person.role || '',
});

module.exports = {
  TRIGGERS, TRIGGER_MAP, substitute, renderInternal, sendInternalMessage, notify,
  AUDIENCES, AUDIENCE_MAP, CUSTOM_VARIABLES, audienceMembers, varsFor, resolveBasic,
};
