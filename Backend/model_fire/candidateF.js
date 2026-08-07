const { db } = require("../router/firebase_ad");
const candidate=db.collection("candidate_db")
const adminF = require("./adminF")

const createCandidate = async (data) => {
  const docRef = candidate.doc();

  const finalData = {
    ...data,
    id: docRef.id,
    datePosted: new Date(),
  };

//   Object.keys(finalData).forEach(key => {
//     if (finalData[key] === undefined) delete finalData[key];
//   });

  await docRef.set(finalData);
 
  // After creating a candidate, update position visibility
  if (data.pos_id) {
    try {
      await adminF.updatePositionVisibility(data.pos_id);
    } catch (error) {
      console.error("Error updating position visibility after candidate creation:", error);
      // Don't throw - candidate was still created successfully
    }
  }

  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};


const findCandidateById= async (recId)=>{
    const snap= await candidate.where('recId','==',recId).get();
    return snap.docs.map( doc => ({ id:doc.id, ...doc.data()}))
    
}


const showAllCandidate= async ()=>{
    const sow= await candidate.get()
    return sow.docs.map( doc => ({ id:doc.id, ...doc.data() }))
}


const updatePositionStatus = async (id, statusa, meta = {}) => {

    const posRef = candidate.doc(id);
    const posSnap = await posRef.get();

    if (!posSnap.exists) {
        throw new Error("Position not found");
    }

    const candidateData = posSnap.data();
    const pos_id = candidateData.pos_id;

    const now = new Date();
    await posRef.update({
        statusa: statusa,
        statusaDate: now,
        statusChangedAt: now,
        updatedAt: now,
        ...(meta.changedBy ? { statusChangedBy: meta.changedBy } : {}),
        ...(meta.changedByName ? { statusChangedByName: meta.changedByName } : {}),
        ...(meta.rejectReason !== undefined ? { rejectReason: meta.rejectReason } : {}),
    });

    // After updating candidate status, update position visibility
    if (pos_id) {
      try {
        await adminF.updatePositionVisibility(pos_id);
      } catch (error) {
        console.error("Error updating position visibility after status change:", error);
        // Don't throw - status was still updated successfully
      }
    }

    const updatedDoc = await posRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
};


async function findCandidateByEmail(email) {

  if(!email) return null;



  const snapshot = await candidate.where("emails", "==", String(email).trim().toLowerCase())
                           .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

async function findCandidateByPhone(mob) {

  if(!mob) return null;


  const snapshot = await candidate.where("mob", "==", String(mob).trim().toLowerCase())
                           .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}




async function findCandidateByPan(pan) {
  if (!pan) return null;
  const variants = [...new Set([String(pan).trim(), String(pan).trim().toUpperCase()])];
  for (const v of variants) {
    const snapshot = await candidate.where("pan_number", "==", v).limit(1).get();
    if (!snapshot.empty) return snapshot.docs[0].data();
  }
  return null;
}

module.exports={createCandidate, findCandidateByPhone, findCandidateByEmail, findCandidateByPan, updatePositionStatus, findCandidateById,showAllCandidate}