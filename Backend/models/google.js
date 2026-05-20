const mongoose=require('mongoose')

mongoose.connect(process.env.MONGO_LINK)

const googS= mongoose.Schema({
    uid : {type: String, required: true, unique: true},
    name : String,
    email : {type: String, required: true, unique: true},
    picture : String,

})

module.exports=mongoose.model('google',googS)