import { ethers } from 'ethers';

export interface VerifiableCredential {
  id: string;
  type: string;
  issuer: {
    id: string;
    name: string;
    ensDomain?: string;
  };
  subject: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, string | number | undefined>;
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
  status: 'active' | 'revoked' | 'expired';
  isSelfIssued: boolean; // New field to identify self-issued credentials
}

export interface WalletInfo {
  address: string;
  name: string;
  email?: string;
  phone?: string;
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
  lastBackup?: string;
  credentialCount: number;
}

export interface WalletBackup {
  version: string;
  timestamp: string;
  walletInfo: WalletInfo;
  credentials: VerifiableCredential[];
  encryptionKey?: string; // In real implementation, this would be encrypted
}

class SSIWallet {
  private walletInfo: WalletInfo;
  private credentials: Map<string, VerifiableCredential>;
  private encryptionKey: string;

  constructor() {
    this.credentials = new Map();
    this.encryptionKey = this.generateEncryptionKey();
    // Load credentials from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ssi-wallet-credentials');
      if (stored) {
        try {
          const creds: VerifiableCredential[] = JSON.parse(stored);
          creds.forEach(cred => this.credentials.set(cred.id, cred));
        } catch {
          // ignore parse errors
        }
      }
    }
    // Initialize with demo wallet info
    this.walletInfo = {
      address: "0x1234567890123456789012345678901234567890",
      name: "Student Wallet",
      email: "student@example.com",
      phone: "+91 98765 43210",
      securityLevel: "enhanced",
      credentialCount: this.credentials.size
    };
  }

  private persistCredentials() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ssi-wallet-credentials', JSON.stringify(Array.from(this.credentials.values())));
    }
  }

  /**
   * Generate a secure encryption key for wallet data
   */
  private generateEncryptionKey(): string {
    return ethers.Wallet.createRandom().privateKey;
  }

  /**
   * Get wallet information
   */
  getWalletInfo(): WalletInfo {
    return {
      ...this.walletInfo,
      credentialCount: this.credentials.size
    };
  }

  /**
   * Create a self-issued credential (student creates their own VC)
   */
  async createSelfIssuedCredential(
    type: string,
    credentialData: Record<string, string | number>,
    studentName: string,
    expirationDate?: string
  ): Promise<string> {
    try {
      // Generate unique ID for the credential
      const id = `vc:self:${this.walletInfo.address}:${Date.now()}`;
      
      // Create the credential with student as both issuer and subject
      const credential: Omit<VerifiableCredential, 'id' | 'proof'> = {
        type,
        issuer: {
          id: `did:ethr:${this.walletInfo.address}`,
          name: studentName,
          ensDomain: `${studentName.toLowerCase().replace(/\s+/g, '')}.eth`
        },
        subject: {
          id: `did:ethr:${this.walletInfo.address}`,
          name: studentName
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year default
        credentialSubject: credentialData,
        status: 'active',
        isSelfIssued: true
      };
      
      // Create proof for the credential
      const proof = await this.createCredentialProof(credential);
      
      // Create the complete credential
      const completeCredential: VerifiableCredential = {
        ...credential,
        id,
        proof,
        isSelfIssued: true
      };

      // Store the credential
      this.credentials.set(id, completeCredential);
      
      // Update wallet info
      this.walletInfo.credentialCount = this.credentials.size;
      this.persistCredentials();
      
      return id;
    } catch (error) {
      console.error('Error creating self-issued credential:', error);
      throw new Error('Failed to create self-issued credential');
    }
  }

  /**
   * Add a new verifiable credential to the wallet (for external credentials)
   */
  async addCredential(credential: Omit<VerifiableCredential, 'id' | 'proof'>): Promise<string> {
    try {
      // Generate unique ID for the credential
      const id = `vc:${this.walletInfo.address}:${Date.now()}`;
      
      // Create proof for the credential
      const proof = await this.createCredentialProof(credential);
      
      // Create the complete credential
      const completeCredential: VerifiableCredential = {
        ...credential,
        id,
        proof,
        status: 'active',
        isSelfIssued: false
      };

      // Store the credential
      this.credentials.set(id, completeCredential);
      
      // Update wallet info
      this.walletInfo.credentialCount = this.credentials.size;
      this.persistCredentials();
      
      return id;
    } catch (error) {
      console.error('Error adding credential:', error);
      throw new Error('Failed to add credential to wallet');
    }
  }

  /**
   * Add a comprehensive verifiable credential from certificate processing
   */
  async addComprehensiveCredential(comprehensiveVC: Record<string, unknown>): Promise<string> {
    try {
      console.log("Adding comprehensive credential:", comprehensiveVC);
      
      // Convert comprehensive VC to wallet format
      const walletCredential: VerifiableCredential = {
        id: comprehensiveVC.id as string,
        type: Array.isArray(comprehensiveVC.type) ? (comprehensiveVC.type as string[])[1] || (comprehensiveVC.type as string[])[0] : comprehensiveVC.type as string,
        issuer: {
          id: (comprehensiveVC.issuer as Record<string, unknown>).id as string,
          name: (comprehensiveVC.issuer as Record<string, unknown>).name as string,
          ensDomain: (comprehensiveVC.issuer as Record<string, unknown>).ensDomain as string || undefined
        },
        subject: {
          id: (comprehensiveVC.credentialSubject as Record<string, unknown>).id as string,
          name: (comprehensiveVC.credentialSubject as Record<string, unknown>).studentName as string
        },
        issuanceDate: comprehensiveVC.issuanceDate as string,
        expirationDate: comprehensiveVC.expirationDate as string,
        credentialSubject: comprehensiveVC.credentialSubject as Record<string, string | number | undefined>,
        proof: comprehensiveVC.proof as VerifiableCredential['proof'],
        status: 'active',
        isSelfIssued: true
      };

      console.log("Created wallet credential:", walletCredential);

      // Store the credential
      this.credentials.set(comprehensiveVC.id as string, walletCredential);
      
      // Update wallet info
      this.walletInfo.credentialCount = this.credentials.size;
      this.persistCredentials();
      
      console.log("Credential stored. Total credentials:", this.credentials.size);
      
      return comprehensiveVC.id as string;
    } catch (error) {
      console.error('Error adding comprehensive credential:', error);
      throw new Error('Failed to add comprehensive credential to wallet');
    }
  }

  /**
   * Create a cryptographic proof for a credential
   */
  private async createCredentialProof(credential: Omit<VerifiableCredential, 'id' | 'proof'>): Promise<VerifiableCredential['proof']> {
    // In a real implementation, this would use proper cryptographic signing
    const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credential)));
    
    return {
      type: "Ed25519Signature2020",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${this.walletInfo.address}#keys-1`,
      jws: `eyJhbGciOiJFZERTQSIsImNyaXQiOiJbImI2NCJdIiwiaGIiOiJiajY0In0.${credentialHash}`
    };
  }

  /**
   * Get all credentials in the wallet
   */
  getAllCredentials(): VerifiableCredential[] {
    const creds = Array.from(this.credentials.values());
    console.log("Getting all credentials:", creds.length, creds);
    return creds;
  }

  /**
   * Get self-issued credentials only
   */
  getSelfIssuedCredentials(): VerifiableCredential[] {
    return Array.from(this.credentials.values()).filter(cred => cred.isSelfIssued);
  }

  /**
   * Get external credentials only
   */
  getExternalCredentials(): VerifiableCredential[] {
    return Array.from(this.credentials.values()).filter(cred => !cred.isSelfIssued);
  }

  /**
   * Get a specific credential by ID
   */
  getCredential(id: string): VerifiableCredential | undefined {
    return this.credentials.get(id);
  }

  /**
   * Get credentials by type
   */
  getCredentialsByType(type: string): VerifiableCredential[] {
    return Array.from(this.credentials.values()).filter(
      credential => credential.type === type
    );
  }

  /**
   * Get active credentials
   */
  getActiveCredentials(): VerifiableCredential[] {
    return Array.from(this.credentials.values()).filter(
      credential => credential.status === 'active'
    );
  }

  /**
   * Revoke a credential
   */
  revokeCredential(id: string): boolean {
    const credential = this.credentials.get(id);
    if (!credential) {
      return false;
    }

    credential.status = 'revoked';
    this.credentials.set(id, credential);
    this.persistCredentials();
    return true;
  }

  /**
   * Update credential status
   */
  updateCredentialStatus(id: string, status: VerifiableCredential['status']): boolean {
    const credential = this.credentials.get(id);
    if (!credential) {
      return false;
    }

    credential.status = status;
    this.credentials.set(id, credential);
    this.persistCredentials();
    return true;
  }

  /**
   * Export a credential as JSON
   */
  exportCredential(id: string): string | null {
    const credential = this.credentials.get(id);
    if (!credential) {
      return null;
    }

    return JSON.stringify(credential, null, 2);
  }

  /**
   * Import a credential from JSON
   */
  async importCredential(credentialJson: string): Promise<string> {
    try {
      const credential: VerifiableCredential = JSON.parse(credentialJson);
      
      // Validate the credential
      if (!this.validateCredential(credential)) {
        throw new Error('Invalid credential format');
      }

      // Check if credential already exists
      if (this.credentials.has(credential.id)) {
        throw new Error('Credential already exists in wallet');
      }

      // Add to wallet
      this.credentials.set(credential.id, credential);
      this.walletInfo.credentialCount = this.credentials.size;
      this.persistCredentials();

      return credential.id;
    } catch (error) {
      console.error('Error importing credential:', error);
      throw new Error('Failed to import credential');
    }
  }

  /**
   * Validate a credential format
   */
  private validateCredential(credential: unknown): credential is VerifiableCredential {
    return (
      credential !== null &&
      typeof credential === 'object' &&
      'id' in credential &&
      'type' in credential &&
      'issuer' in credential &&
      'subject' in credential &&
      'credentialSubject' in credential &&
      'proof' in credential
    );
  }

  /**
   * Create a backup of the wallet
   */
  createBackup(): WalletBackup {
    const backup: WalletBackup = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      walletInfo: this.getWalletInfo(),
      credentials: this.getAllCredentials(),
      encryptionKey: this.encryptionKey
    };

    return backup;
  }

  /**
   * Restore wallet from backup
   */
  async restoreFromBackup(backup: WalletBackup): Promise<boolean> {
    try {
      // Validate backup format
      if (!backup.version || !backup.walletInfo || !backup.credentials) {
        throw new Error('Invalid backup format');
      }

      // Clear current wallet
      this.credentials.clear();

      // Restore wallet info
      this.walletInfo = backup.walletInfo;

      // Restore credentials
      for (const credential of backup.credentials) {
        if (this.validateCredential(credential)) {
          this.credentials.set(credential.id, credential);
        }
      }

      // Update credential count
      this.walletInfo.credentialCount = this.credentials.size;

      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Export wallet backup as JSON
   */
  exportBackup(): string {
    const backup = this.createBackup();
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import wallet backup from JSON
   */
  async importBackup(backupJson: string): Promise<boolean> {
    try {
      const backup: WalletBackup = JSON.parse(backupJson);
      return await this.restoreFromBackup(backup);
    } catch (error) {
      console.error('Error importing backup:', error);
      return false;
    }
  }

  /**
   * Get wallet statistics
   */
  getWalletStats() {
    const credentials = this.getAllCredentials();
    const activeCount = credentials.filter(c => c.status === 'active').length;
    const revokedCount = credentials.filter(c => c.status === 'revoked').length;
    const expiredCount = credentials.filter(c => c.status === 'expired').length;

    const typeStats = credentials.reduce((acc, credential) => {
      acc[credential.type] = (acc[credential.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCredentials: credentials.length,
      activeCredentials: activeCount,
      revokedCredentials: revokedCount,
      expiredCredentials: expiredCount,
      credentialTypes: typeStats,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Search credentials
   */
  searchCredentials(query: string): VerifiableCredential[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.credentials.values()).filter(credential => {
      return (
        credential.type.toLowerCase().includes(searchTerm) ||
        credential.issuer.name.toLowerCase().includes(searchTerm) ||
        credential.subject.name.toLowerCase().includes(searchTerm) ||
        Object.values(credential.credentialSubject).some(value => 
          value?.toString().toLowerCase().includes(searchTerm)
        )
      );
    });
  }

  /**
   * Get credentials expiring soon
   */
  getExpiringCredentials(daysThreshold: number = 30): VerifiableCredential[] {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return Array.from(this.credentials.values()).filter(credential => {
      if (!credential.expirationDate) return false;
      const expirationDate = new Date(credential.expirationDate);
      return expirationDate <= thresholdDate && credential.status === 'active';
    });
  }

  /**
   * Update wallet security level
   */
  updateSecurityLevel(level: WalletInfo['securityLevel']): void {
    this.walletInfo.securityLevel = level;
  }

  /**
   * Update wallet information
   */
  updateWalletInfo(updates: Partial<WalletInfo>): void {
    this.walletInfo = { ...this.walletInfo, ...updates };
  }

  /**
   * Check if wallet is secure
   */
  isWalletSecure(): boolean {
    return this.walletInfo.securityLevel !== 'basic';
  }

  /**
   * Get wallet security recommendations
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.walletInfo.securityLevel === 'basic') {
      recommendations.push('Enable two-factor authentication');
      recommendations.push('Use a strong password');
    }

    if (!this.walletInfo.lastBackup) {
      recommendations.push('Create a backup of your wallet');
    }

    const expiringCredentials = this.getExpiringCredentials(7);
    if (expiringCredentials.length > 0) {
      recommendations.push(`${expiringCredentials.length} credentials expiring soon`);
    }

    return recommendations;
  }
}

// Create singleton instance
export const ssiWallet = new SSIWallet();
export default ssiWallet;

// Initialize with some demo credentials
export const initializeDemoCredentials = async () => {
  const demoCredentials = [
    {
      type: "CasteCertificate",
      issuer: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued",
        ensDomain: "student.eth"
      },
      subject: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued"
      },
      issuanceDate: "2024-01-15T10:30:00.000Z",
      expirationDate: "2025-01-15T10:30:00.000Z",
      credentialSubject: {
        caste: "SC",
        category: "Scheduled Caste",
        district: "Bangalore",
        state: "Karnataka"
      },
      status: 'active' as const,
      isSelfIssued: true
    },
    {
      type: "IncomeCertificate",
      issuer: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued",
        ensDomain: "student.eth"
      },
      subject: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued"
      },
      issuanceDate: "2024-01-10T14:20:00.000Z",
      expirationDate: "2025-01-10T14:20:00.000Z",
      credentialSubject: {
        annualIncome: 80000,
        currency: "INR",
        financialYear: "2023-24",
        district: "Bangalore"
      },
      status: 'active' as const,
      isSelfIssued: true
    },
    {
      type: "AcademicCertificate",
      issuer: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued",
        ensDomain: "student.eth"
      },
      subject: {
        id: "did:ethr:0x1234567890123456789012345678901234567890",
        name: "Student Self-Issued"
      },
      issuanceDate: "2024-01-20T09:15:00.000Z",
      expirationDate: "2029-01-20T09:15:00.000Z",
      credentialSubject: {
        degree: "Bachelor of Technology",
        specialization: "Computer Science",
        cgpa: 8.5,
        graduationYear: 2024
      },
      status: 'active' as const,
      isSelfIssued: true
    }
  ];

  for (const credential of demoCredentials) {
    try {
      await ssiWallet.addCredential(credential);
    } catch (error) {
      console.error('Error adding demo credential:', error);
    }
  }
}; 