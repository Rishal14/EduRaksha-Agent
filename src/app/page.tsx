
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ssiWallet, type VerifiableCredential } from "@/lib/ssi-wallet";

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
  const { data: session } = useSession();
  const [generatingZKP, setGeneratingZKP] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [generatedProofs, setGeneratedProofs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadUserData = async () => {
    try {
      // Get self-issued credentials from wallet
      const walletCredentials = ssiWallet.getSelfIssuedCredentials();
      setCredentials(walletCredentials);

      // Get generated proofs from localStorage
      const proofs = JSON.parse(localStorage.getItem("generatedProofs") || "[]");
      setGeneratedProofs(proofs.length);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateZKP = async (credentialId: string) => {
    setGeneratingZKP(credentialId);
    
    // Simulate ZKP generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store the generated proof
    const proofs = JSON.parse(localStorage.getItem("generatedProofs") || "[]");
    const newProof = {
      id: `proof-${Date.now()}`,
      credentialId,
      generatedAt: new Date().toISOString(),
      status: 'active'
    };
    proofs.push(newProof);
    localStorage.setItem("generatedProofs", JSON.stringify(proofs));
    setGeneratedProofs(proofs.length);
    
    setGeneratingZKP(null);
    router.push(`/zkp-generator?credential=${credentialId}`);
  };

  // Convert wallet credentials to display format
  const displayCredentials = credentials.map((cred, index) => {
    const sampleCred = sampleCredentials[index] || sampleCredentials[0];
    return {
      id: cred.id,
      type: cred.type.replace('Credential', ''),
      value: getCredentialValue(cred),
      description: getCredentialDescription(cred),
      color: sampleCred.color
    };
  });

  // Use sample credentials as fallback if no wallet credentials
  const finalCredentials = displayCredentials.length > 0 ? displayCredentials : sampleCredentials;

  // Show landing page for unauthenticated users
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 py-10 px-2 md:px-0">
        {/* Hero Section */}
        <div className="relative max-w-4xl mx-auto text-center py-12 mb-10 rounded-3xl bg-white/80 shadow-xl border border-blue-100 backdrop-blur-lg">
          <img src="/globe.svg" alt="Globe" className="absolute left-6 top-6 w-16 h-16 opacity-20 pointer-events-none select-none" />
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 drop-shadow mb-4 tracking-tight">
            EduRaksha Agent
          </h1>
          <p className="text-2xl text-gray-700 max-w-2xl mx-auto mb-6 font-medium">
            Create your own credentials and generate Zero-Knowledge Proofs to prove eligibility without revealing sensitive information.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white shadow-lg px-8 py-3 text-lg font-semibold" onClick={() => router.push('/auth/signin')}>
              <span className="mr-2">🔐</span> Sign In to Continue
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/80 shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Zero-Knowledge Proofs</h3>
              <p className="text-gray-600">Prove eligibility without revealing sensitive personal information</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">👛</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Self-Issued Credentials</h3>
              <p className="text-gray-600">Create and manage your own verifiable credentials</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Verification</h3>
              <p className="text-gray-600">Verify credentials and proofs instantly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        
        {/* User Welcome Message */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-lg text-blue-800 font-medium">
            Welcome back, {session.user?.name || session.user?.email}! 👋
          </p>
          <p className="text-sm text-blue-600 mt-1">
            You&apos;re signed in and ready to manage your verifiable credentials.
          </p>
        </div>
        
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
              <span className="text-4xl font-bold text-blue-700">
                {isLoading ? "..." : finalCredentials.length}
              </span>
            </div>
            <div className="text-lg text-blue-900 font-medium">Available Credentials</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-100 to-green-50 border-0 shadow-md">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-2">🛡️</span>
              <span className="text-4xl font-bold text-green-700">
                {isLoading ? "..." : generatedProofs}
              </span>
            </div>
            <div className="text-lg text-green-900 font-medium">Generated Proofs</div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center tracking-tight">Your Verifiable Credentials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {finalCredentials.map((credential) => (
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

// Helper functions to extract credential values and descriptions
function getCredentialValue(credential: VerifiableCredential): string {
  // Prefer credentialSubject if available, fallback to claims for legacy
  const subject = credential.credentialSubject || {};
  if (credential.type === 'IncomeCredential') {
    return subject.annualIncome !== undefined ? String(subject.annualIncome) : '₹80,000';
  } else if (credential.type === 'CasteCredential') {
    return subject.caste !== undefined ? String(subject.caste) : 'SC';
  } else if (credential.type === 'EducationalCredential') {
    return subject.marks !== undefined ? `${subject.marks}%` : '88%';
  } else if (credential.type === 'DisabilityCredential') {
    return subject.disabilityStatus !== undefined ? String(subject.disabilityStatus) : 'None';
  } else if (credential.type === 'RegionCredential') {
    return subject.region !== undefined ? String(subject.region) : 'Rural';
  }
  return 'N/A';
}

function getCredentialDescription(credential: VerifiableCredential): string {
  if (credential.type === 'IncomeCredential') {
    return 'Annual Family Income';
  } else if (credential.type === 'CasteCredential') {
    return 'Scheduled Caste Certificate';
  } else if (credential.type === 'EducationalCredential') {
    return 'Class 12 Board Percentage';
  } else if (credential.type === 'DisabilityCredential') {
    return 'Physical Disability Status';
  } else if (credential.type === 'RegionCredential') {
    return 'Residential Area Type';
  }
  return 'Verifiable Credential';
}

