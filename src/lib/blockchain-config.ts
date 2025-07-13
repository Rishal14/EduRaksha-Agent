import { BlockchainConfig } from './blockchain-service';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // Sepolia testnet
  11155111: {
    eduRakshaVerifierAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
    credentialRegistryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
  },
  // Mumbai testnet
  80001: {
    eduRakshaVerifierAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
    credentialRegistryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
  },
  // Local hardhat network
  31337: {
    eduRakshaVerifierAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
    credentialRegistryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
  },
  // Ethereum mainnet (for production)
  1: {
    eduRakshaVerifierAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
    credentialRegistryAddress: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
  }
};

// RPC URLs for different networks
const RPC_URLS = {
  11155111: 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with your Infura project ID
  80001: 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with your Infura project ID
  31337: 'http://localhost:8545',
  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID' // Replace with your Infura project ID
};

/**
 * Get blockchain configuration for a specific network
 */
export function getBlockchainConfig(chainId: number): BlockchainConfig {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const rpcUrl = RPC_URLS[chainId as keyof typeof RPC_URLS];
  
  if (!addresses || !rpcUrl) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  return {
    rpcUrl,
    eduRakshaVerifierAddress: addresses.eduRakshaVerifierAddress,
    credentialRegistryAddress: addresses.credentialRegistryAddress,
    chainId
  };
}

/**
 * Get configuration for the current network (detected from window.ethereum)
 */
export async function getCurrentNetworkConfig(): Promise<BlockchainConfig> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask or Web3 provider not found');
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const numericChainId = parseInt(chainId, 16);
    return getBlockchainConfig(numericChainId);
  } catch (error) {
    throw new Error(`Failed to get current network: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get configuration for a specific network by name
 */
export function getNetworkConfigByName(networkName: string): BlockchainConfig {
  const networkMap: { [key: string]: number } = {
    'sepolia': 11155111,
    'mumbai': 80001,
    'hardhat': 31337,
    'mainnet': 1
  };
  
  const chainId = networkMap[networkName.toLowerCase()];
  if (!chainId) {
    throw new Error(`Unknown network: ${networkName}`);
  }
  
  return getBlockchainConfig(chainId);
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

/**
 * Get list of supported networks
 */
export function getSupportedNetworks(): { chainId: number; name: string; rpcUrl: string }[] {
  return [
    { chainId: 11155111, name: 'Sepolia', rpcUrl: RPC_URLS[11155111] },
    { chainId: 80001, name: 'Mumbai', rpcUrl: RPC_URLS[80001] },
    { chainId: 31337, name: 'Hardhat Local', rpcUrl: RPC_URLS[31337] },
    { chainId: 1, name: 'Ethereum Mainnet', rpcUrl: RPC_URLS[1] }
  ];
}

/**
 * Update contract addresses (useful for development/testing)
 */
export function updateContractAddresses(
  chainId: number, 
  eduRakshaAddress: string, 
  credentialRegistryAddress: string
): void {
  if (!isNetworkSupported(chainId)) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  
  CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] = {
    eduRakshaVerifierAddress: eduRakshaAddress,
    credentialRegistryAddress: credentialRegistryAddress
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): BlockchainConfig {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // Use local hardhat network for development
    return getBlockchainConfig(31337);
  }
  
  // For production, default to Sepolia (you can change this)
  return getBlockchainConfig(11155111);
} 