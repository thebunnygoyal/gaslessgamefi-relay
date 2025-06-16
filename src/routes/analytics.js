const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { validateApiKey } = require('../middleware/validation');

// Get overall metrics
router.get('/metrics', (req, res) => {
  const metrics = analyticsService.getMetrics();
  res.json(metrics);
});

// Get metrics for specific game
router.get('/games/:gameId', (req, res) => {
  const metrics = analyticsService.getGameMetrics(req.params.gameId);
  
  if (!metrics) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(metrics);
});

// Get top games by usage
router.get('/top-games', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const metrics = analyticsService.getMetrics();
  
  const topGames = Object.entries(metrics.byGame)
    .map(([gameId, stats]) => ({
      gameId,
      total: stats.total,
      success: stats.success,
      uniqueUsers: stats.uniqueUsers
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  
  res.json(topGames);
});

// Protected endpoint to reset metrics
router.post('/reset', validateApiKey, (req, res) => {
  analyticsService.metrics = {
    totalRelays: 0,
    successfulRelays: 0,
    failedRelays: 0,
    gassSaved: '0',
    byNetwork: {},
    byGame: {},
    hourlyStats: []
  };
  
  res.json({ message: 'Metrics reset successfully' });
});

module.exports = router;