"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { didkitService } from "@/lib/didkit-service";

interface WalletInfo {
  address: string;
  did: string;
  privateKey: string;
}

interface CredentialRecord {
  id: string;
  credential: {
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
  jwt: string;
  storedAt: string;
  status: 'active';
}

export default function DIDKitDemoPage() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [storedCredentials, setStoredCredentials] = useState<CredentialRecord[]>([]);
  const [issuerInfo, setIssuerInfo] = useState<any>(null);
  
  // Issuance state
  const [issuanceForm, setIssuanceForm] = useState({
    subjectDid: "",
    credentialType: "EducationalCredential",
    credentialSubject: "",
    expirationDate: ""
  });
  const [issuedCredential, setIssuedCredential] = useState<any>(null);
  const [issuanceLoading, setIssuanceLoading] = useState(false);
  const [issuanceError, setIssuanceError] = useState("");

  // Verification state
  const [verificationJwt, setVerificationJwt] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const credentialTypes = [
    "EducationalCredential",
    "IncomeCredential", 
    "CasteCredential",
    "DisabilityCredential",
    "RegionCredential"
  ];

  useEffect(() => {
    loadStoredCredentials();
    loadIssuerInfo();
  }, []);

  const loadStoredCredentials = () => {
    const credentials = didkitService.getStoredCredentials();
    setStoredCredentials(credentials);
  };

  const loadIssuerInfo = async () => {
    try {
      const info = await didkitService.getIssuerInfo();
      setIssuerInfo(info);
    } catch (error) {
      console.error('Failed to load issuer info:', error);
    }
  };

  const handleSetupWallet = async () => {
    try {
      const wallet = await didkitService.setupWallet();
      setWalletInfo(wallet);
    } catch (error) {
      console.error('Failed to setup wallet:', error);
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuanceLoading(true);
    setIssuanceError("");
    setIssuedCredential(null);

    try {
      // Parse credential subject
      const parsedSubject = issuanceForm.credentialSubject ? 
        JSON.parse(issuanceForm.credentialSubject) : {};

      const result = await didkitService.issueCredential({
        subjectDid: issuanceForm.subjectDid,
        credentialType: issuanceForm.credentialType,
        credentialSubject: parsedSubject,
        expirationDate: issuanceForm.expirationDate || undefined
      });

      setIssuedCredential(result);
      
      // Store the credential
      didkitService.storeCredential(result.credential, result.jwt);
      loadStoredCredentials();
      
      // Reset form
      setIssuanceForm({
        subjectDid: "",
        credentialType: "EducationalCredential",
        credentialSubject: "",
        expirationDate: ""
      });
    } catch (error) {
      setIssuanceError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIssuanceLoading(false);
    }
  };

  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);
    setVerificationError("");
    setVerificationResult(null);

    try {
      const result = await didkitService.verifyCredential(verificationJwt);
      setVerificationResult(result);
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleImportCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportLoading(true);
    setImportError("");

    try {
      const result = didkitService.importCredential(importJson);
      setImportJson("");
      loadStoredCredentials();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCredential = (credentialId: string) => {
    const exported = didkitService.exportCredential(credentialId);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${credentialId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRemoveCredential = (credentialId: string) => {
    didkitService.removeCredential(credentialId);
    loadStoredCredentials();
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">DIDKit VC Demo</h1>
      
      {/* Wallet Setup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wallet Setup</CardTitle>
          <CardDescription>
            Set up your DID wallet for credential management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletInfo ? (
            <Button onClick={handleSetupWallet}>
              Setup Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <div><strong>Address:</strong> {walletInfo.address}</div>
              <div><strong>DID:</strong> {walletInfo.did}</div>
              <div><strong>Private Key:</strong> {walletInfo.privateKey.substring(0, 20)}...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issuer Info */}
      {issuerInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Issuer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Issuer DID:</strong> {issuerInfo.did}</div>
              <div><strong>Issuer Address:</strong> {issuerInfo.address}</div>
              <div><strong>Issuer Name:</strong> {issuerInfo.name}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="issue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="issue">Issue Credential</TabsTrigger>
          <TabsTrigger value="verify">Verify Credential</TabsTrigger>
          <TabsTrigger value="import">Import Credential</TabsTrigger>
          <TabsTrigger value="wallet">My Wallet</TabsTrigger>
        </TabsList>

        {/* Issue Credential Tab */}
        <TabsContent value="issue">
          <Card>
            <CardHeader>
              <CardTitle>Issue Verifiable Credential</CardTitle>
              <CardDescription>
                Issue a new verifiable credential using DIDKit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIssueCredential} className="space-y-4">
                <div>
                  <Label htmlFor="subjectDid">Subject DID</Label>
                  <Input
                    id="subjectDid"
                    value={issuanceForm.subjectDid}
                    onChange={(e) => setIssuanceForm({...issuanceForm, subjectDid: e.target.value})}
                    placeholder="did:ethr:0x..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="credentialType">Credential Type</Label>
                  <Select 
                    value={issuanceForm.credentialType} 
                    onValueChange={(value) => setIssuanceForm({...issuanceForm, credentialType: value})}
                  >
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
                    value={issuanceForm.credentialSubject}
                    onChange={(e) => setIssuanceForm({...issuanceForm, credentialSubject: e.target.value})}
                    placeholder='{"marks": "88%", "subject": "Class 12 Board Results"}'
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
                  <Input
                    id="expirationDate"
                    type="datetime-local"
                    value={issuanceForm.expirationDate}
                    onChange={(e) => setIssuanceForm({...issuanceForm, expirationDate: e.target.value})}
                  />
                </div>
                
                <Button type="submit" disabled={issuanceLoading}>
                  {issuanceLoading ? "Issuing..." : "Issue Credential"}
                </Button>
              </form>

              {issuanceError && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {issuanceError}
                </div>
              )}

              {issuedCredential && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Issued Credential</h3>
                  <div className="space-y-2">
                    <div><strong>Credential ID:</strong> {issuedCredential.credential.id}</div>
                    <div><strong>Type:</strong> {issuedCredential.credential.type.join(", ")}</div>
                    <div><strong>Subject:</strong> {issuedCredential.credential.credentialSubject.id}</div>
                    <div><strong>Issuer:</strong> {issuedCredential.credential.issuer.name}</div>
                  </div>
                  <div>
                    <strong>JWT:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                      {issuedCredential.jwt}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Credential Tab */}
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify Verifiable Credential</CardTitle>
              <CardDescription>
                Verify a verifiable credential JWT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyCredential} className="space-y-4">
                <div>
                  <Label htmlFor="verificationJwt">JWT Token</Label>
                  <Textarea
                    id="verificationJwt"
                    value={verificationJwt}
                    onChange={(e) => setVerificationJwt(e.target.value)}
                    placeholder="eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ..."
                    rows={6}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={verificationLoading}>
                  {verificationLoading ? "Verifying..." : "Verify Credential"}
                </Button>
              </form>

              {verificationError && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {verificationError}
                </div>
              )}

              {verificationResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Verification Result</h3>
                    <Badge className={getStatusColor(verificationResult.isValid)}>
                      {verificationResult.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                  
                  {verificationResult.credential && (
                    <div className="space-y-2">
                      <div><strong>Credential ID:</strong> {verificationResult.credential.id}</div>
                      <div><strong>Type:</strong> {verificationResult.credential.type.join(", ")}</div>
                      <div><strong>Subject:</strong> {verificationResult.credential.credentialSubject.id}</div>
                      <div><strong>Issuer:</strong> {verificationResult.credential.issuer.name}</div>
                      <div><strong>Issuance Date:</strong> {new Date(verificationResult.credential.issuanceDate).toLocaleString()}</div>
                      {verificationResult.credential.expirationDate && (
                        <div><strong>Expiration Date:</strong> {new Date(verificationResult.credential.expirationDate).toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  {verificationResult.errors.length > 0 && (
                    <div>
                      <strong className="text-red-600">Errors:</strong>
                      <ul className="list-disc list-inside text-red-600">
                        {verificationResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Credential Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Credential</CardTitle>
              <CardDescription>
                Import a credential from JSON format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImportCredential} className="space-y-4">
                <div>
                  <Label htmlFor="importJson">Credential JSON</Label>
                  <Textarea
                    id="importJson"
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='{"credential": {...}, "jwt": "..."}'
                    rows={8}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={importLoading}>
                  {importLoading ? "Importing..." : "Import Credential"}
                </Button>
              </form>

              {importError && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {importError}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Wallet Tab */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>My Credential Wallet</CardTitle>
              <CardDescription>
                Manage your stored verifiable credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storedCredentials.length === 0 ? (
                <p className="text-gray-500">No credentials stored in wallet</p>
              ) : (
                <div className="space-y-4">
                  {storedCredentials.map((credential) => (
                    <Card key={credential.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{credential.credential.type[1]}</h4>
                            <p className="text-sm text-gray-600">ID: {credential.credential.id}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleExportCredential(credential.id)}
                            >
                              Export
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRemoveCredential(credential.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div><strong>Subject:</strong> {credential.credential.credentialSubject.id}</div>
                          <div><strong>Issuer:</strong> {credential.credential.issuer.name}</div>
                          <div><strong>Issued:</strong> {new Date(credential.credential.issuanceDate).toLocaleDateString()}</div>
                          {credential.credential.expirationDate && (
                            <div><strong>Expires:</strong> {new Date(credential.credential.expirationDate).toLocaleDateString()}</div>
                          )}
                          <div><strong>Stored:</strong> {new Date(credential.storedAt).toLocaleDateString()}</div>
                        </div>

                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600">Show JWT</summary>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                            {credential.jwt}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 