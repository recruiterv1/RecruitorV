const { db } = require("../router/firebase_ad");
const clientspoc=db.collection('admin_db');
const companyoverview=db.collection('Company_Overview');
const positions = db.collection('admin_AddPos');
const candidates = db.collection('candidate_db');

const createRecruiter= async (data)=>{
    const add= await clientspoc.add(data);
    return { id: add.id, ...data} 

}

const createCompany= async (data)=>{
    const add= await companyoverview.add(data);
    return { id: add.id, ...data} 

}

const findClientSpocByEmail= async (email)=>{
    const snap= await clientspoc.where('email','==',email).get()
    if(snap.empty) return null;
    const doc=snap.docs[0]
    return { id: doc.id, ...doc.data()}
}

const findClientSpocById= async (id)=>{
    const doc= await clientspoc.doc(id).get()
    if(!doc.exists) return null;
    return { id: doc.id, ...doc.data()}
}

const updateClientSpoc= async (id,data)=>{
    await clientspoc.doc(id).update(data)
}

// Create or update clientspoc (upsert) - handles both new and existing profiles
const createOrUpdateClientSpoc = async (id, data) => {
    try {
        const docRef = clientspoc.doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
            // Document exists, do a regular update
            await docRef.update({ ...data, updatedAt: new Date() });
            console.log('[createOrUpdateClientSpoc] Updated existing document:', id);
            const updatedDoc = await docRef.get();
            return { id, ...updatedDoc.data(), exists: true };
        } else {
            // Document doesn't exist, create new with set
            await docRef.set({ ...data, createdAt: new Date(), updatedAt: new Date() }, { merge: true });
            console.log('[createOrUpdateClientSpoc] Created new document:', id);
            return { id, ...data, exists: false };
        }
    } catch (error) {
        console.error('[createOrUpdateClientSpoc] Error:', error);
        throw error;
    }
}

const getAllClientSpocs= async ()=>{
    try {
        const snap= await clientspoc.get();
        if(snap.empty) return [];
        return snap.docs.map(doc => {
            const data = doc.data() || {};
            const phone =
                data.mobile ||
                data.phone ||
                data.mob ||
                data.contact ||
                data.contactNumber ||
                null;
            return {
                id: doc.id,
                name: data.name || 'N/A',
                email: data.email || 'N/A',
                company: data.company || 'N/A',
                mobile: phone || 'N/A'
            };
        });
    } catch (error) {
        console.error("Error getting all client spocs:", error);
        throw error;
    }
}

const toMs = (ts) => {
    if (!ts) return null;
    if (ts._seconds) return ts._seconds * 1000;
    if (ts.seconds) return ts.seconds * 1000;
    if (ts.toDate) return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    const n = new Date(ts).getTime();
    return isNaN(n) ? null : n;
};

const getAllClientSpocsWithStats = async () => {
    try {
        const [spocsSnap, posSnap, candSnap] = await Promise.all([
            clientspoc.get(),
            positions.get(),
            candidates.get()
        ]);

        const allPositions = posSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
        const allCandidates = candSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return spocsSnap.docs.map(doc => {
            const data = doc.data() || {};
            const email = (data.email || '').toLowerCase();
            const phone = data.mobile || data.phone || data.mob || data.contact || data.contactNumber || 'N/A';

            // Positions belonging to this SPOC
            const spocPositions = allPositions.filter(p => (p.clientspoc || '').toLowerCase() === email);

            // Build per-position stats
            let lastActiveMs = null;
            const positionDetails = spocPositions.map(p => {
                const posCands = allCandidates.filter(c => c.pos_id === p.pos_id);
                const recruiterCount = new Set(posCands.map(c => c.recId).filter(Boolean)).size;

                // Track last active across all positions
                posCands.forEach(c => {
                    const ms = toMs(c.updatedAt) || toMs(c.datePosted);
                    if (ms && ms > (lastActiveMs || 0)) lastActiveMs = ms;
                });

                const st = (p.status || '').toLowerCase().trim();
                const inactiveStatuses = ['paused', 'closed', 'on hold', 'hold', 'closed - filled', 'closed - cancelled'];
                const isActive = !inactiveStatuses.some(s => st === s || st.includes(s));
                return {
                    posId: p.pos_id,
                    positionName: p.position || 'N/A',
                    client: p.client || 'N/A',
                    status: p.status || 'Active',
                    isActive,
                    submissionCount: posCands.length,
                    recruiterCount
                };
            });

            // Sort positions by submission count desc
            positionDetails.sort((a, b) => b.submissionCount - a.submissionCount);

            // Active positions: not paused and not closed/on-hold
            const inactiveStatuses = ['paused', 'closed', 'on hold', 'hold', 'closed - filled', 'closed - cancelled'];
            const activePositionCount = spocPositions.filter(p => {
                const st = (p.status || '').toLowerCase().trim();
                return !inactiveStatuses.some(s => st === s || st.includes(s));
            }).length;

            return {
                id: doc.id,
                name: data.name || 'N/A',
                email: email || 'N/A',
                company: data.company || 'N/A',
                mobile: phone,
                positionCount: spocPositions.length,
                activePositionCount,
                lastActiveDate: lastActiveMs ? new Date(lastActiveMs).toISOString() : null,
                positions: positionDetails
            };
        });
    } catch (error) {
        console.error("Error getting client spocs with stats:", error);
        throw error;
    }
};

module.exports={
    createRecruiter,
    createCompany,
    findClientSpocByEmail,
    findClientSpocById,
    updateClientSpoc,
    createOrUpdateClientSpoc,
    getAllClientSpocs,
    getAllClientSpocsWithStats
}
