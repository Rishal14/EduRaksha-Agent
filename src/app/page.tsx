"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Credential {
  id: string;
  type: string;
  value: string;
  description: string;
  color: string;
}

const sampleCredentials: Credential[] = [
  {
    id: "1",
    type: "Caste",
    value: "SC",
    description: "Scheduled Caste Certificate",
    color: "bg-purple-100 text-purple-800"
  },
  {
    id: "2",
    type: "Income",
    value: "₹80,000",
    description: "Annual Family Income",
    color: "bg-green-100 text-green-800"
  },
  {
    id: "3",
    type: "Marks",
    value: "88%",
    description: "Class 12 Board Percentage",
    color: "bg-blue-100 text-blue-800"
  },
  {
    id: "4",
    type: "Disability",
    value: "None",
    description: "Physical Disability Status",
    color: "bg-gray-100 text-gray-800"
  },
  {
    id: "5",
    type: "Region",
    value: "Rural",
    description: "Residential Area Type",
    color: "bg-orange-100 text-orange-800"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [generatingZKP, setGeneratingZKP] = useState<string | null>(null);

  const handleGenerateZKP = async (credentialId: string) => {
    setGeneratingZKP(credentialId);
    
    // Simulate ZKP generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratingZKP(null);
    router.push(`/zkp-generator?credential=${credentialId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to EduRaksha Agent
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your privacy-preserving student verification system. Generate Zero-Knowledge Proofs 
          to prove your eligibility without revealing sensitive personal information.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{sampleCredentials.length}</div>
              <div className="text-sm text-gray-600">Available Credentials</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Generated Proofs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Privacy Protected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Grid */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Your Verifiable Credentials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCredentials.map((credential) => (
            <Card key={credential.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{credential.type}</CardTitle>
                  <Badge className={credential.color}>
                    {credential.value}
                  </Badge>
                </div>
                <CardDescription>{credential.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleGenerateZKP(credential.id)}
                  disabled={generatingZKP === credential.id}
                  className="w-full"
                >
                  {generatingZKP === credential.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating ZKP...
                    </>
                  ) : (
                    "Generate ZKP"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => router.push('/scholarship')}>
            Apply for Scholarships
          </Button>
          <Button variant="outline" onClick={() => router.push('/wallet')}>
            View SSI Wallet
          </Button>
          <Button variant="outline" onClick={() => router.push('/zkp-generator')}>
            Generate New Proof
          </Button>
          <Button variant="outline" onClick={() => router.push('/verifier')}>
            Verify Proof
          </Button>
          <Button variant="outline" onClick={() => router.push('/chat')}>
            Ask AI Assistant
          </Button>
        </div>
      </div>
    </div>
  );
}
