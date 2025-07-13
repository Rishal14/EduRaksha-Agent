const { ethers } = require('ethers');
const crypto = require('crypto');

class DIDKitService {
  constructor() {
    this.issuerKey = null;
    this.issuerDid = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      // Generate or load issuer key
      this.issuerKey = process.env.ISSUER_PRIVATE_KEY || 
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      
      // Create issuer DID
      const wallet = new ethers.Wallet(this.issuerKey);
      this.issuerDid = `did:ethr:${wallet.address}`;
      
      this.initialized = true;
      console.log('DIDKit service initialized with issuer DID:', this.issuerDid);
    } catch (error) {
      console.error('Failed to initialize DIDKit service:', error);
      throw error;
    }
  }

  /**
   * Issue a verifiable credential as a DID-JWT
   */
  async issueCredential(credentialData) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      const {
        subjectDid,
        credentialType,
        credentialSubject,
        expirationDate,
        issuanceDate = new Date().toISOString()
      } = credentialData;

      // Create the credential payload
      const credential = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "id": `urn:uuid:${this.generateUUID()}`,
        "type": ["VerifiableCredential", credentialType],
        "issuer": {
          "id": this.issuerDid,
          "name": "EduRaksha Authority"
        },
        "issuanceDate": issuanceDate,
        "expirationDate": expirationDate,
        "credentialSubject": {
          "id": subjectDid,
          ...credentialSubject
        }
      };

      // Create a simple JWT-like structure (simplified for demo)
      const header = {
        "alg": "ES256K",
        "typ": "JWT"
      };

      const payload = {
        "sub": subjectDid,
        "nbf": Math.floor(Date.now() / 1000),
        "vc": credential,
        "iss": this.issuerDid
      };

      // Create signature (simplified)
      const wallet = new ethers.Wallet(this.issuerKey);
      const message = JSON.stringify(payload);
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
      const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

      // Create JWT (simplified format)
      const jwt = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;

      return {
        jwt,
        credential,
        issuerDid: this.issuerDid
      };
    } catch (error) {
      console.error('Error issuing credential:', error);
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  /**
   * Verify a verifiable credential JWT
   */
  async verifyCredential(jwt) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      // Parse JWT (simplified)
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      const signature = parts[2];

      // Verify signature (simplified)
      const wallet = new ethers.Wallet(this.issuerKey);
      const message = JSON.stringify(payload);
      const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
      const expectedSignature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
      
      const isValid = signature === expectedSignature;

      return {
        isValid,
        credential: payload.vc,
        issuer: payload.iss,
        subject: payload.sub,
        errors: isValid ? [] : ['Invalid signature'],
        warnings: []
      };
    } catch (error) {
      console.error('Error verifying credential:', error);
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Create a presentation from credentials
   */
  async createPresentation(credentials, holderDid) {
    try {
      const presentation = {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "id": `urn:uuid:${this.generateUUID()}`,
        "type": ["VerifiablePresentation"],
        "holder": holderDid,
        "verifiableCredential": credentials
      };

      return presentation;
    } catch (error) {
      console.error('Error creating presentation:', error);
      throw new Error(`Failed to create presentation: ${error.message}`);
    }
  }

  /**
   * Verify a verifiable presentation
   */
  async verifyPresentation(presentation) {
    try {
      // Simplified presentation verification
      const isValid = presentation && 
                     presentation.type && 
                     presentation.type.includes('VerifiablePresentation') &&
                     presentation.holder &&
                     presentation.verifiableCredential;

      return {
        isValid,
        presentation: presentation,
        holder: presentation?.holder,
        credentials: presentation?.verifiableCredential,
        errors: isValid ? [] : ['Invalid presentation format'],
        warnings: []
      };
    } catch (error) {
      console.error('Error verifying presentation:', error);
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Resolve a DID to its document
   */
  async resolveDid(did) {
    try {
      // Simplified DID resolution for ethr DIDs
      if (did.startsWith('did:ethr:')) {
        const address = did.replace('did:ethr:', '');
        return {
          "@context": "https://www.w3.org/ns/did/v1",
          "id": did,
          "verificationMethod": [{
            "id": `${did}#keys-1`,
            "type": "EcdsaSecp256k1VerificationKey2019",
            "controller": did,
            "publicKeyHex": address
          }]
        };
      }
      
      throw new Error(`Unsupported DID method: ${did}`);
    } catch (error) {
      console.error('Error resolving DID:', error);
      throw new Error(`Failed to resolve DID: ${error.message}`);
    }
  }

  /**
   * Generate a UUID for credential IDs
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get issuer information
   */
  getIssuerInfo() {
    return {
      did: this.issuerDid,
      address: this.issuerDid.replace('did:ethr:', ''),
      name: 'EduRaksha Authority'
    };
  }
}

module.exports = DIDKitService; 