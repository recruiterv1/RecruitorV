const express=require('express');
const router=express.Router();

const bcrypt=require('bcryptjs')


const clientspoc=require('../model_fire/clientspocF')


router.post('/add',async (req,res)=>{

    let {name,email,codPass}=req.body;

    try{

        const salt= await bcrypt.genSalt(10);
        const hashPass= await bcrypt.hash(codPass,salt);

        user = await clientspoc.createRecruiter({
            name,
            email,
            codPass:hashPass,

        })

        res.json({ message: `Client SPOC Added!` });
    }
    catch(err){
        res.status(500).json({error: err.message})
    }

    


})

router.post('/companyAdd',async (req,res)=>{

    let { commisson,lower,name,overview}=req.body;

    try{



        user = await clientspoc.createCompany({
                commisson,
                lower,
                name,
                overview

        })

        res.json({ message: `Company Added!` });
    }
    catch(err){
        res.status(500).json({error: err.message})
    }

    


})

/**
 * GET /clientspoc/all
 * Get all Client SPOCs with their names and emails
 */
router.get('/all', async (req, res) => {
    try {
        const spocs = await clientspoc.getAllClientSpocs();
        res.json({
            success: true,
            data: spocs
        });
    } catch (err) {
        console.error("Error getting all client spocs:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports=router;