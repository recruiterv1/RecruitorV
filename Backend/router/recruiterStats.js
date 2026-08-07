const express = require('express');
const router = express.Router();
const { getRecruiterStats, getRecruiterDetailedStats, getRecruiterDashboardStats } = require('../model_fire/recruiterStatsF');
const { cached } = require('../utils/cache');

const STATS_TTL = 3 * 60 * 1000; // 3 min — dashboards don't need second-level freshness

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

    const stats = await cached(`recDash:${recruiterId}`, STATS_TTL, () => getRecruiterDashboardStats(recruiterId));

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
    const stats = await cached('recAll', STATS_TTL, () => getRecruiterStats());

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
 * PATCH /recruiterstats/:id/active
 * Activate or deactivate a recruiter account
 */
router.patch('/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const recruiterF = require('../model_fire/recruiterF');
    const patch = { isActive: Boolean(isActive) };
    // Re-activating clears an inactivity suspension so the recruiter can log in again.
    if (Boolean(isActive)) { patch.accountStatus = 'approved'; patch.suspendedReason = null; }
    await recruiterF.updateRecruiter(id, patch);
    // Invalidate the cached recruiter list so the change shows immediately.
    try { require('../utils/cache').invalidate('rec'); } catch (_) {}
    console.log(`Recruiter ${id} isActive set to ${Boolean(isActive)}`);
    return res.json({ success: true, id, isActive: Boolean(isActive) });
  } catch (error) {
    console.error('Error toggling recruiter status:', error);
    return res.status(500).json({ success: false, message: error.message });
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

    const stats = await cached(`recDetail:${id}`, STATS_TTL, () => getRecruiterDetailedStats(id));

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
