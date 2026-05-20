const mongoose=require('mongoose')

mongoose.connect(process.env.MONGO_LINK)

const pontS=mongoose.Schema({

    users: [{
        type : mongoose.Schema.Types.ObjectId,
        ref: "recruiter"
    }],
    pos_name: String,
    cv_data: {
        filename: String,
        path: String
    },
    candidate: String,
    current_ctc: String, 
    exp_ctc: String,
    curr_loc: String,
    pref_loc: String,
    rel_exp: String,
    offer_hand: String,
    offer_amt: String,

})                          
module.exports= mongoose.model('rec_cand',pontS)