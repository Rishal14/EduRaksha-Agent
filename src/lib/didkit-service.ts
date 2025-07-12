import { ethers } from 'ethers';

// Types for DIDKit
interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: unknown;
  };
}

interface VerificationResult {
  isValid: boolean;
  credential?: VerifiableCredential;
  issuer?: string;
  subject?: string;
  errors: string[];
  warnings: string[];
}

interface IssuanceRequest {
  subjectDid: string;
  credentialType: string;
  credentialSubject: Record<string, unknown>;
  expirationDate?: string;
}

interface IssuanceResult {
  jwt: string;
  credential: VerifiableCredential;
  issuerDid: string;
}

class DIDKitService {
  private wallet: ethers.HDNodeWallet | ethers.Wallet | null = null;
  private holderDid: string | null = null;

  constructor() {
    // No initialization needed for frontend service
    console.log('DIDKit frontend service initialized');
  }

  /**
   * Set up wallet and DID for the holder
   */
  async setupWallet(privateKey?: string) {
    try {
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey);
      } else {
        this.wallet = ethers.Wallet.createRandom();
      }
      
      if (this.wallet) {
        this.holderDid = `did:ethr:${this.wallet.address}`;
        return {
          address: this.wallet.address,
          did: this.holderDid,
          privateKey: this.wallet.privateKey
        };
      }
      throw new Error('Failed to create wallet');
    } catch (error) {
      console.error('Failed to setup wallet:', error);
      throw error;
    }
  }

  /**
   * Issue a verifiable credential (frontend calls backend)
   */
  async issueCredential(request: IssuanceRequest): Promise<IssuanceResult> {
    try {
      const response = await fetch('http://localhost:3001/api/issue-vc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to issue credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error issuing credential:', error);
      throw error;
    }
  }

  /**
   * Verify a verifiable credential JWT
   */
  async verifyCredential(jwt: string): Promise<VerificationResult> {
    try {
      const response = await fetch('http://localhost:3001/api/verify-vc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to verify credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying credential:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Create a presentation from credentials
   */
  async createPresentation(credentials: string[], holderDid: string) {
    try {
      const response = await fetch('http://localhost:3001/api/create-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials, holderDid }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create presentation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating presentation:', error);
      throw error;
    }
  }

  /**
   * Verify a verifiable presentation
   */
  async verifyPresentation(presentation: unknown): Promise<VerificationResult> {
    try {
      const response = await fetch('http://localhost:3001/api/verify-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presentation }),
      });

      if (!response.ok) {
        throw new Error(`Failed to verify presentation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying presentation:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Resolve a DID to its document
   */
  async resolveDid(did: string) {
    try {
      const response = await fetch(`http://localhost:3001/api/resolve-did/${encodeURIComponent(did)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to resolve DID: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resolving DID:', error);
      throw error;
    }
  }

  /**
   * Get issuer information
   */
  async getIssuerInfo() {
    try {
      const response = await fetch('http://localhost:3001/api/issuer-info');
      
      if (!response.ok) {
        throw new Error(`Failed to get issuer info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting issuer info:', error);
      throw error;
    }
  }

  /**
   * Store credential in local storage
   */
  storeCredential(credential: VerifiableCredential, jwt: string) {
    try {
      const storedCredentials = this.getStoredCredentials();
      const credentialRecord = {
        id: credential.id,
        credential,
        jwt,
        storedAt: new Date().toISOString(),
        status: 'active' as const
      };
      
      storedCredentials.push(credentialRecord);
      localStorage.setItem('didkit-credentials', JSON.stringify(storedCredentials));
      
      return credentialRecord;
    } catch (error) {
      console.error('Error storing credential:', error);
      throw error;
    }
  }

  /**
   * Get stored credentials from local storage
   */
  getStoredCredentials() {
    try {
      const stored = localStorage.getItem('didkit-credentials');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return [];
    }
  }

  /**
   * Remove credential from local storage
   */
  removeCredential(credentialId: string) {
    try {
      const storedCredentials = this.getStoredCredentials();
      const filteredCredentials = storedCredentials.filter(
        (cred: { id: string }) => cred.id !== credentialId
      );
      localStorage.setItem('didkit-credentials', JSON.stringify(filteredCredentials));
    } catch (error) {
      console.error('Error removing credential:', error);
      throw error;
    }
  }

  /**
   * Export credential as JSON
   */
  exportCredential(credentialId: string): string | null {
    try {
      const storedCredentials = this.getStoredCredentials();
      const credential = storedCredentials.find((cred: { id: string }) => cred.id === credentialId);
      
      if (!credential) {
        return null;
      }

      return JSON.stringify(credential, null, 2);
    } catch (error) {
      console.error('Error exporting credential:', error);
      return null;
    }
  }

  /**
   * Import credential from JSON
   */
  importCredential(credentialJson: string) {
    try {
      const credentialData = JSON.parse(credentialJson);
      
      if (!credentialData.credential || !credentialData.jwt) {
        throw new Error('Invalid credential format');
      }

      return this.storeCredential(credentialData.credential, credentialData.jwt);
    } catch (error) {
      console.error('Error importing credential:', error);
      throw error;
    }
  }

  /**
   * Get current wallet info
   */
  getWalletInfo() {
    if (!this.wallet || !this.holderDid) {
      return null;
    }

    return {
      address: this.wallet.address,
      did: this.holderDid,
      hasPrivateKey: !!this.wallet.privateKey
    };
  }

  /**
   * Generate a UUID for credential IDs
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const didkitService = new DIDKitService();
export default DIDKitService; 