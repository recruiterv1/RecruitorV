const { db } = require('../router/firebase_ad');
const bcrypt = require('bcryptjs');
const firms = db.collection('consulting_firms');

// A consulting firm is a tenant with its own login and admin-set quotas. It owns
// companies, positions, recruiters and ClientSPOCs — all tagged consultingFirmId.
// Quotas: { maxCompanies, maxPositions, maxClientspocs, maxRecruiters }.
const DEFAULT_QUOTAS = { maxCompanies: 0, maxPositions: 0, maxClientspocs: 0, maxRecruiters: 0 };

const createFirm = async (data) => {
  const ref = firms.doc();
  const doc = {
    id: ref.id,
    name: data.name || '',
    lower: (data.name || '').toLowerCase().trim(),
    email: (data.email || '').toLowerCase().trim(),
    phone: data.phone || '',
    codPass: data.codPass || '',
    quotas: { ...DEFAULT_QUOTAS, ...(data.quotas || {}) },
    status: data.status || 'pending',   // pending | approved | blocked
    createdAt: new Date(),
  };
  await ref.set(doc);
  return doc;
};

const findFirmByEmail = async (email) => {
  const e = (email || '').toLowerCase().trim();
  const snap = await firms.where('email', '==', e).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

const getFirmById = async (id) => {
  const doc = await firms.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const checkFirmCredentials = async (email, pass) => {
  const f = await findFirmByEmail(email);
  if (!f) return { success: false, message: 'Invalid credentials' };
  if (!f.codPass) return { success: false, message: 'Login not set up yet. Contact the administrator.' };
  const ok = await bcrypt.compare(pass, f.codPass);
  if (!ok) return { success: false, message: 'Invalid credentials' };
  // The account is only active once an administrator approves it.
  if (f.status === 'blocked') return { success: false, message: 'This firm account is blocked. Contact the administrator.' };
  if (f.status !== 'approved') return { success: false, message: 'Your firm account is pending administrator approval. You can log in once it is approved.' };
  return { success: true, firm: f };
};

const updateFirm = async (id, data) => {
  await firms.doc(id).set({ ...data, updatedAt: new Date() }, { merge: true });
  const doc = await firms.doc(id).get();
  return { id: doc.id, ...doc.data() };
};

const setFirmPassword = async (id, plain) => {
  const codPass = await bcrypt.hash(plain, 10);
  await firms.doc(id).set({ codPass, updatedAt: new Date() }, { merge: true });
};

const getAllFirms = async () => {
  const snap = await firms.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

module.exports = {
  DEFAULT_QUOTAS, createFirm, findFirmByEmail, getFirmById, checkFirmCredentials,
  updateFirm, setFirmPassword, getAllFirms,
};
