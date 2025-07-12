import { ethers } from 'ethers';
import { zkpGenerator, type ZKPProof } from './zkp-generator';

// ABI for the SemaphoreVerifier contract
const SEMAPHORE_VERIFIER_ABI = [
  "function verifyProof(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[4] memory input, uint256 merkleTreeDepth) external pure returns (bool)",
  "function verifyProofWithNullifier(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[4] memory input, uint256 merkleTreeDepth, uint256 nullifier, uint256 groupId) external returns (bool)",
  "function registerGroup(uint256 groupId) external",
  "function isNullifierUsed(uint256 nullifier) external view returns (bool)",
  "function isGroupValid(uint256 groupId) external view returns (bool)",
  "event ProofVerified(uint256 indexed groupId, uint256 indexed nullifier, uint256 signal, address indexed verifier)",
  "event NullifierUsed(uint256 indexed nullifier, address indexed user)",
  "event GroupRegistered(uint256 indexed groupId, address indexed issuer)"
];

export interface BlockchainConfig {
  rpcUrl: string;
  verifierAddress: string;
  chainId: number;
}

export interface VerificationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  nullifierUsed?: boolean;
  groupValid?: boolean;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private verifierContract: ethers.Contract | null = null;
  private config: BlockchainConfig | null = null;

  /**
   * Initialize the blockchain service
   */
  async initialize(config: BlockchainConfig, privateKey?: string): Promise<void> {
    try {
      this.config = config;
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      // Initialize signer if private key provided
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      }
      
      // Initialize verifier contract
      this.verifierContract = new ethers.Contract(
        config.verifierAddress,
        SEMAPHORE_VERIFIER_ABI,
        this.signer || this.provider
      );
      
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Get the current network information
   */
  async getNetworkInfo() {
    if (!this.provider) {
      throw new Error('Blockchain service not initialized');
    }
    
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    
    return {
      chainId: network.chainId,
      blockNumber,
      rpcUrl: this.config?.rpcUrl
    };
  }

  /**
   * Register a credential group on the blockchain
   */
  async registerGroup(groupId: string): Promise<VerificationResult> {
    if (!this.verifierContract || !this.signer) {
      return {
        success: false,
        error: 'Contract or signer not initialized'
      };
    }

    try {
      const groupIdBigInt = BigInt(groupId);
      const tx = await this.verifierContract.registerGroup(groupIdBigInt);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify a ZKP proof on the blockchain
   */
  async verifyProofOnChain(proof: ZKPProof): Promise<VerificationResult> {
    if (!this.verifierContract) {
      return {
        success: false,
        error: 'Contract not initialized'
      };
    }

    try {
      // Check if nullifier has been used
      const nullifierUsed = await this.verifierContract.isNullifierUsed(proof.nullifier);
      if (nullifierUsed) {
        return {
          success: false,
          nullifierUsed: true,
          error: 'Nullifier has already been used'
        };
      }

      // Check if group is valid
      const groupValid = await this.verifierContract.isGroupValid(proof.groupId);
      if (!groupValid) {
        return {
          success: false,
          groupValid: false,
          error: 'Credential group is not valid'
        };
      }

      // Format proof for blockchain
      const blockchainProof = zkpGenerator.formatProofForBlockchain(proof);
      
      // Convert string arrays to number arrays for Solidity
      const a = [BigInt(blockchainProof.a[0]), BigInt(blockchainProof.a[1])];
      const b = [
        [BigInt(blockchainProof.b[0][0]), BigInt(blockchainProof.b[0][1])],
        [BigInt(blockchainProof.b[1][0]), BigInt(blockchainProof.b[1][1])]
      ];
      const c = [BigInt(blockchainProof.c[0]), BigInt(blockchainProof.c[1])];
      const input = blockchainProof.input.map(signal => BigInt(signal));
      const nullifier = BigInt(proof.nullifier);
      const groupId = BigInt(proof.groupId);

      // Verify proof on chain
      const tx = await this.verifierContract.verifyProofWithNullifier(
        a, b, c, input, proof.merkleTreeDepth, nullifier, groupId
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a nullifier has been used
   */
  async checkNullifierUsage(nullifier: string): Promise<boolean> {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.verifierContract.isNullifierUsed(nullifier);
  }

  /**
   * Check if a group is valid
   */
  async checkGroupValidity(groupId: string): Promise<boolean> {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.verifierContract.isGroupValid(groupId);
  }

  /**
   * Listen for proof verification events
   */
  onProofVerified(callback: (groupId: string, nullifier: string, signal: string, verifier: string) => void) {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }
    
    this.verifierContract.on('ProofVerified', (groupId, nullifier, signal, verifier) => {
      callback(groupId.toString(), nullifier.toString(), signal.toString(), verifier);
    });
  }

  /**
   * Listen for nullifier usage events
   */
  onNullifierUsed(callback: (nullifier: string, user: string) => void) {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }
    
    this.verifierContract.on('NullifierUsed', (nullifier, user) => {
      callback(nullifier.toString(), user);
    });
  }

  /**
   * Listen for group registration events
   */
  onGroupRegistered(callback: (groupId: string, issuer: string) => void) {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }
    
    this.verifierContract.on('GroupRegistered', (groupId, issuer) => {
      callback(groupId.toString(), issuer);
    });
  }

  /**
   * Get the current account balance
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const targetAddress = address || (this.signer?.address);
    if (!targetAddress) {
      throw new Error('No address provided and no signer available');
    }
    
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Get the current gas price
   */
  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const gasPrice = await this.provider.getFeeData();
    return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
  }

  /**
   * Estimate gas for proof verification
   */
  async estimateVerificationGas(proof: ZKPProof): Promise<string> {
    if (!this.verifierContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const blockchainProof = zkpGenerator.formatProofForBlockchain(proof);
      
      const a = [BigInt(blockchainProof.a[0]), BigInt(blockchainProof.a[1])];
      const b = [
        [BigInt(blockchainProof.b[0][0]), BigInt(blockchainProof.b[0][1])],
        [BigInt(blockchainProof.b[1][0]), BigInt(blockchainProof.b[1][1])]
      ];
      const c = [BigInt(blockchainProof.c[0]), BigInt(blockchainProof.c[1])];
      const input = blockchainProof.input.map(signal => BigInt(signal));
      const nullifier = BigInt(proof.nullifier);
      const groupId = BigInt(proof.groupId);

      const gasEstimate = await this.verifierContract.verifyProofWithNullifier.estimateGas(
        a, b, c, input, proof.merkleTreeDepth, nullifier, groupId
      );
      
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService(); 