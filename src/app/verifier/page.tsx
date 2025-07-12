"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { blockchainService } from "@/lib/blockchain-service";
import { zkpGenerator } from "@/lib/zkp-generator";

interface VerificationResult {
  isValid: boolean;
  message: string;
  details?: {
    claimType: string;
    verifiedAt: string;
    proofHash: string;
  };
}

export default function VerifierPage() {
  const [proofInput, setProofInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const sampleProof = `{
  "proof": {
    "a": ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"],
    "b": [["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"], ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"]],
    "c": ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"]
  },
  "publicSignals": {
    "input": ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"],
    "merkleTreeDepth": 20
  },
  "claimId": "income_lt_100k",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`;

  const handleVerifyProof = async () => {
    if (!proofInput.trim()) return;

    setIsVerifying(true);
    
    try {
      // Import and validate the proof
      const importedProof = zkpGenerator.importProof(proofInput);
      if (!importedProof) {
        throw new Error("Invalid proof format");
      }

      // Step 1: Local ZKP verification
      const localVerification = await zkpGenerator.verifyProof(importedProof);
      
      // Step 2: Blockchain verification (if local verification passes)
      let blockchainResult = null;
      if (localVerification) {
        try {
          const formattedProof = zkpGenerator.formatProofForBlockchain(importedProof);
          // Add required fields for blockchain service
          const blockchainProof = {
            ...formattedProof,
            credentialId: `proof-${Date.now()}`,
            timestamp: Date.now()
          };
          blockchainResult = await blockchainService.verifyCredentialZKP(blockchainProof);
        } catch (blockchainError) {
          console.warn("Blockchain verification failed, using local result:", blockchainError);
        }
      }
      
      // Determine final result
      const isValid = localVerification && (!blockchainResult || blockchainResult.isValid);
      
      const result: VerificationResult = {
        isValid,
        message: isValid 
          ? `Proof is valid and verified successfully! ${blockchainResult ? `Issuer: ${blockchainResult.issuerName}` : 'Locally verified'}`
          : `Proof verification failed: ${blockchainResult?.errorMessage || 'Local verification failed'}`,
        details: isValid ? {
          claimType: importedProof.claimType,
          verifiedAt: new Date().toISOString(),
          proofHash: importedProof.nullifier
        } : undefined
      };
      
      setVerificationResult(result);
      
          } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error during verification. Please check the proof format.";
        setVerificationResult({
          isValid: false,
          message: errorMessage
        });
      } finally {
      setIsVerifying(false);
    }
  };

  const handleLoadSample = () => {
    setProofInput(sampleProof);
    setVerificationResult(null);
  };

  const handleClear = () => {
    setProofInput("");
    setVerificationResult(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Proof Verifier
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Submit Zero-Knowledge Proofs for verification. The verifier will check the proof 
          without accessing your private credential data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Proof Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Proof</CardTitle>
              <CardDescription>
                Paste your Zero-Knowledge Proof JSON here for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Proof JSON
                </label>
                <Textarea
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  placeholder="Paste your ZKP proof JSON here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleLoadSample}
                  variant="outline"
                  className="flex-1"
                >
                  Load Sample
                </Button>
                <Button 
                  onClick={handleClear}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>

              <Button 
                onClick={handleVerifyProof}
                disabled={!proofInput.trim() || isVerifying}
                className="w-full"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying Proof...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Copy your generated ZKP proof from the ZKP Generator page</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Paste the JSON proof in the text area above</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Click "Submit for Verification" to validate the proof</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>View the verification result on the right</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Verification Result */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
              <CardDescription>
                The result of your proof verification will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationResult ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={verificationResult.isValid ? "default" : "destructive"}
                      className="text-sm px-3 py-1"
                    >
                      {verificationResult.isValid ? "✅ Valid" : "❌ Invalid"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </span>
                  </div>

                  {/* Message */}
                  <div className={`p-4 rounded-lg ${
                    verificationResult.isValid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationResult.message}
                    </p>
                  </div>

                  {/* Details */}
                  {verificationResult.details && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Verification Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Claim Type:</span>
                          <span className="font-medium">{verificationResult.details.claimType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verified At:</span>
                          <span className="font-medium">
                            {new Date(verificationResult.details.verifiedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Proof Hash:</span>
                          <span className="font-mono text-xs">
                            {verificationResult.details.proofHash.substring(0, 20)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={() => setVerificationResult(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Verify Another
                    </Button>
                    {verificationResult.isValid && (
                      <Button className="flex-1">
                        Download Certificate
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p>Submit a proof to see the verification result here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Proofs Verified</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Valid Proofs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 