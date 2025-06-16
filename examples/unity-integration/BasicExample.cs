using System.Collections;
using UnityEngine;
using GaslessGameFi;
using UnityEngine.UI;

public class BasicGaslessExample : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private string gameId = "my-awesome-game";
    [SerializeField] private string apiKey = "your-api-key";
    [SerializeField] private string contractAddress = "0x...";
    
    [Header("UI Elements")]
    [SerializeField] private Button mintButton;
    [SerializeField] private Button battleButton;
    [SerializeField] private Text statusText;
    [SerializeField] private Text gassSavedText;
    
    private float totalGasSaved = 0f;
    
    void Start()
    {
        // Initialize the relay client
        GaslessRelayClient.Instance.Initialize(gameId, apiKey);
        
        // Setup button listeners
        mintButton.onClick.AddListener(MintNFT);
        battleButton.onClick.AddListener(InitiateBattle);
        
        // Get supported networks
        CheckNetworkSupport();
    }
    
    void CheckNetworkSupport()
    {
        GaslessRelayClient.Instance.GetSupportedNetworks(
            onSuccess: (networks) => {
                Debug.Log($"Supported networks: {string.Join(", ", networks.networks)}");
                statusText.text = "Ready to play gasless!";
            },
            onError: (error) => {
                Debug.LogError($"Failed to get networks: {error}");
                statusText.text = "Connection error";
            }
        );
    }
    
    void MintNFT()
    {
        statusText.text = "Minting NFT...";
        
        // Prepare the mint transaction
        string mintData = EncodeMintFunction();
        
        var transaction = new Transaction
        {
            Network = "polygon",
            To = contractAddress,
            Data = mintData,
            UserId = GetPlayerId()
        };
        
        // First, estimate gas to show savings
        GaslessRelayClient.Instance.EstimateGas(transaction,
            onSuccess: (estimate) => {
                float gasCost = float.Parse(estimate.estimatedCost);
                totalGasSaved += gasCost;
                gassSavedText.text = $"Gas Saved: ${totalGasSaved:F2}";
                
                // Now relay the actual transaction
                RelayMintTransaction(transaction);
            },
            onError: (error) => {
                statusText.text = $"Estimation failed: {error}";
            }
        );
    }
    
    void RelayMintTransaction(Transaction transaction)
    {
        GaslessRelayClient.Instance.RelayTransaction(transaction,
            onSuccess: (result) => {
                statusText.text = $"NFT Minted! Tx: {result.result.transactionHash.Substring(0, 10)}...";
                Debug.Log($"Full transaction hash: {result.result.transactionHash}");
                
                // Update UI or game state
                OnNFTMinted();
            },
            onError: (error) => {
                statusText.text = $"Minting failed: {error}";
            }
        );
    }
    
    void InitiateBattle()
    {
        statusText.text = "Starting battle...";
        
        // Encode battle function with hero IDs
        string battleData = EncodeBattleFunction(1, 2);
        
        var transaction = new Transaction
        {
            Network = "polygon",
            To = contractAddress,
            Data = battleData,
            UserId = GetPlayerId()
        };
        
        GaslessRelayClient.Instance.RelayTransaction(transaction,
            onSuccess: (result) => {
                statusText.text = "Battle completed!";
                // Process battle results
            },
            onError: (error) => {
                statusText.text = $"Battle failed: {error}";
            }
        );
    }
    
    string EncodeMintFunction()
    {
        // In production, use proper ABI encoding
        // This is a simplified example
        return "0x1249c58b"; // mintHero() function selector
    }
    
    string EncodeBattleFunction(int hero1, int hero2)
    {
        // In production, use proper ABI encoding with parameters
        // This is a simplified example
        return $"0xbattle{hero1}{hero2}";
    }
    
    string GetPlayerId()
    {
        // Get unique player ID from your authentication system
        return SystemInfo.deviceUniqueIdentifier;
    }
    
    void OnNFTMinted()
    {
        // Update game state, unlock features, etc.
        Debug.Log("Player now owns a new NFT hero!");
    }
}