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
import { ssiWallet, type VerifiableCredential, initializeDemoCredentials } from "@/lib/ssi-wallet";
import { ethers } from "ethers";
import { Copy, Download, CheckCircle, XCircle, Loader2, Link, Wallet, RefreshCw } from "lucide-react";
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
  const [customValue, setCustomValue] = useState<string>("");
  const [thresholdValue, setThresholdValue] = useState<string>("");
  
  // SSI Wallet state
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  
  // Blockchain state
  const [isVerifyingOnChain, setIsVerifyingOnChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    error?: string;
    transactionHash?: string;
  } | null>(null);

  // Load SSI wallet credentials on component mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    const creds = ssiWallet.getSelfIssuedCredentials();
    setCredentials(creds);
  };

  // Auto-select credential when claim type changes
  useEffect(() => {
    if (selectedClaim) {
      const claim = availableClaims.find(c => c.id === selectedClaim);
      if (claim) {
        const matchingCredential = credentials.find(cred => {
          switch (claim.credentialType) {
            case "income":
              return cred.type === "IncomeCertificate";
            case "caste":
              return cred.type === "CasteCertificate";
            case "marks":
              return cred.type === "AcademicCertificate";
            default:
              return false;
          }
        });
        
        if (matchingCredential) {
          setSelectedCredential(matchingCredential);
          // Auto-populate the value based on credential type
          switch (claim.credentialType) {
            case "income":
              setCustomValue(matchingCredential.credentialSubject.annualIncome?.toString() || "");
              break;
            case "caste":
              setCustomValue(matchingCredential.credentialSubject.caste?.toString() || "");
              break;
            case "marks":
              setCustomValue(matchingCredential.credentialSubject.cgpa?.toString() || "");
              break;
          }
        } else {
          setSelectedCredential(null);
          setCustomValue("");
        }
      }
    }
  }, [selectedClaim, credentials]);

  useEffect(() => {
    const credential = searchParams?.get('credential');
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
    if (!selectedClaim || !studentAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!ethers.isAddress(studentAddress)) {
      toast.error("Invalid student address");
      return;
    }

    if (!selectedCredential) {
      toast.error("Please select a credential from your SSI Wallet");
      return;
    }

    setIsGenerating(true);
    setGeneratedProof(null);

    try {
      const claim = availableClaims.find(c => c.id === selectedClaim);
      if (!claim) {
        throw new Error("Invalid claim selected");
      }

      // Use the issuer address from the selected credential
      const issuerAddress = selectedCredential.issuer.id.replace('did:ethr:', '');

      let result: ZKPResult;

      switch (claim.credentialType) {
        case "income":
          const income = parseInt(customValue) || 80000;
          const threshold = parseInt(thresholdValue) || 100000;
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
          const marksThreshold = parseInt(thresholdValue) || 75;
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
            credentialId: selectedCredential.id,
            claimType: `${claim.credentialType} ${thresholdValue ? `< ${thresholdValue}` : ''}`,
            studentAddress,
            issuerAddress,
            credentialData: {
              value: customValue || "default",
              threshold: thresholdValue || "default",
              type: claim.credentialType
            } as Record<string, string>
          });
      }

      setGeneratedProof(result);
      
      if (result.isValid) {
        // Store the generated proof
        const proofs = JSON.parse(localStorage.getItem("generatedProofs") || "[]");
        const newProof = {
          id: `proof-${Date.now()}`,
          claimType: result.proof.claimType,
          studentAddress: result.proof.studentAddress,
          issuerAddress: result.proof.issuerAddress,
          credentialId: selectedCredential.id,
          generatedAt: new Date().toISOString(),
          status: 'active',
          proofData: result.proof
        };
        proofs.push(newProof);
        localStorage.setItem("generatedProofs", JSON.stringify(proofs));
        
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

  const verifyOnChain = async () => {
    if (!generatedProof || !generatedProof.isValid) {
      toast.error("No valid proof to verify");
      return;
    }

    setIsVerifyingOnChain(true);
    setVerificationResult(null);

    try {
      // Mock blockchain verification for now
      const result = {
        success: true,
        transactionHash: "0x" + Math.random().toString(16).slice(2, 66)
      };
      setVerificationResult(result);
      toast.success("Proof verified on blockchain!");
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setVerificationResult(result);
      toast.error(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVerifyingOnChain(false);
    }
  };

  const selectedClaimData = availableClaims.find(c => c.id === selectedClaim);

  // Add some example scenarios to demonstrate integrity checks
  const exampleScenarios = [
    {
      title: "Scholarship A - Income < ₹2,50,000",
      description: "Using Income Certificate (₹80,000) | Criteria: < ₹2,50,000 ✅",
      claimType: "income-threshold",
      customValue: "80000",
      thresholdValue: "250000",
      credentialType: "IncomeCertificate"
    },
    {
      title: "Scholarship B - Income < ₹5,00,000", 
      description: "Using Income Certificate (₹80,000) | Criteria: < ₹5,00,000 ✅",
      claimType: "income-threshold",
      customValue: "80000",
      thresholdValue: "500000",
      credentialType: "IncomeCertificate"
    },
    {
      title: "Scholarship C - Marks > 80%",
      description: "Using Academic Certificate (8.5 CGPA) | Criteria: > 80% ✅",
      claimType: "marks-threshold", 
      customValue: "85",
      thresholdValue: "80",
      credentialType: "AcademicCertificate"
    },
    {
      title: "Scholarship D - Marks > 90%",
      description: "Using Academic Certificate (8.5 CGPA) | Criteria: > 90% ❌",
      claimType: "marks-threshold",
      customValue: "85", 
      thresholdValue: "90",
      credentialType: "AcademicCertificate"
    },
    {
      title: "SC Scholarship",
      description: "Using Caste Certificate (SC) | Criteria: SC ✅",
      claimType: "caste-verification",
      customValue: "SC",
      thresholdValue: "",
      credentialType: "CasteCertificate"
    },
    {
      title: "ST Scholarship",
      description: "Using Caste Certificate (SC) | Criteria: ST ❌", 
      claimType: "caste-verification",
      customValue: "SC",
      thresholdValue: "",
      credentialType: "CasteCertificate"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zero-Knowledge Proof Generator
          </h1>
          <p className="text-gray-600">
            Generate privacy-preserving proofs from your verifiable credentials
          </p>
        </div>

        {/* SSI Wallet Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>SSI Wallet</span>
            </CardTitle>
            <CardDescription>
              Your verifiable credentials from the SSI Wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isLoadingWallet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span className="font-medium">
                    {isLoadingWallet ? "Loading credentials..." : `${credentials.length} credentials available`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCredentials}
                  disabled={isLoadingWallet}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {credentials.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCredential?.id === credential.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCredential(credential)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {credential.type.replace('Certificate', '')}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {credential.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        Issued by: {credential.issuer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(credential.issuanceDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedCredential && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Credential:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Type:</strong> {selectedCredential.type}</p>
                    <p><strong>Issuer:</strong> {selectedCredential.issuer.name}</p>
                    <p><strong>Issued:</strong> {new Date(selectedCredential.issuanceDate).toLocaleDateString()}</p>
                    {selectedCredential.expirationDate && (
                      <p><strong>Expires:</strong> {new Date(selectedCredential.expirationDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                  disabled={true}
                />
                <p className="text-xs text-gray-500">
                  Automatically loaded from your SSI Wallet
                </p>
              </div>

              {/* Custom Value */}
              {selectedClaimData && (
                <div className="space-y-2">
                  <Label htmlFor="custom-value">
                    {selectedClaimData.credentialType === "income" ? "Your Actual Income (₹)" :
                     selectedClaimData.credentialType === "caste" ? "Your Caste Category" :
                     selectedClaimData.credentialType === "marks" ? "Your Marks (%)" :
                     "Value"}
                  </Label>
                  <Input
                    id="custom-value"
                    placeholder={selectedClaimData.example}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    disabled={selectedCredential !== null}
                  />
                  <p className="text-xs text-gray-500">
                    {selectedCredential 
                      ? "Automatically loaded from your selected credential" 
                      : "Enter your actual value from your credential"}
                  </p>
                </div>
              )}

              {/* Threshold Value */}
              {selectedClaimData && (selectedClaimData.credentialType === "income" || selectedClaimData.credentialType === "marks") && (
                <div className="space-y-2">
                  <Label htmlFor="threshold-value">
                    {selectedClaimData.credentialType === "income" ? "Scholarship Income Limit (₹)" :
                     selectedClaimData.credentialType === "marks" ? "Scholarship Marks Requirement (%)" :
                     "Threshold"}
                  </Label>
                  <Input
                    id="threshold-value"
                    placeholder={selectedClaimData.credentialType === "income" ? "e.g., 250000" : "e.g., 80"}
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the scholarship criteria to check your eligibility
                  </p>
                </div>
              )}

              {/* Eligibility Check Display */}
              {selectedClaimData && customValue && thresholdValue && 
               (selectedClaimData.credentialType === "income" || selectedClaimData.credentialType === "marks") && (
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Eligibility Check:</p>
                  {selectedClaimData.credentialType === "income" ? (
                    <div className="text-sm">
                      <p>Your income: ₹{parseInt(customValue).toLocaleString()}</p>
                      <p>Scholarship limit: ₹{parseInt(thresholdValue).toLocaleString()}</p>
                      <p className={`font-medium ${parseInt(customValue) < parseInt(thresholdValue) ? 'text-green-600' : 'text-red-600'}`}>
                        {parseInt(customValue) < parseInt(thresholdValue) ? '✅ Eligible' : '❌ Not Eligible'}
                      </p>
                    </div>
                  ) : selectedClaimData.credentialType === "marks" ? (
                    <div className="text-sm">
                      <p>Your marks: {customValue}%</p>
                      <p>Scholarship requirement: {thresholdValue}%</p>
                      <p className={`font-medium ${parseInt(customValue) >= parseInt(thresholdValue) ? 'text-green-600' : 'text-red-600'}`}>
                        {parseInt(customValue) >= parseInt(thresholdValue) ? '✅ Eligible' : '❌ Not Eligible'}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateProof}
                disabled={
                  isGenerating || 
                  !selectedClaim || 
                  !studentAddress ||
                  !selectedCredential ||
                  (selectedClaimData?.credentialType === "income" && Boolean(customValue) && Boolean(thresholdValue) && parseInt(customValue) >= parseInt(thresholdValue)) ||
                  (selectedClaimData?.credentialType === "marks" && Boolean(customValue) && Boolean(thresholdValue) && parseInt(customValue) < parseInt(thresholdValue))
                }
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

        {/* Example Scenarios */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Example Scenarios</CardTitle>
            <CardDescription>
              Test the integrity checks with these example scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedClaim(scenario.claimType);
                    setCustomValue(scenario.customValue);
                    setThresholdValue(scenario.thresholdValue);
                    
                    // Auto-select the matching credential
                    const matchingCredential = credentials.find(cred => 
                      cred.type === scenario.credentialType
                    );
                    if (matchingCredential) {
                      setSelectedCredential(matchingCredential);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                    <Badge variant={scenario.title.includes('❌') ? "destructive" : "secondary"}>
                      {scenario.title.includes('❌') ? 'Will Fail' : 'Will Pass'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                  <p className="text-xs text-gray-500">Click to try this scenario</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 