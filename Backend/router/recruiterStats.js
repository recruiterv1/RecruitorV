const express = require('express');
const router = express.Router();
const { getRecruiterStats, getRecruiterDetailedStats, getRecruiterDashboardStats } = require('../model_fire/recruiterStatsF');

/**
 * GET /recruiterstats/dashboard
 * Get dashboard statistics for the current logged-in recruiter
 * Query params:
 *   - recruiterId: recruiter ID (required)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { recruiterId } = req.query;

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }

    const stats = await getRecruiterDashboardStats(recruiterId);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching recruiter dashboard stats:', error);

    if (error.message === 'Recruiter not found') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter dashboard statistics',
      error: error.message
    });
  }
});

/**
 * GET /recruiterstats/all
 * Get all recruiters with their position counts and statistics
 */
router.get('/all', async (req, res) => {
  try {
    const stats = await getRecruiterStats();

    return res.status(200).json({
      success: true,
      count: stats.length,
      recruiters: stats
    });
  } catch (error) {
    console.error('Error fetching recruiter stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter statistics',
      error: error.message
    });
  }
});

/**
 * GET /recruiterstats/:id
 * Get detailed statistics for a specific recruiter
 * NOTE: This route must come LAST to avoid conflicts with specific routes like /dashboard
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }

    const stats = await getRecruiterDetailedStats(id);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching recruiter detailed stats:', error);

    if (error.message === 'Recruiter not found') {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter detailed statistics',
      error: error.message
    });
  }
});

module.exports = router;
