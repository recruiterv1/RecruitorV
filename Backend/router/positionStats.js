const express = require('express');
const router = express.Router();
const { 
  getPositionStats, 
  getPositionDetailedStats, 
  getPositionsByDate 
} = require('../model_fire/positionStatsF');

/**
 * GET /positionstats/all
 * Get all positions with their statistics
 */
router.get('/all', async (req, res) => {
  try {
    const stats = await getPositionStats();
    
    return res.status(200).json({
      success: true,
      count: stats.length,
      positions: stats
    });
  } catch (error) {
    console.error('Error fetching position stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch position statistics',
      error: error.message
    });
  }
});

/**
 * GET /positionstats/:posId
 * Get detailed statistics for a specific position
 */
router.get('/:posId', async (req, res) => {
  try {
    const { posId } = req.params;
    
    if (!posId) {
      return res.status(400).json({
        success: false,
        message: 'Position ID is required'
      });
    }

    const stats = await getPositionDetailedStats(posId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching position detailed stats:', error);
    
    if (error.message === 'Position not found') {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch position detailed statistics',
      error: error.message
    });
  }
});

/**
 * GET /positionstats/date/:date
 * Get positions that had activity on a specific date
 * Date format: YYYY-MM-DD
 */
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const stats = await getPositionsByDate(date);
    
    return res.status(200).json({
      success: true,
      date: date,
      count: stats.length,
      positions: stats
    });
  } catch (error) {
    console.error('Error fetching positions by date:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch positions by date',
      error: error.message
    });
  }
});

module.exports = router;
