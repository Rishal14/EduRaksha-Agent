"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { AgentChat } from "@/components/AgentChat";
import { ssiWallet, type VerifiableCredential } from "@/lib/ssi-wallet";
import { Wallet, FileText, RotateCcw, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Claim {
  income: number;
  caste: string;
  marks: number;
}

interface Scholarship {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [claims, setClaims] = useState<Claim | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRevoked, setShowRevoked] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load credentials from SSI wallet
    const creds = ssiWallet.getAllCredentials();
    setCredentials(creds);

    // Load other dashboard data
    fetch("/api/dashboard-data")
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims);
        setScholarships(data.scholarships);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      });
  };

  const revokeCredential = async (credential: VerifiableCredential) => {
    if (credential.status === 'revoked') {
      toast.error("Credential is already revoked");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke this ${credential.type} credential? This action cannot be undone and the credential will no longer be usable for scholarship applications.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const success = ssiWallet.revokeCredential(credential.id);
      if (success) {
        toast.success("Credential revoked successfully");
        loadDashboardData(); // Refresh the dashboard data
      } else {
        toast.error("Failed to revoke credential");
      }
    } catch (error) {
      console.error("Error revoking credential:", error);
      toast.error("Failed to revoke credential");
    }
  };

  const restoreCredential = async (credential: VerifiableCredential) => {
    if (credential.status === 'active') {
      toast.error("Credential is already active");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to restore this ${credential.type} credential? It will be available for scholarship applications again.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const success = ssiWallet.updateCredentialStatus(credential.id, 'active');
      if (success) {
        toast.success("Credential restored successfully");
        loadDashboardData(); // Refresh the dashboard data
      } else {
        toast.error("Failed to restore credential");
      }
    } catch (error) {
      console.error("Error restoring credential:", error);
      toast.error("Failed to restore credential");
    }
  };

  const getCredentialDisplayValue = (credential: VerifiableCredential) => {
    switch (credential.type) {
      case "IncomeCertificate":
        const income = credential.credentialSubject.annualIncome;
        const name = credential.credentialSubject.applicantName;
        return income ? `₹${income.toLocaleString()} - ${name || 'N/A'}` : 'N/A';
      case "CasteCertificate":
        return credential.credentialSubject.caste as string;
      case "AcademicCertificate":
        return `${credential.credentialSubject.cgpa} CGPA`;
      case "DisabilityCertificate":
        return credential.credentialSubject.disabilityType as string;
      case "DomicileCertificate":
        return credential.credentialSubject.domicileState as string;
      default:
        return "N/A";
    }
  };

  const getCredentialIcon = (credential: VerifiableCredential) => {
    if (credential.status === 'revoked') {
      return <X className="h-4 w-4 text-red-500" />;
    }
    return credential.isSelfIssued ? <CheckCircle className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4 text-blue-500" />;
  };

  const activeCredentials = credentials.filter(cred => cred.status === 'active');
  const revokedCredentials = credentials.filter(cred => cred.status === 'revoked');

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your verifiable credentials and view scholarship eligibility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Credentials Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Your Credentials</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={showRevoked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRevoked(!showRevoked)}
                    className="text-xs"
                  >
                    {showRevoked ? "Hide Revoked" : "Show Revoked"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDashboardData}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Manage your verifiable credentials for scholarship applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-8 h-8" />
                    </div>
                  </div>
                  <p>No credentials yet</p>
                  <p className="text-sm">Upload certificates in your SSI Wallet to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active Credentials */}
                  {activeCredentials.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Active Credentials ({activeCredentials.length})</h4>
                      <div className="space-y-3">
                        {activeCredentials.map((credential) => (
                          <div
                            key={credential.id}
                            className="p-4 border border-green-200 rounded-lg bg-green-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getCredentialIcon(credential)}
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {credential.type.replace('Certificate', '')}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {getCredentialDisplayValue(credential)}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {credential.isSelfIssued ? 'Self-Issued' : 'From Certificate'}
                                    </Badge>
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      Active
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => revokeCredential(credential)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Revoke
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revoked Credentials */}
                  {showRevoked && revokedCredentials.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Revoked Credentials ({revokedCredentials.length})</h4>
                      <div className="space-y-3">
                        {revokedCredentials.map((credential) => (
                          <div
                            key={credential.id}
                            className="p-4 border border-red-200 rounded-lg bg-red-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getCredentialIcon(credential)}
                                <div>
                                  <h5 className="font-medium text-gray-500 line-through">
                                    {credential.type.replace('Certificate', '')}
                                  </h5>
                                  <p className="text-sm text-gray-500 line-through">
                                    {getCredentialDisplayValue(credential)}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {credential.isSelfIssued ? 'Self-Issued' : 'From Certificate'}
                                    </Badge>
                                    <Badge variant="destructive" className="text-xs">
                                      Revoked
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreCredential(credential)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showRevoked && revokedCredentials.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No revoked credentials</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary and AI Chat */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Credentials Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Credentials</span>
                  <Badge variant="outline">{credentials.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {activeCredentials.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revoked</span>
                  <Badge variant="destructive">
                    {revokedCredentials.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Self-Issued</span>
                  <Badge variant="outline">
                    {credentials.filter(c => c.isSelfIssued).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legacy Claims Display */}
          {claims && (
            <Card>
              <CardHeader>
                <CardTitle>Legacy Verified Claims</CardTitle>
                <CardDescription>Previously verified credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Badge variant="default">Income: {claims?.income}</Badge>
                  <Badge variant="default">Caste: {claims?.caste}</Badge>
                  <Badge variant="default">Marks: {claims?.marks}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eligible Scholarships */}
          {scholarships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eligible Scholarships</CardTitle>
                <CardDescription>Based on your active credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scholarships.map(s => (
                    <li key={s.id} className="text-sm text-gray-600">{s.name}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Get help with your credentials and applications</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentChat claims={claims} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 