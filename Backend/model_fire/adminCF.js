const {db}=require('../router/firebase_ad')

const adminData=db.collection('admin_db');
const bcrypt=require('bcryptjs')


const checkCredentials = async(email,pass)=>{
    try{
        
        const snap= await adminData.where("email","==",email).limit(1).get()

        if(snap.empty) {
            return { success: false, message: "Invalid Credentials" };
        }

        const admin= snap.docs[0].data();
        const hashedPass= admin.codPass;

        const ismatch= await bcrypt.compare(pass,hashedPass)

        if(!ismatch){
            return { success: false, message: "Invalid Credentials"}
        }

        return { success: true, message: "Verified Successfully", admin}

    } catch (error){
        console.error("Error verifying admin:", error);
        return { success: false, message: "Server Error" };

    }

}

const checkData = async (email)=>{
    try{
        const snap= await adminData.where("email","==",email).limit(1).get()

        if (snap.empty) {
            return { success: false, message: "Admin not found" };
        }

        return {success: true, admin:snap.docs[0].data()}

    } catch (error){
        console.error("Error verifying admin:", error);
        return { success: false, message: "Server Error" };

    }
}

const updateAdmin = async (email, data) => {
    try {
        const snap = await adminData.where("email", "==", email).limit(1).get();
        
        if (snap.empty) {
            return { success: false, message: "Admin not found" };
        }

        const docId = snap.docs[0].id;
        await adminData.doc(docId).update(data);
        
        return { success: true, message: "Admin updated successfully" };
    } catch (error) {
        console.error("Error updating admin:", error);
        return { success: false, message: "Server Error" };
    }
}

// New function to get user by email
const getAdminByEmail = async (email) => {
    try {
        const snap = await adminData.where("email", "==", email).limit(1).get();
        
        if (snap.empty) {
            return { success: false, message: "Admin not found" };
        }

        return { 
            success: true, 
            admin: { id: snap.docs[0].id, ...snap.docs[0].data() } 
        };
    } catch (error) {
        console.error("Error getting admin:", error);
        return { success: false, message: "Server Error" };
    }
}

module.exports={checkCredentials,checkData,updateAdmin,getAdminByEmail}
