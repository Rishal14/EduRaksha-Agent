
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 py-10 px-2 md:px-0">
      {/* Hero Section */}
      <div className="relative max-w-4xl mx-auto text-center py-12 mb-10 rounded-3xl bg-white/80 shadow-xl border border-blue-100 backdrop-blur-lg">
        <img src="/globe.svg" alt="Globe" className="absolute left-6 top-6 w-16 h-16 opacity-20 pointer-events-none select-none" />
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 drop-shadow mb-4 tracking-tight">
          EduRaksha Agent
        </h1>
        <p className="text-2xl text-gray-700 max-w-2xl mx-auto mb-6 font-medium">
          Privacy-preserving student verification. Generate Zero-Knowledge Proofs to prove eligibility without revealing sensitive information.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg px-8 py-3 text-lg font-semibold" onClick={() => router.push('/zkp-generator')}>
            <span className="mr-2">🔒</span> Generate New Proof
          </Button>
          <Button size="lg" variant="outline" className="border-blue-700 text-blue-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold" onClick={() => router.push('/verifier')}>
            <span className="mr-2">✅</span> Verify Proof
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="bg-gradient-to-r from-blue-100 to-blue-50 border-0 shadow-md">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-2">📄</span>
              <span className="text-4xl font-bold text-blue-700">{sampleCredentials.length}</span>
            </div>
            <div className="text-lg text-blue-900 font-medium">Available Credentials</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-100 to-green-50 border-0 shadow-md">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-2">🛡️</span>
              <span className="text-4xl font-bold text-green-700">0</span>
            </div>
            <div className="text-lg text-green-900 font-medium">Generated Proofs</div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center tracking-tight">Your Verifiable Credentials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleCredentials.map((credential) => (
            <Card key={credential.id} className="group relative overflow-hidden rounded-2xl border-0 shadow-lg bg-white hover:scale-[1.03] hover:shadow-2xl transition-all duration-300">
              <div className="absolute right-4 top-4 opacity-10 text-6xl pointer-events-none select-none">🎓</div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{credential.type}</CardTitle>
                  <Badge className={credential.color + ' text-base px-3 py-1 rounded-full shadow-sm font-semibold'}>
                    {credential.value}
                  </Badge>
                </div>
                <CardDescription className="text-gray-500 mt-2">{credential.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleGenerateZKP(credential.id)}
                  disabled={generatingZKP === credential.id}
                  className="w-full py-2 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                >
                  {generatingZKP === credential.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating ZKP...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔒</span> Generate ZKP
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto mt-16 bg-white/90 rounded-2xl p-8 shadow-xl border border-blue-100 flex flex-col items-center">
        <h3 className="text-2xl font-bold text-blue-900 mb-6">Quick Actions</h3>
        <div className="flex flex-wrap justify-center gap-6 w-full">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 font-semibold shadow-md hover:from-purple-700 hover:to-blue-700" onClick={() => router.push('/wallet')}>
            <span className="mr-2">👛</span> View SSI Wallet
          </Button>
          <Button size="lg" variant="outline" className="border-blue-700 text-blue-700 hover:bg-blue-50 px-8 py-3 font-semibold" onClick={() => router.push('/zkp-generator')}>
            <span className="mr-2">🔒</span> Generate New Proof
          </Button>
          <Button size="lg" variant="outline" className="border-green-700 text-green-700 hover:bg-green-50 px-8 py-3 font-semibold" onClick={() => router.push('/verifier')}>
            <span className="mr-2">✅</span> Verify Proof
          </Button>
          <Button size="lg" variant="outline" className="border-gray-700 text-gray-700 hover:bg-gray-50 px-8 py-3 font-semibold" onClick={() => router.push('/chat')}>
            <span className="mr-2">🤖</span> Ask AI Assistant
          </Button>
        </div>
      </div>
    </div>
  );
}

