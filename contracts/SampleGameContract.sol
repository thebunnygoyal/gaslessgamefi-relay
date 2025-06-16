// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SampleGameNFT
 * @dev Example game contract that supports gasless NFT minting
 */
contract SampleGameNFT is ERC721, ERC2771Context, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Game mechanics
    mapping(address => uint256) public playerScores;
    mapping(uint256 => uint256) public tokenPower;
    mapping(address => uint256) public lastMintTime;
    
    uint256 public constant MINT_COOLDOWN = 1 hours;
    uint256 public constant SCORE_THRESHOLD = 100;
    
    event NFTMinted(address indexed player, uint256 tokenId, uint256 power);
    event ScoreUpdated(address indexed player, uint256 newScore);
    
    constructor(address trustedForwarder) 
        ERC721("GameFi Hero", "HERO")
        ERC2771Context(trustedForwarder) 
    {}
    
    /**
     * @dev Gasless NFT minting based on player score
     */
    function mintHero() external {
        address player = _msgSender();
        
        require(playerScores[player] >= SCORE_THRESHOLD, "Insufficient score");
        require(block.timestamp >= lastMintTime[player] + MINT_COOLDOWN, "Cooldown active");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint NFT
        _safeMint(player, tokenId);
        
        // Set random power (simplified for demo)
        uint256 power = uint256(keccak256(abi.encodePacked(block.timestamp, player, tokenId))) % 100 + 1;
        tokenPower[tokenId] = power;
        
        // Reset score and update cooldown
        playerScores[player] -= SCORE_THRESHOLD;
        lastMintTime[player] = block.timestamp;
        
        emit NFTMinted(player, tokenId, power);
    }
    
    /**
     * @dev Update player score (called by game server via relay)
     */
    function updateScore(address player, uint256 points) external onlyOwner {
        playerScores[player] += points;
        emit ScoreUpdated(player, playerScores[player]);
    }
    
    /**
     * @dev Battle between two heroes (gasless)
     */
    function battle(uint256 heroId1, uint256 heroId2) external view returns (uint256 winner) {
        require(_exists(heroId1) && _exists(heroId2), "Invalid hero IDs");
        require(ownerOf(heroId1) == _msgSender() || ownerOf(heroId2) == _msgSender(), "Not your hero");
        
        uint256 power1 = tokenPower[heroId1];
        uint256 power2 = tokenPower[heroId2];
        
        // Simple battle logic
        uint256 randomFactor = uint256(keccak256(abi.encodePacked(block.timestamp, heroId1, heroId2))) % 20;
        
        if (power1 + randomFactor > power2) {
            return heroId1;
        } else {
            return heroId2;
        }
    }
    
    /**
     * @dev Trade heroes between players (gasless)
     */
    function tradeHero(uint256 tokenId, address to) external {
        require(ownerOf(tokenId) == _msgSender(), "Not your hero");
        _transfer(_msgSender(), to, tokenId);
    }
    
    /**
     * @dev Override functions for meta-transaction support
     */
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }
    
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
    
    /**
     * @dev Get all heroes owned by a player
     */
    function getPlayerHeroes(address player) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(player);
        uint256[] memory heroes = new uint256[](balance);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == player) {
                heroes[index] = i;
                index++;
            }
        }
        
        return heroes;
    }
}