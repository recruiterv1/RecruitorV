const mongoose=require('mongoose')

mongoose.connect(process.env.MONGO_LINK)


const montS= mongoose.Schema({
    position: String,
    ctc: String,
    location: String,
    job_desc: String,
    experience: String

})   

module.exports= mongoose.model('admin',montS)