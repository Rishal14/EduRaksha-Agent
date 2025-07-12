import { ethers } from 'ethers';

export interface ZKPInput {
  credentialId: string;
  claimType: string;
  studentAddress: string;
  issuerAddress: string;
  credentialData: Record<string, string | number>;
}

export interface ZKPProof {
  claimType: string;
  studentAddress: string;
  issuerAddress: string;
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  input: [string, string, string, string];
  merkleTreeDepth: number;
  nullifier: string;
  timestamp: number;
}

export interface ZKPResult {
  proof: ZKPProof;
  isValid: boolean;
  errorMessage?: string;
}

class ZKPGenerator {
  private merkleTreeDepth = 20;

  /**
   * Generate a Zero-Knowledge Proof for a specific claim
   * @param input ZKP input parameters
   * @returns ZKP proof result
   */
  async generateProof(input: ZKPInput): Promise<ZKPResult> {
    try {
      // Step 1: Validate input
      const validation = this.validateInput(input);
      if (!validation.isValid) {
        return {
          proof: this.createEmptyProof(input),
          isValid: false,
          errorMessage: validation.errorMessage
        };
      }

      // Step 2: Generate nullifier (prevents double-spending)
      const nullifier = this.generateNullifier(input);

      // Step 3: Create Merkle tree input
      const merkleInput = this.createMerkleInput(input);

      // Step 4: Generate ZKP proof (simulated for demo)
      const proof = await this.generateZKProof(input, merkleInput, nullifier);

      return {
        proof,
        isValid: true
      };

    } catch (error) {
      console.error('ZKP generation failed:', error);
      return {
        proof: this.createEmptyProof(input),
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'ZKP generation failed'
      };
    }
  }

  /**
   * Validate ZKP input parameters
   */
  private validateInput(input: ZKPInput): { isValid: boolean; errorMessage?: string } {
    if (!input.credentialId || input.credentialId.trim() === '') {
      return { isValid: false, errorMessage: 'Credential ID is required' };
    }

    if (!input.claimType || input.claimType.trim() === '') {
      return { isValid: false, errorMessage: 'Claim type is required' };
    }

    if (!ethers.isAddress(input.studentAddress)) {
      return { isValid: false, errorMessage: 'Invalid student address' };
    }

    if (!ethers.isAddress(input.issuerAddress)) {
      return { isValid: false, errorMessage: 'Invalid issuer address' };
    }

    if (!input.credentialData || Object.keys(input.credentialData).length === 0) {
      return { isValid: false, errorMessage: 'Credential data is required' };
    }

    return { isValid: true };
  }

  /**
   * Generate a unique nullifier to prevent double-spending
   */
  private generateNullifier(input: ZKPInput): string {
    const nullifierData = `${input.credentialId}-${input.claimType}-${input.studentAddress}-${Date.now()}`;
    return ethers.keccak256(ethers.toUtf8Bytes(nullifierData));
  }

  /**
   * Create Merkle tree input from credential data
   */
  private createMerkleInput(input: ZKPInput): string[] {
    const { credentialData, claimType } = input;
    
    // Convert credential data to Merkle tree input
    const inputArray: string[] = [];
    
    // Add claim type hash
    inputArray.push(ethers.keccak256(ethers.toUtf8Bytes(claimType)));
    
    // Add credential data hashes
    Object.entries(credentialData).forEach(([key, value]) => {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(`${key}:${value}`));
      inputArray.push(dataHash);
    });
    
    // Pad to required length (4 elements for this implementation)
    while (inputArray.length < 4) {
      inputArray.push(ethers.ZeroHash);
    }
    
    return inputArray.slice(0, 4);
  }

  /**
   * Generate ZKP proof using Semaphore-like protocol
   */
  private async generateZKProof(
    input: ZKPInput, 
    merkleInput: string[], 
    nullifier: string
  ): Promise<ZKPProof> {
    // Simulate ZKP generation process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock proof components (in real implementation, this would use actual ZKP library)
    const proof: ZKPProof = {
      claimType: input.claimType,
      studentAddress: input.studentAddress,
      issuerAddress: input.issuerAddress,
      a: [
        ethers.keccak256(ethers.toUtf8Bytes(`a-${input.credentialId}-${Date.now()}`)),
        ethers.keccak256(ethers.toUtf8Bytes(`a-${input.credentialId}-${Date.now() + 1}`))
      ],
      b: [
        [
          ethers.keccak256(ethers.toUtf8Bytes(`b-${input.credentialId}-0-0`)),
          ethers.keccak256(ethers.toUtf8Bytes(`b-${input.credentialId}-0-1`))
        ],
        [
          ethers.keccak256(ethers.toUtf8Bytes(`b-${input.credentialId}-1-0`)),
          ethers.keccak256(ethers.toUtf8Bytes(`b-${input.credentialId}-1-1`))
        ]
      ],
      c: [
        ethers.keccak256(ethers.toUtf8Bytes(`c-${input.credentialId}-0`)),
        ethers.keccak256(ethers.toUtf8Bytes(`c-${input.credentialId}-1`))
      ],
      input: merkleInput as [string, string, string, string],
      merkleTreeDepth: this.merkleTreeDepth,
      nullifier,
      timestamp: Math.floor(Date.now() / 1000)
    };

    return proof;
  }

  /**
   * Create empty proof for error cases
   */
  private createEmptyProof(input: ZKPInput): ZKPProof {
    return {
      claimType: input.claimType,
      studentAddress: input.studentAddress,
      issuerAddress: input.issuerAddress,
      a: [ethers.ZeroHash, ethers.ZeroHash],
      b: [[ethers.ZeroHash, ethers.ZeroHash], [ethers.ZeroHash, ethers.ZeroHash]],
      c: [ethers.ZeroHash, ethers.ZeroHash],
      input: [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash],
      merkleTreeDepth: this.merkleTreeDepth,
      nullifier: ethers.ZeroHash,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Verify a ZKP proof (for testing purposes)
   */
  async verifyProof(proof: ZKPProof): Promise<boolean> {
    try {
      // Basic validation
      if (!proof.claimType || !proof.studentAddress || !proof.issuerAddress) {
        return false;
      }

      // Check if nullifier is valid
      if (proof.nullifier === ethers.ZeroHash) {
        return false;
      }

      // Check if proof components are valid
      if (proof.a[0] === ethers.ZeroHash || proof.a[1] === ethers.ZeroHash) {
        return false;
      }

      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, return true if all basic checks pass
      return true;

    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  /**
   * Generate proof for specific claim types
   */
  async generateIncomeProof(
    studentAddress: string,
    issuerAddress: string,
    income: number,
    threshold: number
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: `income-${Date.now()}`,
      claimType: `Income < ₹${threshold.toLocaleString()}`,
      studentAddress,
      issuerAddress,
      credentialData: {
        income: income.toString(),
        threshold: threshold.toString(),
        currency: 'INR'
      }
    };

    return this.generateProof(input);
  }

  async generateCasteProof(
    studentAddress: string,
    issuerAddress: string,
    caste: string
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: `caste-${Date.now()}`,
      claimType: `Caste = ${caste}`,
      studentAddress,
      issuerAddress,
      credentialData: {
        caste,
        category: caste === 'SC' ? 'Scheduled Caste' : 
                  caste === 'ST' ? 'Scheduled Tribe' : 'Other'
      }
    };

    return this.generateProof(input);
  }

  async generateMarksProof(
    studentAddress: string,
    issuerAddress: string,
    marks: number,
    threshold: number
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: `marks-${Date.now()}`,
      claimType: `Marks > ${threshold}%`,
      studentAddress,
      issuerAddress,
      credentialData: {
        marks: marks.toString(),
        threshold: threshold.toString(),
        unit: 'percentage'
      }
    };

    return this.generateProof(input);
  }

  /**
   * Format proof for blockchain submission
   */
  formatProofForBlockchain(proof: ZKPProof) {
    return {
      claimType: proof.claimType,
      student: proof.studentAddress,
      issuer: proof.issuerAddress,
      a: proof.a,
      b: proof.b,
      c: proof.c,
      input: proof.input,
      merkleTreeDepth: proof.merkleTreeDepth,
      nullifier: proof.nullifier
    };
  }

  /**
   * Export proof as JSON
   */
  exportProof(proof: ZKPProof): string {
    return JSON.stringify(proof, null, 2);
  }

  /**
   * Import proof from JSON
   */
  importProof(proofJson: string): ZKPProof | null {
    try {
      return JSON.parse(proofJson) as ZKPProof;
    } catch (error) {
      console.error('Failed to import proof:', error);
      return null;
    }
  }
}

export const zkpGenerator = new ZKPGenerator(); 