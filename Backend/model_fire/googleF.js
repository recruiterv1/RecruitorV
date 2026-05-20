const { db } = require("../router/firebase_ad");
const user_g=db.collection("google_users")

// const findbyUid= async (uid)=>{

//     const snap= await user_g.where('uid', '==', uid).limit(1).get()
//     if(snap.empty) return null;
//     const doc=snap.docs[0]
//     return { id: doc.id, ...doc.data()}

// }

const createUser= async (data)=>{
    const docs= await user_g.add(data)
    const doc= await docs.get()
    return { id: doc.id, ...doc.data()}

}


const findByEmail= async (email)=>{
    const snap= await user_g.where('email','==',email).get()
    if(snap.empty) return null;
    const doc=snap.docs[0]
    return { id: doc.id, ...doc.data(),source: 'Google'}
    
}

const updateRecruiter= async (id,data)=>{
    await user_g.doc(id).update(data)
}


 
module.exports={findByEmail,updateRecruiter,createUser}