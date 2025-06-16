const express = require('express');
const router = express.Router();
const relayService = require('../services/relayService');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const networks = relayService.getSupportedNetworks();
    const networkStatus = {};
    
    // Check each network
    for (const network of networks) {
      try {
        const balance = await relayService.getRelayerBalance(network);
        networkStatus[network] = {
          status: 'operational',
          balance: balance.balance,
          address: balance.address
        };
      } catch (error) {
        networkStatus[network] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    res.json({
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      networks: networkStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detailed status
router.get('/detailed', async (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;