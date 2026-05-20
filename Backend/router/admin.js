const express=require('express');
const router=express.Router();
const jwt=require('jsonwebtoken');



const adminVerify=require('../model_fire/adminCF');





router.post('/ad', async (req,res)=>{

    console.log("Request body:", req.body);

    const {email,pass}=req.body;

    const result= await adminVerify.checkCredentials(email,pass);

    if(!result.success) {
        return res.status(400).json({ message: result.message });
    }

    const admin = result.admin;

    // Update lastActive timestamp on successful login
    await adminVerify.updateAdmin(email, { lastActive: new Date() });

    const token= jwt.sign({email : email}, process.env.SECKEY, {expiresIn: '12h'})

    res.cookie("__session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1 * 12 * 60 * 60 * 1000 
    });

    // Determine roleCategory based on role field or set default
    // Support both 'role' and 'roleCategory' fields from database
    const roleCategory = admin.roleCategory || admin.role || 'Admin';

    return res.json({
    message: "Verified Successfully",
    email: admin.email,
    name: admin.name,
    roleCategory: roleCategory,
    role: admin.role || roleCategory
    });


})

router.post('/adlogout', (req, res) => {
    res.clearCookie("__session", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });

    return res.json({ message: "Logged out successfully" });
});



router.get("/authcheck", async (req, res) => {
    const token = req.cookies.__session;

    if (!token) {
        return res.status(401).json({ message: "No admin session" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECKEY);

        const result = await adminVerify.checkData(decoded.email)

        if(!result.success){
            return res.status(401).json({ message: "Admin not found" });
        }

        const admin=result.admin

        // Determine roleCategory based on role field or set default
        // Support both 'role' and 'roleCategory' fields from database
        const roleCategory = admin.roleCategory || admin.role || 'Admin';

        return res.json({
            message: "Admin authenticated",
            user: {
                email: admin.email,
                name: admin.name,
                type: "admin",
                roleCategory: roleCategory,
                role: admin.role || roleCategory
            }
        });

    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
});




module.exports=router;     


// Admin endpoint to update user roleCategory (for fixing sidebar menu visibility)
router.post('/update-user-role', async (req, res) => {
    try {
        const { email, roleCategory } = req.body;
        
        if (!email || !roleCategory) {
            return res.status(400).json({
                success: false,
                message: 'Email and roleCategory are required'
            });
        }
        
        const result = await adminVerify.updateAdmin(email, {
            roleCategory: roleCategory,
            role: roleCategory
        });
        
        if (result.success) {
            return res.json({
                success: true,
                message: `User role updated to: ${roleCategory}`,
                email: email,
                roleCategory: roleCategory
            });
        } else {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        
    } catch (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user role',
            error: error.message
        });
    }
});

// Admin endpoint to get user role (for debugging)
router.get('/get-user-role/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const result = await adminVerify.getAdminByEmail(email);
        
        if (result.success) {
            return res.json({
                success: true,
                user: {
                    email: result.admin.email,
                    name: result.admin.name,
                    role: result.admin.role,
                    roleCategory: result.admin.roleCategory
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        
    } catch (error) {
        console.error('Error getting user role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user role',
            error: error.message
        });
    }
});
        