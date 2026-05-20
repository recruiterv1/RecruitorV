const { db } = require("../router/firebase_ad");
const clientspoc=db.collection('admin_db');
const companyoverview=db.collection('Company_Overview')

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
        return snap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || 'N/A',
            email: doc.data().email || 'N/A',
            company: doc.data().company || 'N/A',
            mobile: doc.data().mobile || 'N/A'
        }));
    } catch (error) {
        console.error("Error getting all client spocs:", error);
        throw error;
    }
}

module.exports={
    createRecruiter,
    createCompany,
    findClientSpocByEmail,
    findClientSpocById,
    updateClientSpoc,
    createOrUpdateClientSpoc,
    getAllClientSpocs
}
