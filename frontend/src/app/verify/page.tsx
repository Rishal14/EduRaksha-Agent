"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { didkitService } from "@/lib/didkit-service";

interface VerificationResult {
  isValid: boolean;
  credential?: {
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
  };
  issuer?: string;
  subject?: string;
  errors: string[];
  warnings: string[];
}

export default function VerifyPage() {
  const [jwt, setJwt] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setVerificationResult(null);
    
    try {
      const result = await didkitService.verifyCredential(jwt);
      setVerificationResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verify Verifiable Credential</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verify JWT Credential</CardTitle>
          <CardDescription>
            Verify a verifiable credential JWT using DIDKit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="jwt">JWT Token</Label>
              <Textarea
                id="jwt"
                value={jwt}
                onChange={(e) => setJwt(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={6}
                required
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Credential"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {verificationResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verification Result</CardTitle>
            <CardDescription>
              <Badge className={getStatusColor(verificationResult.isValid)}>
                {verificationResult.isValid ? "Valid" : "Invalid"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationResult.credential && (
                <div>
                  <h3 className="font-semibold mb-2">Credential Details</h3>
                  <div className="space-y-2">
                    <div>
                      <strong>ID:</strong> {verificationResult.credential.id}
                    </div>
                    <div>
                      <strong>Type:</strong> {verificationResult.credential.type.join(", ")}
                    </div>
                    <div>
                      <strong>Issuer:</strong> {verificationResult.credential.issuer.name}
                    </div>
                    <div>
                      <strong>Issuance Date:</strong> {new Date(verificationResult.credential.issuanceDate).toLocaleString()}
                    </div>
                    {verificationResult.credential.expirationDate && (
                      <div>
                        <strong>Expiration Date:</strong> {new Date(verificationResult.credential.expirationDate).toLocaleString()}
                      </div>
                    )}
                    <div>
                      <strong>Subject:</strong> {verificationResult.credential.credentialSubject.id}
                    </div>
                    <div>
                      <strong>Credential Subject:</strong>
                      <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                        {JSON.stringify(verificationResult.credential.credentialSubject, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              
              {verificationResult.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Errors</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.errors.map((error, index) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {verificationResult.warnings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-yellow-600 mb-2">Warnings</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 