const jwt=require('jsonwebtoken');

let tokenBlacklist=[];

const authenticateToken = (req,res,next)=>{
    const authHeader=req.headers["authorization"]
    const token= authHeader && authHeader.split(" ")[1]

    if (!token) return res.status(401).json({ message: "No token provided" });

    if(tokenBlacklist.includes(token)){
        return res.status(401).json({ message: "Token expired or logged out"})
    }

    jwt.verify(token, process.env.SECKEY, (err, admin) => {
        if (err) return res.status(403).json({ message: "Invalid token" });

        req.admin = admin; 
        next();
    });

}


const logoutToken =(token)=>{
  tokenBlacklist.push(token)
}


module.exports={authenticateToken, logoutToken}