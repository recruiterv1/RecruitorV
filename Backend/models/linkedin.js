const mongoose=require('mongoose');

mongoose.connect(process.env.MONGO_LINK)

const linkS= mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    avatar: String
})

module.exports=mongoose.model('linkedin',linkS);