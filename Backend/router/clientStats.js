const express = require('express');
const router = express.Router();
const { getClientStats, getClientDetailedStats } = require('../model_fire/clientStatsF');

/**
 * GET /clientstats/all
 * Get all client statistics with optional filters
 * Query params:
 *   - spocName: Filter by SPOC name
 *   - recruiterName: Filter by recruiter name
 *   - status: Filter by candidate status
 *   - clientName: Filter by client name
 *   - date: Filter by position creation date (single date)
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 */
router.get('/all', async (req, res) => {
  try {
    const { spocName, recruiterName, status, clientName, date, page = 1, limit = 10 } = req.query;

    const filters = {
      spocName,
      recruiterName,
      status,
      clientName,
      date
    };

    const stats = await getClientStats(filters);
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedStats = stats.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      total: stats.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(stats.length / limitNum),
      clients: paginatedStats
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch client statistics',
      error: error.message
    });
  }
});

/**
 * GET /clientstats/:clientId
 * Get detailed statistics for a specific client
 */
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    const stats = await getClientDetailedStats(clientId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching client detailed stats:', error);
    
    if (error.message === 'Client not found') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch client detailed statistics',
      error: error.message
    });
  }
});

/**
 * GET /clientstats/filters/options
 * Get filter options for client stats page
 * Returns unique values for SPOCs, recruiters, statuses, and clients
 */
router.get('/filters/options', async (req, res) => {
  try {
    console.log('Fetching filter options...');
    const stats = await getClientStats({});
    console.log('Stats received for filter options:', stats.length, 'clients');
    
    // Extract unique filter options
    const clientNames = [...new Set(stats.map(c => c.clientName).filter(Boolean))].sort();
    const spocNames = [...new Set(stats.flatMap(c => c.positionBreakdown?.map(p => p.spocName) || [])).filter(Boolean)].sort();
    
    // Collect all recruiter names and statuses
    const recruiterNames = new Set();
    const statuses = new Set();
    
    stats.forEach(client => {
      client.positionBreakdown?.forEach(pos => {
        pos.recruiters?.forEach(rec => {
          recruiterNames.add(rec.recruiterName);
        });
      });
      
      Object.keys(client.statusCounts || {}).forEach(status => {
        statuses.add(status);
      });
    });

    const result = {
      success: true,
      filters: {
        spocNames,
        clientNames,
        recruiterNames: [...recruiterNames].sort(),
        statuses: [...statuses].sort()
      }
    };
    
    console.log('Filter options result:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  }
});

module.exports = router;

