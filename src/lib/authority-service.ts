import { ethers } from 'ethers';

export interface AuthorityInfo {
  id: string;
  name: string;
  ensDomain: string;
  address: string;
  type: 'government' | 'educational' | 'corporate';
  jurisdiction: string;
  verificationLevel: 'basic' | 'enhanced' | 'enterprise';
  isActive: boolean;
}

export interface IssuanceRequest {
  studentAddress: string;
  studentName: string;
  credentialType: string;
  credentialData: Record<string, string | number>;
  expirationDate?: string;
  metadata?: Record<string, string | number>;
}

export interface IssuedCredential {
  id: string;
  request: IssuanceRequest;
  authority: AuthorityInfo;
  issuanceDate: string;
  status: 'pending' | 'issued' | 'rejected' | 'expired';
  transactionHash?: string;
  credentialHash: string;
  signature: string;
}

export interface IssuanceStats {
  totalIssued: number;
  totalPending: number;
  totalRejected: number;
  thisMonth: number;
  thisYear: number;
  byType: Record<string, number>;
}

class AuthorityService {
  private authorities: Map<string, AuthorityInfo>;
  private issuedCredentials: Map<string, IssuedCredential>;
  private privateKey: string;

  constructor() {
    this.authorities = new Map();
    this.issuedCredentials = new Map();
    this.privateKey = this.generatePrivateKey();
    this.initializeDemoAuthorities();
  }

  /**
   * Generate a private key for signing credentials
   */
  private generatePrivateKey(): string {
    return ethers.randomBytes(32).toString('hex');
  }

  /**
   * Initialize demo authorities
   */
  private initializeDemoAuthorities() {
    const demoAuthorities: AuthorityInfo[] = [
      {
        id: "karnataka-gov",
        name: "Karnataka Government",
        ensDomain: "karnataka.gov.eth",
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        type: "government",
        jurisdiction: "Karnataka, India",
        verificationLevel: "enterprise",
        isActive: true
      },
      {
        id: "bangalore-university",
        name: "University of Bangalore",
        ensDomain: "bangalore.university.eth",
        address: "0x1234567890123456789012345678901234567890",
        type: "educational",
        jurisdiction: "Bangalore, Karnataka",
        verificationLevel: "enhanced",
        isActive: true
      },
      {
        id: "delhi-gov",
        name: "Delhi Government",
        ensDomain: "delhi.gov.eth",
        address: "0x9876543210987654321098765432109876543210",
        type: "government",
        jurisdiction: "Delhi, India",
        verificationLevel: "enterprise",
        isActive: true
      }
    ];

    demoAuthorities.forEach(authority => {
      this.authorities.set(authority.id, authority);
    });
  }

  /**
   * Get all authorities
   */
  getAllAuthorities(): AuthorityInfo[] {
    return Array.from(this.authorities.values());
  }

  /**
   * Get authority by ID
   */
  getAuthority(id: string): AuthorityInfo | undefined {
    return this.authorities.get(id);
  }

  /**
   * Get authority by ENS domain
   */
  getAuthorityByENS(ensDomain: string): AuthorityInfo | undefined {
    return Array.from(this.authorities.values()).find(
      authority => authority.ensDomain === ensDomain
    );
  }

  /**
   * Register a new authority
   */
  registerAuthority(authority: Omit<AuthorityInfo, 'id'>): string {
    const id = `auth:${ethers.keccak256(ethers.toUtf8Bytes(authority.name)).slice(0, 10)}`;
    const newAuthority: AuthorityInfo = {
      ...authority,
      id
    };
    
    this.authorities.set(id, newAuthority);
    return id;
  }

  /**
   * Issue a verifiable credential
   */
  async issueCredential(
    authorityId: string,
    request: IssuanceRequest
  ): Promise<IssuedCredential> {
    const authority = this.authorities.get(authorityId);
    if (!authority) {
      throw new Error('Authority not found');
    }

    if (!authority.isActive) {
      throw new Error('Authority is not active');
    }

    // Validate request
    this.validateIssuanceRequest(request);

    // Generate credential ID
    const credentialId = `vc:${authority.ensDomain}:${Date.now()}`;

    // Create credential hash
    const credentialData = {
      id: credentialId,
      type: request.credentialType,
      issuer: {
        id: `did:ethr:${authority.address}`,
        name: authority.name,
        ensDomain: authority.ensDomain
      },
      subject: {
        id: `did:ethr:${request.studentAddress}`,
        name: request.studentName
      },
      issuanceDate: new Date().toISOString(),
      expirationDate: request.expirationDate,
      credentialSubject: request.credentialData
    };

    const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credentialData)));

    // Sign the credential
    const wallet = new ethers.Wallet(this.privateKey);
    const signature = await wallet.signMessage(ethers.getBytes(credentialHash));

    // Create issued credential record
    const issuedCredential: IssuedCredential = {
      id: credentialId,
      request,
      authority,
      issuanceDate: new Date().toISOString(),
      status: 'issued',
      credentialHash,
      signature
    };

    // Store the credential
    this.issuedCredentials.set(credentialId, issuedCredential);

    return issuedCredential;
  }

  /**
   * Validate issuance request
   */
  private validateIssuanceRequest(request: IssuanceRequest): void {
    if (!request.studentAddress || !ethers.isAddress(request.studentAddress)) {
      throw new Error('Invalid student address');
    }

    if (!request.studentName || request.studentName.trim() === '') {
      throw new Error('Student name is required');
    }

    if (!request.credentialType || request.credentialType.trim() === '') {
      throw new Error('Credential type is required');
    }

    if (!request.credentialData || Object.keys(request.credentialData).length === 0) {
      throw new Error('Credential data is required');
    }

    // Validate expiration date if provided
    if (request.expirationDate) {
      const expirationDate = new Date(request.expirationDate);
      if (isNaN(expirationDate.getTime())) {
        throw new Error('Invalid expiration date');
      }
      if (expirationDate <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
    }
  }

  /**
   * Get all issued credentials
   */
  getAllIssuedCredentials(): IssuedCredential[] {
    return Array.from(this.issuedCredentials.values());
  }

  /**
   * Get credentials by authority
   */
  getCredentialsByAuthority(authorityId: string): IssuedCredential[] {
    return Array.from(this.issuedCredentials.values()).filter(
      credential => credential.authority.id === authorityId
    );
  }

  /**
   * Get credentials by student
   */
  getCredentialsByStudent(studentAddress: string): IssuedCredential[] {
    return Array.from(this.issuedCredentials.values()).filter(
      credential => credential.request.studentAddress.toLowerCase() === studentAddress.toLowerCase()
    );
  }

  /**
   * Get credential by ID
   */
  getCredential(id: string): IssuedCredential | undefined {
    return this.issuedCredentials.get(id);
  }

  /**
   * Verify credential signature
   */
  async verifyCredential(credential: IssuedCredential): Promise<boolean> {
    try {
      // Recreate credential data
      const credentialData = {
        id: credential.id,
        type: credential.request.credentialType,
        issuer: {
          id: `did:ethr:${credential.authority.address}`,
          name: credential.authority.name,
          ensDomain: credential.authority.ensDomain
        },
        subject: {
          id: `did:ethr:${credential.request.studentAddress}`,
          name: credential.request.studentName
        },
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.request.expirationDate,
        credentialSubject: credential.request.credentialData
      };

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(credentialData)));

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(ethers.getBytes(credentialHash), credential.signature);
      
      // Check if the recovered address matches the authority address
      return recoveredAddress.toLowerCase() === credential.authority.address.toLowerCase();
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }

  /**
   * Revoke a credential
   */
  revokeCredential(credentialId: string): boolean {
    const credential = this.issuedCredentials.get(credentialId);
    if (!credential) {
      return false;
    }

    credential.status = 'rejected';
    this.issuedCredentials.set(credentialId, credential);
    return true;
  }

  /**
   * Get issuance statistics
   */
  getIssuanceStats(): IssuanceStats {
    const credentials = this.getAllIssuedCredentials();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const stats: IssuanceStats = {
      totalIssued: credentials.filter(c => c.status === 'issued').length,
      totalPending: credentials.filter(c => c.status === 'pending').length,
      totalRejected: credentials.filter(c => c.status === 'rejected').length,
      thisMonth: credentials.filter(c => {
        const issuanceDate = new Date(c.issuanceDate);
        return issuanceDate.getMonth() === thisMonth && 
               issuanceDate.getFullYear() === thisYear &&
               c.status === 'issued';
      }).length,
      thisYear: credentials.filter(c => {
        const issuanceDate = new Date(c.issuanceDate);
        return issuanceDate.getFullYear() === thisYear && c.status === 'issued';
      }).length,
      byType: {}
    };

    // Count by credential type
    credentials.forEach(credential => {
      const type = credential.request.credentialType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get credentials expiring soon
   */
  getExpiringCredentials(daysThreshold: number = 30): IssuedCredential[] {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return Array.from(this.issuedCredentials.values()).filter(credential => {
      if (!credential.request.expirationDate) return false;
      const expirationDate = new Date(credential.request.expirationDate);
      return expirationDate <= thresholdDate && credential.status === 'issued';
    });
  }

  /**
   * Search credentials
   */
  searchCredentials(query: string): IssuedCredential[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.issuedCredentials.values()).filter(credential => {
      return (
        credential.request.studentName.toLowerCase().includes(searchTerm) ||
        credential.request.credentialType.toLowerCase().includes(searchTerm) ||
        credential.authority.name.toLowerCase().includes(searchTerm) ||
        Object.values(credential.request.credentialData).some(value => 
          value.toString().toLowerCase().includes(searchTerm)
        )
      );
    });
  }

  /**
   * Export credential as JSON
   */
  exportCredential(credentialId: string): string | null {
    const credential = this.issuedCredentials.get(credentialId);
    if (!credential) {
      return null;
    }

    // Create W3C Verifiable Credential format
    const w3cCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": credential.id,
      "type": ["VerifiableCredential", credential.request.credentialType],
      "issuer": {
        "id": `did:ethr:${credential.authority.address}`,
        "name": credential.authority.name
      },
      "issuanceDate": credential.issuanceDate,
      "expirationDate": credential.request.expirationDate,
      "credentialSubject": {
        "id": `did:ethr:${credential.request.studentAddress}`,
        "name": credential.request.studentName,
        ...credential.request.credentialData
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": credential.issuanceDate,
        "proofPurpose": "assertionMethod",
        "verificationMethod": `did:ethr:${credential.authority.address}#keys-1`,
        "proofValue": credential.signature
      }
    };

    return JSON.stringify(w3cCredential, null, 2);
  }

  /**
   * Batch issue credentials
   */
  async batchIssueCredentials(
    authorityId: string,
    requests: IssuanceRequest[]
  ): Promise<IssuedCredential[]> {
    const results: IssuedCredential[] = [];
    
    for (const request of requests) {
      try {
        const credential = await this.issueCredential(authorityId, request);
        results.push(credential);
      } catch (error) {
        console.error(`Failed to issue credential for ${request.studentName}:`, error);
        // Continue with other requests
      }
    }

    return results;
  }

  /**
   * Update authority status
   */
  updateAuthorityStatus(authorityId: string, isActive: boolean): boolean {
    const authority = this.authorities.get(authorityId);
    if (!authority) {
      return false;
    }

    authority.isActive = isActive;
    this.authorities.set(authorityId, authority);
    return true;
  }

  /**
   * Get authority statistics
   */
  getAuthorityStats(authorityId: string) {
    const credentials = this.getCredentialsByAuthority(authorityId);
    const authority = this.authorities.get(authorityId);
    
    if (!authority) {
      return null;
    }

    return {
      authority,
      totalIssued: credentials.filter(c => c.status === 'issued').length,
      totalPending: credentials.filter(c => c.status === 'pending').length,
      totalRejected: credentials.filter(c => c.status === 'rejected').length,
      byType: credentials.reduce((acc, credential) => {
        const type = credential.request.credentialType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Initialize demo credentials
   */
  async initializeDemoCredentials() {
    const demoRequests: IssuanceRequest[] = [
      {
        studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        studentName: "Rishal D",
        credentialType: "CasteCertificate",
        credentialData: {
          caste: "SC",
          category: "Scheduled Caste",
          district: "Bangalore",
          state: "Karnataka"
        },
        expirationDate: "2025-01-15T10:30:00.000Z"
      },
      {
        studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        studentName: "Rishal D",
        credentialType: "IncomeCertificate",
        credentialData: {
          annualIncome: 80000,
          currency: "INR",
          financialYear: "2023-24",
          district: "Bangalore"
        },
        expirationDate: "2025-01-10T14:20:00.000Z"
      },
      {
        studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        studentName: "Rishal D",
        credentialType: "AcademicCertificate",
        credentialData: {
          degree: "Bachelor of Technology",
          specialization: "Computer Science",
          cgpa: 8.5,
          graduationYear: 2024
        },
        expirationDate: "2029-01-20T09:15:00.000Z"
      }
    ];

    for (const request of demoRequests) {
      try {
        await this.issueCredential("karnataka-gov", request);
      } catch (error) {
        console.error('Error issuing demo credential:', error);
      }
    }
  }
}

// Create singleton instance
export const authorityService = new AuthorityService();

// Initialize with some demo credentials
export const initializeDemoCredentials = async () => {
  const demoRequests: IssuanceRequest[] = [
    {
      studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      studentName: "Rishal D",
      credentialType: "CasteCertificate",
      credentialData: {
        caste: "SC",
        category: "Scheduled Caste",
        district: "Bangalore",
        state: "Karnataka"
      },
      expirationDate: "2025-01-15T10:30:00.000Z"
    },
    {
      studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      studentName: "Rishal D",
      credentialType: "IncomeCertificate",
      credentialData: {
        annualIncome: 80000,
        currency: "INR",
        financialYear: "2023-24",
        district: "Bangalore"
      },
      expirationDate: "2025-01-10T14:20:00.000Z"
    },
    {
      studentAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      studentName: "Rishal D",
      credentialType: "AcademicCertificate",
      credentialData: {
        degree: "Bachelor of Technology",
        specialization: "Computer Science",
        cgpa: 8.5,
        graduationYear: 2024
      },
      expirationDate: "2029-01-20T09:15:00.000Z"
    }
  ];

  for (const request of demoRequests) {
    try {
      await authorityService.issueCredential("karnataka-gov", request);
    } catch (error) {
      console.error('Error issuing demo credential:', error);
    }
  }
}; 