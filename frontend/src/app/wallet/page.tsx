"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, 
  Shield, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle, 
  GraduationCap,
  DollarSign,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ssiWallet, type VerifiableCredential, initializeDemoCredentials } from "@/lib/ssi-wallet";

export default function WalletPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [selectedVC, setSelectedVC] = useState<VerifiableCredential | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVC, setNewVC] = useState({
    type: "",
    issuer: "",
    claims: "",
    expiryDate: ""
  });
  // Add form validation state
  const [formError, setFormError] = useState<string | null>(null);

  // Load credentials from SSI wallet on mount
  useEffect(() => {
    const loadCredentials = async () => {
      let currentCredentials = ssiWallet.getAllCredentials();
      
      // If no credentials exist, initialize demo credentials
      if (currentCredentials.length === 0) {
        await initializeDemoCredentials();
        currentCredentials = ssiWallet.getAllCredentials();
      }
      
      console.log('Loaded credentials:', currentCredentials.length, currentCredentials);
      setCredentials(currentCredentials);
    };
    
    loadCredentials();
  }, []);

  // Get wallet statistics
  const walletStats = {
    total: credentials.length,
    active: credentials.filter(vc => vc.status === 'active').length,
    expired: credentials.filter(vc => vc.status === 'expired').length,
    revoked: credentials.filter(vc => vc.status === 'revoked').length,
    educational: credentials.filter(vc => vc.type === 'EducationalCredential').length,
    income: credentials.filter(vc => vc.type === 'IncomeCredential').length,
    caste: credentials.filter(vc => vc.type === 'CasteCredential').length
  };

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

  const isFormValid = () => {
    if (!newVC.type || !newVC.issuer || !newVC.claims) return false;
    try {
      JSON.parse(newVC.claims);
    } catch {
      return false;
    }
    return true;
  };

  const handleAddVC = () => {
    setFormError(null);
    console.log('Add VC: Start', newVC);
    if (!newVC.type || !newVC.issuer || !newVC.claims) {
      setFormError("All fields are required.");
      console.error('Add VC: Missing fields', newVC);
      return;
    }
    try {
      const claimsObj = JSON.parse(newVC.claims || '{}');
      console.log('Add VC: Parsed claims', claimsObj);
      const vc: Omit<VerifiableCredential, 'id' | 'proof'> = {
        type: newVC.type,
        issuer: {
          id: `issuer:${newVC.issuer.toLowerCase().replace(/\s+/g, '-')}`,
          name: newVC.issuer
        },
        subject: {
          id: "student:stu2024001",
          name: "Student ID: STU2024001"
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: newVC.expiryDate,
        credentialSubject: claimsObj,
        status: 'active'
      };
      console.log('Add VC: Prepared VC', vc);
      ssiWallet.addCredential(vc).then(() => {
        console.log('Add VC: Credential added successfully');
        setCredentials(ssiWallet.getAllCredentials());
        setShowAddForm(false);
        setNewVC({ type: "", issuer: "", claims: "", expiryDate: "" });
        toast.success("Credential added successfully!");
      }).catch((error) => {
        console.error('Add VC: Error adding credential:', error);
        setFormError("Failed to add credential. Please check your input.");
        toast.error("Failed to add credential. Please check your input.");
      });
    } catch (err) {
      setFormError("Invalid JSON in claims field. Please check the format.");
      console.error('Add VC: Invalid JSON', err);
      toast.error("Invalid JSON in claims field. Please check the format.");
    }
  };

  const handleRevokeVC = (vcId: string) => {
    ssiWallet.revokeCredential(vcId);
    setCredentials(ssiWallet.getAllCredentials());
    toast.success("Credential revoked successfully");
  };

  const handleUseForScholarship = (vc: VerifiableCredential) => {
    localStorage.setItem('selectedCredential', JSON.stringify(vc));
    router.push('/scholarship');
    toast.success("Credential selected for scholarship application");
  };

  const handleExportWallet = () => {
    const walletData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      credentials: credentials,
      metadata: {
        totalCredentials: credentials.length,
        activeCredentials: walletStats.active
      }
    };
    
    const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssi-wallet-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Wallet exported successfully");
  };

  const handleImportWallet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const walletData = JSON.parse(e.target?.result as string);
        if (walletData.credentials) {
          // Import each credential individually
          for (const credential of walletData.credentials) {
            await ssiWallet.importCredential(JSON.stringify(credential));
          }
          setCredentials(ssiWallet.getAllCredentials());
          toast.success("Wallet imported successfully");
        }
      } catch {
        toast.error("Invalid wallet file");
      }
    };
    reader.readAsText(file);
  };

  // Add this function to fill the form with a valid example
  const fillExample = () => {
    setNewVC({
      type: "EducationalCredential",
      issuer: "CBSE Board",
      claims: '{"marks": "95", "subject": "Math"}',
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)
    });
    setFormError(null);
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
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{walletStats.total}</div>
                <div className="text-sm text-gray-600">Total Credentials</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{walletStats.active}</div>
                <div className="text-sm text-gray-600">Active Credentials</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{walletStats.educational}</div>
                <div className="text-sm text-gray-600">Educational VCs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{walletStats.income}</div>
                <div className="text-sm text-gray-600">Income VCs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Wallet Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
            <Button variant="outline" onClick={handleExportWallet}>
              <Download className="w-4 h-4 mr-2" />
              Export Wallet
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportWallet}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Wallet
                </span>
              </Button>
            </label>
            <Button variant="outline" onClick={() => router.push('/scholarship')}>
              <Award className="w-4 h-4 mr-2" />
              Apply for Scholarships
            </Button>
          </div>
        </CardContent>
      </Card>

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
                {formError && (
                  <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{formError}</div>
                )}
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
                  <Button onClick={handleAddVC} className="flex-1" disabled={!isFormValid()}>
                    Add Credential
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setShowAddForm(false); setFormError(null); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={fillExample}
                    className="flex-1"
                  >
                    Fill Example
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
                  <CardTitle className="text-lg">{vc.issuer.name}</CardTitle>
                  <CardDescription>
                    Issued: {new Date(vc.issuanceDate).toLocaleDateString()} | 
                    Expires: {vc.expirationDate ? new Date(vc.expirationDate).toLocaleDateString() : 'No expiry'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(vc.credentialSubject).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  {vc.status === 'active' && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseForScholarship(vc);
                        }}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Use for Scholarship
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
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
                        <span>{selectedVC.issuer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subject:</span>
                        <span>{selectedVC.subject.name}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Claims</h4>
                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedVC.credentialSubject, null, 2)}
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