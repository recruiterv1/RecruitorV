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
const { FieldValue } = require('../db');

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


/**
 * Every live template for an event. A template may pin itself to a sender and/or
 * recipient role — when it does, it only applies to matching parties, which is
 * what "from whom, to whom" means in the designer.
 */
async function templatesForEvent(eventKey, { senderRole = '', recipientRole = '' } = {}) {
  try {
    const snap = await db.collection('internal_message_templates')
      .where('event', '==', eventKey).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.enabled === true && String(t.body || '').trim())
      .filter(t => !t.senderRole || !senderRole || lc(t.senderRole) === lc(senderRole))
      .filter(t => !t.recipientRole || !recipientRole || lc(t.recipientRole) === lc(recipientRole));
  } catch (e) {
    console.error('templatesForEvent(' + eventKey + '):', e.message);
    return [];
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
async function notify(key, { fromEmail, toEmail, vars = {}, senderRole = '', recipientRole = '' }) {
  let delivered = false;

  // The built-in template for this event, if the SuperAdmin made it live.
  const builtIn = await renderInternal(key, vars);
  if (builtIn) delivered = await sendInternalMessage({ fromEmail, toEmail, text: builtIn }) || delivered;

  // Plus any templates they wrote themselves for this event and role pair.
  const extra = await templatesForEvent(key, { senderRole, recipientRole });
  for (const t of extra) {
    const text = substitute(t.body, vars).trim();
    if (text) delivered = await sendInternalMessage({ fromEmail, toEmail, text }) || delivered;
  }
  return delivered;
}



// ── Role types ───────────────────────────────────────────────────────────────
// A template is defined as "from this role, to that role". These are the roles
// that exist on the platform and can hold a Messages inbox.
const ROLE_TYPES = [
  { key: 'recruiter',      label: 'Recruiter',       collection: 'recruiter_db' },
  { key: 'coach',          label: 'Coach',           collection: 'coach_db' },
  { key: 'expert',         label: 'Expert',          collection: 'expert_db' },
  { key: 'clientspoc',     label: 'ClientSPOC',      collection: 'admin_db', roleCategory: 'clientspoc' },
  { key: 'vendor',         label: 'Vendor',          collection: 'admin_db', roleCategory: 'vendor' },
  { key: 'company',        label: 'Company',         collection: 'admin_db', roleCategory: 'company' },
  { key: 'consultingfirm', label: 'Consulting Firm', collection: 'consulting_firms' },
];
const ROLE_MAP = Object.fromEntries(ROLE_TYPES.map(r => [r.key, r]));

// ── When a template is delivered ─────────────────────────────────────────────
// A role pair says who talks to whom, but not when. Each event below names the
// moment the message goes out and the roles it naturally runs between; 'manual'
// means the SuperAdmin sends it by hand.
const TEMPLATE_EVENTS = [
  {
    key: 'candidateSubmitted',
    label: 'A candidate is submitted against a position',
    sender: ['recruiter', 'coach', 'expert', 'vendor'], recipient: ['clientspoc'],
    variables: ['recruiterName', 'recruiterRole', 'spocName', 'candidateName',
                'positionName', 'positionId', 'clientName'],
  },
  {
    key: 'candidateStatusChanged',
    label: "A candidate's status is changed",
    sender: ['clientspoc'], recipient: ['recruiter', 'coach', 'expert', 'vendor'],
    variables: ['recruiterName', 'spocName', 'candidateName', 'positionName',
                'positionId', 'clientName', 'oldStatus', 'newStatus', 'reason'],
  },
  {
    key: 'positionAssigned',
    label: 'A position is assigned to a recruiter',
    sender: ['coach', 'expert', 'vendor'], recipient: ['recruiter'],
    variables: ['recruiterName', 'assignerName', 'assignerRole', 'positionName',
                'positionId', 'clientName', 'location'],
  },
  {
    key: 'teamJoinRequest',
    label: 'A team join request is sent',
    sender: ['coach', 'expert', 'recruiter'], recipient: ['recruiter', 'coach', 'expert'],
    variables: ['recipientName', 'senderName', 'senderRole', 'direction'],
  },
  {
    key: 'accountApproved',
    label: 'An account is approved',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['recruiter', 'coach', 'expert', 'vendor', 'clientspoc'],
    variables: ['name', 'firstName', 'email', 'role', 'loginUrl', 'dashboardUrl'],
  },
  {
    key: 'accountRejected',
    label: 'An account is rejected',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['recruiter', 'coach', 'expert', 'vendor', 'clientspoc'],
    variables: ['name', 'firstName', 'email', 'role', 'reason', 'supportEmail'],
  },
  {
    key: 'registrationReceived',
    label: 'Someone registers',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['recruiter', 'coach', 'expert', 'vendor', 'clientspoc'],
    variables: ['name', 'firstName', 'email', 'role', 'loginUrl', 'supportEmail'],
  },
  {
    key: 'candidateAutoRejected',
    label: 'A candidate is auto screen-rejected',
    sender: ['clientspoc'], recipient: ['recruiter', 'coach', 'expert', 'vendor'],
    variables: ['recruiterName', 'candidateName', 'positionName', 'positionId', 'clientName', 'newStatus'],
  },
  {
    key: 'positionAccessDecided',
    label: 'A position access request is approved or rejected',
    sender: ['clientspoc', 'coach', 'expert'], recipient: ['recruiter', 'coach', 'expert'],
    variables: ['recruiterName', 'positionName', 'positionId', 'clientName', 'newStatus', 'reason'],
  },
  {
    key: 'companyApproved',
    label: 'A company is approved',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['company', 'clientspoc'],
    variables: ['name', 'clientName', 'email', 'loginUrl', 'dashboardUrl'],
  },
  {
    key: 'companySpocAssigned',
    label: 'A ClientSPOC is assigned to a company',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['company', 'clientspoc'],
    variables: ['name', 'clientName', 'spocName', 'email'],
  },
  {
    key: 'employerSubmissionReceived',
    label: 'An employer submits a position',
    sender: ROLE_TYPES.map(r => r.key), recipient: ['company', 'clientspoc'],
    variables: ['name', 'clientName', 'positionName', 'positionId'],
  },
  {
    key: 'employerSubmissionRejected',
    label: 'An employer position is rejected',
    sender: ['clientspoc'], recipient: ['company'],
    variables: ['name', 'clientName', 'positionName', 'positionId', 'reason'],
  },
  {
    key: 'vendorRegisteredRecruiter',
    label: 'A vendor registers a recruiter',
    sender: ['vendor'], recipient: ['recruiter'],
    variables: ['name', 'firstName', 'email', 'senderName', 'loginUrl', 'dashboardUrl', 'supportEmail'],
  },
  {
    key: 'manual',
    label: 'Only when I send it by hand',
    sender: ROLE_TYPES.map(r => r.key), recipient: ROLE_TYPES.map(r => r.key),
    variables: [],
  },
];
const EVENT_MAP = Object.fromEntries(TEMPLATE_EVENTS.map(e => [e.key, e]));

// ── Custom templates ─────────────────────────────────────────────────────────
// The four triggers above fire on an event. A SuperAdmin can also write their
// own templates, which have no event to hook — those are sent by hand to a
// chosen audience from the designer.

// Audiences a custom message can be sent to.
const AUDIENCES = [
  { key: 'recruiters', label: 'All Recruiters', collection: 'recruiter_db', role: 'recruiter' },
  { key: 'coaches',    label: 'All Coaches',    collection: 'coach_db',     role: 'coach' },
  { key: 'experts',    label: 'All Experts',    collection: 'expert_db',    role: 'expert' },
  { key: 'vendors',    label: 'All Vendors',    collection: 'admin_db', roleCategory: 'vendor',     role: 'vendor' },
  { key: 'clientspocs',label: 'All ClientSPOCs',collection: 'admin_db', roleCategory: 'clientspoc', role: 'clientspoc' },
  { key: 'custom',     label: 'Specific people (enter emails)', collection: null },
];
const AUDIENCE_MAP = Object.fromEntries(AUDIENCES.map(a => [a.key, a]));

// Variables a custom template may use, grouped for the designer. Everything here
// resolves per recipient at send time, so one template reads personally to each
// person who gets it.
const CUSTOM_VARIABLE_GROUPS = [
  {
    group: 'Position & candidate',
    variables: [
      { key: 'candidateName', label: 'Candidate name' },
      { key: 'positionName',  label: 'Position name' },
      { key: 'positionId',    label: 'Position ID' },
      { key: 'clientName',    label: 'Client / company name' },
      { key: 'oldStatus',     label: 'Previous status' },
      { key: 'newStatus',     label: 'New status' },
      { key: 'reason',        label: 'Reason (on a rejection)' },
      { key: 'location',      label: 'Position location' },
    ],
  },
  {
    group: 'People in this message',
    variables: [
      { key: 'recruiterName', label: 'Recruiter name' },
      { key: 'recruiterRole', label: 'Recruiter / coach / expert' },
      { key: 'spocName',      label: 'ClientSPOC name' },
      { key: 'assignerName',  label: 'Who assigned the position' },
      { key: 'assignerRole',  label: 'Their role' },
      { key: 'recipientName', label: 'Who receives this message' },
      { key: 'senderRole',    label: "Sender's role" },
      { key: 'direction',     label: 'What the request says' },
    ],
  },
  {
    group: 'Recipient profile',
    variables: [
      { key: 'name',               label: 'Full name' },
      { key: 'firstName',          label: 'First name' },
      { key: 'lastName',           label: 'Last name' },
      { key: 'email',              label: 'Email address' },
      { key: 'phone',              label: 'Phone number' },
      { key: 'role',               label: 'Role (recruiter, coach, …)' },
      { key: 'location',           label: 'Location on their profile' },
      { key: 'skillCategory',      label: 'Skill categories' },
      { key: 'experienceCategory', label: 'Experience category' },
      { key: 'company',            label: 'Company (ClientSPOC / vendor)' },
      { key: 'designation',        label: 'Designation' },
      { key: 'joinedDate',         label: 'Date they registered' },
    ],
  },
  {
    group: 'Links',
    variables: [
      { key: 'siteUrl',         label: 'recruiterv.com' },
      { key: 'loginUrl',        label: 'Login page' },
      { key: 'dashboardUrl',    label: 'Their dashboard' },
      { key: 'positionsUrl',    label: 'Open positions page' },
      { key: 'appDownloadUrl',  label: 'Android app download' },
      { key: 'profileUrl',      label: 'Their profile page' },
    ],
  },
  {
    group: 'Sender & platform',
    variables: [
      { key: 'senderName',   label: 'Who is sending (you)' },
      { key: 'senderEmail',  label: 'Your email' },
      { key: 'platformName', label: 'RecruiterV' },
      { key: 'supportEmail', label: 'Support email address' },
    ],
  },
  {
    group: 'Date',
    variables: [
      { key: 'today',        label: "Today's date" },
      { key: 'currentMonth', label: 'Current month' },
      { key: 'currentYear',  label: 'Current year' },
    ],
  },
];

// Flat list of keys, for validation and the fallback in the designer.
const CUSTOM_VARIABLES = CUSTOM_VARIABLE_GROUPS.flatMap(g => g.variables.map(v => v.key));

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
      if (!e || out.some(x => x.email === e)) continue;
      let doc = null;
      for (const col of ['recruiter_db', 'coach_db', 'expert_db', 'admin_db']) {
        const snap = await db.collection(col).where('email', '==', e).limit(1).get();
        if (!snap.empty) { doc = snap.docs[0].data(); break; }
      }
      out.push(doc ? personFrom(doc) : personFrom({ email: e }));
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
    .map(u => personFrom(u, a.role));
}

// Normalise a user document into the fields the variables draw on.
const personFrom = (u, fallbackRole = '') => {
  const asText = (v) => Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v || '');
  const when = (v) => {
    if (!v) return '';
    const d = v._seconds ? new Date(v._seconds * 1000) : (v.toDate ? v.toDate() : new Date(v));
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return {
    email: lc(u.email || ''),
    name: u.name || lc(u.email || '').split('@')[0],
    role: lc(u.roleCategory || u.role || fallbackRole),
    phone: u.phone || u.mobile || u.contact || '',
    location: asText(u.location),
    skillCategory: asText(u.skillCategory || u.skill_category || u.specialization),
    experienceCategory: asText(u.experienceCategory),
    company: u.company || u.vendorName || '',
    designation: u.designation || u.currentTitle || '',
    joinedDate: when(u.registrationDate || u.createdAt),
  };
};

// Where each role lands after signing in — used by {{dashboardUrl}}.
const SITE = (process.env.FRONTURL || 'https://www.recruiterv.com').replace(/\/$/, '');
const DASHBOARD_BY_ROLE = {
  recruiter: '/dash_rec', coach: '/coach-dashboard', expert: '/expert-dashboard',
  vendor: '/vendor-dashboard', clientspoc: '/ad_panel#dashboard',
};

/**
 * Per-recipient variable values for a custom send.
 * @param person  a record from personFrom()
 * @param sender  { name, email } of the SuperAdmin sending
 */
const varsFor = (person, sender = {}) => {
  const now = new Date();
  const role = lc(person.role || '').replace(/\s/g, '');
  const parts = String(person.name || '').trim().split(/\s+/);
  return {
    ...person,
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',

    siteUrl: SITE,
    loginUrl: `${SITE}/log_rec`,
    dashboardUrl: SITE + (DASHBOARD_BY_ROLE[role] || '/dash_rec'),
    positionsUrl: `${SITE}/dash_position`,
    appDownloadUrl: `${SITE}/get-app`,
    profileUrl: `${SITE}/dash_form`,

    senderName: sender.name || 'RecruiterV',
    senderEmail: sender.email || '',
    platformName: 'RecruiterV',
    supportEmail: 'support@recruiterv.com',

    today: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    currentMonth: now.toLocaleDateString('en-IN', { month: 'long' }),
    currentYear: String(now.getFullYear()),
  };
};

module.exports = {
  TRIGGERS, TRIGGER_MAP, substitute, renderInternal, sendInternalMessage, notify,
  AUDIENCES, AUDIENCE_MAP, CUSTOM_VARIABLES, CUSTOM_VARIABLE_GROUPS,
  ROLE_TYPES, ROLE_MAP, TEMPLATE_EVENTS, EVENT_MAP,
  audienceMembers, varsFor, personFrom, resolveBasic, templatesForEvent,
};
