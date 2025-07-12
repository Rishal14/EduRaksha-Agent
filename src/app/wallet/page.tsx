"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VerifiableCredential {
  id: string;
  type: string;
  issuer: string;
  subject: string;
  issuedDate: string;
  expiryDate: string;
  claims: Record<string, any>;
  signature: string;
  status: 'active' | 'expired' | 'revoked';
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

const sampleVCs: VerifiableCredential[] = [
  {
    id: "vc:marks:2024:001",
    type: "EducationalCredential",
    issuer: "CBSE Board",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-06-15",
    expiryDate: "2025-06-15",
    claims: {
      "marks": "88%",
      "subject": "Class 12 Board Results",
      "year": "2024",
      "board": "CBSE"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-06-15T10:30:00Z",
      verificationMethod: "did:cbse:board#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:income:2024:001",
    type: "IncomeCredential",
    issuer: "Income Tax Department",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-05-20",
    expiryDate: "2025-05-20",
    claims: {
      "annualIncome": "₹80,000",
      "familySize": "4",
      "incomeCategory": "Low Income"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-05-20T14:15:00Z",
      verificationMethod: "did:incometax:gov#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  {
    id: "vc:caste:2024:001",
    type: "CasteCredential",
    issuer: "State Government",
    subject: "Student ID: STU2024001",
    issuedDate: "2024-04-10",
    expiryDate: "2025-04-10",
    claims: {
      "caste": "SC",
      "category": "Scheduled Caste",
      "certificateNumber": "SC2024001"
    },
    signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    status: 'active',
    proof: {
      type: "Ed25519Signature2020",
      created: "2024-04-10T09:45:00Z",
      verificationMethod: "did:state:gov#key-1",
      proofPurpose: "assertionMethod",
      jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
];

export default function WalletPage() {
  const [credentials, setCredentials] = useState<VerifiableCredential[]>(sampleVCs);
  const [selectedVC, setSelectedVC] = useState<VerifiableCredential | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVC, setNewVC] = useState({
    type: "",
    issuer: "",
    claims: "",
    expiryDate: ""
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EducationalCredential': return 'bg-blue-100 text-blue-800';
      case 'IncomeCredential': return 'bg-green-100 text-green-800';
      case 'CasteCredential': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddVC = () => {
    const vc: VerifiableCredential = {
      id: `vc:${newVC.type.toLowerCase()}:${Date.now()}`,
      type: newVC.type,
      issuer: newVC.issuer,
      subject: "Student ID: STU2024001",
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: newVC.expiryDate,
      claims: JSON.parse(newVC.claims),
      signature: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      status: 'active',
      proof: {
        type: "Ed25519Signature2020",
        created: new Date().toISOString(),
        verificationMethod: `did:${newVC.issuer.toLowerCase()}:gov#key-1`,
        proofPurpose: "assertionMethod",
        jws: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    };

    setCredentials([...credentials, vc]);
    setShowAddForm(false);
    setNewVC({ type: "", issuer: "", claims: "", expiryDate: "" });
  };

  const handleRevokeVC = (vcId: string) => {
    setCredentials(credentials.map(vc => 
      vc.id === vcId ? { ...vc, status: 'revoked' as const } : vc
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          SSI Wallet
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your Self-Sovereign Identity Wallet. Store and manage Verifiable Credentials 
          issued by trusted authorities. You control your data and privacy.
        </p>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{credentials.length}</div>
              <div className="text-sm text-gray-600">Total Credentials</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {credentials.filter(vc => vc.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Credentials</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {credentials.filter(vc => vc.type === 'EducationalCredential').length}
              </div>
              <div className="text-sm text-gray-600">Educational VCs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {credentials.filter(vc => vc.status === 'expired').length}
              </div>
              <div className="text-sm text-gray-600">Expired Credentials</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Credentials List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Verifiable Credentials
            </h2>
            <Button onClick={() => setShowAddForm(true)}>
              Add New VC
            </Button>
          </div>

          {/* Add VC Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Verifiable Credential</CardTitle>
                <CardDescription>
                  Add a new credential to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Credential Type</label>
                    <Select value={newVC.type} onValueChange={(value) => setNewVC({...newVC, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credential type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EducationalCredential">Educational Credential</SelectItem>
                        <SelectItem value="IncomeCredential">Income Credential</SelectItem>
                        <SelectItem value="CasteCredential">Caste Credential</SelectItem>
                        <SelectItem value="DisabilityCredential">Disability Credential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Issuing Authority</label>
                    <Input
                      value={newVC.issuer}
                      onChange={(e) => setNewVC({...newVC, issuer: e.target.value})}
                      placeholder="e.g., CBSE Board"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Claims (JSON)</label>
                  <Textarea
                    value={newVC.claims}
                    onChange={(e) => setNewVC({...newVC, claims: e.target.value})}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                  <Input
                    type="date"
                    value={newVC.expiryDate}
                    onChange={(e) => setNewVC({...newVC, expiryDate: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleAddVC} className="flex-1">
                    Add Credential
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credentials Grid */}
          <div className="space-y-4">
            {credentials.map((vc) => (
              <Card 
                key={vc.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedVC?.id === vc.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedVC(vc)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTypeColor(vc.type)}>
                        {vc.type.replace('Credential', '')}
                      </Badge>
                      <Badge className={getStatusColor(vc.status)}>
                        {vc.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {vc.id}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{vc.issuer}</CardTitle>
                  <CardDescription>
                    Issued: {new Date(vc.issuedDate).toLocaleDateString()} | 
                    Expires: {new Date(vc.expiryDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(vc.claims).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {vc.status === 'active' && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevokeVC(vc.id);
                        }}
                      >
                        Revoke Credential
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Credential Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credential Details</CardTitle>
              <CardDescription>
                {selectedVC ? "View detailed information about the selected credential" : "Select a credential to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedVC ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{selectedVC.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span>{selectedVC.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issuer:</span>
                        <span>{selectedVC.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span>{selectedVC.subject}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Claims</h4>
                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedVC.claims, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Proof</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span>{selectedVC.proof.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{new Date(selectedVC.proof.created).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span>{selectedVC.proof.proofPurpose}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full mb-2">
                      Generate ZKP from this VC
                    </Button>
                    <Button variant="outline" className="w-full">
                      Export Credential
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p>Select a credential to view detailed information</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Security */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Encryption Status</span>
                  <Badge className="bg-green-100 text-green-800">Encrypted</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backup Status</span>
                  <Badge className="bg-green-100 text-green-800">Backed Up</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Sync</span>
                  <span className="text-sm">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 