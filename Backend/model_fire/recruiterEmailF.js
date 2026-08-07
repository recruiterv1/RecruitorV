const { db } = require('../router/firebase_ad');
const emails = db.collection('recruiter_emails');

const getRecruiterSenderEmail = (name) => {
  const parts = (name || '').trim().split(/\s+/);
  const first = (parts[0] || 'recruiter').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last  = (parts[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return last ? `${first}.${last}@recruiterv.com` : `${first}@recruiterv.com`;
};

const createEmail = async (data) => {
  const ref = emails.doc();
  const doc = { id: ref.id, ...data, createdAt: new Date() };
  await ref.set(doc);
  return doc;
};

const getEmailsByFolder = async (ownerEmail, folder) => {
  const snap = await emails
    .where('ownerEmail', '==', ownerEmail)
    .where('folder', '==', folder)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const getEmailById = async (id) => {
  const doc = await emails.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const updateEmail = async (id, data) => {
  await emails.doc(id).update(data);
};

const deleteEmail = async (id) => {
  await emails.doc(id).delete();
};

// Find recruiter email address by their @recruiterv.com address (for inbound routing)
const findEmailsByRecruiterAddress = async (toAddress) => {
  const snap = await emails
    .where('recruiterEmail', '==', toAddress)
    .limit(1)
    .get();
  return !snap.empty;
};

module.exports = { createEmail, getEmailsByFolder, getEmailById, updateEmail, deleteEmail, getRecruiterSenderEmail };
