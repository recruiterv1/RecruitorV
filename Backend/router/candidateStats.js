const express = require('express');
const router = express.Router();
const {
  getAllCandidates,
  getCandidateStatistics,
  getUniqueStatuses
} = require('../model_fire/candidateStatsF');

/**
 * GET /candidatestats/all
 * Get all candidates with filtering and pagination
 * Query params:
 *   - name: filter by candidate name (optional)
 *   - phone: filter by phone number (optional)
 *   - email: filter by email (optional)
 *   - position: filter by position (optional)
 *   - status: filter by status (optional)
 *   - lastUpdateDate: filter by last update date (YYYY-MM-DD) (optional)
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 50)
 */
router.get('/all', async (req, res) => {
  try {
    const { name, phone, email, position, status, lastUpdateDate, page = 1, limit = 50 } = req.query;
    
    // Build filters object
    const filters = {};
    if (name) filters.name = name;
    if (phone) filters.phone = phone;
    if (email) filters.email = email;
    if (position) filters.position = position;
    if (status) filters.status = status;
    if (lastUpdateDate) filters.lastUpdateDate = lastUpdateDate;
    
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
    
    const result = await getAllCandidates(filters, pageNum, limitNum);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message
    });
  }
});

/**
 * GET /candidatestats/statistics
 * Get candidate statistics summary
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await getCandidateStatistics();
    
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('Error fetching candidate statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate statistics',
      error: error.message
    });
  }
});

/**
 * GET /candidatestats/statuses
 * Get list of unique status values
 */
router.get('/statuses', async (req, res) => {
  try {
    const statuses = await getUniqueStatuses();
    
    return res.status(200).json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statuses',
      error: error.message
    });
  }
});

module.exports = router;
