"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { certificateProcessor } from '@/lib/certificate-processor';

export default function IncomeTestPage() {
  const [sampleText, setSampleText] = useState(`INCOME CERTIFICATE

Name: John Doe
Father's Name: Robert Doe
Address: 123 Main Street, Mumbai, Maharashtra
District: Mumbai
State: Maharashtra
Pin Code: 400001

Annual Income: ₹5,00,000
Financial Year: 2023-24
Issued By: Tahsildar Office
Certificate Number: INC/2024/001
Issue Date: 15/01/2024

Occupation: Student
Purpose: Scholarship Application`);

  const [extractedData, setExtractedData] = useState<Record<string, string | number> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testResults, setTestResults] = useState<Array<{testCase: string, result: number | string}>>([]);

  const handleTestExtraction = () => {
    setIsProcessing(true);
    try {
      const result = certificateProcessor.testIncomeExtraction(sampleText);
      setExtractedData(result);
      console.log("Extraction result:", result);
    } catch (error) {
      console.error("Extraction error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestMultipleFormats = () => {
    setIsProcessing(true);
    try {
      const testCases = [
        "Annual Income: ₹250,000",
        "Income: 85000",
        "Total Income: 1,50,000",
        "Salary: ₹50000",
        "Annual Income is 75000",
        "Income amount: 125000",
        "Rs. 95000",
        "₹1,25,000",
        "250000 rupees",
        "Income 65000",
        "Annual Income: 85000",
        "Total family income: ₹2,50,000",
        "Monthly income: 15000",
        "Income: 1,00,000 only",
        "Annual Income: 75000 INR",
        "Income: 5,00,000",
        "Annual Income: ₹5,00,000",
        "Total Income: 5,00,000 rupees",
        "Income: 5,00,000 only",
        "Salary: ₹5,00,000",
        "Annual Income is 5,00,000"
      ];

      const results = testCases.map(testCase => {
        const result = certificateProcessor.testIncomeExtraction(testCase);
        return {
          testCase,
          result: result.annualIncome || 'NOT FOUND'
        };
      });

      setTestResults(results);
      console.log("Multiple format test results:", results);
    } catch (error) {
      console.error("Multiple format test error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunBuiltInTests = () => {
    setIsProcessing(true);
    try {
      certificateProcessor.testMultipleIncomeFormats();
      setIsProcessing(false);
    } catch (error) {
      console.error("Built-in test error:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Income Certificate Extraction Test</CardTitle>
          <CardDescription>
            Test the income extraction functionality with different text formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sample-text">Sample Certificate Text</Label>
            <Textarea
              id="sample-text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Enter sample certificate text..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestExtraction} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Test Extraction'}
            </Button>
            <Button 
              onClick={handleTestMultipleFormats} 
              disabled={isProcessing}
              variant="outline"
            >
              Test Multiple Formats
            </Button>
            <Button 
              onClick={handleRunBuiltInTests} 
              disabled={isProcessing}
              variant="outline"
            >
              Run Built-in Tests
            </Button>
          </div>

          {extractedData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Extraction Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Annual Income</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.annualIncome ? (
                      <Badge variant="default" className="text-lg">
                        ₹{extractedData.annualIncome.toLocaleString()}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">NOT FOUND</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Applicant Name</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.applicantName || 'Not found'}
                  </div>
                </div>
                <div>
                  <Label>Father&apos;s Name</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.fatherName || 'Not found'}
                  </div>
                </div>
                <div>
                  <Label>District</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.district || 'Not found'}
                  </div>
                </div>
                <div>
                  <Label>State</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.state || 'Not found'}
                  </div>
                </div>
                <div>
                  <Label>Issued By</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {extractedData.issuedBy || 'Not found'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Multiple Format Test Results</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{result.testCase}</span>
                    <Badge variant={result.result === 'NOT FOUND' ? 'destructive' : 'default'}>
                      {typeof result.result === 'number' ? `₹${result.result.toLocaleString()}` : result.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Debugging Tips</h3>
            <ul className="text-sm space-y-1">
              <li>• Check the browser console for detailed extraction logs</li>
              <li>• The system looks for patterns like &quot;Annual Income: ₹250,000&quot;</li>
              <li>• Income should be between ₹1,000 and ₹10,000,000</li>
              <li>• Multiple formats are supported (₹, Rs., rupees, etc.)</li>
              <li>• Numbers with commas are automatically parsed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Test Cases:</h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Indian format:</strong> &quot;₹5,00,000&quot; → ₹5,00,000</li>
              <li>• <strong>International format:</strong> &quot;$50,000&quot; → $50,000</li>
              <li>• <strong>With text:</strong> &quot;Annual income: ₹2,50,000&quot; → ₹2,50,000</li>
              <li>• <strong>Multiple amounts:</strong> &quot;₹1,00,000 to ₹5,00,000&quot; → ₹1,00,000, ₹5,00,000</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 