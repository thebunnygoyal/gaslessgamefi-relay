// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

/**
 * @title GameForwarder
 * @dev Minimal forwarder for gasless gaming transactions
 * Inherits from OpenZeppelin's MinimalForwarder for EIP-2771 compliance
 */
contract GameForwarder is MinimalForwarder {
    // Events for analytics
    event GameTransaction(address indexed game, address indexed player, bool success);
    
    // Mapping to track game contracts
    mapping(address => bool) public registeredGames;
    
    // Admin for game registration
    address public admin;
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor() MinimalForwarder() {
        admin = msg.sender;
    }
    
    /**
     * @dev Register a game contract for tracking
     */
    function registerGame(address game) external onlyAdmin {
        registeredGames[game] = true;
    }
    
    /**
     * @dev Unregister a game contract
     */
    function unregisterGame(address game) external onlyAdmin {
        registeredGames[game] = false;
    }
    
    /**
     * @dev Execute meta-transaction with game tracking
     */
    function execute(ForwardRequest calldata req, bytes calldata signature)
        public
        payable
        override
        returns (bool, bytes memory)
    {
        // Verify and execute the meta-transaction
        (bool success, bytes memory returndata) = super.execute(req, signature);
        
        // Emit event for analytics if it's a registered game
        if (registeredGames[req.to]) {
            emit GameTransaction(req.to, req.from, success);
        }
        
        return (success, returndata);
    }
    
    /**
     * @dev Transfer admin rights
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
}