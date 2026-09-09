// ─────────────────────────────────────────────────────────────────────────────
// Send a newly-posted position to a Zapier "Catch Hook" webhook, which then
// posts it to the RecruiterV LinkedIn company Page (via a LinkedIn action step
// built inside Zapier).
//
// Config lives in Firestore `app_config/zapier`:
//   { enabled: true, webhookUrl: 'https://hooks.zapier.com/hooks/catch/....' }
// It can also be set via env ZAPIER_LINKEDIN_WEBHOOK_URL. When neither is set /
// disabled, this is a no-op. Fire-and-forget — never blocks position creation.
// ─────────────────────────────────────────────────────────────────────────────

const getWebhookUrl = async () => {
  if (process.env.ZAPIER_LINKEDIN_WEBHOOK_URL) return process.env.ZAPIER_LINKEDIN_WEBHOOK_URL;
  try {
    const { db } = require('../router/firebase_ad');
    const doc = await db.collection('app_config').doc('zapier').get();
    if (!doc.exists) return null;
    const c = doc.data();
    if (c.enabled === false || !c.webhookUrl) return null;
    return c.webhookUrl;
  } catch (_) { return null; }
};

const locText = (loc) => Array.isArray(loc) ? loc.filter(Boolean).join(', ') : (loc || '');

const toHashtag = (raw) => {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  if (!cleaned) return '';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const tag = parts.map(w => (w.length <= 4 && w === w.toUpperCase()) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  return tag.length >= 2 && tag.length <= 30 ? '#' + tag : '';
};

// Build a ready-to-post LinkedIn caption so Zapier can map one field straight
// into the LinkedIn "commentary"/update, no assembly needed on their side.
const buildCaption = (pos, link) => {
  const title = pos.position || 'New Opening';
  const loc = locText(pos.location);
  const exp = pos.experience || [pos.min_exp, pos.max_exp].filter(Boolean).join('–');
  const lines = [`🚀 We're hiring: ${title}`];
  if (pos.client) lines.push(`🏢 ${pos.client}`);
  if (loc) lines.push(`📍 ${loc}`);
  if (exp) lines.push(`💼 Experience: ${exp} yrs`);
  if (pos.employment_type || pos.work_mode) lines.push(`🗂️ ${[pos.employment_type, pos.work_mode].filter(Boolean).join(' · ')}`);
  if (link) lines.push(`\n👉 Apply / view details: ${link}`);
  const tags = [toHashtag('Hiring'), toHashtag('RecruiterV'), toHashtag(pos.skill_category), toHashtag(pos.pos_cat), toHashtag('Jobs')]
    .filter(Boolean);
  if (tags.length) lines.push('\n' + [...new Set(tags)].join(' '));
  return lines.join('\n');
};

async function postPositionToZapier(pos) {
  try {
    if (!pos || !pos.pos_id) return { skipped: 'no-position' };
    const url = await getWebhookUrl();
    if (!url) return { skipped: 'not-configured' };

    const frontUrl = process.env.FRONTURL || 'https://www.recruiterv.com';
    const link = `${frontUrl}/position/${pos.pos_id}?view=share`;

    const payload = {
      pos_id: pos.pos_id,
      title: pos.position || '',
      client: pos.client || '',
      location: locText(pos.location),
      experience: pos.experience || [pos.min_exp, pos.max_exp].filter(Boolean).join('–') || '',
      skill_category: pos.skill_category || '',
      employment_type: pos.employment_type || '',
      work_mode: pos.work_mode || '',
      no_of_positions: pos.no_of_positions || '',
      clientspoc: pos.clientspoc || '',
      link,
      // Ready-to-post caption — map THIS field to the LinkedIn update in Zapier.
      message: buildCaption(pos, link),
      postedAt: new Date().toISOString(),
    };

    // Every attempt is recorded, success or failure. Without this the only trace
    // was a console line, so the integration could stop for weeks with nothing
    // to show whether positions were being sent at all.
    //
    // Note what a 200 here does and does not prove: Make accepts and queues a
    // webhook even when its scenario is switched off or erroring, so a run of
    // successes below still does not guarantee anything reached LinkedIn.
    const record = async (fields) => {
      try {
        const { db } = require('../router/firebase_ad');
        await db.collection('app_config').doc('zapier').set({
          lastSendAt: new Date(),
          lastSendPosId: pos.pos_id || '',
          lastSendPosition: pos.position || '',
          ...fields,
        }, { merge: true });
        if (pos.id) {
          await db.collection('admin_AddPos').doc(pos.id).update({
            zapier_sent_at: new Date(),
            zapier_ok: fields.lastSendOk === true,
          });
        }
      } catch (_) { /* logging must never break the send */ }
    };

    let resp;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      console.error('Zapier webhook unreachable:', netErr.message);
      await record({ lastSendOk: false, lastSendError: netErr.message });
      return { ok: false, error: netErr.message };
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(`Zapier webhook responded ${resp.status}`);
      await record({ lastSendOk: false, lastSendStatus: resp.status, lastSendError: body.slice(0, 200) });
      return { ok: false, status: resp.status };
    }
    console.log(`🔗 Zapier: sent position ${pos.pos_id} to LinkedIn webhook`);
    await record({ lastSendOk: true, lastSendStatus: resp.status, lastSendError: '' });
    return { ok: true };
  } catch (e) {
    console.error('postPositionToZapier error:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { postPositionToZapier };
