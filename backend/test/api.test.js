const request = require('supertest');
const express = require('express');
const app = require('../index');

describe('EduRaksha Backend API', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('ZKP Endpoints', () => {
    it('should generate QR code for proof request', async () => {
      const response = await request(app)
        .get('/api/generate-qr')
        .expect(200);
      
      expect(response.body).toHaveProperty('qr');
      expect(response.body.qr).toHaveProperty('id');
      expect(response.body.qr).toHaveProperty('type', 'proof_request');
    });

    it('should generate ZKP proof', async () => {
      const response = await request(app)
        .post('/api/generate-proof')
        .send({
          identity: '12345678901234567890',
          signal: 'test_signal'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('proof');
      expect(response.body).toHaveProperty('publicSignals');
    });

    it('should verify ZKP proof', async () => {
      const response = await request(app)
        .post('/api/verify')
        .send({
          sessionId: 'test-session-id',
          proof: { claims: { income: 90000, caste: 'SC', marks: 85 } }
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('Verifiable Credential Endpoints', () => {
    it('should issue verifiable credential', async () => {
      const response = await request(app)
        .post('/api/issue-vc')
        .send({
          studentDid: 'did:ethr:0x1234567890123456789012345678901234567890',
          credentialType: 'EduEligibilityCredential',
          credentialSubject: {
            income: 80000,
            caste: 'SC',
            marks: 85
          }
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('jwt');
      expect(response.body).toHaveProperty('credential');
      expect(response.body).toHaveProperty('issuerDid');
    });

    it('should verify verifiable credential', async () => {
      // First issue a credential
      const issueResponse = await request(app)
        .post('/api/issue-vc')
        .send({
          studentDid: 'did:ethr:0x1234567890123456789012345678901234567890',
          credentialType: 'TestCredential',
          credentialSubject: { test: 'value' }
        });

      // Then verify it
      const response = await request(app)
        .post('/api/verify-vc')
        .send({
          jwt: issueResponse.body.jwt
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('credential');
    });

    it('should create verifiable presentation', async () => {
      const response = await request(app)
        .post('/api/create-presentation')
        .send({
          credentials: ['jwt1', 'jwt2'],
          holderDid: 'did:ethr:0x1234567890123456789012345678901234567890'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('presentation');
      expect(response.body.presentation).toHaveProperty('type');
      expect(response.body.presentation.type).toContain('VerifiablePresentation');
    });
  });

  describe('DID Resolution Endpoints', () => {
    it('should resolve DID', async () => {
      const response = await request(app)
        .get('/api/resolve-did/did:ethr:0x1234567890123456789012345678901234567890')
        .expect(200);
      
      expect(response.body).toHaveProperty('@context');
      expect(response.body).toHaveProperty('id');
    });

    it('should get issuer info', async () => {
      const response = await request(app)
        .get('/api/issuer-info')
        .expect(200);
      
      expect(response.body).toHaveProperty('issuerDid');
      expect(response.body).toHaveProperty('issuerName');
    });
  });

  describe('Dashboard & AI Endpoints', () => {
    it('should get dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard-data')
        .expect(200);
      
      expect(response.body).toHaveProperty('claims');
      expect(response.body).toHaveProperty('scholarships');
    });

    it('should process AI query', async () => {
      const response = await request(app)
        .post('/api/ai-query')
        .send({
          claims: { income: 90000, caste: 'SC', marks: 85 },
          question: 'Am I eligible for SC scholarship?'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('response');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ZKP generation request', async () => {
      const response = await request(app)
        .post('/api/generate-proof')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid VC issuance request', async () => {
      const response = await request(app)
        .post('/api/issue-vc')
        .send({})
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid DID resolution', async () => {
      const response = await request(app)
        .get('/api/resolve-did/invalid-did')
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });
  });
}); 