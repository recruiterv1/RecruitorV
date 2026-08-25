const {db}=require('../router/firebase_ad')

const adminData=db.collection('admin_db');
const bcrypt=require('bcryptjs')

// Case-insensitive admin lookup:
// 1. Try the fast lowercase query first (newer accounts are stored lowercase).
// 2. If not found, scan all admin_db docs and match email case-insensitively
//    (legacy accounts may be stored with mixed-case emails, e.g.
//    "Jayashree.prakash@changeleaders.in").
const findAdminByEmailCi = async (email) => {
  const normalized = (email || '').toLowerCase().trim();
  if (!normalized) return null;

  // Fast path: exact lowercase query
  const snap = await adminData.where('email', '==', normalized).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Fallback: scan all (admin_db is small) for case-insensitive match
  const all = await adminData.get();
  for (const doc of all.docs) {
    const d = doc.data();
    if (d.email && String(d.email).toLowerCase().trim() === normalized) {
      return { id: doc.id, ...d };
    }
  }
  return null;
};

// Password check that tolerates stray leading/trailing whitespace from browser
// autofill/paste (a very common "works in curl, fails in the browser" cause).
// Tries the EXACT value first (so nothing that used to work changes), then a
// trimmed retry — this only ever ADMITS more inputs, never rejects a prior match.
const pwMatch = async (pass, storedPass) => {
    const p = pass == null ? '' : String(pass);
    const s = storedPass == null ? '' : String(storedPass);
    const isBcrypt = s.startsWith('$2') && s.length >= 60;
    if (isBcrypt) {
        if (await bcrypt.compare(p, s)) return true;
        if (p !== p.trim() && await bcrypt.compare(p.trim(), s)) return true;
        return false;
    }
    return p === s || p.trim() === s.trim();
};

const checkCredentials = async(email,pass)=>{
    try{
        const admin= await findAdminByEmailCi(email);

        // Fallback: SuperAdmin may live in recruiter_db (e.g. roshan@freepathshala.org)
        // with no password in admin_db. Resolve them here so they can sign in.
        // This triggers when: (a) no admin found in admin_db, OR (b) the admin
        // exists in admin_db but has no password field set.
        const recruiterF = require('./recruiterF');

        if (!admin) {
            const rec = await recruiterF.findRecruiterByEmail((email || '').toLowerCase().trim());
            if (rec && (rec.roleCategory === 'Super Admin' || rec.roleCategory === 'SuperAdmin' || rec.role === 'SuperAdmin')) {
                const stored = rec.password || rec.codPass;
                if (stored && await pwMatch(pass, stored)) {
                    return { success: true, message: "Verified Successfully", admin: rec };
                }
            }
            return { success: false, message: "Invalid Credentials" };
        }

        // Support both codPass (new) and password (legacy) field names
        const storedPass = admin.codPass || admin.password;

        // Admin found in admin_db but has no password — try recruiter_db SuperAdmin fallback
        if (!storedPass) {
            const rec = await recruiterF.findRecruiterByEmail((email || '').toLowerCase().trim());
            if (rec && (rec.roleCategory === 'Super Admin' || rec.roleCategory === 'SuperAdmin' || rec.role === 'SuperAdmin')) {
                const stored = rec.password || rec.codPass;
                if (stored && await pwMatch(pass, stored)) {
                    return { success: true, message: "Verified Successfully", admin: rec };
                }
            }
            return { success: false, message: "Invalid Credentials" };
        }

        const ismatch = await pwMatch(pass, storedPass);

        if(!ismatch){
            return { success: false, message: "Invalid Credentials"}
        }

        // Self-registered Company / Vendor accounts sit at 'pending' until a
        // SuperAdmin approves them. Refuse the sign-in until then, otherwise
        // approval would mean nothing.
        const status = String(admin.accountStatus || '').toLowerCase().trim();
        if (status === 'pending') {
            return {
                success: false,
                pending: true,
                message: "Your account is awaiting approval. We'll email you as soon as it's approved.",
            };
        }
        if (status === 'blocked') {
            return {
                success: false,
                blocked: true,
                message: "Your access has been put on hold by the administrator.",
            };
        }

        // A vendor on a paid plan is refused once the term has lapsed. Other
        // admin_db roles are unaffected.
        if (String(admin.roleCategory || admin.role || '').toLowerCase().replace(/\s/g, '') === 'vendor') {
            try {
                const { assertSubscriptionActive } = require('../router/portalSubscription');
                const st = await assertSubscriptionActive(admin.email);
                if (!st.active) {
                    return {
                        success: false,
                        expired: true,
                        message: st.reason === 'never-paid'
                            ? 'Your subscription has not been activated yet. Please complete the payment to sign in.'
                            : 'Your subscription has expired. Please renew to sign in again.',
                    };
                }
            } catch (e) {
                // A failure here must not lock anyone out of an account that paid.
                console.error('vendor subscription check failed:', e.message);
            }
        }

        return { success: true, message: "Verified Successfully", admin}

    } catch (error){
        console.error("Error verifying admin:", error);
        return { success: false, message: "Server Error" };

    }

}

const checkData = async (email)=>{
    try{
        const admin= await findAdminByEmailCi(email);

        if (!admin) {
            return { success: false, message: "Admin not found" };
        }

        return {success: true, admin}

    } catch (error){
        console.error("Error verifying admin:", error);
        return { success: false, message: "Server Error" };

    }
}

const updateAdmin = async (email, data) => {
    try {
        const admin= await findAdminByEmailCi(email);
        
        if (!admin) {
            return { success: false, message: "Admin not found" };
        }

        await adminData.doc(admin.id).update(data);
        
        return { success: true, message: "Admin updated successfully" };
    } catch (error) {
        console.error("Error updating admin:", error);
        return { success: false, message: "Server Error" };
    }
}

// New function to get user by email
const getAdminByEmail = async (email) => {
    try {
        const admin= await findAdminByEmailCi(email);
        
        if (!admin) {
            return { success: false, message: "Admin not found" };
        }

        return { 
            success: true, 
            admin
        };
    } catch (error) {
        console.error("Error getting admin:", error);
        return { success: false, message: "Server Error" };
    }
}

module.exports={checkCredentials,checkData,updateAdmin,getAdminByEmail}
