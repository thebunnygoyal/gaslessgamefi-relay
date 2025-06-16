const { ethers } = require('ethers');
const { DefenderRelayProvider, DefenderRelaySigner } = require('@openzeppelin/defender-relay-client/lib/ethers');

class RelayService {
  constructor() {
    this.providers = new Map();
    this.signers = new Map();
    this.initializeNetworks();
  }

  initializeNetworks() {
    // Polygon Mumbai
    if (process.env.POLYGON_MUMBAI_API_KEY) {
      const credentials = {
        apiKey: process.env.POLYGON_MUMBAI_API_KEY,
        apiSecret: process.env.POLYGON_MUMBAI_API_SECRET
      };
      const provider = new DefenderRelayProvider(credentials);
      const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
      this.providers.set('polygon-mumbai', provider);
      this.signers.set('polygon-mumbai', signer);
    }

    // Polygon Mainnet
    if (process.env.POLYGON_API_KEY) {
      const credentials = {
        apiKey: process.env.POLYGON_API_KEY,
        apiSecret: process.env.POLYGON_API_SECRET
      };
      const provider = new DefenderRelayProvider(credentials);
      const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
      this.providers.set('polygon', provider);
      this.signers.set('polygon', signer);
    }

    // SKALE
    if (process.env.SKALE_ENDPOINT) {
      const provider = new ethers.JsonRpcProvider(process.env.SKALE_ENDPOINT);
      const signer = new ethers.Wallet(process.env.SKALE_PRIVATE_KEY, provider);
      this.providers.set('skale', provider);
      this.signers.set('skale', signer);
    }

    // Arbitrum
    if (process.env.ARBITRUM_API_KEY) {
      const credentials = {
        apiKey: process.env.ARBITRUM_API_KEY,
        apiSecret: process.env.ARBITRUM_API_SECRET
      };
      const provider = new DefenderRelayProvider(credentials);
      const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
      this.providers.set('arbitrum', provider);
      this.signers.set('arbitrum', signer);
    }
  }

  async relayTransaction(network, transaction) {
    const signer = this.signers.get(network);
    if (!signer) {
      throw new Error(`Network ${network} not supported`);
    }

    try {
      // For meta-transactions, we need to construct the proper transaction
      const tx = await this.constructMetaTransaction(transaction, network);
      
      // Send the transaction
      const response = await signer.sendTransaction(tx);
      const receipt = await response.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
        network
      };
    } catch (error) {
      throw new Error(`Relay failed: ${error.message}`);
    }
  }

  async constructMetaTransaction(transaction, network) {
    // EIP-2771 meta-transaction construction
    const forwarderAddress = this.getForwarderAddress(network);
    const forwarderAbi = [
      'function execute(address to, bytes calldata data) external payable returns (bool, bytes memory)'
    ];
    
    const forwarderInterface = new ethers.Interface(forwarderAbi);
    const data = forwarderInterface.encodeFunctionData('execute', [
      transaction.to,
      transaction.data
    ]);

    return {
      to: forwarderAddress,
      data: data,
      value: transaction.value || '0'
    };
  }

  getForwarderAddress(network) {
    const forwarders = {
      'polygon': process.env.POLYGON_FORWARDER || '0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8',
      'polygon-mumbai': process.env.POLYGON_MUMBAI_FORWARDER || '0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b',
      'arbitrum': process.env.ARBITRUM_FORWARDER || '0x...', // Add your forwarder
      'skale': process.env.SKALE_FORWARDER || '0x...', // Add your forwarder
    };
    return forwarders[network];
  }

  getSupportedNetworks() {
    return Array.from(this.providers.keys());
  }

  async getRelayerBalance(network) {
    const signer = this.signers.get(network);
    if (!signer) {
      throw new Error(`Network ${network} not supported`);
    }
    
    const address = await signer.getAddress();
    const balance = await signer.provider.getBalance(address);
    return {
      network,
      address,
      balance: ethers.formatEther(balance)
    };
  }
}

module.exports = new RelayService();