const {db}=require('../router/firebase_ad')
const company= db.collection('Company_Overview')

async function fetchCompanyOverview(companyName){
    const lowerName= companyName.toLowerCase();

    const snapshot=await company.where('lower','==',lowerName).get();

    if (snapshot.empty) return null;

    return snapshot.docs[0].data()

}

module.exports={fetchCompanyOverview}