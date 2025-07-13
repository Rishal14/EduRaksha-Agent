import { ethers } from 'ethers';
import { zkpGenerator, type ZKPProof } from './zkp-generator';

// ABI for the EduRakshaVerifier contract
const EDU_RAKSHA_VERIFIER_ABI = [
  // Core verification functions
  "function verifyCredential(string memory claimType, address student, address issuer, uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[4] memory input, uint256 merkleTreeDepth, bytes32 nullifier) external returns (bool)",
  "function batchVerifyCredentials(string[] memory claimTypes, address[] memory students, address[] memory issuers, uint256[2][][] memory a, uint256[2][2][][] memory b, uint256[2][][] memory c, uint256[4][][] memory input, uint256[] memory merkleTreeDepths, bytes32[] memory nullifiers) external returns (bool[] memory)",
  
  // Issuer management
  "function registerIssuer(address issuer, string memory domain, bool trusted) external",
  "function trustedIssuers(address issuer) external view returns (bool)",
  "function issuerDomains(string memory domain) external view returns (address)",
  "function revokeIssuerTrust(address issuer) external",
  
  // Verification checks
  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
  "function verifyIssuerENS(string memory ensDomain) external view returns (bool trusted, address issuerAddress)",
  "function getIssuerByDomain(string memory domain) external view returns (address)",
  
  // Statistics
  "function getVerificationStats() external view returns (uint256 totalVerifications, uint256 successfulVerifications, uint256 trustedIssuerCount)",
  
  // Events
  "event CredentialVerified(string indexed claimType, address indexed student, address indexed issuer, bool isValid, uint256 timestamp)",
  "event NullifierUsed(bytes32 indexed nullifier, address indexed student)",
  "event IssuerRegistered(address indexed issuer, string domain, bool trusted)"
];

// ABI for the CredentialRegistry contract
const CREDENTIAL_REGISTRY_ABI = [
  "function registerCredential(bytes32 credentialId, address student, bytes32 credentialHash, string calldata zkpReference) external",
  "function getCredential(bytes32 credentialId) external view returns (address student, bytes32 credentialHash, string memory zkpReference, uint256 issuedAt, address issuer)",
  "function verifyZKP(bytes32 credentialId, uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[4] calldata input, uint256 merkleTreeDepth) external returns (bool)",
  "function setSemaphoreVerifier(address _verifier) external",
  "function semaphoreVerifier() external view returns (address)",
  "event CredentialRegistered(bytes32 indexed credentialId, address indexed student, address indexed issuer)",
  "event ProofVerified(bytes32 indexed credentialId, bool valid)"
];

export interface BlockchainConfig {
  rpcUrl: string;
  eduRakshaVerifierAddress: string;
  credentialRegistryAddress: string;
  chainId: number;
}

export interface VerificationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  nullifierUsed?: boolean;
  issuerTrusted?: boolean;
}

export interface CredentialData {
  student: string;
  credentialHash: string;
  zkpReference: string;
  issuedAt: number;
  issuer: string;
}

export interface IssuerInfo {
  address: string;
  domain: string;
  trusted: boolean;
}

export interface VerificationStats {
  totalVerifications: number;
  successfulVerifications: number;
  trustedIssuerCount: number;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private eduRakshaContract: ethers.Contract | null = null;
  private credentialRegistryContract: ethers.Contract | null = null;
  private config: BlockchainConfig | null = null;

  /**
   * Initialize the blockchain service
   */
  async initialize(config: BlockchainConfig, privateKey?: string): Promise<void> {
    try {
      this.config = config;
      // Defensive checks for contract addresses
      if (!config.eduRakshaVerifierAddress || !ethers.isAddress(config.eduRakshaVerifierAddress)) {
        throw new Error("Invalid EduRakshaVerifier contract address");
      }
      if (!config.credentialRegistryAddress || !ethers.isAddress(config.credentialRegistryAddress)) {
        throw new Error("Invalid CredentialRegistry contract address");
      }
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      // Initialize signer if private key provided
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      }
      // Initialize EduRaksha verifier contract
      this.eduRakshaContract = new ethers.Contract(
        config.eduRakshaVerifierAddress,
        EDU_RAKSHA_VERIFIER_ABI,
        this.signer || this.provider
      );
      // Initialize credential registry contract
      this.credentialRegistryContract = new ethers.Contract(
        config.credentialRegistryAddress,
        CREDENTIAL_REGISTRY_ABI,
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
   * Register a credential on the blockchain
   */
  async registerCredential(
    credentialId: string,
    studentAddress: string,
    credentialHash: string,
    zkpReference: string
  ): Promise<VerificationResult> {
    if (!this.credentialRegistryContract || !this.signer) {
      return {
        success: false,
        error: 'Contract or signer not initialized'
      };
    }

    try {
      const tx = await this.credentialRegistryContract.registerCredential(
        credentialId,
        studentAddress,
        credentialHash,
        zkpReference
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
   * Get credential data from the blockchain
   */
  async getCredential(credentialId: string): Promise<CredentialData | null> {
    if (!this.credentialRegistryContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const credential = await this.credentialRegistryContract.getCredential(credentialId);
      return {
        student: credential[0],
        credentialHash: credential[1],
        zkpReference: credential[2],
        issuedAt: Number(credential[3]),
        issuer: credential[4]
      };
    } catch (error) {
      console.error('Failed to get credential:', error);
      return null;
    }
  }

  /**
   * Verify a ZKP proof using EduRaksha verifier
   */
  async verifyCredentialOnChain(
    claimType: string,
    studentAddress: string,
    issuerAddress: string,
    proof: ZKPProof
  ): Promise<VerificationResult> {
    if (!this.eduRakshaContract) {
      return {
        success: false,
        error: 'Contract not initialized'
      };
    }

    try {
      // Check if nullifier has been used
      const nullifierUsed = await this.eduRakshaContract.isNullifierUsed(proof.nullifier);
      if (nullifierUsed) {
        return {
          success: false,
          nullifierUsed: true,
          error: 'Nullifier has already been used'
        };
      }

      // Check if issuer is trusted
      const issuerTrusted = await this.eduRakshaContract.trustedIssuers(issuerAddress);
      if (!issuerTrusted) {
        return {
          success: false,
          issuerTrusted: false,
          error: 'Issuer is not trusted'
        };
      }

      // Format proof for blockchain
      const blockchainProof = zkpGenerator.formatProofForBlockchain(proof);
      
      // Convert string arrays to number arrays for Solidity
      const a = [BigInt(blockchainProof.proof.a[0]), BigInt(blockchainProof.proof.a[1])];
      const b = [
        [BigInt(blockchainProof.proof.b[0][0]), BigInt(blockchainProof.proof.b[0][1])],
        [BigInt(blockchainProof.proof.b[1][0]), BigInt(blockchainProof.proof.b[1][1])]
      ];
      const c = [BigInt(blockchainProof.proof.c[0]), BigInt(blockchainProof.proof.c[1])];
      const input = blockchainProof.publicSignals.slice(0, 4).map(signal => BigInt(signal));
      const nullifier = proof.nullifier;

      // Verify credential on chain
      const tx = await this.eduRakshaContract.verifyCredential(
        claimType,
        studentAddress,
        issuerAddress,
        a, b, c, input, proof.merkleTreeDepth, nullifier
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
   * Batch verify multiple credentials
   */
  async batchVerifyCredentials(
    claimTypes: string[],
    studentAddresses: string[],
    issuerAddresses: string[],
    proofs: ZKPProof[]
  ): Promise<VerificationResult> {
    if (!this.eduRakshaContract || !this.signer) {
      return {
        success: false,
        error: 'Contract or signer not initialized'
      };
    }

    try {
      // Format all proofs for blockchain
      const a: number[][] = [];
      const b: number[][][] = [];
      const c: number[][] = [];
      const input: number[][] = [];
      const merkleTreeDepths: number[] = [];
      const nullifiers: string[] = [];

      for (const proof of proofs) {
        const blockchainProof = zkpGenerator.formatProofForBlockchain(proof);
        
        a.push([
          Number(blockchainProof.proof.a[0]),
          Number(blockchainProof.proof.a[1])
        ]);
        b.push([
          [
            Number(blockchainProof.proof.b[0][0]),
            Number(blockchainProof.proof.b[0][1])
          ],
          [
            Number(blockchainProof.proof.b[1][0]),
            Number(blockchainProof.proof.b[1][1])
          ]
        ]);
        c.push([
          Number(blockchainProof.proof.c[0]),
          Number(blockchainProof.proof.c[1])
        ]);
        input.push(blockchainProof.publicSignals.slice(0, 4).map(signal => Number(signal)));
        merkleTreeDepths.push(proof.merkleTreeDepth);
        nullifiers.push(proof.nullifier);
      }

      const tx = await this.eduRakshaContract.batchVerifyCredentials(
        claimTypes,
        studentAddresses,
        issuerAddresses,
        a, b, c, input, merkleTreeDepths, nullifiers
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
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.eduRakshaContract.isNullifierUsed(nullifier);
  }

  /**
   * Check if an issuer is trusted
   */
  async checkIssuerTrust(issuerAddress: string): Promise<boolean> {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.eduRakshaContract.trustedIssuers(issuerAddress);
  }

  /**
   * Get issuer by domain
   */
  async getIssuerByDomain(domain: string): Promise<string> {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    return await this.eduRakshaContract.getIssuerByDomain(domain);
  }

  /**
   * Verify issuer through ENS
   */
  async verifyIssuerENS(ensDomain: string): Promise<{ trusted: boolean; issuerAddress: string }> {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    const result = await this.eduRakshaContract.verifyIssuerENS(ensDomain);
    return {
      trusted: result[0],
      issuerAddress: result[1]
    };
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<VerificationStats> {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    const stats = await this.eduRakshaContract.getVerificationStats();
    return {
      totalVerifications: Number(stats[0]),
      successfulVerifications: Number(stats[1]),
      trustedIssuerCount: Number(stats[2])
    };
  }

  /**
   * Listen for credential verification events
   */
  onCredentialVerified(callback: (claimType: string, student: string, issuer: string, isValid: boolean, timestamp: number) => void) {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    this.eduRakshaContract.on('CredentialVerified', callback);
  }

  /**
   * Listen for nullifier usage events
   */
  onNullifierUsed(callback: (nullifier: string, student: string) => void) {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    this.eduRakshaContract.on('NullifierUsed', callback);
  }

  /**
   * Listen for issuer registration events
   */
  onIssuerRegistered(callback: (issuer: string, domain: string, trusted: boolean) => void) {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }
    
    this.eduRakshaContract.on('IssuerRegistered', callback);
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const targetAddress = address || this.signer?.address;
    if (!targetAddress) {
      throw new Error('No address provided and no signer available');
    }
    
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const gasPrice = await this.provider.getFeeData();
    return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
  }

  /**
   * Estimate gas for credential verification
   */
  async estimateVerificationGas(
    claimType: string,
    studentAddress: string,
    issuerAddress: string,
    proof: ZKPProof
  ): Promise<string> {
    if (!this.eduRakshaContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const blockchainProof = zkpGenerator.formatProofForBlockchain(proof);
      
      const a = [BigInt(blockchainProof.proof.a[0]), BigInt(blockchainProof.proof.a[1])];
      const b = [
        [BigInt(blockchainProof.proof.b[0][0]), BigInt(blockchainProof.proof.b[0][1])],
        [BigInt(blockchainProof.proof.b[1][0]), BigInt(blockchainProof.proof.b[1][1])]
      ];
      const c = [BigInt(blockchainProof.proof.c[0]), BigInt(blockchainProof.proof.c[1])];
      const input = blockchainProof.publicSignals.slice(0, 4).map(signal => BigInt(signal));
      const nullifier = proof.nullifier;

      const gasEstimate = await this.eduRakshaContract.verifyCredential.estimateGas(
        claimType,
        studentAddress,
        issuerAddress,
        a, b, c, input, proof.merkleTreeDepth, nullifier
      );
      
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect wallet using MetaMask or other Web3 provider
   */
  async connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask or Web3 provider not found');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Reinitialize contracts with new signer
      if (this.config) {
        this.eduRakshaContract = new ethers.Contract(
          this.config.eduRakshaVerifierAddress,
          EDU_RAKSHA_VERIFIER_ABI,
          this.signer
        );
        
        this.credentialRegistryContract = new ethers.Contract(
          this.config.credentialRegistryAddress,
          CREDENTIAL_REGISTRY_ABI,
          this.signer
        );
      }
      
      return account;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get connected account address
   */
  getConnectedAddress(): string | null {
    return this.signer?.address || null;
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.signer = null;
    this.provider = null;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService; 