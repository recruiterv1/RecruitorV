// Feature switches held in Firestore, so a capability can be withdrawn without
// a deploy and restored the same way.
//
// `coachExpert` covers the whole Coach/Expert side of the product: registering
// as one, sitting the eligibility test as one, appearing in team lists, and the
// menus that lead there. Admin and SuperAdmin screens are deliberately not
// gated — the records, briefings and assignment history stay visible to whoever
// has to look after them.

const { db } = require('../router/firebase_ad');
const { cached } = require('./cache');

const DEFAULTS = { coachExpert: true };
const TTL_MS = 60 * 1000;          // short, so switching it back on is quick

const flags = () => cached('feature_flags', TTL_MS, async () => {
  try {
    const doc = await db.collection('app_config').doc('features').get();
    return doc.exists ? { ...DEFAULTS, ...doc.data() } : DEFAULTS;
  } catch (e) {
    // A flag lookup must never be the reason a request fails; the safe answer
    // is the way the product worked before anybody switched anything off.
    console.error('feature flags unavailable:', e.message);
    return DEFAULTS;
  }
});

const coachExpertEnabled = async () => (await flags()).coachExpert !== false;

// The roles a person may register or sit the test as, right now.
const openRoles = async (all = ['Coach', 'Expert', 'Recruiter']) =>
  (await coachExpertEnabled()) ? all : all.filter(r => !['Coach', 'Expert'].includes(r));

module.exports = { flags, coachExpertEnabled, openRoles };
