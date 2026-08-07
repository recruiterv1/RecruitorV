// ─────────────────────────────────────────────────────────────────────────────
// Auto-post newly created positions to the RecruiterV LinkedIn company page.
//
// Config lives in Firestore `app_config/linkedin`:
//   { enabled: true, accessToken: '<OAuth token with w_organization_social>',
//     orgId: '<numeric LinkedIn organization id>' }
//
// The token must belong to an admin of the page, issued by a LinkedIn app that
// has the Community Management API product. Tokens expire (~60 days) — refresh
// via /api/app/linkedin-config. When config is missing/disabled this is a no-op.
// ─────────────────────────────────────────────────────────────────────────────

const getConfig = async () => {
  const { db } = require('../router/firebase_ad');
  const doc = await db.collection('app_config').doc('linkedin').get();
  if (!doc.exists) return null;
  const c = doc.data();
  if (!c.enabled || !c.accessToken || !c.orgId) return null;
  return c;
};

// Turn an arbitrary phrase into a valid LinkedIn hashtag token (alphanumeric,
// no spaces). "SAP ABAP" -> "SapAbap", "Node.js" -> "Nodejs". Skips junk/tiny.
const toHashtag = (raw) => {
  if (!raw) return '';
  const cleaned = String(raw).replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  if (!cleaned) return '';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  // Keep well-known all-caps acronyms as-is, otherwise TitleCase each word.
  const tag = parts.map(w => (w.length <= 4 && w === w.toUpperCase()) ? w : (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('');
  return tag.length >= 2 && tag.length <= 30 ? tag : '';
};

// Split a skills field (comma / newline / slash / pipe separated, or HTML) into
// individual skill phrases.
const splitSkills = (val) => {
  if (!val) return [];
  return String(val)
    .replace(/<[^>]+>/g, ' ')                 // strip any HTML
    .split(/[,;/|\n·•]+/)
    .map(s => s.trim())
    .filter(s => s && s.length <= 40);
};

// Preserve nice casing for known brand/keywords rather than TitleCasing them.
const BRAND_CASE = { recruiterv: 'RecruiterV', odata: 'OData', nodejs: 'NodeJS', reactjs: 'ReactJS', nextjs: 'NextJS', devops: 'DevOps', mlops: 'MLOps', ios: 'iOS' };

const buildHashtags = (pos) => {
  const tags = [];
  const seen = new Set();
  const add = (raw) => {
    let t = toHashtag(raw);
    if (!t) return;
    const key = t.toLowerCase();
    if (BRAND_CASE[key]) t = BRAND_CASE[key];
    if (seen.has(key)) return;
    seen.add(key);
    tags.push('#' + t);
  };

  // Always-on brand/intent hashtags
  ['hiring', 'jobs', 'recruitment', 'hiringnow', 'jobsearch', 'careers', 'RecruiterV'].forEach(add);

  // Role / category
  add(pos.position);
  add(pos.pos_cat);
  add(pos.skill_category);

  // Location cities (added before the longer skill lists so they aren't capped out)
  const locs = Array.isArray(pos.location) ? pos.location : String(pos.location || '').split(',');
  locs.map(l => String(l).trim()).filter(Boolean).forEach(city => { add(city); add('Jobs in ' + city); });

  // Skills — must-have first (highest signal), then good-to-have, then specialization
  splitSkills(pos.m_have).forEach(add);
  splitSkills(pos.g_have).forEach(add);
  splitSkills(pos.skill_sub_category).forEach(add);
  splitSkills(pos.specialization).forEach(add);

  return tags.slice(0, 22).join(' ');   // LinkedIn shows ~first 3 prominently; cap to keep it tidy
};

const buildPostText = (pos) => {
  const loc = Array.isArray(pos.location) ? pos.location.join(', ') : (pos.location || '');
  const lines = [
    `🚀 We're hiring: ${pos.position || 'New Position'}`,
    pos.client ? `🏢 Client: ${pos.client}` : '',
    loc ? `📍 Location: ${loc}` : '',
    pos.experience ? `💼 Experience: ${pos.experience}` : '',
    '',
    `Apply now 👉 https://www.recruiterv.com/position/${pos.pos_id}`,
    '',
    buildHashtags(pos),
  ].filter(l => l !== null && l !== undefined);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').slice(0, 2900);
};

// Post a position to the company page. Fire-and-forget safe: never throws.
// Returns { posted, id?, reason? }.
const postPositionToLinkedIn = async (pos) => {
  try {
    const cfg = await getConfig();
    if (!cfg) return { posted: false, reason: 'LinkedIn posting not configured/enabled' };

    const author = `urn:li:organization:${String(cfg.orgId).replace(/\D/g, '')}`;
    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: buildPostText(pos) },
          shareMediaCategory: 'ARTICLE',
          media: [{
            status: 'READY',
            originalUrl: `https://www.recruiterv.com/position/${pos.pos_id}`,
            title: { text: (pos.position || 'New Position').slice(0, 200) },
            description: { text: `Open position on RecruiterV${pos.client ? ` — ${pos.client}` : ''}`.slice(0, 250) },
          }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error(`❌ LinkedIn post failed (${resp.status}) for position ${pos.pos_id}:`, text.slice(0, 400));
      return { posted: false, reason: `LinkedIn API ${resp.status}: ${text.slice(0, 200)}` };
    }
    let id = '';
    try { id = JSON.parse(text).id || resp.headers.get('x-restli-id') || ''; } catch (_) { id = resp.headers.get('x-restli-id') || ''; }
    console.log(`✅ Position ${pos.pos_id} posted to LinkedIn: ${id}`);

    // Best-effort: record the post id on the position + last-post info on config.
    try {
      const { db } = require('../router/firebase_ad');
      if (pos.id) await db.collection('admin_AddPos').doc(pos.id).update({ linkedin_post_id: id, linkedin_posted_at: new Date() });
      await db.collection('app_config').doc('linkedin').set({ lastPostAt: new Date(), lastPostId: id, lastPostPosId: pos.pos_id || '' }, { merge: true });
    } catch (_) { /* non-fatal */ }

    return { posted: true, id };
  } catch (err) {
    console.error('LinkedIn post error:', err.message);
    return { posted: false, reason: err.message };
  }
};

module.exports = { postPositionToLinkedIn, buildPostText };
