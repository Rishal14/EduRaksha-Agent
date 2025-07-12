"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { zkpGenerator, type ZKPResult } from "@/lib/zkp-generator";
import { blockchainService, type BlockchainConfig } from "@/lib/blockchain-service";
import { ethers } from "ethers";
import { Copy, Download, CheckCircle, XCircle, Loader2, Link, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Claim {
  id: string;
  title: string;
  description: string;
  credentialType: string;
  example: string;
}

const availableClaims: Claim[] = [
  {
    id: "income-threshold",
    title: "Income Below Threshold",
    description: "Prove your income is below a certain amount without revealing the exact amount",
    credentialType: "income",
    example: "Income < ₹1,00,000"
  },
  {
    id: "caste-verification",
    title: "Caste Verification",
    description: "Prove your caste category without revealing personal details",
    credentialType: "caste",
    example: "Caste = SC"
  },
  {
    id: "marks-threshold",
    title: "Academic Performance",
    description: "Prove your marks are above a threshold without revealing exact scores",
    credentialType: "marks",
    example: "Marks > 75%"
  },
  {
    id: "disability-status",
    title: "Disability Status",
    description: "Prove disability status for accommodation purposes",
    credentialType: "disability",
    example: "Has Disability = Yes"
  },
  {
    id: "region-eligibility",
    title: "Regional Eligibility",
    description: "Prove eligibility for region-specific benefits",
    credentialType: "region",
    example: "Region = Karnataka"
  }
];

export default function ZKPGeneratorPage() {
  const searchParams = useSearchParams();
  const [selectedClaim, setSelectedClaim] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<ZKPResult | null>(null);
  const [studentAddress, setStudentAddress] = useState<string>("");
  const [issuerAddress, setIssuerAddress] = useState<string>("");
  const [customValue, setCustomValue] = useState<string>("");
  
  // Blockchain state
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);
  const [blockchainConfig, setBlockchainConfig] = useState<BlockchainConfig>({
    rpcUrl: "http://localhost:8545", // Default to local Hardhat
    verifierAddress: "0x0000000000000000000000000000000000000000",
    chainId: 31337
  });
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    const credential = searchParams.get('credential');
    if (credential) {
      // Auto-select the corresponding claim
      const claim = availableClaims.find(c => c.credentialType.toLowerCase() === 
        (credential === "1" ? "caste" : 
         credential === "2" ? "income" : 
         credential === "3" ? "marks" : 
         credential === "4" ? "disability" : "region"));
      if (claim) {
        setSelectedClaim(claim.id);
      }
    }
  }, [searchParams]);

  const handleGenerateProof = async () => {
    if (!selectedClaim || !studentAddress || !issuerAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!ethers.isAddress(studentAddress)) {
      toast.error("Invalid student address");
      return;
    }

    if (!ethers.isAddress(issuerAddress)) {
      toast.error("Invalid issuer address");
      return;
    }

    setIsGenerating(true);
    setGeneratedProof(null);

    try {
      const claim = availableClaims.find(c => c.id === selectedClaim);
      if (!claim) {
        throw new Error("Invalid claim selected");
      }

      let result: ZKPResult;

      switch (claim.credentialType) {
        case "income":
          const income = parseInt(customValue) || 80000;
          const threshold = 100000;
          result = await zkpGenerator.generateIncomeProof(
            studentAddress,
            issuerAddress,
            income,
            threshold
          );
          break;

        case "caste":
          const caste = customValue || "SC";
          result = await zkpGenerator.generateCasteProof(
            studentAddress,
            issuerAddress,
            caste
          );
          break;

        case "marks":
          const marks = parseInt(customValue) || 85;
          const marksThreshold = 75;
          result = await zkpGenerator.generateMarksProof(
            studentAddress,
            issuerAddress,
            marks,
            marksThreshold
          );
          break;

        default:
          // Generic proof generation
          result = await zkpGenerator.generateProof({
            credentialId: `${claim.credentialType}-${Date.now()}`,
            claimType: claim.example,
            studentAddress,
            issuerAddress,
            credentialData: {
              value: customValue || "default",
              type: claim.credentialType
            }
          });
      }

      setGeneratedProof(result);
      
      if (result.isValid) {
        toast.success("ZKP generated successfully!");
      } else {
        toast.error(result.errorMessage || "Failed to generate ZKP");
      }

    } catch (error) {
      console.error("Error generating proof:", error);
      toast.error("Failed to generate ZKP");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadProof = () => {
    if (!generatedProof) return;
    
    const proofJson = zkpGenerator.exportProof(generatedProof.proof);
    const blob = new Blob([proofJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zkp-proof-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Proof downloaded!");
  };

  const connectBlockchain = async () => {
    try {
      await blockchainService.initialize(blockchainConfig);
      setIsBlockchainConnected(true);
      toast.success("Connected to blockchain!");
    } catch (error) {
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const verifyOnChain = async () => {
    if (!generatedProof || !generatedProof.isValid) {
      toast.error("No valid proof to verify");
      return;
    }

    setIsVerifyingOnChain(true);
    setVerificationResult(null);

    try {
      const result = await blockchainService.verifyProofOnChain(generatedProof.proof);
      setVerificationResult(result);
      
      if (result.success) {
        toast.success("Proof verified on blockchain!");
      } else {
        toast.error(`Verification failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  const selectedClaimData = availableClaims.find(c => c.id === selectedClaim);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Blockchain Connection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Ethereum Blockchain Connection</span>
            </CardTitle>
            <CardDescription>
              Connect to Ethereum blockchain for on-chain ZKP verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="rpc-url">RPC URL</Label>
                <Input
                  id="rpc-url"
                  value={blockchainConfig.rpcUrl}
                  onChange={(e) => setBlockchainConfig({
                    ...blockchainConfig,
                    rpcUrl: e.target.value
                  })}
                  placeholder="http://localhost:8545"
                />
              </div>
              <div>
                <Label htmlFor="verifier-address">Verifier Contract</Label>
                <Input
                  id="verifier-address"
                  value={blockchainConfig.verifierAddress}
                  onChange={(e) => setBlockchainConfig({
                    ...blockchainConfig,
                    verifierAddress: e.target.value
                  })}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label htmlFor="chain-id">Chain ID</Label>
                <Input
                  id="chain-id"
                  type="number"
                  value={blockchainConfig.chainId}
                  onChange={(e) => setBlockchainConfig({
                    ...blockchainConfig,
                    chainId: parseInt(e.target.value)
                  })}
                  placeholder="31337"
                />
              </div>
            </div>
            <Button
              onClick={connectBlockchain}
              disabled={isBlockchainConnected}
              className="w-full"
            >
              {isBlockchainConnected ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Connected to Blockchain
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Connect to Blockchain
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zero-Knowledge Proof Generator
          </h1>
          <p className="text-gray-600">
            Generate privacy-preserving proofs from your verifiable credentials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Generate ZKP</CardTitle>
              <CardDescription>
                Select a claim type and provide required information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Claim Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="claim-type">Claim Type</Label>
                <Select value={selectedClaim} onValueChange={setSelectedClaim}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClaims.map((claim) => (
                      <SelectItem key={claim.id} value={claim.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{claim.title}</span>
                          <span className="text-sm text-gray-500">
                            {claim.example}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Address */}
              <div className="space-y-2">
                <Label htmlFor="student-address">Student Address</Label>
                <Input
                  id="student-address"
                  placeholder="0x..."
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                />
              </div>

              {/* Issuer Address */}
              <div className="space-y-2">
                <Label htmlFor="issuer-address">Issuer Address</Label>
                <Input
                  id="issuer-address"
                  placeholder="0x..."
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                />
              </div>

              {/* Custom Value */}
              {selectedClaimData && (
                <div className="space-y-2">
                  <Label htmlFor="custom-value">
                    {selectedClaimData.credentialType === "income" ? "Income Amount (₹)" :
                     selectedClaimData.credentialType === "caste" ? "Caste Category" :
                     selectedClaimData.credentialType === "marks" ? "Marks (%)" :
                     "Value"}
                  </Label>
                  <Input
                    id="custom-value"
                    placeholder={selectedClaimData.example}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                  />
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateProof}
                disabled={isGenerating || !selectedClaim || !studentAddress || !issuerAddress}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating ZKP...
                  </>
                ) : (
                  "Generate ZKP"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Proof</CardTitle>
              <CardDescription>
                Your privacy-preserving zero-knowledge proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!generatedProof ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔐</span>
                    </div>
                  </div>
                  <p>Generate a ZKP to see the result here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    {generatedProof.isValid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700 font-medium">Valid Proof Generated</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700 font-medium">Generation Failed</span>
                      </>
                    )}
                  </div>

                  {generatedProof.errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">{generatedProof.errorMessage}</p>
                    </div>
                  )}

                  {/* Proof Details */}
                  {generatedProof.isValid && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Claim Type:</span>
                          <p className="text-gray-900">{generatedProof.proof.claimType}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Student:</span>
                          <p className="text-gray-900 font-mono text-xs">
                            {generatedProof.proof.studentAddress.slice(0, 6)}...
                            {generatedProof.proof.studentAddress.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Issuer:</span>
                          <p className="text-gray-900 font-mono text-xs">
                            {generatedProof.proof.issuerAddress.slice(0, 6)}...
                            {generatedProof.proof.issuerAddress.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Timestamp:</span>
                          <p className="text-gray-900">
                            {new Date(generatedProof.proof.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Proof Hash */}
                      <div>
                        <span className="font-medium text-gray-600 text-sm">Nullifier:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded flex-1">
                            {generatedProof.proof.nullifier}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generatedProof.proof.nullifier)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(zkpGenerator.exportProof(generatedProof.proof))}
                          className="flex-1"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Proof
                        </Button>
                        <Button
                          variant="outline"
                          onClick={downloadProof}
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        {isBlockchainConnected && (
                          <Button
                            variant="default"
                            onClick={verifyOnChain}
                            disabled={isVerifyingOnChain}
                            className="flex-1"
                          >
                            {isVerifyingOnChain ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Link className="mr-2 h-4 w-4" />
                                Verify on Chain
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Blockchain Verification Result */}
                      {verificationResult && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center space-x-2 mb-2">
                            {verificationResult.success ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-green-700 font-medium">Blockchain Verification Successful</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="text-red-700 font-medium">Blockchain Verification Failed</span>
                              </>
                            )}
                          </div>
                          {verificationResult.transactionHash && (
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Transaction Hash:</span>
                              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                                {verificationResult.transactionHash}
                              </p>
                            </div>
                          )}
                          {verificationResult.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-red-700 text-sm">{verificationResult.error}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification Link */}
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">
                          Ready to verify this proof?
                        </p>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => window.location.href = '/verifier'}
                        >
                          Go to Verifier
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Claims */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Claim Types</CardTitle>
            <CardDescription>
              Different types of verifiable claims you can generate proofs for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedClaim(claim.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{claim.title}</h3>
                    <Badge variant="secondary">{claim.credentialType}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{claim.description}</p>
                  <p className="text-xs text-gray-500 font-mono bg-gray-100 p-1 rounded">
                    {claim.example}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 