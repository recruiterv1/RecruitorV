const {db}=require('../router/firebase_ad')

const linkwa=db.collection('linkedIn_users');




const jwt=require('jsonwebtoken')
const redirect = process.env.FRONTURL || "https://recruitorv-1291c.web.app";

const getAccessToken= async (code)=>{

    const body= new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI

    })

    const response= await fetch('https://www.linkedin.com/oauth/v2/accessToken',
        {
            method: 'post',
            headers:{
                'Content-type': 'application/x-www-form-urlencoded'
            },
            body:body.toString()
        }
    )
    
    if(!response.ok){
        throw new Error(response.statusText)
    }
    
    const accessToken=await response.json()
    return accessToken

}



const getUserData= async (accessToken)=>{
    
    const response= await fetch('https://api.linkedin.com/v2/userinfo',{
        method: 'get',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }

        
})

if(!response.ok){
        throw new Error(response.statusText)
    }
    
const userData=await response.json()
return userData
}



const linkedInCallback= async (req,res)=>{
    try {
        const { code }=req.query;
        const accessToken= await getAccessToken(code)
        const userData= await getUserData(accessToken.access_token)
        
        if(!userData || !userData.email){
            res.status(500).json({
                success: false,
                message: 'Failed to fetch LinkedIn user data'
            })
        }

        const linked=linkwa.doc(userData.email)
        const doc= await linked.get()

        if(!doc.exists){
            await linked.set({
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.picture || '',
                createdAt: new Date()
            })
        }
        
        

        const token= jwt.sign({name: userData.name, email: userData.email},process.env.SECKEY)

        res.cookie('__session',token,{
        httpOnly: true,
        
        })

        res.redirect(`${redirect}/dash_rec`)


    }
    catch(error){

        res.status(500).json({
            success: false,
            error: error.message
        })
    }

}


const findByEmails= async (email)=>{
    const snap= await linkwa.where('email','==',email).get()
    if(snap.empty) return null;
    const doc=snap.docs[0]
    return { id: doc.id, ...doc.data(),source: 'Linkedin'}
    
}

const updateRecruiter= async (id,data)=>{
    await linkwa.doc(id).update(data)
    
}
module.exports ={ linkedInCallback,findByEmails,updateRecruiter};

