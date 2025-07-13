"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ssiWallet, type VerifiableCredential, type WalletInfo } from "@/lib/ssi-wallet";
import { certificateProcessor, type ProcessingResult } from "@/lib/certificate-processor";
import { Wallet, FileText, Copy, Download, Upload, File, Image, FileText as FileTextIcon, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CertificateUpload {
  type: string;
  file: File;
  studentName: string;
  extractedData?: Record<string, string | number>;
  rawText?: string;
}

const certificateTypes = [
  { value: "IncomeCertificate", label: "Income Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "CasteCertificate", label: "Caste Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "AcademicCertificate", label: "Academic Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "DisabilityCertificate", label: "Disability Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "DomicileCertificate", label: "Domicile Certificate", accept: ".pdf,.jpg,.jpeg,.png" },
];

export default function SSIWalletPage() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [uploadData, setUploadData] = useState<CertificateUpload | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, string | number> | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [showRevoked, setShowRevoked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    type: "",
    studentName: "",
  });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = () => {
    const info = ssiWallet.getWalletInfo();
    const creds = ssiWallet.getAllCredentials(); // Get all credentials, not just self-issued
    console.log("Loading wallet data:", { info, credentialsCount: creds.length, credentials: creds });
    setWalletInfo(info);
    setCredentials(creds);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!formData.type || !formData.studentName) {
      toast.error("Please select certificate type and enter student name first");
      return;
    }

    setIsProcessing(true);

    try {
      // Process certificate using the certificate processor
      const result: ProcessingResult = await certificateProcessor.processCertificate(file, formData.type);
      
      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to process certificate");
        return;
      }

      setExtractedData(result.data.extractedFields);
      setRawText(result.data.rawText);
      setConfidence(result.data.confidence);
      
      setUploadData({
        type: formData.type,
        file,
        studentName: formData.studentName,
        extractedData: result.data.extractedFields,
        rawText: result.data.rawText
      });

      toast.success(`Certificate processed successfully! Confidence: ${(result.data.confidence * 100).toFixed(1)}%`);
    } catch (error) {
      console.error("Error processing certificate:", error);
      toast.error("Failed to process certificate");
    } finally {
      setIsProcessing(false);
    }
  };



  const handleCreateCredential = async () => {
    if (!uploadData || !extractedData) {
      toast.error("Please upload and process a certificate first");
      return;
    }

    setIsProcessing(true);

    try {
      // Generate comprehensive VC with all extracted data
      const comprehensiveVC = certificateProcessor.generateVerifiableCredential(
        extractedData,
        uploadData.type,
        uploadData.studentName,
        uploadData.file,
        confidence || 0.85
      );

      // Store the comprehensive VC in the wallet using the comprehensive method
      const credentialId = await ssiWallet.addComprehensiveCredential(comprehensiveVC);
      console.log("Credential created with ID:", credentialId);

      toast.success("Comprehensive credential created successfully from certificate!");
      loadWalletData();
      setShowUploadForm(false);
      setUploadData(null);
      setExtractedData(null);
      setRawText(null);
      setFormData({ type: "", studentName: "" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error creating credential:", error);
      toast.error("Failed to create credential");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadCredential = (credential: VerifiableCredential) => {
    const credentialJson = ssiWallet.exportCredential(credential.id);
    if (credentialJson) {
      const blob = new Blob([credentialJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${credential.type}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Credential downloaded!");
    }
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
        loadWalletData(); // Refresh the wallet data
        setSelectedCredential(null); // Clear selection
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
        loadWalletData(); // Refresh the wallet data
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileTextIcon className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SSI Wallet
          </h1>
          <p className="text-gray-600">
            Upload certificates and convert them into verifiable credentials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Wallet Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletInfo && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm font-mono text-gray-900 break-all">
                        {walletInfo.address}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      <p className="text-sm text-gray-900">{walletInfo.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Credentials</Label>
                      <p className="text-sm text-gray-900">{walletInfo.credentialCount} from certificates</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Security Level</Label>
                      <Badge variant="outline" className="capitalize">
                        {walletInfo.securityLevel}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Certificate */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Certificate</span>
                </CardTitle>
                <CardDescription>
                  Upload your certificates to convert them into verifiable credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="w-full"
                  variant={showUploadForm ? "outline" : "default"}
                >
                  {showUploadForm ? "Cancel" : "Upload Certificate"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Credentials List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
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
                      onClick={loadWalletData}
                      className="text-xs"
                    >
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Verifiable credentials created from your uploaded certificates
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
                    <p className="text-sm">Upload your first certificate to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {credentials
                      .filter(credential => showRevoked || credential.status === 'active')
                      .map((credential) => (
                      <div
                        key={credential.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCredential?.id === credential.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCredential(credential)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium ${credential.status === 'revoked' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {credential.type.replace('Certificate', '')}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              From Certificate
                            </Badge>
                            {credential.status === 'revoked' && (
                              <Badge variant="destructive" className="text-xs">
                                Revoked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={credential.status === 'active' ? 'secondary' : 'destructive'}>
                              {credential.status}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {getCredentialDisplayValue(credential)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Issued: {new Date(credential.issuanceDate).toLocaleDateString()}</span>
                          <span>By: {credential.issuer.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Credential Details */}
            {selectedCredential && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Credential Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <p className="text-gray-900">{selectedCredential.type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <Badge variant={selectedCredential.status === 'active' ? 'secondary' : 'destructive'}>
                          {selectedCredential.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Issuer:</span>
                        <p className="text-gray-900">{selectedCredential.issuer.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Issued:</span>
                        <p className="text-gray-900">
                          {new Date(selectedCredential.issuanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600 text-sm">Extracted Data:</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(selectedCredential.credentialSubject, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(selectedCredential, null, 2))}
                        className="flex-1"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadCredential(selectedCredential)}
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      {selectedCredential.status === 'active' ? (
                        <Button
                          variant="destructive"
                          onClick={() => revokeCredential(selectedCredential)}
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Revoke Credential
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => restoreCredential(selectedCredential)}
                          className="flex-1"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore Credential
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Upload Certificate Form */}
        {showUploadForm && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Upload Certificate</CardTitle>
                              <CardDescription>
                  Upload your certificate file and we&apos;ll extract the data to create a verifiable credential
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="certificate-type">Certificate Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input
                      id="student-name"
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certificate-file">Certificate File</Label>
                    <div className="mt-2">
                      <Input
                        id="certificate-file"
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={!formData.type || !formData.studentName || isProcessing}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, JPG, JPEG, PNG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {uploadData && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">Uploaded File</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {getFileIcon(uploadData.file.name)}
                        <span>{uploadData.file.name}</span>
                        <span className="text-xs">({(uploadData.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  )}

                  {rawText && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-2">Raw Extracted Text</h4>
                      <div className="text-sm text-blue-800">
                        <pre className="text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {rawText}
                        </pre>
                      </div>
                    </div>
                  )}

                  {extractedData && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-medium text-green-900 mb-2">Structured Data</h4>
                      <div className="text-sm text-green-800">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(extractedData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleCreateCredential}
                      disabled={!uploadData || !extractedData || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Processing..." : "Create Credential from Certificate"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 