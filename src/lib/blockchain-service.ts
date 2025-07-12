import { ethers } from 'ethers';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// Contract ABIs (simplified for demo)
const ENS_VERIFIER_ABI = [
  "function verifyIssuerENS(string memory ensDomain) public view returns (bool, address)",
  "function isTrustedIssuer(address issuer) public view returns (bool)",
  "function getIssuerName(address issuer) public view returns (string memory)"
];

const CREDENTIAL_REGISTRY_ABI = [
  "function verifyCredentialZKP(tuple(string credentialId, address issuer, uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[4] input, uint256 merkleTreeDepth, uint256 timestamp) proof) external returns (tuple(bool isValid, string credentialType, string issuerName, uint256 verifiedAt, string errorMessage))",
  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
  "function isAuthorizedVerifier(address verifier) external view returns (bool)"
];

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  contractAddresses: {
    ensVerifier: string;
    credentialRegistry: string;
  };
}

export interface VerificationResult {
  isValid: boolean;
  credentialType: string;
  issuerName: string;
  verifiedAt: number;
  errorMessage: string;
}

export interface CredentialProof {
  credentialId: string;
  issuer: string;
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  input: [string, string, string, string];
  merkleTreeDepth: number;
  timestamp: number;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.JsonRpcSigner | null = null;
  private config: BlockchainConfig;
  private ensVerifier: ethers.Contract;
  private credentialRegistry: ethers.Contract;

  constructor(config: BlockchainConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    this.ensVerifier = new ethers.Contract(
      config.contractAddresses.ensVerifier,
      ENS_VERIFIER_ABI,
      this.provider
    );
    
    this.credentialRegistry = new ethers.Contract(
      config.contractAddresses.credentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      this.provider
    );
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.signer = await this.provider.getSigner();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  async verifyIssuerENS(ensDomain: string): Promise<{ trusted: boolean; address: string }> {
    try {
      const [trusted, address] = await this.ensVerifier.verifyIssuerENS(ensDomain);
      return { trusted, address };
    } catch (error) {
      console.error('ENS verification failed:', error);
      return { trusted: false, address: ethers.ZeroAddress };
    }
  }

  async verifyCredentialZKP(proof: CredentialProof): Promise<VerificationResult> {
    try {
      // Convert proof to contract format
      const contractProof = {
        credentialId: proof.credentialId,
        issuer: proof.issuer,
        a: [proof.a[0], proof.a[1]],
        b: [[proof.b[0][0], proof.b[0][1]], [proof.b[1][0], proof.b[1][1]]],
        c: [proof.c[0], proof.c[1]],
        input: [proof.input[0], proof.input[1], proof.input[2], proof.input[3]],
        merkleTreeDepth: proof.merkleTreeDepth,
        timestamp: proof.timestamp
      };

      const result = await this.credentialRegistry.verifyCredentialZKP(contractProof);
      
      return {
        isValid: result.isValid,
        credentialType: result.credentialType,
        issuerName: result.issuerName,
        verifiedAt: Number(result.verifiedAt),
        errorMessage: result.errorMessage
      };
    } catch (error) {
      console.error('ZKP verification failed:', error);
      return {
        isValid: false,
        credentialType: '',
        issuerName: '',
        verifiedAt: Date.now(),
        errorMessage: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  async isNullifierUsed(nullifier: string): Promise<boolean> {
    try {
      return await this.credentialRegistry.isNullifierUsed(nullifier);
    } catch (error) {
      console.error('Nullifier check failed:', error);
      return false;
    }
  }

  async isAuthorizedVerifier(address: string): Promise<boolean> {
    try {
      return await this.credentialRegistry.isAuthorizedVerifier(address);
    } catch (error) {
      console.error('Verifier authorization check failed:', error);
      return false;
    }
  }

  async getIssuerName(issuerAddress: string): Promise<string> {
    try {
      return await this.ensVerifier.getIssuerName(issuerAddress);
    } catch (error) {
      console.error('Failed to get issuer name:', error);
      return 'Unknown Issuer';
    }
  }

  // Mock functions for development
  async mockVerifyCredentialZKP(proof: CredentialProof): Promise<VerificationResult> {
    // Simulate blockchain verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isValid = Math.random() > 0.2; // 80% success rate for demo
    
    return {
      isValid,
      credentialType: proof.credentialId,
      issuerName: 'Mock Authority',
      verifiedAt: Date.now(),
      errorMessage: isValid ? '' : 'Mock verification failed'
    };
  }

  async mockVerifyIssuerENS(_ensDomain: string): Promise<{ trusted: boolean; address: string }> {
    // Simulate ENS verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const trusted = Math.random() > 0.1; // 90% trust rate for demo
    
    return {
      trusted,
      address: trusted ? ethers.Wallet.createRandom().address : ethers.ZeroAddress
    };
  }

  // Utility functions
  generateNullifier(input: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(input));
  }

  formatProofForContract(proof: Record<string, unknown>): CredentialProof {
    return {
      credentialId: (proof.credentialId as string) || '',
      issuer: (proof.issuer as string) || ethers.ZeroAddress,
      a: (proof.a as [string, string]) || ['0', '0'],
      b: (proof.b as [[string, string], [string, string]]) || [['0', '0'], ['0', '0']],
      c: (proof.c as [string, string]) || ['0', '0'],
      input: (proof.input as [string, string, string, string]) || ['0', '0', '0', '0'],
      merkleTreeDepth: (proof.merkleTreeDepth as number) || 20,
      timestamp: (proof.timestamp as number) || Math.floor(Date.now() / 1000)
    };
  }
}

// Default configuration for Sepolia testnet
const defaultConfig: BlockchainConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id',
  chainId: 11155111, // Sepolia
  contractAddresses: {
    ensVerifier: process.env.NEXT_PUBLIC_ENS_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000',
    credentialRegistry: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000'
  }
};

export const blockchainService = new BlockchainService(defaultConfig);

// Mock service for development
export class MockBlockchainService extends BlockchainService {
  constructor() {
    super(defaultConfig);
  }

  async verifyCredentialZKP(proof: CredentialProof): Promise<VerificationResult> {
    return this.mockVerifyCredentialZKP(proof);
  }

  async verifyIssuerENS(ensDomain: string): Promise<{ trusted: boolean; address: string }> {
    return this.mockVerifyIssuerENS(ensDomain);
  }
}

export const mockBlockchainService = new MockBlockchainService(); 