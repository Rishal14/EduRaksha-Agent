"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { certificateProcessor, type ProcessingResult } from "@/lib/certificate-processor";
import { Upload, File, Image, FileText as FileTextIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const certificateTypes = [
  { value: "IncomeCertificate", label: "Income Certificate" },
  { value: "CasteCertificate", label: "Caste Certificate" },
  { value: "AcademicCertificate", label: "Academic Certificate" },
  { value: "DisabilityCertificate", label: "Disability Certificate" },
  { value: "DomicileCertificate", label: "Domicile Certificate" },
];

export default function OCRTestPage() {
  const [selectedType, setSelectedType] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedType) {
      toast.error("Please select a certificate type first");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const processingResult = await certificateProcessor.processCertificate(file, selectedType);
      setResult(processingResult);
      
      if (processingResult.success) {
        toast.success(`OCR completed! Confidence: ${(processingResult.data!.confidence * 100).toFixed(1)}%`);
      } else {
        toast.error(processingResult.error || "Processing failed");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file");
    } finally {
      setIsProcessing(false);
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
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OCR Test Page
          </h1>
          <p className="text-gray-600">
            Test real OCR extraction from uploaded certificates
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Certificate for OCR</span>
            </CardTitle>
            <CardDescription>
              Upload a certificate file to test real OCR text extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificate-type">Certificate Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
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
                <Label htmlFor="certificate-file">Certificate File</Label>
                <div className="mt-2">
                  <Input
                    id="certificate-file"
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={!selectedType || isProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, JPG, JPEG, PNG (max 10MB)
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing certificate with OCR...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Processing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <Badge variant={result.success ? "secondary" : "destructive"} className="ml-2">
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  {result.success && result.data && (
                    <>
                      <div>
                        <span className="font-medium text-gray-600">Confidence:</span>
                        <span className="ml-2">{(result.data.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Processing Time:</span>
                        <span className="ml-2">{result.data.processingTime}ms</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">File:</span>
                        <div className="flex items-center space-x-2 ml-2">
                          {getFileIcon(result.data.originalFile.name)}
                          <span className="text-xs">{result.data.originalFile.name}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Raw Extracted Text */}
            {result.success && result.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Raw Extracted Text</CardTitle>
                  <CardDescription>
                    Text extracted from the certificate using OCR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {result.data.rawText}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Structured Data */}
            {result.success && result.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Structured Data</CardTitle>
                  <CardDescription>
                    Data extracted and structured based on certificate type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <pre className="text-sm text-green-800 whitespace-pre-wrap">
                      {JSON.stringify(result.data.extractedFields, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {!result.success && (
              <Card>
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800">{result.error}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Select a certificate type from the dropdown</p>
              <p>2. Upload a certificate file (PDF or image)</p>
              <p>3. Wait for OCR processing to complete</p>
              <p>4. Review the extracted text and structured data</p>
              <p>5. Check the confidence score for accuracy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 