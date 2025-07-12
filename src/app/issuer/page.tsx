"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DIDKitCredential {
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

export default function IssuerPanel() {
  const [studentDid, setStudentDid] = useState("");
  const [credentialType, setCredentialType] = useState("");
  const [credentialSubject, setCredentialSubject] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [jwt, setJwt] = useState("");
  const [credential, setCredential] = useState<DIDKitCredential | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const credentialTypes = [
    "EducationalCredential",
    "IncomeCredential", 
    "CasteCredential",
    "DisabilityCredential",
    "RegionCredential"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setJwt("");
    setCredential(null);
    
    try {
      // Parse credential subject
      const parsedSubject = credentialSubject ? JSON.parse(credentialSubject) : {};
      
      const res = await fetch("/api/issue-vc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentDid, 
          credentialType, 
          credentialSubject: parsedSubject,
          expirationDate: expirationDate || undefined
        }),
      });
      
      if (!res.ok) throw new Error("Failed to issue VC");
      const data = await res.json();
      setJwt(data.jwt);
      setCredential(data.credential);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">VC Issuer Panel</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Issue Verifiable Credential</CardTitle>
          <CardDescription>
            Issue a new verifiable credential using DIDKit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="studentDid">Student DID</Label>
              <Input
                id="studentDid"
                value={studentDid}
                onChange={(e) => setStudentDid(e.target.value)}
                placeholder="did:ethr:0x..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="credentialType">Credential Type</Label>
              <Select value={credentialType} onValueChange={setCredentialType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select credential type" />
                </SelectTrigger>
                <SelectContent>
                  {credentialTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="credentialSubject">Credential Subject (JSON)</Label>
              <Textarea
                id="credentialSubject"
                value={credentialSubject}
                onChange={(e) => setCredentialSubject(e.target.value)}
                placeholder='{"marks": "88%", "subject": "Class 12 Board Results"}'
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
              <Input
                id="expirationDate"
                type="datetime-local"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? "Issuing..." : "Issue VC"}
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
      
      {credential && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Issued Credential</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mr-2">
                {credential.type[1]}
              </Badge>
              <span>Issued to: {credential.credentialSubject.id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>Issuer:</strong> {credential.issuer.name}
              </div>
              <div>
                <strong>Issuance Date:</strong> {new Date(credential.issuanceDate).toLocaleString()}
              </div>
              {credential.expirationDate && (
                <div>
                  <strong>Expiration Date:</strong> {new Date(credential.expirationDate).toLocaleString()}
                </div>
              )}
              <div>
                <strong>Credential Subject:</strong>
                <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                  {JSON.stringify(credential.credentialSubject, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {jwt && (
        <Card>
          <CardHeader>
            <CardTitle>JWT Token</CardTitle>
            <CardDescription>
              The signed JWT representation of the credential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {jwt}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 