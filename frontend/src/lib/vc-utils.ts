export interface VerifiableCredential {
  id: string;
  type: string;
  issuer: string;
  subject: string;
  issuedDate: string;
  expiryDate: string;
  claims: Record<string, unknown>;
  signature: string;
  status: 'active' | 'expired' | 'revoked';
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

// DIDKit compatible credential interface
export interface DIDKitCredential {
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

export interface VCSummary {
  id: string;
  type: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  claims: Record<string, unknown>;
  status: 'active' | 'expired' | 'revoked';
}

// Sample VCs for demonstration
export const sampleVCs: VerifiableCredential[] = [
  {
    id: "vc:marks:2024:001",
    type: "EducationalCredential",
    issuer: "CBSE Board",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-06-15",
    expiryDate: "2025-06-15",
    claims: {
      "marks": "88%",
      "subject": "Class 12 Board Results",
      "year": "2024",
      "board": "CBSE"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-06-15T10:30:00Z",
      verificationMethod: "did:cbse:board#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:income:2024:001",
    type: "IncomeCredential",
    issuer: "Income Tax Department",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-05-20",
    expiryDate: "2025-05-20",
    claims: {
      "annualIncome": "₹80,000",
      "familySize": "4",
      "incomeCategory": "Low Income"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-05-20T14:15:00Z",
      verificationMethod: "did:incometax:gov#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:caste:2024:001",
    type: "CasteCredential",
    issuer: "State Government",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-04-10",
    expiryDate: "2025-04-10",
    claims: {
      "caste": "SC",
      "category": "Scheduled Caste",
      "certificateNumber": "SC2024001"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-04-10T09:45:00Z",
      verificationMethod: "did:state:gov#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:disability:2024:001",
    type: "DisabilityCredential",
    issuer: "Medical Board",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-03-15",
    expiryDate: "2025-03-15",
    claims: {
      "disability": "None",
      "category": "No Disability",
      "certificateNumber": "ND2024001"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-03-15T11:20:00Z",
      verificationMethod: "did:medical:board#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:region:2024:001",
    type: "RegionCredential",
    issuer: "Local Administration",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-02-20",
    expiryDate: "2025-02-20",
    claims: {
      "region": "Rural",
      "areaType": "Rural Area",
      "certificateNumber": "RUR2024001"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-02-20T16:30:00Z",
      verificationMethod: "did:local:admin#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
];

// Utility functions
export function getVCSummary(vc: VerifiableCredential): VCSummary {
  return {
    id: vc.id,
    type: vc.type,
    issuer: vc.issuer,
    issuedDate: vc.issuedDate,
    expiryDate: vc.expiryDate,
    claims: vc.claims,
    status: vc.status
  };
}

export function isVCExpired(vc: VerifiableCredential): boolean {
  return new Date(vc.expiryDate) < new Date();
}

export function getVCStatus(vc: VerifiableCredential): 'active' | 'expired' | 'revoked' {
  if (vc.status === 'revoked') return 'revoked';
  if (isVCExpired(vc)) return 'expired';
  return 'active';
}

export function filterVCsByType(vcs: VerifiableCredential[], type: string): VerifiableCredential[] {
  return vcs.filter(vc => vc.type === type);
}

export function filterVCsByStatus(vcs: VerifiableCredential[], status: 'active' | 'expired' | 'revoked'): VerifiableCredential[] {
  return vcs.filter(vc => getVCStatus(vc) === status);
}

export function getVCCounts(vcs: VerifiableCredential[]) {
  return {
    total: vcs.length,
    active: filterVCsByStatus(vcs, 'active').length,
    expired: filterVCsByStatus(vcs, 'expired').length,
    revoked: filterVCsByStatus(vcs, 'revoked').length,
    educational: filterVCsByType(vcs, 'EducationalCredential').length,
    income: filterVCsByType(vcs, 'IncomeCredential').length,
    caste: filterVCsByType(vcs, 'CasteCredential').length,
    disability: filterVCsByType(vcs, 'DisabilityCredential').length,
    region: filterVCsByType(vcs, 'RegionCredential').length
  };
}

// Mock functions for VC operations
export async function addVC(vc: Omit<VerifiableCredential, 'id' | 'issuedDate' | 'proof'>): Promise<VerifiableCredential> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newVC: VerifiableCredential = {
    ...vc,
    id: `vc:${vc.type.toLowerCase()}:${Date.now()}`,
    issuedDate: new Date().toISOString().split('T')[0],
    proof: {
      type: "Ed25519Signature2020",
      created: new Date().toISOString(),
      verificationMethod: `did:${vc.issuer.toLowerCase()}:gov#key-1`,
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  };
  
  return newVC;
}

export async function revokeVC(vcId: string): Promise<void> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Revoking VC: ${vcId}`);
}

export async function exportVC(vc: VerifiableCredential): Promise<string> {
  // Simulate export to JSON
  await new Promise(resolve => setTimeout(resolve, 300));
  return JSON.stringify(vc, null, 2);
}

// DIDKit integration functions
export async function issueDIDKitCredential(
  subjectDid: string,
  credentialType: string,
  credentialSubject: Record<string, unknown>,
  expirationDate?: string
) {
  const { didkitService } = await import('./didkit-service');
  
  return await didkitService.issueCredential({
    subjectDid,
    credentialType,
    credentialSubject,
    expirationDate
  });
}

export async function verifyDIDKitCredential(jwt: string) {
  const { didkitService } = await import('./didkit-service');
  
  return await didkitService.verifyCredential(jwt);
}

export async function createDIDKitPresentation(credentials: string[], holderDid: string) {
  const { didkitService } = await import('./didkit-service');
  
  return await didkitService.createPresentation(credentials, holderDid);
}

export async function verifyDIDKitPresentation(presentation: unknown) {
  const { didkitService } = await import('./didkit-service');
  
  return await didkitService.verifyPresentation(presentation);
}

export async function setupDIDKitWallet(privateKey?: string) {
  const { didkitService } = await import('./didkit-service');
  
  return await didkitService.setupWallet(privateKey);
}

export function getDIDKitStoredCredentials() {
  // Dynamic import to avoid circular dependency
  return import('./didkit-service').then(({ didkitService }) => 
    didkitService.getStoredCredentials()
  );
}

export function storeDIDKitCredential(credential: DIDKitCredential, jwt: string) {
  return import('./didkit-service').then(({ didkitService }) => 
    didkitService.storeCredential(credential, jwt)
  );
} 