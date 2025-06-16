const express = require('express');
const router = express.Router();
const relayService = require('../services/relayService');
const { validateTransaction } = require('../middleware/validation');
const analyticsService = require('../services/analyticsService');

// Relay a transaction
router.post('/transaction', validateTransaction, async (req, res) => {
  try {
    const { network, transaction, gameId, userId } = req.body;
    
    // Start analytics tracking
    const startTime = Date.now();
    
    // Relay the transaction
    const result = await relayService.relayTransaction(network, transaction);
    
    // Track analytics
    await analyticsService.trackRelay({
      network,
      gameId,
      userId,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      duration: Date.now() - startTime,
      success: true
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    // Track failed transaction
    await analyticsService.trackRelay({
      network: req.body.network,
      gameId: req.body.gameId,
      userId: req.body.userId,
      error: error.message,
      success: false
    });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported networks
router.get('/networks', (req, res) => {
  res.json({
    networks: relayService.getSupportedNetworks(),
    forwarders: {
      'polygon': '0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8',
      'polygon-mumbai': '0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b',
      'arbitrum': 'Contact for address',
      'skale': 'Contact for address'
    }
  });
});

// Get relayer balance
router.get('/balance/:network', async (req, res) => {
  try {
    const balance = await relayService.getRelayerBalance(req.params.network);
    res.json(balance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Estimate gas for a transaction
router.post('/estimate', validateTransaction, async (req, res) => {
  try {
    const { network, transaction } = req.body;
    const provider = relayService.providers.get(network);
    
    if (!provider) {
      throw new Error(`Network ${network} not supported`);
    }
    
    const gasEstimate = await provider.estimateGas(transaction);
    const gasPrice = await provider.getFeeData();
    
    res.json({
      gasLimit: gasEstimate.toString(),
      gasPrice: gasPrice.gasPrice?.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
      estimatedCost: ethers.formatEther(gasEstimate * (gasPrice.gasPrice || 0n))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;