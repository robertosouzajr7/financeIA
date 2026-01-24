const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get summary
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!req.organization) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Default to first day of month
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await analyticsService.getOrganizationSummary(req.organization.id, start, end);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
