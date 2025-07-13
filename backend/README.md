# EduRaksha Backend Server

A Node.js backend server for the EduRaksha privacy-preserving student verification system, providing ZKP generation, Verifiable Credential management, and AI integration.

## 🏗️ Architecture

The backend provides several key services:

- **ZKP Generation**: Creates privacy-preserving proofs using Semaphore protocol
- **DIDKit Integration**: Manages Verifiable Credentials (DID-JWT)
- **AI Assistant**: Processes natural language queries
- **Blockchain Integration**: Verifies proofs on Ethereum
- **Credential Management**: Issues and verifies educational credentials

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Ethereum RPC endpoint (for blockchain operations)

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

3. **Configure Environment Variables**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here

# DIDKit Configuration
ISSUER_PRIVATE_KEY=your_issuer_private_key_here

# AI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### ZKP (Zero-Knowledge Proof) Endpoints

#### Generate QR Code for Proof Request
```http
GET /api/generate-qr
```
Generates a QR code containing a ZKP proof request for scholarship eligibility.

**Response:**
```json
{
  "qr": {
    "id": "session-uuid",
    "type": "proof_request",
    "body": {
      "reason": "Scholarship eligibility",
      "scope": [...]
    },
    "callbackUrl": "http://localhost:3001/api/verify?sessionId=..."
  }
}
```

#### Generate ZKP Proof
```http
POST /api/generate-proof
Content-Type: application/json

{
  "identity": "12345678901234567890",
  "signal": "signal_data"
}
```
Generates a ZKP proof using the Semaphore protocol.

**Response:**
```json
{
  "proof": "solidity_proof_data",
  "publicSignals": [...]
}
```

#### Verify ZKP Proof
```http
POST /api/verify
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "proof": "proof_data"
}
```
Verifies a submitted ZKP proof.

**Response:**
```json
{
  "status": "success"
}
```

#### Check Verification Status
```http
GET /api/verify?sessionId=session-uuid
```
Checks the status of a verification session.

**Response:**
```json
{
  "status": "success|pending|failed"
}
```

### Verifiable Credential (DID-JWT) Endpoints

#### Issue Verifiable Credential
```http
POST /api/issue-vc
Content-Type: application/json

{
  "studentDid": "did:ethr:0x...",
  "credentialType": "EduEligibilityCredential",
  "credentialSubject": {
    "income": 80000,
    "caste": "SC",
    "marks": 85
  },
  "expirationDate": "2025-12-31T23:59:59Z"
}
```
Issues a new Verifiable Credential as a DID-JWT.

**Response:**
```json
{
  "jwt": "eyJ...",
  "credential": {...},
  "issuerDid": "did:ethr:0x..."
}
```

#### Verify Verifiable Credential
```http
POST /api/verify-vc
Content-Type: application/json

{
  "jwt": "eyJ..."
}
```
Verifies a Verifiable Credential JWT.

**Response:**
```json
{
  "isValid": true,
  "credential": {...},
  "issuer": "did:ethr:0x...",
  "subject": "did:ethr:0x...",
  "errors": [],
  "warnings": []
}
```

#### Create Verifiable Presentation
```http
POST /api/create-presentation
Content-Type: application/json

{
  "credentials": ["jwt1", "jwt2"],
  "holderDid": "did:ethr:0x..."
}
```
Creates a Verifiable Presentation from multiple credentials.

**Response:**
```json
{
  "presentation": {
    "@context": [...],
    "type": ["VerifiablePresentation"],
    "holder": "did:ethr:0x...",
    "verifiableCredential": [...]
  }
}
```

#### Verify Verifiable Presentation
```http
POST /api/verify-presentation
Content-Type: application/json

{
  "presentation": {...}
}
```
Verifies a Verifiable Presentation.

**Response:**
```json
{
  "isValid": true,
  "presentation": {...},
  "holder": "did:ethr:0x...",
  "credentials": [...],
  "errors": [],
  "warnings": []
}
```

### DID Resolution Endpoints

#### Resolve DID
```http
GET /api/resolve-did/:did
```
Resolves a DID to its document.

**Response:**
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:ethr:0x...",
  "verificationMethod": [...],
  "authentication": [...]
}
```

#### Get Issuer Information
```http
GET /api/issuer-info
```
Returns information about the credential issuer.

**Response:**
```json
{
  "issuerDid": "did:ethr:0x...",
  "issuerName": "EduRaksha Authority",
  "publicKey": "0x...",
  "supportedCredentialTypes": [...]
}
```

### Dashboard & AI Endpoints

#### Get Dashboard Data
```http
GET /api/dashboard-data
```
Returns dashboard data including claims and available scholarships.

**Response:**
```json
{
  "claims": {
    "income": 90000,
    "caste": "SC",
    "marks": 85
  },
  "scholarships": [
    {
      "id": 1,
      "name": "SC Post-Matric Scholarship"
    }
  ]
}
```

#### AI Query Processing
```http
POST /api/ai-query
Content-Type: application/json

{
  "claims": {
    "income": 90000,
    "caste": "SC",
    "marks": 85
  },
  "question": "Am I eligible for SC scholarship?"
}
```
Processes natural language queries using AI.

**Response:**
```json
{
  "response": "Based on your claims, you are eligible for SC Post-Matric Scholarship."
}
```

## 🔧 Services

### DIDKitService
Manages Verifiable Credentials using DID-JWT format:

- **issueCredential()**: Creates new VCs with cryptographic signatures
- **verifyCredential()**: Validates VC authenticity and integrity
- **createPresentation()**: Combines multiple VCs into presentations
- **verifyPresentation()**: Validates presentation structure and content
- **resolveDid()**: Resolves DIDs to their documents

### ZKP Generation
Uses Semaphore protocol for privacy-preserving proofs:

- **generateProof()**: Creates ZKP for membership and signal
- **verifyProof()**: Validates ZKP on-chain
- **packToSolidityProof()**: Converts proof for smart contract verification

## 🛡️ Security Features

### Cryptographic Security
- **Digital Signatures**: All credentials signed with issuer private key
- **JWT Tokens**: Standard format for credential exchange
- **Zero-Knowledge Proofs**: Privacy-preserving verification

### Input Validation
- **Request Validation**: All inputs validated before processing
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Protection against abuse (implemented via middleware)

### Privacy Protection
- **No Data Storage**: Minimal data retention for privacy
- **Session Management**: Temporary session storage only
- **Secure Communication**: HTTPS and CORS protection

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### API Testing
Use the provided Postman collection or curl commands:

```bash
# Test ZKP generation
curl -X POST http://localhost:3001/api/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"identity": "12345678901234567890", "signal": "test"}'

# Test VC issuance
curl -X POST http://localhost:3001/api/issue-vc \
  -H "Content-Type: application/json" \
  -d '{"studentDid": "did:ethr:0x123...", "credentialType": "TestCredential"}'
```

## 📊 Monitoring & Logging

### Log Levels
- **ERROR**: Critical errors and failures
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Detailed debugging information

### Health Check
```http
GET /health
```
Returns server health status.

### Metrics
- Request count and response times
- Error rates and types
- ZKP generation success rates
- VC issuance statistics

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure load balancer
5. Set up monitoring and logging

### Docker Deployment
```bash
# Build image
docker build -t eduraksha-backend .

# Run container
docker run -p 3001:3001 eduraksha-backend
```

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | Yes | - |
| `PRIVATE_KEY` | Ethereum private key | Yes | - |
| `ISSUER_PRIVATE_KEY` | Issuer private key | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | No | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 