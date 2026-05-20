const { db }= require('../router/firebase_ad')

const candidate=db.collection('candidate_db')
const xlsx=require("xlsx")

const downloadBulkFile = async ()=>{

    try{
        const snap= await candidate.get();

        const jsonD=snap.docs.map((doc)=>({ id: doc.id,...doc.data()}))
        
        const worksheet=xlsx.utils.json_to_sheet(jsonD);
        const workbook=xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Candidates");

        const buffer=xlsx.write(workbook,{
            type: "buffer",
            bookType: "xlsx"
        })
        
        return buffer;

    } catch (err){
        console.error("Error generating excel:", err);
        throw err;

    }

}

module.exports={downloadBulkFile}