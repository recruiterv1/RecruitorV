const express=require('express');
const router=express.Router();

const downloadFile=require('../model_fire/downloadF')

router.get('/bulkFile', async (req,res)=>{
    try{
        const buffer= await downloadFile.downloadBulkFile();

        res.setHeader("Content-Disposition", 'attachment; filename="candidate.xlsx"');
        res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer)

    } catch(err){
         res.status(500).send("Failed to download Excel");
         console.log(err);

    }

})

module.exports=router;