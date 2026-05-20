const express=require('express');
const router=express.Router();
const app=express()
const jwt=require('jsonwebtoken')

const {admin} =require('../router/firebase_ad')
const recruiter=require('../model_fire/recruiterF')
const google=require('../model_fire/googleF')
const candida=require('../model_fire/candidateF')
const linkwa=require('../auth/linkControl')
const companyOver=require('../model_fire/companyF')
const path=require('path');
const ad_Pos = require('../model_fire/adminF')
const positionAccess = require('../model_fire/positionAccessF')
const notificationModel = require('../model_fire/notificationF')

/**
 * Statuses that indicate a position is CLOSED and cannot accept new candidates
 */
const CLOSED_POSITION_STATUSES = [
  'rejected',
  'pending',
  'hold',
  'closed',
  'on hold',
  'closed - filled',
  'closed - cancelled'
];

/**
 * Helper function to validate if a position is active and can accept candidates
 * @param {string} pos_id - Position ID
 * @param {string} recruiterEmail - Recruiter's email to check access request status
 * @returns {object} { valid: boolean, message: string, position: object }
 */
const validatePositionForCandidateSubmission = async (pos_id, recruiterEmail) => {
  try {
    if (!pos_id) {
      return { valid: false, message: "Position ID is required" };
    }

    // Find the position
    const position = await ad_Pos.findPositionByPosId(pos_id);
    
    if (!position) {
      return { valid: false, message: "Position not found" };
    }

    // Check if position status is closed/rejected/pending
    const positionStatus = (position.status || '').toLowerCase();
    const isClosed = CLOSED_POSITION_STATUSES.some(status => 
      positionStatus.includes(status.toLowerCase())
    );

    if (isClosed) {
      return { 
        valid: false, 
        message: `Cannot submit candidates. This position has status: "${position.status}". Only active positions accept new candidates.`,
        position 
      };
    }

    // Check if the recruiter has a rejected access request for this position
    if (recruiterEmail) {
      try {
        const accessRequests = await positionAccess.getRecruiterRequests(recruiterEmail);
        const relevantRequest = accessRequests.find(
          req => req.positionId === pos_id && req.status === 'rejected'
        );

        if (relevantRequest) {
          return {
            valid: false,
            message: `Cannot submit candidates. Your access request for this position was rejected by the ClientSPOC. Please contact the ClientSPOC if you believe this is an error.`,
            position
          };
        }
      } catch (accessError) {
        console.error("Error checking access request status:", accessError);
        // Continue without blocking on access check error
      }
    }

    return { valid: true, position };
  } catch (error) {
    console.error("Error validating position:", error);
    return { valid: false, message: "Failed to validate position status" };
  }
};


const isLoggedIn = async (req, res, next) => {
  try {
    // 1️⃣ Check if JWT is present in cookies (normal login)
    const jwtToken = req.cookies?.__session;

    if (jwtToken) {
      try {
        const data = jwt.verify(jwtToken, process.env.SECKEY);
        req.user = data; // { email, name, etc. }
        return next(); // ✅ verified via JWT
      } catch (err) {
        console.warn("JWT verification failed, falling back to Firebase token...");
      }
    }

    // 2️⃣ If not JWT, check Authorization header (Google/Firebase login)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // contains { uid, email, name, picture, ... }

    return next(); // ✅ verified via Firebase
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};



router.post('/data/candi', isLoggedIn, async (req,res)=>{
  try {
    let news = (await recruiter.findRecruiterByEmail(req.user.email)) ||
               (await google.findByEmail(req.user.email)) ||
               (await linkwa.findByEmails(req.user.email));

    if(!news) return res.status(400).json({ message : "Recruiter Not Found!"});

    let { 
      id,statusa,clientspoc,client,hr_name,pos_name,candidate,rel_exp,total_exp,current_ctc,self_rate,
      notice_period,last_day,exp_ctc,curr_state,curr_loc,pref_state,pref_loc,offer_hand,offer_amt,curr_emp,skill_type,
      tech_category,tech_subcategory,tech_skill,tech_exp,nontech_category,nontech_subcategory,nontech_skill,nontech_exp,
      mob,pos_id,emails,cv_url
    } = req.body;

    // 🔒 VALIDATION: Check if position is active and recruiter has access
    const positionValidation = await validatePositionForCandidateSubmission(pos_id, news.email);
    if (!positionValidation.valid) {
      return res.status(400).json({ 
        message: positionValidation.message,
        positionStatus: positionValidation.position?.status || 'unknown'
      });
    }

    if (typeof tech_skill === "string") tech_skill = JSON.parse(tech_skill);
    if (typeof tech_exp === "string") tech_exp = JSON.parse(tech_exp);
    if (typeof nontech_skill === "string") nontech_skill = JSON.parse(nontech_skill);
    if (typeof nontech_exp === "string") nontech_exp = JSON.parse(nontech_exp);


    const user = await candida.createCandidate({
      id,
      recId: news.id,
      clientspoc,
      recEmail: news.email,
      recName: news.name,
      source: news.source,
      hr_name,
      pos_id,
      pos_name,
      current_ctc,
      exp_ctc,
      curr_state,
      curr_loc,
      pref_loc,
      pref_state,
      offer_hand,
      offer_amt,
      self_rate,
      notice_period,
      last_day,
      rel_exp,
      total_exp,
      candidate,
      cv_data: cv_url, //🔥 ONLY URL STORED
      curr_emp,
      client,
      skill_type,
      tech_category,
      tech_subcategory,
      tech_skill,
      tech_exp,
      nontech_category,
      nontech_subcategory,
      nontech_skill,
      nontech_exp,
      mob,
      emails,
      statusa:'Submitted'
    });

    // 🔔 Send notification to ClientSPOC about new candidate submission
    try {
      // Get position details
      const position = positionValidation.position;
      
      // Get recruiter name
      const recruiterName = news.name || news.firstName || req.user.email.split('@')[0];
      
      // Send notification to ClientSPOC
      if (position && position.clientspoc) {
        await notificationModel.notifyClientSpocNewCandidate({
          clientspocEmail: position.clientspoc,
          clientspocName: null, // Will be fetched in the model if needed
          positionId: pos_id,
          positionTitle: position.position,
          clientName: position.client,
          candidateName: candidate,
          candidateId: id,
          recruiterEmail: news.email,
          recruiterName: recruiterName
        });
        console.log(`✅ Notification sent to ClientSPOC ${position.clientspoc} for new candidate ${candidate}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending notification:", notificationError);
      // Don't fail the main request if notification fails
    }

    return res.status(200).json({
      message : "Candidate Added Successfully!",
      data : user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


router.get('/stats/recruiter', isLoggedIn, async (req,res)=>{

  try {
    let recData = (await recruiter.findRecruiterByEmail(req.user.email)) ||
                  (await google.findByEmail(req.user.email)) ||
                  (await linkwa.findByEmails(req.user.email));

    if(!recData) return res.status(402).json({message:"Recruiter not found"});

    const candidates = await candida.findCandidateById(recData.id);

    const totalSubmitted = candidates.length;
    const accepted = candidates.filter(c => c.statusa === "Accepted").length;
    const rejected = candidates.filter(c => c.statusa === "Rejected").length;

    const score = totalSubmitted > 0 
      ? ((accepted / totalSubmitted) * 10).toFixed(1)
      : 0;

    res.json({
      totalSubmitted,
      accepted,
      rejected,
      score
    });

  } catch(err) {
    console.error(err);
    res.status(500).json({error:"Server error"});
  }

});





router.get('/show/candi',isLoggedIn,async (req,res)=>{
    try{
        let recData= (await recruiter.findRecruiterByEmail(req.user.email)) ||
                     (await google.findByEmail(req.user.email)) ||
                     (await linkwa.findByEmails(req.user.email))
        if(!recData) return res.status(402).json({  message: "Recruiter not found"  })
        
        const candidates= await candida.findCandidateById(recData.id)
        res.status(200).json(candidates)
    }
    catch(error){
        console.error("Error while Showing candidate:", error);
        res.status(500).json({ error: error.message });
    }

})

router.get('/show/all/candi', async(req,res)=>{
  try{
    const canudo= await candida.showAllCandidate()
    return res.status(200).json(canudo)

  } catch(error){
    console.log("Error while showing all candidate:",error)
    res.status(500).json({ error: error.message });
  }
})


router.patch("/update/status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { statusa } = req.body;

    if (!statusa) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updated = await candida.updatePositionStatus(id, statusa);

    return res.json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/data/check", isLoggedIn, async (req, res) => {
  try {
    

    let email = req.body.emails?.trim().toLowerCase();
    let mob = req.body.mob?.trim();


    if (!email && !mob) {
      return res.status(400).json({ error: "Email or phone required" });
    }

    const emailExists = await candida.findCandidateByEmail(email);
    const phoneExists = await candida.findCandidateByPhone(mob);

    return res.json({
      emailExists: !!emailExists,
      phoneExists: !!phoneExists,
    });
    
  } catch (err) {
    console.error("Duplicate check error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get('/overview/:name', async (req, res) => {
  try {
    const data = await companyOver.fetchCompanyOverview(req.params.name);

    if (!data) return res.json({ found: false, data: null });

    res.json({ found: true, data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});






// Backend API endpoint for sending emails using Brevo
// Add this to your existing routes file

const brevo = require('@getbrevo/brevo');

/**
 * POST /addit/send/email
 * Send email to candidate with optional CC to recruiter and HR using Brevo
 */
router.post('/send/email', async (req, res) => {
  try {
    const {
      to,
      subject,
      message,
      candidateId,
      candidateName,
      position,
      client,
      ccRecruiter,
      recName,
      ccHR
    } = req.body;

    // Validate required fields
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, message'
      });
    }

    // Initialize Brevo client
    const brevoClient = new brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // Build CC list
    const ccList = [];
    if (ccRecruiter) ccList.push({ email: ccRecruiter });
    if (ccHR) ccList.push({ email: ccHR });

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .details-box {
            background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
          .details-item {
            margin: 8px 0;
            display: flex;
            align-items: center;
          }
          .details-label {
            font-weight: 600;
            color: #1f2937;
            min-width: 100px;
            font-size: 14px;
          }
          .details-value {
            color: #4b5563;
            font-size: 14px;
          }
          .message-body {
            white-space: pre-wrap;
            line-height: 1.8;
            color: #374151;
            font-size: 15px;
            margin: 25px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 3px solid #f97316;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 15px 0;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>🎯 RecruiterV</h1>
            <p>Recruitment Management System</p>
          </div>
          
          <div class="content">
            ${position && client && candidateName ? `
            <div class="details-box">
              <div class="details-item">
                <span class="details-label">👤 Candidate:</span>
                <span class="details-value">${candidateName}</span>
              </div>
              <div class="details-item">
                <span class="details-label">💼 Position:</span>
                <span class="details-value">${position}</span>
              </div>
              <div class="details-item">
                <span class="details-label">🏢 Client:</span>
                <span class="details-value">${client}</span>
              </div>
            </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <div class="message-body">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <div class="footer-logo">RecruiterV</div>
              <p>This is an automated email from the Recruitment Management System.</p>
              <p>Please do not reply directly to this email.</p>
              <p style="margin-top: 15px; color: #9ca3af;">
                © ${new Date().getFullYear()} RecruiterV. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version (fallback)
    const textContent = `
RecruiterV - Recruitment Management System

${position && client && candidateName ? `
Candidate: ${candidateName}
Position: ${position}
Client: ${client}

---
` : ''}

${message}

---
This is an automated email from the Recruitment Management System.
Please do not reply directly to this email.

© ${new Date().getFullYear()} RecruiterV. All rights reserved.
    `.trim();

    // Create Brevo email object
    const emailData = new brevo.SendSmtpEmail();
    
    emailData.sender = {
      name: "RecruiterV Team",
      email: "admin@recruiterv.com",
    };
    
    emailData.to = [{ email: to , name: recName || '' }];
    
    if (ccList.length > 0) {
      emailData.cc = ccList;
    }
    
    emailData.subject = subject;
    emailData.htmlContent = htmlContent;
    emailData.textContent = textContent;

    // Optional: Add reply-to
    // emailData.replyTo = {
    //   email: "hr@recruiterv.com",
    //   name: "HR Team"
    // };

    // Send email via Brevo
    const response = await brevoClient.sendTransacEmail(emailData);

    console.log('✅ Email sent successfully:', response.messageId);

    // Optional: Log email activity to database
    // await logEmailActivity({
    //   candidateId,
    //   to,
    //   subject,
    //   sentAt: new Date(),
    //   messageId: response.messageId,
    //   status: 'sent'
    // });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: response.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * POST /addit/send/bulk-email
 * Send email to multiple candidates at once using Brevo
 */
router.post('/send/bulk-email', async (req, res) => {
  try {
    const { recipients, subject, message, position, client } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    // Initialize Brevo client
    const brevoClient = new brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const results = [];
    
    // Send emails one by one (Brevo doesn't support true bulk in transactional API)
    for (const recipient of recipients) {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .email-wrapper {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
              }
              .content {
                padding: 40px 30px;
              }
              .message-body {
                white-space: pre-wrap;
                line-height: 1.8;
                color: #374151;
                font-size: 15px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
                border-left: 3px solid #f97316;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <h1>🎯 RecruiterV</h1>
              </div>
              <div class="content">
                <div class="message-body">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailData = new brevo.SendSmtpEmail();
        emailData.sender = {
          name: "RecruiterV Team",
          email: "admin@recruiterv.com",
        };
        emailData.to = [{ email: recipient.email, name: recipient.name || '' }];
        emailData.subject = subject;
        emailData.htmlContent = htmlContent;
        emailData.textContent = message;

        const response = await brevoClient.sendTransacEmail(emailData);
        
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: true,
          messageId: response.messageId
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
        results.push({
          email: recipient.email,
          name: recipient.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Sent ${successCount} of ${recipients.length} emails (${failCount} failed)`,
      summary: {
        total: recipients.length,
        successful: successCount,
        failed: failCount
      },
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk email:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

/**
 * POST /addit/send/status-update
 * Send status update email to candidate
 */
router.post('/send/status-update', async (req, res) => {
  try {
    const { candidateId, email, name, position, client, oldStatus, newStatus } = req.body;

    if (!email || !name || !position || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const brevoClient = new brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    // Status-specific messages and colors
    const getStatusDetails = (status) => {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('accept') || statusLower.includes('joining')) {
        return { emoji: '🎉', color: '#10b981', message: 'Congratulations!' };
      }
      if (statusLower.includes('reject') || statusLower.includes('decline')) {
        return { emoji: '📋', color: '#ef4444', message: 'Application Update' };
      }
      if (statusLower.includes('schedule')) {
        return { emoji: '📅', color: '#f59e0b', message: 'Interview Schedule' };
      }
      if (statusLower.includes('offer')) {
        return { emoji: '🎁', color: '#8b5cf6', message: 'Great News!' };
      }
      return { emoji: '📢', color: '#3b82f6', message: 'Status Update' };
    };

    const statusDetails = getStatusDetails(newStatus);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .status-badge {
            display: inline-block;
            padding: 10px 20px;
            background-color: ${statusDetails.color};
            color: white;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 20px 0;
          }
          .details-box {
            background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>${statusDetails.emoji} ${statusDetails.message}</h1>
            <p>RecruiterV - Recruitment Management System</p>
          </div>
          <div class="content">
            <p>Dear <strong>${recName}</strong>,</p>
            
            <p>Your application status has been updated:</p>
            
            <div class="details-box">
              <div><strong>Position:</strong> ${position}</div>
              ${client ? `<div><strong>Client:</strong> ${client}</div>` : ''}
              <div style="margin-top: 15px;">
                ${oldStatus ? `<div><strong>Previous Status:</strong> ${oldStatus}</div>` : ''}
                <div><strong>Current Status:</strong> <span class="status-badge">${newStatus}</span></div>
              </div>
            </div>
            
            <p>If you have any questions, please feel free to reach out to your recruiter.</p>
            
            <p>Best regards,<br>RecruiterV Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = new brevo.SendSmtpEmail();
    emailData.sender = {
      name: "RecruiterV Team",
      email: "admin@recruiterv.com",
    };
    emailData.to = [{ email, name }];
    emailData.subject = `Application Status Update - ${position}`;
    emailData.htmlContent = htmlContent;

    const response = await brevoClient.sendTransacEmail(emailData);

    console.log('✅ Status update email sent:', response.messageId);

    res.status(200).json({
      success: true,
      message: 'Status update email sent successfully',
      messageId: response.messageId
    });

  } catch (error) {
    console.error('❌ Error sending status update:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send status update email',
      details: error.message
    });
  }
});


module.exports=router;