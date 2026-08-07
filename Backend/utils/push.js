/**
 * Reusable FCM push helper for the native app.
 * Device tokens are stored in the `device_tokens` collection ({ email, token, platform }).
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const { db } = require('../router/firebase_ad');

const lc = (s) => (s || '').toString().toLowerCase().trim();
const tokenDocId = (t) => crypto.createHash('sha1').update(t).digest('hex');

const sendToTokens = async (tokens, { title, body, data }) => {
  const uniq = [...new Set((tokens || []).filter(Boolean))];
  if (!uniq.length) return;
  const payloadData = {};
  Object.entries(data || {}).forEach(([k, v]) => { payloadData[k] = String(v == null ? '' : v); });
  for (let i = 0; i < uniq.length; i += 500) {
    const chunk = uniq.slice(i, i + 500);
    const resp = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title: (title || 'RecruiterV').slice(0, 80), body: (body || '').slice(0, 180) },
      data: payloadData,
      android: { priority: 'high', notification: { sound: 'default', channelId: 'chat' } },
    });
    resp.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (code.includes('not-registered') || code.includes('invalid-argument') || code.includes('invalid-registration')) {
          db.collection('device_tokens').doc(tokenDocId(chunk[idx])).delete().catch(() => {});
        }
      }
    });
  }
};

const tokensForEmails = async (emails) => {
  const list = [...new Set((emails || []).map(lc).filter(Boolean))];
  const tokens = [];
  for (let i = 0; i < list.length; i += 10) {
    const batch = list.slice(i, i + 10);
    const snap = await db.collection('device_tokens').where('email', 'in', batch).get();
    snap.forEach(d => { const t = d.data().token; if (t) tokens.push(t); });
  }
  return tokens;
};

// Push to specific users (by email). Best-effort, never throws.
const sendPushToEmails = async (emails, payload) => {
  try {
    const tokens = await tokensForEmails(emails);
    await sendToTokens(tokens, payload);
  } catch (e) { console.error('sendPushToEmails:', e.message); }
};

// Broadcast to every registered device (e.g. a brand new open position).
const sendPushToAll = async (payload) => {
  try {
    const snap = await db.collection('device_tokens').get();
    const tokens = [];
    snap.forEach(d => { const t = d.data().token; if (t) tokens.push(t); });
    await sendToTokens(tokens, payload);
  } catch (e) { console.error('sendPushToAll:', e.message); }
};

module.exports = { sendPushToEmails, sendPushToAll, tokenDocId };
