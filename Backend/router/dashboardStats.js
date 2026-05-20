const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getDetailedRecords
} = require('../model_fire/dashboardStatsF');

/**
 * GET /dashboardstats/summary
 * Get summary statistics for all dashboard metrics
 * Query params:
 *   - filter: 'today', 'week', 'month' (optional)
 */
router.get('/summary', async (req, res) => {
  try {
    const { filter } = req.query;
    
    // Validate filter if provided
    if (filter && !['today', 'week', 'month'].includes(filter)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter. Use: today, week, or month'
      });
    }
    
    const summary = await getDashboardSummary(filter);
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
});

/**
 * GET /dashboardstats/details/:type
 * Get detailed records for a specific metric type
 * Params:
 *   - type: 'clients', 'recruiters', 'spocs', 'positions', 'hrs', 'candidates'
 * Query params:
 *   - filter: 'today', 'week', 'month' (optional)
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 50)
 */
router.get('/details/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { filter, page = 1, limit = 50 } = req.query;
    
    // Validate type
    const validTypes = ['clients', 'recruiters', 'spocs', 'positions', 'hrs', 'candidates'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Use one of: ${validTypes.join(', ')}`
      });
    }
    
    // Validate filter if provided
    if (filter && !['today', 'week', 'month'].includes(filter)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter. Use: today, week, or month'
      });
    }
    
    // Validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number'
      });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be between 1 and 100'
      });
    }
    
    const details = await getDetailedRecords(type, filter, pageNum, limitNum);
    
    return res.status(200).json(details);
  } catch (error) {
    console.error('Error fetching detailed records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed records',
      error: error.message
    });
  }
});

module.exports = router;
