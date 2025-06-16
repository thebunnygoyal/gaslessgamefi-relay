using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

namespace GaslessGameFi
{
    public class GaslessRelayClient : MonoBehaviour
    {
        [SerializeField] private string relayServiceUrl = "https://gaslessgamefi.azurewebsites.net";
        [SerializeField] private string gameId;
        [SerializeField] private string apiKey;
        
        private static GaslessRelayClient instance;
        
        public static GaslessRelayClient Instance
        {
            get
            {
                if (instance == null)
                {
                    GameObject go = new GameObject("GaslessRelayClient");
                    instance = go.AddComponent<GaslessRelayClient>();
                    DontDestroyOnLoad(go);
                }
                return instance;
            }
        }
        
        private void Awake()
        {
            if (instance != null && instance != this)
            {
                Destroy(gameObject);
                return;
            }
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        
        public void Initialize(string gameId, string apiKey, string customUrl = null)
        {
            this.gameId = gameId;
            this.apiKey = apiKey;
            if (!string.IsNullOrEmpty(customUrl))
            {
                this.relayServiceUrl = customUrl;
            }
        }
        
        public void RelayTransaction(Transaction transaction, Action<RelayResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(RelayTransactionCoroutine(transaction, onSuccess, onError));
        }
        
        private IEnumerator RelayTransactionCoroutine(Transaction transaction, Action<RelayResponse> onSuccess, Action<string> onError)
        {
            var requestData = new RelayRequest
            {
                network = transaction.Network,
                transaction = new TransactionData
                {
                    to = transaction.To,
                    data = transaction.Data,
                    value = transaction.Value
                },
                gameId = gameId,
                userId = transaction.UserId
            };
            
            string jsonData = JsonConvert.SerializeObject(requestData);
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            
            using (UnityWebRequest request = new UnityWebRequest($"{relayServiceUrl}/api/v1/relay/transaction", "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("X-API-Key", apiKey);
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<RelayResponse>(request.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    var errorResponse = JsonConvert.DeserializeObject<ErrorResponse>(request.downloadHandler.text);
                    onError?.Invoke(errorResponse?.error ?? request.error);
                }
            }
        }
        
        public void GetSupportedNetworks(Action<NetworksResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(GetSupportedNetworksCoroutine(onSuccess, onError));
        }
        
        private IEnumerator GetSupportedNetworksCoroutine(Action<NetworksResponse> onSuccess, Action<string> onError)
        {
            using (UnityWebRequest request = UnityWebRequest.Get($"{relayServiceUrl}/api/v1/relay/networks"))
            {
                request.SetRequestHeader("X-API-Key", apiKey);
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<NetworksResponse>(request.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
        
        public void EstimateGas(Transaction transaction, Action<GasEstimate> onSuccess, Action<string> onError)
        {
            StartCoroutine(EstimateGasCoroutine(transaction, onSuccess, onError));
        }
        
        private IEnumerator EstimateGasCoroutine(Transaction transaction, Action<GasEstimate> onSuccess, Action<string> onError)
        {
            var requestData = new EstimateRequest
            {
                network = transaction.Network,
                transaction = new TransactionData
                {
                    to = transaction.To,
                    data = transaction.Data,
                    value = transaction.Value
                }
            };
            
            string jsonData = JsonConvert.SerializeObject(requestData);
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
            
            using (UnityWebRequest request = new UnityWebRequest($"{relayServiceUrl}/api/v1/relay/estimate", "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("X-API-Key", apiKey);
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonConvert.DeserializeObject<GasEstimate>(request.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
    }
    
    // Data classes
    [Serializable]
    public class Transaction
    {
        public string Network { get; set; }
        public string To { get; set; }
        public string Data { get; set; }
        public string Value { get; set; } = "0";
        public string UserId { get; set; }
    }
    
    [Serializable]
    public class RelayRequest
    {
        public string network { get; set; }
        public TransactionData transaction { get; set; }
        public string gameId { get; set; }
        public string userId { get; set; }
    }
    
    [Serializable]
    public class TransactionData
    {
        public string to { get; set; }
        public string data { get; set; }
        public string value { get; set; }
    }
    
    [Serializable]
    public class RelayResponse
    {
        public bool success { get; set; }
        public RelayResult result { get; set; }
    }
    
    [Serializable]
    public class RelayResult
    {
        public string transactionHash { get; set; }
        public int blockNumber { get; set; }
        public string gasUsed { get; set; }
        public int status { get; set; }
        public string network { get; set; }
    }
    
    [Serializable]
    public class ErrorResponse
    {
        public bool success { get; set; }
        public string error { get; set; }
    }
    
    [Serializable]
    public class NetworksResponse
    {
        public List<string> networks { get; set; }
        public Dictionary<string, string> forwarders { get; set; }
    }
    
    [Serializable]
    public class EstimateRequest
    {
        public string network { get; set; }
        public TransactionData transaction { get; set; }
    }
    
    [Serializable]
    public class GasEstimate
    {
        public string gasLimit { get; set; }
        public string gasPrice { get; set; }
        public string maxFeePerGas { get; set; }
        public string maxPriorityFeePerGas { get; set; }
        public string estimatedCost { get; set; }
    }
}