const mongoose=require('mongoose');

mongoose.connect(process.env.MONGO_LINK)

const monS=mongoose.Schema({
    //New created 
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"rec_cand"
    }],
    //Personal Data
    name:String,
    email:{type: String, unique: true, required: true},
    mobile:String,
    city: String,


    //OTP Based Part
    otp: String,
    otpExpires: Date,
    isVerified : {type: Boolean, default: false},


    //Password for later
    password:String

})

module.exports=mongoose.model('recruiter',monS);


