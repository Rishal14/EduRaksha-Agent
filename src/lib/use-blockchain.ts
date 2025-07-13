import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface BlockchainState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  network: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ContractCall {
  contractAddress: string;
  abi: ethers.InterfaceAbi;
  method: string;
  params: unknown[];
}

export function useBlockchain() {
  const [state, setState] = useState<BlockchainState>({
    isConnected: false,
    account: null,
    balance: null,
    network: null,
    isLoading: false,
    error: null
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found.');
      }

      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setState({
        isConnected: true,
        account: accounts[0],
        balance: ethers.formatEther(balance),
        network: network.name,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setState({
      isConnected: false,
      account: null,
      balance: null,
      network: null,
      isLoading: false,
      error: null
    });
  };

  const callContract = async (contractCall: ContractCall) => {
    if (!signer || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const contract = new ethers.Contract(
        contractCall.contractAddress,
        contractCall.abi,
        signer
      );

      const result = await contract[contractCall.method](...contractCall.params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Contract call failed';
      throw new Error(errorMessage);
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
      return await tx.wait();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      throw new Error(errorMessage);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (state.account && accounts[0] !== state.account) {
          // Account changed, reconnect
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.account]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    callContract,
    sendTransaction,
    provider,
    signer
  };
} 