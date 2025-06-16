const { ethers } = require('ethers');

const validateTransaction = (req, res, next) => {
  const { network, transaction, gameId } = req.body;
  
  // Validate required fields
  if (!network || !transaction || !gameId) {
    return res.status(400).json({
      error: 'Missing required fields: network, transaction, gameId'
    });
  }
  
  // Validate transaction structure
  if (!transaction.to || !transaction.data) {
    return res.status(400).json({
      error: 'Transaction must include to and data fields'
    });
  }
  
  // Validate Ethereum address
  if (!ethers.isAddress(transaction.to)) {
    return res.status(400).json({
      error: 'Invalid transaction recipient address'
    });
  }
  
  // Validate hex data
  if (!ethers.isHexString(transaction.data)) {
    return res.status(400).json({
      error: 'Transaction data must be a valid hex string'
    });
  }
  
  // Validate gameId format (alphanumeric and dashes)
  if (!/^[a-zA-Z0-9-]+$/.test(gameId)) {
    return res.status(400).json({
      error: 'Invalid gameId format'
    });
  }
  
  next();
};

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required'
    });
  }
  
  // In production, validate against database
  // For now, check against environment variable
  if (apiKey !== process.env.MASTER_API_KEY) {
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }
  
  next();
};

module.exports = {
  validateTransaction,
  validateApiKey
};