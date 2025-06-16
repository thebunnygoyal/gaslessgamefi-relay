// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title GameRegistry
 * @dev Registry for Web3 games using gasless transactions
 */
contract GameRegistry is Ownable, ERC2771Context {
    struct GameInfo {
        string name;
        address contractAddress;
        address developer;
        uint256 transactionCount;
        uint256 gassSaved;
        bool active;
    }
    
    // Game ID => GameInfo
    mapping(string => GameInfo) public games;
    
    // Developer => Game IDs
    mapping(address => string[]) public developerGames;
    
    // Contract address => Game ID
    mapping(address => string) public contractToGameId;
    
    // Events
    event GameRegistered(string indexed gameId, address indexed developer);
    event GameUpdated(string indexed gameId);
    event TransactionRelayed(string indexed gameId, address indexed player);
    
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}
    
    /**
     * @dev Register a new game
     */
    function registerGame(
        string memory gameId,
        string memory name,
        address contractAddress
    ) external {
        require(bytes(games[gameId].name).length == 0, "Game already registered");
        require(contractAddress != address(0), "Invalid contract address");
        
        games[gameId] = GameInfo({
            name: name,
            contractAddress: contractAddress,
            developer: _msgSender(),
            transactionCount: 0,
            gassSaved: 0,
            active: true
        });
        
        developerGames[_msgSender()].push(gameId);
        contractToGameId[contractAddress] = gameId;
        
        emit GameRegistered(gameId, _msgSender());
    }
    
    /**
     * @dev Update game info (only by developer)
     */
    function updateGame(
        string memory gameId,
        string memory name,
        bool active
    ) external {
        require(games[gameId].developer == _msgSender(), "Not the game developer");
        
        games[gameId].name = name;
        games[gameId].active = active;
        
        emit GameUpdated(gameId);
    }
    
    /**
     * @dev Record a relayed transaction (called by relayer)
     */
    function recordTransaction(
        string memory gameId,
        address player,
        uint256 estimatedGas
    ) external {
        require(games[gameId].active, "Game not active");
        
        games[gameId].transactionCount++;
        games[gameId].gassSaved += estimatedGas;
        
        emit TransactionRelayed(gameId, player);
    }
    
    /**
     * @dev Get game statistics
     */
    function getGameStats(string memory gameId) 
        external 
        view 
        returns (
            uint256 transactionCount,
            uint256 gassSaved,
            bool active
        ) 
    {
        GameInfo memory game = games[gameId];
        return (game.transactionCount, game.gassSaved, game.active);
    }
    
    /**
     * @dev Get all games by developer
     */
    function getGamesByDeveloper(address developer) 
        external 
        view 
        returns (string[] memory) 
    {
        return developerGames[developer];
    }
    
    /**
     * @dev Check if sender is using meta-transaction
     */
    function isTrustedForwarder(address forwarder) public view override returns (bool) {
        return ERC2771Context.isTrustedForwarder(forwarder);
    }
    
    /**
     * @dev Get the actual sender (works with meta-transactions)
     */
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }
    
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}