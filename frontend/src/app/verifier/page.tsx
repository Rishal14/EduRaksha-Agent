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
  "claimType": "caste",
  "studentAddress": "0x3c2b1a0d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b",
  "issuerAddress": "0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
  "proof": {
    "a": [
      "0xc6aaf7214e5e5c1d13f2b4a7f7828774740b902e611912ba86a0f8d32b232bc3",
      "0x34f4e8e0f1d9204bff5d7936af722a35a515c375458f442d2e59ecb3748884b5"
    ],
    "b": [
      [
        "0x83610f6679236a07117f9d52c8fcc38fc2477849884ca719e0bb7a9efe48775c",
        "0x9cbd9c0e6141b4969d42a3dc9600cedda3098c9c8ce8a8c170135ae806f3070d"
      ],
      [
        "0x436d6adb66a8f611e5707cdbdbb891d96f6526c0e155fb95afb2a14e4484f2a9",
        "0xe25f287b5671dd41c78ae6edb3e172916afd640f78c59e7e1e8707516be5c961"
      ]
    ],
    "c": [
      "0x5081b5a7dfa6bbbea976bcd856d524286f47e9d66ba7bf6e85f4dafdf58179bc",
      "0x38bc46d7bb167f5ae7183dbfe993417c35bc89d2f3083bb2c633f22aa85bc6cc"
    ]
  },
  "publicSignals": [
    "0xeafe02b8a595d019fa7cd9e564bd009b88b8d76ba5a06c16d6757b27c9911a8e",
    "0xf1a335476091715323ecd294e0972b46ddb672ff0bdc73859c8ca73a591f0cda",
    "88962594580111843101890501849626951651677040589036480006579951475627937879424",
    "0x3c2b1a0d9e8f7c6b5a4d3e2f1c0b9a8d7e6f5c4b",
    "0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f"
  ],
  "merkleTreeDepth": 20,
  "nullifier": "0xf1a335476091715323ecd294e0972b46ddb672ff0bdc73859c8ca73a591f0cda",
  "timestamp": 1752321059857,
  "groupId": "0x12738dffa9180fa3225bd70f37ab41784816ab27870ee88f12a6c165a45e0410"
}`;

  const handleVerifyProof = async () => {
    if (!proofInput.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null); // Clear previous result
    
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
          blockchainResult = await blockchainService.verifyCredentialOnChain(
            importedProof.claimType,
            importedProof.studentAddress,
            importedProof.issuerAddress,
            importedProof
          );
        } catch (blockchainError) {
          console.warn("Blockchain verification failed, using local result:", blockchainError);
        }
      }
      
      // Determine final result
      const isValid = localVerification && (!blockchainResult || blockchainResult.success);
      
      const result: VerificationResult = {
        isValid,
        message: isValid 
          ? `Proof is valid and verified successfully! ${blockchainResult?.transactionHash ? `Transaction: ${blockchainResult.transactionHash}` : 'Locally verified'}`
          : `Proof verification failed: ${blockchainResult?.error || 'Local verification failed'}`,
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
                  onChange={(e) => {
                    setProofInput(e.target.value);
                    setVerificationResult(null); // Clear status on input change
                  }}
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

              {/* Verification Result Display */}
              {verificationResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  verificationResult.isValid 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="font-bold text-lg">
                      {verificationResult.isValid ? '✅ Verification Successful' : '❌ Verification Failed'}
                    </div>
                  </div>
                  <div className="text-sm mb-3">{verificationResult.message}</div>
                  {verificationResult.details && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      <div className="grid grid-cols-1 gap-1">
                        <div><span className="font-medium">Claim Type:</span> {verificationResult.details.claimType}</div>
                        <div><span className="font-medium">Verified At:</span> {new Date(verificationResult.details.verifiedAt).toLocaleString()}</div>
                        <div><span className="font-medium">Proof Hash:</span> <span className="font-mono">{verificationResult.details.proofHash.slice(0, 20)}...</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Instructions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
              <CardDescription>
                Follow these steps to verify a Zero-Knowledge Proof
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-medium">Prepare Your Proof</h4>
                    <p className="text-sm text-gray-600">
                      Generate a ZKP using the ZKP Generator or obtain one from a trusted source.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-medium">Paste the Proof</h4>
                    <p className="text-sm text-gray-600">
                      Copy and paste the complete JSON proof into the text area on the left.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-medium">Submit for Verification</h4>
                    <p className="text-sm text-gray-600">
                      Click the &quot;Submit for Verification&quot; button to verify the proof.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary" className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-medium">Review Results</h4>
                    <p className="text-sm text-gray-600">
                      Check the verification result below the submit button. The proof will be verified both locally and on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Gets Verified</CardTitle>
              <CardDescription>
                The verification process checks several aspects of your proof
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Proof mathematical validity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Nullifier uniqueness (prevents double-spending)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Issuer trust verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Blockchain state consistency</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 