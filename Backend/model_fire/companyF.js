const {db}=require('../router/firebase_ad')
const bcrypt=require('bcryptjs')
const company= db.collection('Company_Overview')

// Company portal login lives on the Company_Overview doc: { email, codPass (bcrypt),
// portalEnabled, assignedClientspoc, assignedClientspocName } — set by SuperAdmin.
async function findCompanyByEmail(email){
    const e = (email || '').toLowerCase().trim();
    const snap = await company.where('email','==',e).limit(1).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function getCompanyById(id){
    const doc = await company.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

async function checkCompanyCredentials(email, pass){
    const c = await findCompanyByEmail(email);
    if (!c) return { success:false, message:'Invalid credentials' };
    if (c.portalEnabled === false) return { success:false, message:'Portal access is disabled for this company.' };
    if (!c.codPass) return { success:false, message:'Portal login not set up. Contact your administrator.' };
    const ok = await bcrypt.compare(pass, c.codPass);
    if (!ok) return { success:false, message:'Invalid credentials' };
    return { success:true, company:c };
}

// SuperAdmin sets/updates a company's portal login + assigned ClientSPOC(s).
// `clientspocs` (array of {email,name}) enables multiple SPOCs; the first is kept as
// the primary in assignedClientspoc/Name for backward compatibility.
async function setCompanyPortalAccess(id, { email, password, clientspocEmail, clientspocName, clientspocs, portalEnabled }){
    const patch = { updatedAt: new Date() };
    if (email !== undefined) patch.email = (email || '').toLowerCase().trim();
    if (password) patch.codPass = await bcrypt.hash(password, 10);

    // Normalise a multi-SPOC list; fall back to the single clientspocEmail/Name.
    let list = null;
    if (Array.isArray(clientspocs)) {
        const seen = new Set();
        list = clientspocs
            .map(s => ({ email: (s.email || '').toLowerCase().trim(), name: (s.name || '').trim() }))
            .filter(s => s.email && !seen.has(s.email) && seen.add(s.email));
    } else if (clientspocEmail !== undefined) {
        list = clientspocEmail ? [{ email: (clientspocEmail || '').toLowerCase().trim(), name: clientspocName || '' }] : [];
    }
    if (list) {
        patch.assignedClientspocs = list;
        patch.assignedClientspoc = list[0]?.email || '';
        patch.assignedClientspocName = list[0]?.name || '';
    }

    if (portalEnabled !== undefined) patch.portalEnabled = !!portalEnabled;
    await company.doc(id).set(patch, { merge: true });
    const doc = await company.doc(id).get();
    return { id: doc.id, ...doc.data() };
}

async function fetchCompanyOverview(companyName){
    const lowerName = companyName.toLowerCase().trim();

    // Primary: match by 'lower' field (existing behaviour)
    const byLower = await company.where('lower','==',lowerName).get();
    if (!byLower.empty) return byLower.docs[0].data();

    // Fallback: fetch all and match name case-insensitively
    // (handles cases where 'lower' was entered incorrectly)
    const all = await company.get();
    const match = all.docs.find(doc => {
        const n = (doc.data().name || '').toLowerCase().trim();
        return n === lowerName;
    });
    if (match) return match.data();

    return null;
}

async function getAllCompanies() {
    const snapshot = await company.get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

async function updateCompany(id, data) {
    const ref = company.doc(id);
    await ref.update(data);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
}

module.exports={fetchCompanyOverview, getAllCompanies, updateCompany, findCompanyByEmail, getCompanyById, checkCompanyCredentials, setCompanyPortalAccess}
