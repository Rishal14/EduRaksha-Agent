const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Group } = require('@semaphore-protocol/group');
const { generateProof, packToSolidityProof } = require('@semaphore-protocol/proof');
const { ethers } = require('ethers');
const DIDKitService = require('./didkit-service');
const errorHandler = require('./middleware/errorHandler');
const { 
  validateZKPRequest, 
  validateVCIssuance, 
  validateVCVerification, 
  validatePresentation, 
  validateAIQuery 
} = require('./middleware/validation');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Example: In-memory group (replace with DB in production)
const group = new Group();

// Add some dummy identity commitments (replace with real ones)
group.addMember(BigInt('12345678901234567890'));
group.addMember(BigInt('98765432109876543210'));

const PORT = 3001;
const sessions = {}; // sessionId: { status, claims }

// Initialize DIDKit service
const didkitService = new DIDKitService();

// Demo issuer private key (replace with secure storage in production)
const issuerPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const issuerAddress = new ethers.Wallet(issuerPrivateKey).address;

// 1. Generate ZK proof request (QR)
app.get('/api/generate-qr', (req, res) => {
  const sessionId = uuidv4();
  // Placeholder ZK proof request
  const qr = {
    id: sessionId,
    type: 'proof_request',
    body: {
      reason: 'Scholarship eligibility',
      scope: [
        {
          id: 1,
          circuitId: 'credentialAtomicQuerySig',
          rules: {
            query: {
              allowedIssuers: ['*'],
              req: {
                income: { $lt: 100000 },
                caste: { $eq: 'SC' },
                marks: { $gte: 80 }
              },
              schema: {
                url: 'https://schema.org/EduEligibilityCredential',
                type: 'EduEligibilityCredential'
              }
            }
          }
        }
      ]
    },
    callbackUrl: `http://localhost:${PORT}/api/verify?sessionId=${sessionId}`
  };
  sessions[sessionId] = { status: 'pending', claims: null };
  res.json({ qr });
});

// 2. Verify ZK proof
app.post('/api/verify', (req, res) => {
  const { sessionId, proof } = req.body;
  // Placeholder: Accept any proof, extract claims
  // TODO: Integrate Polygon ID verifier and ENS trust check
  if (!sessions[sessionId]) return res.status(404).json({ error: 'Session not found' });
  // Simulate claim extraction
  const claims = proof?.claims || { income: 90000, caste: 'SC', marks: 85 };
  sessions[sessionId] = { status: 'success', claims };
  res.json({ status: 'success' });
});

// 3. Poll for verification result (used by frontend)
app.get('/api/verify', (req, res) => {
  const { sessionId } = req.query;
  if (!sessions[sessionId]) return res.json({ status: 'pending' });
  res.json({ status: sessions[sessionId].status });
});

// 4. Dashboard data (claims + scholarships)
app.get('/api/dashboard-data', (req, res) => {
  // For demo, return static claims and scholarships
  const claims = { income: 90000, caste: 'SC', marks: 85 };
  const scholarships = [
    { id: 1, name: 'SC Post-Matric Scholarship' },
    { id: 2, name: 'Merit-cum-Means Scholarship' }
  ];
  res.json({ claims, scholarships });
});

// 5. AI query relay
app.post('/api/ai-query', validateAIQuery, async (req, res) => {
  const { claims, question } = req.body;
  // Placeholder: Simulate AI response
  // TODO: Integrate LLaMA via LangChain.js
  const response = `Based on your claims (${JSON.stringify(claims)}), you are eligible for SC Post-Matric Scholarship.`;
  res.json({ response });
});

// 6. Issue VC using DIDKit
app.post('/api/issue-vc', validateVCIssuance, async (req, res) => {
  const { studentDid, credentialType, credentialSubject, expirationDate } = req.body;
  try {
    const result = await didkitService.issueCredential({
      subjectDid: studentDid,
      credentialType: credentialType || 'EduEligibilityCredential',
      credentialSubject: credentialSubject || {},
      expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    res.json({
      jwt: result.jwt,
      credential: result.credential,
      issuerDid: result.issuerDid
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to issue VC' });
  }
});

// 7. Verify VC using DIDKit
app.post('/api/verify-vc', validateVCVerification, async (req, res) => {
  const { jwt } = req.body;
  try {
    const result = await didkitService.verifyCredential(jwt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to verify VC' });
  }
});

// 8. Create presentation
app.post('/api/create-presentation', validatePresentation, async (req, res) => {
  const { credentials, holderDid } = req.body;
  try {
    const presentation = await didkitService.createPresentation(credentials, holderDid);
    res.json({ presentation });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create presentation' });
  }
});

// 9. Verify presentation
app.post('/api/verify-presentation', async (req, res) => {
  const { presentation } = req.body;
  try {
    const result = await didkitService.verifyPresentation(presentation);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to verify presentation' });
  }
});

// 10. Resolve DID
app.get('/api/resolve-did/:did', async (req, res) => {
  const { did } = req.params;
  try {
    const didDocument = await didkitService.resolveDid(did);
    res.json(didDocument);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to resolve DID' });
  }
});

// 11. Get issuer info
app.get('/api/issuer-info', (req, res) => {
  try {
    const issuerInfo = didkitService.getIssuerInfo();
    res.json(issuerInfo);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get issuer info' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Endpoint to generate ZKP proof
app.post('/api/generate-proof', validateZKPRequest, async (req, res) => {
    try {
        const { identity, signal } = req.body;
        // In production, identity is a secret (private key or hash)
        // Here, we use a dummy identity for demo
        const identityCommitment = BigInt(identity);
        if (!group.members.includes(identityCommitment)) {
            return res.status(400).json({ error: 'Identity not in group' });
        }
        const { proof, publicSignals } = await generateProof(
            { trapdoor: identityCommitment, nullifier: identityCommitment },
            group,
            BigInt(signal),
            20 // Merkle tree depth
        );
        const solidityProof = packToSolidityProof(proof);
        res.json({ proof: solidityProof, publicSignals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to submit ZKP proof to the smart contract
app.post('/api/submit-proof', async (req, res) => {
    try {
        const { credentialId, proof, publicSignals } = req.body;
        const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const registry = new ethers.Contract(
            process.env.CREDENTIAL_REGISTRY_ADDRESS,
            require('./CredentialRegistryABI.json'),
            wallet
        );
        const tx = await registry.verifyZKP(
            credentialId,
            proof.a,
            proof.b,
            proof.c,
            publicSignals.input,
            publicSignals.merkleTreeDepth
        );
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => console.log(`API running on :${PORT}`)); 