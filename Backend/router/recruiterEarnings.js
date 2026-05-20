const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getRecruiterEarnings, getEarningsSummary } = require("../model_fire/recruiterEarningsF");
const { findRecruiterByEmail } = require("../model_fire/recruiterF");

// Middleware to check authentication
function authMiddleware(req, res, next) {
  const token = req.cookies.__session;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECKEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

/**
 * GET /api/recruiter-earnings
 * Get earnings data for the logged-in recruiter
 * Shows candidates with "Offer Accepted" status and calculated commissions
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Get recruiter info from authenticated user
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User email not found in session"
      });
    }

    // Find recruiter by email
    const recruiter = await findRecruiterByEmail(userEmail);
    
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    // Get earnings data
    const earningsData = await getRecruiterEarnings(recruiter.id, userEmail);

    return res.status(200).json({
      success: true,
      data: earningsData
    });

  } catch (error) {
    console.error("Error in recruiter earnings route:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch earnings data",
      error: error.message
    });
  }
});

/**
 * GET /api/recruiter-earnings/summary
 * Get earnings summary statistics for the logged-in recruiter
 */
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User email not found in session"
      });
    }

    const recruiter = await findRecruiterByEmail(userEmail);
    
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found"
      });
    }

    const summary = await getEarningsSummary(recruiter.id);

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error("Error in earnings summary route:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch earnings summary",
      error: error.message
    });
  }
});

module.exports = router;
