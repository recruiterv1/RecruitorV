const express = require('express');
const router = express.Router();
const { getClientSpocStats, getClientSpocDetailedStats } = require('../model_fire/clientspocStatsF');
const { sendEmail } = require('../utils/email');

/**
 * GET /clientspocstats/all
 * Get all Client SPOCs with their statistics
 */
router.get('/all', async (req, res) => {
  try {
    const stats = await getClientSpocStats();
    
    return res.status(200).json({
      success: true,
      count: stats.length,
      spocs: stats
    });
  } catch (error) {
    console.error('Error fetching Client SPOC stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Client SPOC statistics',
      error: error.message
    });
  }
});

/**
 * GET /clientspocstats/:id
 * Get detailed statistics for a specific Client SPOC
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client SPOC ID is required'
      });
    }

    const stats = await getClientSpocDetailedStats(id);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching Client SPOC detailed stats:', error);
    
    if (error.message === 'Client SPOC not found') {
      return res.status(404).json({
        success: false,
        message: 'Client SPOC not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Client SPOC detailed statistics',
      error: error.message
    });
  }
});

/**
 * POST /clientspocstats/send-email
 * Send email to inactive Client SPOC
 */
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    // Validation
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, body'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    await sendEmail(to, subject, body.replace(/\n/g, '<br>'), 'admin@recruiterv.com', 'RecruiterV Admin');

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email to Client SPOC:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

module.exports = router;
