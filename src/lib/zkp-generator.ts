import { ethers } from 'ethers';

export interface ZKPInput {
  credentialId: string;
  claimType: string;
  studentAddress: string;
  issuerAddress: string;
  credentialData: Record<string, string | number | boolean>;
}

export interface ZKPProof {
  claimType: string;
  studentAddress: string;
  issuerAddress: string;
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
  merkleTreeDepth: number;
  nullifier: string;
  timestamp: number;
  groupId: string;
}

export interface ZKPResult {
  proof: ZKPProof;
  isValid: boolean;
  errorMessage?: string;
}

export interface CredentialGroup {
  id: string;
  name: string;
  members: string[];
  merkleTree: GroupData;
}

interface GroupData {
  id: string;
  members: string[];
  root: string;
  addMember: (member: string) => void;
}

class ZKPGenerator {
  private merkleTreeDepth = 20;
  private groups: Map<string, GroupData> = new Map();

  constructor() {
    console.log('ZKP Generator initialized with simplified implementation');
  }

  /**
   * Create or get a credential group for a specific claim type
   */
  private async getOrCreateGroup(claimType: string): Promise<GroupData> {
    const groupId = ethers.keccak256(ethers.toUtf8Bytes(claimType));
    
    if (!this.groups.has(groupId)) {
      // Simplified group implementation
      const group: GroupData = {
        id: groupId,
        members: [],
        root: ethers.ZeroHash,
        addMember: (member: string) => {
          group.members.push(member);
          group.root = ethers.keccak256(ethers.toUtf8Bytes(member.toString()));
        }
      };
      this.groups.set(groupId, group);
    }
    
    return this.groups.get(groupId)!;
  }

  /**
   * Add a member to a credential group
   */
  private async addMemberToGroup(group: GroupData, memberId: string) {
    // Simplified: use simple hash
    const memberHash = ethers.keccak256(ethers.toUtf8Bytes(memberId));
    group.addMember(memberHash);
  }

  /**
   * Generate a Zero-Knowledge Proof for a specific claim
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

      // Step 2: Validate claim integrity
      const integrityCheck = this.validateClaimIntegrity(input);
      if (!integrityCheck.isValid) {
        return {
          proof: this.createEmptyProof(input),
          isValid: false,
          errorMessage: integrityCheck.errorMessage
        };
      }

      // Step 3: Get or create credential group
      const group = await this.getOrCreateGroup(input.claimType);
      
      // Step 4: Add student to group if not already present
      const studentId = this.hashStudentId(input.studentAddress, input.credentialId);
      await this.addMemberToGroup(group, studentId);

      // Step 5: Generate nullifier
      const nullifier = this.generateNullifier(input);

      // Step 6: Generate simplified ZKP
      const proof = await this.generateSimplifiedProof(input, group, nullifier);

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
   * Generate simplified ZKP proof
   */
  private async generateSimplifiedProof(
    input: ZKPInput,
    group: GroupData,
    nullifier: string
  ): Promise<ZKPProof> {
    // Create a simplified proof structure
    const signal = this.createSignal(input);
    
    // Generate mock proof values (in a real implementation, these would be computed)
    const proof = {
      a: [
        ethers.keccak256(ethers.toUtf8Bytes(input.studentAddress + "1")),
        ethers.keccak256(ethers.toUtf8Bytes(input.studentAddress + "2"))
      ] as [string, string],
      b: [
        [
          ethers.keccak256(ethers.toUtf8Bytes(input.credentialId + "1")),
          ethers.keccak256(ethers.toUtf8Bytes(input.credentialId + "2"))
        ],
        [
          ethers.keccak256(ethers.toUtf8Bytes(input.claimType + "1")),
          ethers.keccak256(ethers.toUtf8Bytes(input.claimType + "2"))
        ]
      ] as [[string, string], [string, string]],
      c: [
        ethers.keccak256(ethers.toUtf8Bytes(nullifier + "1")),
        ethers.keccak256(ethers.toUtf8Bytes(nullifier + "2"))
      ] as [string, string]
    };

    const publicSignals = [
      group.root,
      nullifier,
      signal.toString(),
      input.studentAddress,
      input.issuerAddress
    ];

    return {
      claimType: input.claimType,
      studentAddress: input.studentAddress,
      issuerAddress: input.issuerAddress,
      proof,
      publicSignals,
      merkleTreeDepth: this.merkleTreeDepth,
      nullifier,
      timestamp: Date.now(),
      groupId: group.id
    };
  }

  /**
   * Create a signal from the input data
   */
  private createSignal(input: ZKPInput): bigint {
    const signalData = {
      claimType: input.claimType,
      credentialId: input.credentialId,
      studentAddress: input.studentAddress,
      issuerAddress: input.issuerAddress,
      ...input.credentialData
    };
    
    const signalString = JSON.stringify(signalData);
    return BigInt(ethers.keccak256(ethers.toUtf8Bytes(signalString)));
  }

  /**
   * Hash student ID for group membership
   */
  private hashStudentId(studentAddress: string, credentialId: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(studentAddress + credentialId));
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: ZKPInput): { isValid: boolean; errorMessage?: string } {
    if (!input.credentialId || input.credentialId.trim() === '') {
      return { isValid: false, errorMessage: 'Credential ID is required' };
    }
    
    if (!input.claimType || input.claimType.trim() === '') {
      return { isValid: false, errorMessage: 'Claim type is required' };
    }
    
    if (!input.studentAddress || !ethers.isAddress(input.studentAddress)) {
      return { isValid: false, errorMessage: 'Valid student address is required' };
    }
    
    if (!input.issuerAddress || !ethers.isAddress(input.issuerAddress)) {
      return { isValid: false, errorMessage: 'Valid issuer address is required' };
    }
    
    if (!input.credentialData || Object.keys(input.credentialData).length === 0) {
      return { isValid: false, errorMessage: 'Credential data is required' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate that the claim is mathematically consistent
   */
  private validateClaimIntegrity(input: ZKPInput): { isValid: boolean; errorMessage?: string } {
    const claimType = input.claimType.toLowerCase();
    const credentialData = input.credentialData;

    // Income threshold validation
    if (claimType.includes('income') || claimType.includes('salary')) {
      const actualIncome = this.extractNumericValue(credentialData.value || credentialData.income);
      const threshold = this.extractThresholdFromClaim(claimType) || this.extractNumericValue(credentialData.threshold);
      
      if (actualIncome >= threshold) {
        return {
          isValid: false,
          errorMessage: `Cannot prove income < ₹${threshold.toLocaleString()}. Your actual income (₹${actualIncome.toLocaleString()}) is above the threshold.`
        };
      }
    }

    // Marks threshold validation
    if (claimType.includes('marks') || claimType.includes('percentage') || claimType.includes('grade')) {
      const actualMarks = this.extractNumericValue(credentialData.value || credentialData.marks);
      const threshold = this.extractThresholdFromClaim(claimType) || this.extractNumericValue(credentialData.threshold);
      
      if (actualMarks < threshold) {
        return {
          isValid: false,
          errorMessage: `Cannot prove marks > ${threshold}%. Your actual marks (${actualMarks}%) are below the threshold.`
        };
      }
    }

    // Caste verification (should match exactly)
    if (claimType.includes('caste')) {
      const actualCaste = credentialData.value || credentialData.caste;
      const claimedCaste = this.extractCasteFromClaim(claimType);
      
      if (actualCaste !== claimedCaste) {
        return {
          isValid: false,
          errorMessage: `Cannot prove caste = ${claimedCaste}. Your actual caste is ${actualCaste}.`
        };
      }
    }

    // Disability status verification
    if (claimType.includes('disability')) {
      const hasDisability = credentialData.value === 'true' || credentialData.hasDisability === true;
      const claimRequiresDisability = claimType.includes('has disability = yes');
      
      if (claimRequiresDisability && !hasDisability) {
        return {
          isValid: false,
          errorMessage: 'Cannot prove disability status. You do not have a disability credential.'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Extract numeric value from credential data
   */
  private extractNumericValue(value: string | number | boolean | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleanValue = value.replace(/[₹,]/g, '').replace(/%/g, '');
      const num = parseFloat(cleanValue);
      return isNaN(num) ? 0 : num;
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  }

  /**
   * Extract threshold value from claim type
   */
  private extractThresholdFromClaim(claimType: string): number {
    // Extract numbers from claim type
    const numbers = claimType.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]);
    }
    
    // Default thresholds
    if (claimType.includes('income')) return 250000;
    if (claimType.includes('marks')) return 75;
    
    return 0;
  }

  /**
   * Extract caste from claim type
   */
  private extractCasteFromClaim(claimType: string): string {
    if (claimType.includes('sc')) return 'SC';
    if (claimType.includes('st')) return 'ST';
    if (claimType.includes('obc')) return 'OBC';
    if (claimType.includes('general')) return 'General';
    return 'Unknown';
  }

  /**
   * Generate nullifier for the proof
   */
  private generateNullifier(input: ZKPInput): string {
    const nullifierData = input.studentAddress + input.credentialId + input.claimType;
    return ethers.keccak256(ethers.toUtf8Bytes(nullifierData));
  }

  /**
   * Create an empty proof structure
   */
  private createEmptyProof(input: ZKPInput): ZKPProof {
    return {
      claimType: input.claimType,
      studentAddress: input.studentAddress,
      issuerAddress: input.issuerAddress,
      proof: {
        a: [ethers.ZeroHash, ethers.ZeroHash],
        b: [[ethers.ZeroHash, ethers.ZeroHash], [ethers.ZeroHash, ethers.ZeroHash]],
        c: [ethers.ZeroHash, ethers.ZeroHash]
      },
      publicSignals: [],
      merkleTreeDepth: this.merkleTreeDepth,
      nullifier: ethers.ZeroHash,
      timestamp: Date.now(),
      groupId: ethers.ZeroHash
    };
  }

  /**
   * Verify a ZKP proof
   */
  async verifyProof(proof: ZKPProof): Promise<boolean> {
    try {
      // Simplified verification - just check basic structure
      if (!proof.proof || !proof.publicSignals || proof.publicSignals.length === 0) {
        return false;
      }
      
      // Check that proof values are not zero hashes
      const hasValidProof = proof.proof.a.some(hash => hash !== ethers.ZeroHash) &&
                           proof.proof.b.some(row => row.some(hash => hash !== ethers.ZeroHash)) &&
                           proof.proof.c.some(hash => hash !== ethers.ZeroHash);
      
      return hasValidProof;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  /**
   * Generate income proof
   */
  async generateIncomeProof(
    studentAddress: string,
    issuerAddress: string,
    income: number,
    threshold: number
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: ethers.keccak256(ethers.toUtf8Bytes(`income_${studentAddress}_${Date.now()}`)),
      claimType: 'income',
      studentAddress,
      issuerAddress,
      credentialData: {
        income,
        threshold,
        isEligible: income <= threshold ? 1 : 0
      }
    };
    
    return this.generateProof(input);
  }

  /**
   * Generate caste proof
   */
  async generateCasteProof(
    studentAddress: string,
    issuerAddress: string,
    caste: string
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: ethers.keccak256(ethers.toUtf8Bytes(`caste_${studentAddress}_${Date.now()}`)),
      claimType: 'caste',
      studentAddress,
      issuerAddress,
      credentialData: {
        caste,
        isReserved: ['SC', 'ST', 'OBC'].includes(caste.toUpperCase()) ? 1 : 0
      }
    };
    
    return this.generateProof(input);
  }

  /**
   * Generate marks proof
   */
  async generateMarksProof(
    studentAddress: string,
    issuerAddress: string,
    marks: number,
    threshold: number
  ): Promise<ZKPResult> {
    const input: ZKPInput = {
      credentialId: ethers.keccak256(ethers.toUtf8Bytes(`marks_${studentAddress}_${Date.now()}`)),
      claimType: 'marks',
      studentAddress,
      issuerAddress,
      credentialData: {
        marks,
        threshold,
        isEligible: marks >= threshold ? 1 : 0
      }
    };
    
    return this.generateProof(input);
  }

  /**
   * Format proof for blockchain submission
   */
  formatProofForBlockchain(proof: ZKPProof) {
    return {
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      claimType: proof.claimType,
      studentAddress: proof.studentAddress,
      issuerAddress: proof.issuerAddress,
      nullifier: proof.nullifier,
      timestamp: proof.timestamp
    };
  }

  /**
   * Export proof as JSON string
   */
  exportProof(proof: ZKPProof): string {
    return JSON.stringify(proof, null, 2);
  }

  /**
   * Import proof from JSON string
   */
  importProof(proofJson: string): ZKPProof | null {
    try {
      return JSON.parse(proofJson) as ZKPProof;
    } catch (error) {
      console.error('Failed to import proof:', error);
      return null;
    }
  }

  /**
   * Get all credential groups
   */
  getCredentialGroups(): CredentialGroup[] {
    const groups: CredentialGroup[] = [];
    
    this.groups.forEach((group, id) => {
      groups.push({
        id,
        name: `Group ${id.slice(0, 8)}`,
        members: group.members,
        merkleTree: group
      });
    });
    
    return groups;
  }

  /**
   * Check if advanced ZKP features are available
   */
  isAdvancedAvailable(): boolean {
    return false; // Simplified implementation
  }
}

// Export singleton instance
export const zkpGenerator = new ZKPGenerator();
export default zkpGenerator; 