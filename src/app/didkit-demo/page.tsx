"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Credential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, unknown>;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

interface VerificationResult {
  verified: boolean;
  errors?: string[];
  warnings?: string[];
}

export default function DIDKitDemoPage() {
  const [credential, setCredential] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [parsedCredential, setParsedCredential] = useState<Credential | null>(null);

  const sampleCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "id": "http://example.edu/credentials/3732",
    "type": ["VerifiableCredential", "UniversityDegreeCredential"],
    "issuer": "https://example.edu/issuers/565049",
    "issuanceDate": "2010-01-01T19:23:24Z",
    "credentialSubject": {
      "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
      "degree": {
        "type": "BachelorDegree",
        "name": "Bachelor of Science and Arts"
      }
    },
    "proof": {
      "type": "Ed25519Signature2018",
      "created": "2017-06-18T21:19:10Z",
      "verificationMethod": "https://example.edu/issuers/565049#key-1",
      "proofPurpose": "assertionMethod",
      "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
    }
  };

  const handleVerify = async () => {
    if (!credential.trim()) {
      toast.error("Please enter a credential to verify");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Parse the credential first
      const parsed = JSON.parse(credential);
      setParsedCredential(parsed);

      // Mock verification - in a real implementation, this would use DIDKit
      const mockVerification: VerificationResult = {
        verified: true,
        warnings: ["Mock verification - DIDKit not configured"]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setVerificationResult(mockVerification);
      toast.success("Verification completed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON";
      setVerificationResult({
        verified: false,
        errors: [errorMessage]
      });
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadSample = () => {
    setCredential(JSON.stringify(sampleCredential, null, 2));
    setParsedCredential(null);
    setVerificationResult(null);
  };

  const clearAll = () => {
    setCredential("");
    setParsedCredential(null);
    setVerificationResult(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">DIDKit Verification Demo</h1>
        <p className="text-muted-foreground">
          Test verifiable credential verification using DIDKit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Credential</CardTitle>
            <CardDescription>
              Paste a verifiable credential in JSON format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={loadSample} variant="outline" size="sm">
                Load Sample
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credential">Credential JSON</Label>
              <Textarea
                id="credential"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Paste your verifiable credential here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <Button 
              onClick={handleVerify} 
              disabled={isVerifying || !credential.trim()}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Credential"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {parsedCredential && (
            <Card>
              <CardHeader>
                <CardTitle>Parsed Credential</CardTitle>
                <CardDescription>Credential details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">ID</Label>
                  <p className="text-sm text-muted-foreground break-all">
                    {parsedCredential.id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="flex gap-1 mt-1">
                    {parsedCredential.type.map((type: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issuer</Label>
                  <p className="text-sm text-muted-foreground break-all">
                    {parsedCredential.issuer}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issuance Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(parsedCredential.issuanceDate).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.verified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Verification Successful
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      Verification Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationResult.errors && verificationResult.errors.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-red-600">Errors</Label>
                    <ul className="text-sm text-red-600 mt-1">
                      {verificationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-yellow-600">Warnings</Label>
                    <ul className="text-sm text-yellow-600 mt-1">
                      {verificationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 