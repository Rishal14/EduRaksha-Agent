"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  UserCheck, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Users,
  Shield
} from "lucide-react";
import { authorityService, type AuthorityInfo, type IssuanceRequest, type IssuedCredential, type IssuanceStats } from "@/lib/authority-service";

export default function AuthorityPage() {
  const [authorities, setAuthorities] = useState<AuthorityInfo[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<string>("");
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [stats, setStats] = useState<IssuanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    studentAddress: "",
    studentName: "",
    credentialType: "",
    expirationDate: "",
    credentialData: ""
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Initialize demo data
      await authorityService.initializeDemoCredentials();
      
      setAuthorities(authorityService.getAllAuthorities());
      setIssuedCredentials(authorityService.getAllIssuedCredentials());
      setStats(authorityService.getIssuanceStats());
      
      if (authorityService.getAllAuthorities().length > 0) {
        setSelectedAuthority(authorityService.getAllAuthorities()[0].id);
      }
    } catch (error) {
      console.error('Error initializing authority data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    if (!selectedAuthority || !formData.studentAddress || !formData.studentName || !formData.credentialType) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Parse credential data
      let credentialData: Record<string, string | number> = {};
      try {
        credentialData = JSON.parse(formData.credentialData);
      } catch {
        // If not valid JSON, create a simple key-value pair
        credentialData = { value: formData.credentialData };
      }

      const request: IssuanceRequest = {
        studentAddress: formData.studentAddress,
        studentName: formData.studentName,
        credentialType: formData.credentialType,
        credentialData,
        expirationDate: formData.expirationDate || undefined
      };

      const issuedCredential = await authorityService.issueCredential(selectedAuthority, request);
      
      // Update state
      setIssuedCredentials(authorityService.getAllIssuedCredentials());
      setStats(authorityService.getIssuanceStats());
      
      // Reset form
      setFormData({
        studentAddress: "",
        studentName: "",
        credentialType: "",
        expirationDate: "",
        credentialData: ""
      });
      setShowIssueForm(false);
      
      alert("Credential issued successfully!");
    } catch (error) {
      console.error('Error issuing credential:', error);
      alert(`Error issuing credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = authorityService.searchCredentials(query);
      setIssuedCredentials(results);
    } else {
      setIssuedCredentials(authorityService.getAllIssuedCredentials());
    }
  };

  const handleExportCredential = (credentialId: string) => {
    const exported = authorityService.exportCredential(credentialId);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${credentialId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="default" className="bg-green-100 text-green-800">Issued</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authority Portal
          </h1>
          <p className="text-gray-600">
            Issue and manage verifiable credentials for students
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Authority Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Authority</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAuthority} onValueChange={setSelectedAuthority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorities.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{authority.name}</span>
                          <span className="text-sm text-gray-500">{authority.ensDomain}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Total Issued:</span>
                      <p className="font-medium text-green-600">{stats.totalIssued}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">This Month:</span>
                      <p className="font-medium">{stats.thisMonth}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Pending:</span>
                      <p className="font-medium text-yellow-600">{stats.totalPending}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rejected:</span>
                      <p className="font-medium text-red-600">{stats.totalRejected}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => setShowIssueForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Issue Credential
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4" />
                  Batch Import
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Issued Credentials</CardTitle>
                    <CardDescription>
                      Manage and track all issued verifiable credentials
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All ({issuedCredentials.length})</TabsTrigger>
                    <TabsTrigger value="issued">
                      Issued ({issuedCredentials.filter(c => c.status === 'issued').length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({issuedCredentials.filter(c => c.status === 'pending').length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({issuedCredentials.filter(c => c.status === 'rejected').length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-6">
                    {issuedCredentials.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No credentials issued yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {issuedCredentials.map((credential) => (
                          <CredentialCard
                            key={credential.id}
                            credential={credential}
                            onExport={() => handleExportCredential(credential.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="issued" className="space-y-4 mt-6">
                    {issuedCredentials.filter(c => c.status === 'issued').map((credential) => (
                      <CredentialCard
                        key={credential.id}
                        credential={credential}
                        onExport={() => handleExportCredential(credential.id)}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4 mt-6">
                    {issuedCredentials.filter(c => c.status === 'pending').map((credential) => (
                      <CredentialCard
                        key={credential.id}
                        credential={credential}
                        onExport={() => handleExportCredential(credential.id)}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="rejected" className="space-y-4 mt-6">
                    {issuedCredentials.filter(c => c.status === 'rejected').map((credential) => (
                      <CredentialCard
                        key={credential.id}
                        credential={credential}
                        onExport={() => handleExportCredential(credential.id)}
                      />
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Issue Credential Modal */}
        {showIssueForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Issue New Credential</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIssueForm(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student-address">Student Address</Label>
                    <Input
                      id="student-address"
                      placeholder="0x..."
                      value={formData.studentAddress}
                      onChange={(e) => setFormData({...formData, studentAddress: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input
                      id="student-name"
                      placeholder="Student Name"
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credential-type">Credential Type</Label>
                    <Select value={formData.credentialType} onValueChange={(value) => setFormData({...formData, credentialType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CasteCertificate">Caste Certificate</SelectItem>
                        <SelectItem value="IncomeCertificate">Income Certificate</SelectItem>
                        <SelectItem value="AcademicCertificate">Academic Certificate</SelectItem>
                        <SelectItem value="DisabilityCertificate">Disability Certificate</SelectItem>
                        <SelectItem value="RegionCertificate">Region Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expiration-date">Expiration Date</Label>
                    <Input
                      id="expiration-date"
                      type="datetime-local"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="credential-data">Credential Data (JSON)</Label>
                  <Textarea
                    id="credential-data"
                    placeholder='{"caste": "SC", "district": "Bangalore"}'
                    value={formData.credentialData}
                    onChange={(e) => setFormData({...formData, credentialData: e.target.value})}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleIssueCredential} className="flex-1">
                    Issue Credential
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowIssueForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
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
  credential: IssuedCredential;
  onExport: () => void;
}

function CredentialCard({ credential, onExport }: CredentialCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="default" className="bg-green-100 text-green-800">Issued</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
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
              <h3 className="font-medium">{credential.request.credentialType}</h3>
              {getStatusBadge(credential.status)}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Student:</span> {credential.request.studentName}</p>
              <p><span className="font-medium">Address:</span> {credential.request.studentAddress.slice(0, 6)}...{credential.request.studentAddress.slice(-4)}</p>
              <p><span className="font-medium">Issued:</span> {new Date(credential.issuanceDate).toLocaleDateString()}</p>
              {credential.request.expirationDate && (
                <p><span className="font-medium">Expires:</span> {new Date(credential.request.expirationDate).toLocaleDateString()}</p>
              )}
            </div>

            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Credential Data:</div>
              <div className="bg-gray-50 p-2 rounded text-xs">
                {Object.entries(credential.request.credentialData).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
                {Object.keys(credential.request.credentialData).length > 3 && (
                  <div className="text-gray-400">... and {Object.keys(credential.request.credentialData).length - 3} more</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 