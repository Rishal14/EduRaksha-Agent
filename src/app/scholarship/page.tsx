"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, Shield, Eye, EyeOff, GraduationCap, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: string;
  eligibility: {
    incomeMax: number;
    caste: string[];
    marksMin: number;
    region?: string;
    disability?: boolean;
  };
  deadline: string;
  status: 'open' | 'closed' | 'upcoming';
  category: 'merit' | 'need' | 'caste' | 'disability' | 'regional';
}

interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const availableScholarships: Scholarship[] = [
  {
    id: "sc-post-matric",
    name: "SC Post-Matric Scholarship",
    description: "Scholarship for Scheduled Caste students pursuing higher education",
    amount: "₹25,000/year",
    eligibility: {
      incomeMax: 250000,
      caste: ["SC"],
      marksMin: 60
    },
    deadline: "2024-12-31",
    status: "open",
    category: "caste"
  },
  {
    id: "merit-cum-means",
    name: "Merit-cum-Means Scholarship",
    description: "Scholarship based on academic merit and family income",
    amount: "₹15,000/year",
    eligibility: {
      incomeMax: 800000,
      caste: ["General", "OBC", "SC", "ST"],
      marksMin: 75
    },
    deadline: "2024-12-31",
    status: "open",
    category: "merit"
  },
  {
    id: "rural-student",
    name: "Rural Student Scholarship",
    description: "Special scholarship for students from rural areas",
    amount: "₹20,000/year",
    eligibility: {
      incomeMax: 500000,
      caste: ["General", "OBC", "SC", "ST"],
      marksMin: 70,
      region: "rural"
    },
    deadline: "2024-12-31",
    status: "open",
    category: "regional"
  },
  {
    id: "disability-scholarship",
    name: "Disability Scholarship",
    description: "Scholarship for students with disabilities",
    amount: "₹30,000/year",
    eligibility: {
      incomeMax: 1000000,
      caste: ["General", "OBC", "SC", "ST"],
      marksMin: 50,
      disability: true
    },
    deadline: "2024-12-31",
    status: "open",
    category: "disability"
  }
];

const applicationSteps: ApplicationStep[] = [
  {
    id: "select-scholarship",
    title: "Select Scholarship",
    description: "Choose the scholarship you want to apply for",
    completed: false,
    current: true
  },
  {
    id: "verify-eligibility",
    title: "Verify Eligibility",
    description: "Generate privacy-preserving proofs of your eligibility",
    completed: false,
    current: false
  },
  {
    id: "review-application",
    title: "Review Application",
    description: "Review your application details",
    completed: false,
    current: false
  },
  {
    id: "submit",
    title: "Submit Application",
    description: "Submit your application securely",
    completed: false,
    current: false
  }
];

export default function ScholarshipPage() {
  const router = useRouter();
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(applicationSteps);
  const [isGeneratingProofs, setIsGeneratingProofs] = useState(false);
  const [proofsGenerated, setProofsGenerated] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    year: ""
  });
  const [eligibilityProofs, setEligibilityProofs] = useState<any>(null);

  const updateSteps = (currentStepIndex: number) => {
    setSteps(steps.map((step, index) => ({
      ...step,
      current: index === currentStepIndex,
      completed: index < currentStepIndex
    })));
  };

  const handleScholarshipSelect = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setCurrentStep(1);
    updateSteps(1);
  };

  const generateEligibilityProofs = async () => {
    if (!selectedScholarship) return;

    setIsGeneratingProofs(true);
    
    try {
      // Check if user has credentials in SSI wallet
      const selectedCredential = localStorage.getItem('selectedCredential');
      let walletCredentials = [];
      
      if (selectedCredential) {
        walletCredentials = [JSON.parse(selectedCredential)];
        toast.success("Using credential from SSI wallet!");
      }

      // Simulate ZKP generation for each eligibility criterion
      const proofs = {
        incomeProof: await generateIncomeProof(selectedScholarship.eligibility.incomeMax, walletCredentials),
        casteProof: await generateCasteProof(selectedScholarship.eligibility.caste, walletCredentials),
        marksProof: await generateMarksProof(selectedScholarship.eligibility.marksMin, walletCredentials),
        ...(selectedScholarship.eligibility.region && {
          regionProof: await generateRegionProof(selectedScholarship.eligibility.region, walletCredentials)
        }),
        ...(selectedScholarship.eligibility.disability && {
          disabilityProof: await generateDisabilityProof(walletCredentials)
        })
      };

      setEligibilityProofs(proofs);
      setProofsGenerated(true);
      toast.success("Eligibility proofs generated successfully!");
      
      setCurrentStep(2);
      updateSteps(2);
    } catch (error) {
      console.error("Error generating proofs:", error);
      toast.error("Failed to generate eligibility proofs");
    } finally {
      setIsGeneratingProofs(false);
    }
  };

  const generateIncomeProof = async (maxIncome: number, walletCredentials: any[] = []): Promise<any> => {
    // Check if we have income credential in wallet
    const incomeCredential = walletCredentials.find(cred => cred.type === 'IncomeCredential');
    
    if (incomeCredential) {
      const income = parseInt(incomeCredential.claims.annualIncome?.replace(/[^\d]/g, '') || '0');
      const isValid = income <= maxIncome;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        type: "income_threshold",
        threshold: maxIncome,
        proof: `zkp_proof_income_${income}_${maxIncome}`,
        verified: isValid,
        source: "SSI Wallet",
        credentialId: incomeCredential.id
      };
    }
    
    // Fallback to simulated proof
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      type: "income_threshold",
      threshold: maxIncome,
      proof: "zkp_proof_data_income",
      verified: true,
      source: "Simulated"
    };
  };

  const generateCasteProof = async (allowedCastes: string[], walletCredentials: any[] = []): Promise<any> => {
    // Check if we have caste credential in wallet
    const casteCredential = walletCredentials.find(cred => cred.type === 'CasteCredential');
    
    if (casteCredential) {
      const caste = casteCredential.claims.caste;
      const isValid = allowedCastes.includes(caste);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        type: "caste_verification",
        allowedCastes,
        proof: `zkp_proof_caste_${caste}`,
        verified: isValid,
        source: "SSI Wallet",
        credentialId: casteCredential.id
      };
    }
    
    // Fallback to simulated proof
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      type: "caste_verification",
      allowedCastes,
      proof: "zkp_proof_data_caste",
      verified: true,
      source: "Simulated"
    };
  };

  const generateMarksProof = async (minMarks: number, walletCredentials: any[] = []): Promise<any> => {
    // Check if we have educational credential in wallet
    const educationalCredential = walletCredentials.find(cred => cred.type === 'EducationalCredential');
    
    if (educationalCredential) {
      const marks = parseInt(educationalCredential.claims.marks?.replace(/[^\d]/g, '') || '0');
      const isValid = marks >= minMarks;
      
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        type: "marks_threshold",
        threshold: minMarks,
        proof: `zkp_proof_marks_${marks}_${minMarks}`,
        verified: isValid,
        source: "SSI Wallet",
        credentialId: educationalCredential.id
      };
    }
    
    // Fallback to simulated proof
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      type: "marks_threshold",
      threshold: minMarks,
      proof: "zkp_proof_data_marks",
      verified: true,
      source: "Simulated"
    };
  };

  const generateRegionProof = async (region: string, walletCredentials: any[] = []): Promise<any> => {
    // For now, simulate region proof
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      type: "region_verification",
      region,
      proof: "zkp_proof_data_region",
      verified: true,
      source: "Simulated"
    };
  };

  const generateDisabilityProof = async (walletCredentials: any[] = []): Promise<any> => {
    // For now, simulate disability proof
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      type: "disability_status",
      proof: "zkp_proof_data_disability",
      verified: true,
      source: "Simulated"
    };
  };

  const handleApplicationSubmit = async () => {
    if (!selectedScholarship || !eligibilityProofs) return;

    try {
      // Submit application with proofs
      const application = {
        scholarshipId: selectedScholarship.id,
        studentData: applicationData,
        eligibilityProofs,
        submittedAt: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Application submitted successfully!");
      setCurrentStep(3);
      updateSteps(3);
    } catch (error) {
      toast.error("Failed to submit application");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'merit': return <GraduationCap className="w-4 h-4" />;
      case 'need': return <DollarSign className="w-4 h-4" />;
      case 'caste': return <Shield className="w-4 h-4" />;
      case 'disability': return <Shield className="w-4 h-4" />;
      case 'regional': return <Shield className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'merit': return 'bg-blue-100 text-blue-800';
      case 'need': return 'bg-green-100 text-green-800';
      case 'caste': return 'bg-purple-100 text-purple-800';
      case 'disability': return 'bg-orange-100 text-orange-800';
      case 'regional': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Scholarship Applications
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Apply for scholarships using privacy-preserving Zero-Knowledge Proofs. 
          No document uploads required - prove your eligibility without revealing sensitive information.
        </p>
      </div>

      {/* Application Progress */}
      {selectedScholarship && (
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(currentStep / (steps.length - 1)) * 100} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500 text-white' :
                      step.current ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.current ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Scholarship */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Available Scholarships
            </h2>
            <p className="text-gray-600">
              Select a scholarship to begin your privacy-preserving application
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableScholarships.map((scholarship) => (
              <Card key={scholarship.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {scholarship.description}
                      </CardDescription>
                    </div>
                    <Badge className={getCategoryColor(scholarship.category)}>
                      {getCategoryIcon(scholarship.category)}
                      <span className="ml-1">{scholarship.category}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold text-green-600">{scholarship.amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Deadline:</span>
                      <span className="text-sm">{new Date(scholarship.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={scholarship.status === 'open' ? 'default' : 'secondary'}>
                        {scholarship.status}
                      </Badge>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Eligibility Criteria:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Income: ≤ ₹{scholarship.eligibility.incomeMax.toLocaleString()}</div>
                        <div>• Caste: {scholarship.eligibility.caste.join(', ')}</div>
                        <div>• Marks: ≥ {scholarship.eligibility.marksMin}%</div>
                        {scholarship.eligibility.region && (
                          <div>• Region: {scholarship.eligibility.region}</div>
                        )}
                        {scholarship.eligibility.disability && (
                          <div>• Disability: Required</div>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleScholarshipSelect(scholarship)}
                      className="w-full mt-4"
                      disabled={scholarship.status !== 'open'}
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Verify Eligibility */}
      {currentStep === 1 && selectedScholarship && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Verify Eligibility
            </h2>
            <p className="text-gray-600">
              Generate privacy-preserving proofs to verify your eligibility without revealing personal data
            </p>
          </div>

          {/* SSI Wallet Integration */}
          {localStorage.getItem('selectedCredential') && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Shield className="w-5 h-5" />
                  <span>SSI Wallet Integration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-3">
                  Credentials from your SSI wallet will be used to generate proofs automatically.
                  This ensures faster and more secure verification.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('selectedCredential');
                      toast.success("Wallet credentials cleared");
                    }}
                  >
                    Clear Wallet Data
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/wallet')}
                  >
                    View Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy-Preserving Verification</span>
              </CardTitle>
              <CardDescription>
                Your personal information remains private while proving eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Income Verification</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Prove income ≤ ₹{selectedScholarship.eligibility.incomeMax.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Caste Verification</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Prove caste: {selectedScholarship.eligibility.caste.join(', ')}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Academic Performance</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Prove marks ≥ {selectedScholarship.eligibility.marksMin}%
                    </p>
                  </div>

                  {selectedScholarship.eligibility.region && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">Regional Eligibility</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Prove region: {selectedScholarship.eligibility.region}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={generateEligibilityProofs}
                    disabled={isGeneratingProofs}
                    className="px-8"
                  >
                    {isGeneratingProofs ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Proofs...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Generate Privacy Proofs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review Application */}
      {currentStep === 2 && selectedScholarship && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Review Application
            </h2>
            <p className="text-gray-600">
              Review your application details and eligibility proofs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={applicationData.name}
                      onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={applicationData.institution}
                      onChange={(e) => setApplicationData({...applicationData, institution: e.target.value})}
                      placeholder="Enter institution name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={applicationData.course}
                      onChange={(e) => setApplicationData({...applicationData, course: e.target.value})}
                      placeholder="Enter course name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select value={applicationData.year} onValueChange={(value) => setApplicationData({...applicationData, year: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Proofs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Eligibility Proofs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eligibilityProofs && Object.entries(eligibilityProofs).map(([key, proof]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">
                          {key.replace('Proof', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <EyeOff className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      {/* <p className="text-sm font-medium text-blue-900">Privacy Protected</p> */}
                      <p className="text-xs text-blue-700">
                        Your personal data remains private. Only proof of eligibility is shared.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentStep(1);
                updateSteps(1);
              }}
            >
              Back
            </Button>
            <Button 
              onClick={() => {
                setCurrentStep(3);
                updateSteps(3);
              }}
              disabled={!applicationData.name || !applicationData.email}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Submit Application */}
      {currentStep === 3 && selectedScholarship && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Submit Application
            </h2>
            <p className="text-gray-600">
              Review and submit your scholarship application
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Scholarship Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scholarship:</span>
                        <span className="font-medium">{selectedScholarship.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-green-600">{selectedScholarship.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <Badge className={getCategoryColor(selectedScholarship.category)}>
                          {selectedScholarship.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{applicationData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{applicationData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Institution:</span>
                        <span className="font-medium">{applicationData.institution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{applicationData.course}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Privacy Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Zero-Knowledge Proofs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EyeOff className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">No Document Upload</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Cryptographically Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentStep(2);
                updateSteps(2);
              }}
            >
              Back
            </Button>
            <Button 
              onClick={handleApplicationSubmit}
              className="px-8"
            >
              Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {currentStep === 4 && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Application Submitted Successfully!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your scholarship application has been submitted using privacy-preserving technology. 
              You will receive updates via email.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedScholarship(null);
                setCurrentStep(0);
                setSteps(applicationSteps);
                setProofsGenerated(false);
                setEligibilityProofs(null);
                setApplicationData({
                  name: "",
                  email: "",
                  phone: "",
                  institution: "",
                  course: "",
                  year: ""
                });
              }}
            >
              Apply for Another Scholarship
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 