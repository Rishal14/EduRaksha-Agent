"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  Shield, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Settings
} from "lucide-react";
import { ssiWallet, initializeDemoCredentials, type VerifiableCredential, type WalletInfo } from "@/lib/ssi-wallet";

export default function SSIWalletPage() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    setIsLoading(true);
    try {
      // Initialize demo credentials if wallet is empty
      const allCredentials = ssiWallet.getAllCredentials();
      if (allCredentials.length === 0) {
        await initializeDemoCredentials();
      }
      
      setWalletInfo(ssiWallet.getWalletInfo());
      setCredentials(ssiWallet.getAllCredentials());
    } catch (error) {
      console.error('Error initializing wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = ssiWallet.searchCredentials(query);
      setCredentials(results);
    } else {
      setCredentials(ssiWallet.getAllCredentials());
    }
  };

  const handleRevokeCredential = (id: string) => {
    if (ssiWallet.revokeCredential(id)) {
      setCredentials(ssiWallet.getAllCredentials());
      setWalletInfo(ssiWallet.getWalletInfo());
    }
  };

  const handleExportCredential = (id: string) => {
    const exported = ssiWallet.exportCredential(id);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportWallet = () => {
    const backup = ssiWallet.exportBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'revoked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SSI Wallet
          </h1>
          <p className="text-gray-600">
            Manage your Self-Sovereign Identity credentials securely
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wallet Info */}
          <div className="space-y-6">
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletInfo && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Wallet Address</Label>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 p-2 rounded flex-1">
                          {walletInfo.address}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(walletInfo.address)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{walletInfo.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Credentials:</span>
                        <p className="font-medium">{walletInfo.credentialCount}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Security:</span>
                        <Badge variant="outline" className="capitalize">
                          {walletInfo.securityLevel}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className="flex items-center space-x-1">
                          {ssiWallet.isWalletSecure() ? (
                            <Shield className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {ssiWallet.isWalletSecure() ? 'Secure' : 'Needs Attention'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Security Recommendations */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-2">Security Recommendations</h4>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {ssiWallet.getSecurityRecommendations().map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Wallet Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportWallet}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Wallet Backup
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credential
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Wallet Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Credentials */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Credentials</CardTitle>
                    <CardDescription>
                      Manage your verifiable credentials
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search credentials..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger isActive={activeTab === "all"} onClick={() => setActiveTab("all")}>All ({credentials.length})</TabsTrigger>
                    <TabsTrigger isActive={activeTab === "active"} onClick={() => setActiveTab("active")}>Active ({credentials.filter(c => c.status === 'active').length})</TabsTrigger>
                    <TabsTrigger isActive={activeTab === "revoked"} onClick={() => setActiveTab("revoked")}>Revoked ({credentials.filter(c => c.status === 'revoked').length})</TabsTrigger>
                    <TabsTrigger isActive={activeTab === "expired"} onClick={() => setActiveTab("expired")}>Expired ({credentials.filter(c => c.status === 'expired').length})</TabsTrigger>
                  </TabsList>

                  {activeTab === "all" && (
                    <TabsContent className="space-y-4 mt-6">
                      {credentials.filter(c => !["IncomeCertificate", "CasteCertificate"].includes(c.type)).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No credentials found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {credentials
                            .filter(c => !["IncomeCertificate", "CasteCertificate"].includes(c.type))
                            .map((credential) => (
                              <CredentialCard
                                key={credential.id}
                                credential={credential}
                                onView={() => setSelectedCredential(credential)}
                                onRevoke={() => handleRevokeCredential(credential.id)}
                                onExport={() => handleExportCredential(credential.id)}
                              />
                            ))}
                        </div>
                      )}
                    </TabsContent>
                  )}
                  {activeTab === "active" && (
                    <TabsContent className="space-y-4 mt-6">
                      {credentials.filter(c => c.status === 'active' && !["IncomeCertificate", "CasteCertificate"].includes(c.type)).map((credential) => (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          onView={() => setSelectedCredential(credential)}
                          onRevoke={() => handleRevokeCredential(credential.id)}
                          onExport={() => handleExportCredential(credential.id)}
                        />
                      ))}
                    </TabsContent>
                  )}
                  {activeTab === "revoked" && (
                    <TabsContent className="space-y-4 mt-6">
                      {credentials.filter(c => c.status === 'revoked' && !["IncomeCertificate", "CasteCertificate"].includes(c.type)).map((credential) => (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          onView={() => setSelectedCredential(credential)}
                          onRevoke={() => handleRevokeCredential(credential.id)}
                          onExport={() => handleExportCredential(credential.id)}
                        />
                      ))}
                    </TabsContent>
                  )}
                  {activeTab === "expired" && (
                    <TabsContent className="space-y-4 mt-6">
                      {credentials.filter(c => c.status === 'expired' && !["IncomeCertificate", "CasteCertificate"].includes(c.type)).map((credential) => (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          onView={() => setSelectedCredential(credential)}
                          onRevoke={() => handleRevokeCredential(credential.id)}
                          onExport={() => handleExportCredential(credential.id)}
                        />
                      ))}
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credential Detail Modal */}
        {selectedCredential && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Credential Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCredential(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium">{selectedCredential.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedCredential.status)}
                      {getStatusBadge(selectedCredential.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Issuer:</span>
                    <p className="font-medium">{selectedCredential.issuer.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Issued:</span>
                    <p className="font-medium">
                      {new Date(selectedCredential.issuanceDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Credential Data:</span>
                  <div className="bg-gray-50 p-3 rounded mt-1">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedCredential.credentialSubject, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExportCredential(selectedCredential.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(selectedCredential, null, 2))}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  {selectedCredential.status === 'active' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRevokeCredential(selectedCredential.id);
                        setSelectedCredential(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CredentialCardProps {
  credential: VerifiableCredential;
  onView: () => void;
  onRevoke: () => void;
  onExport: () => void;
}

function CredentialCard({ credential, onView, onRevoke, onExport }: CredentialCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'revoked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(credential.status)}
              <h3 className="font-medium">{credential.type}</h3>
              {getStatusBadge(credential.status)}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Issuer:</span> {credential.issuer.name}</p>
              <p><span className="font-medium">Subject:</span> {credential.subject.name}</p>
              <p><span className="font-medium">Issued:</span> {new Date(credential.issuanceDate).toLocaleDateString()}</p>
              {credential.expirationDate && (
                <p><span className="font-medium">Expires:</span> {new Date(credential.expirationDate).toLocaleDateString()}</p>
              )}
            </div>

            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Credential Data:</div>
              <div className="bg-gray-50 p-2 rounded text-xs">
                {Object.entries(credential.credentialSubject).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
                {Object.keys(credential.credentialSubject).length > 3 && (
                  <div className="text-gray-400">... and {Object.keys(credential.credentialSubject).length - 3} more</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
            {credential.status === 'active' && (
              <Button variant="outline" size="sm" onClick={onRevoke}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 