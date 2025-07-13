"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Lock,
  Eye,
  Download,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface FormData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    gender: string;
    category: string;
  };
  academicInfo: {
    institution: string;
    course: string;
    year: string;
    percentage: string;
  };
  financialInfo: {
    annualIncome: string;
    familySize: string;
    occupation: string;
  };
  documents: {
    incomeCertificate: File | null;
    casteCertificate: File | null;
    marksheet: File | null;
    bonafideCertificate: File | null;
  };
}

interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string[];
  documents: string[];
  status: 'open' | 'closed' | 'upcoming';
}

export default function ScholarshipPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("apply");
  const [formData, setFormData] = useState<FormData>({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      category: ""
    },
    academicInfo: {
      institution: "",
      course: "",
      year: "",
      percentage: ""
    },
    financialInfo: {
      annualIncome: "",
      familySize: "",
      occupation: ""
    },
    documents: {
      incomeCertificate: null,
      casteCertificate: null,
      marksheet: null,
      bonafideCertificate: null
    }
  });

  const scholarships: Scholarship[] = [
    {
      id: "1",
      name: "SC/ST Scholarship 2024",
      description: "Financial assistance for SC/ST students pursuing higher education",
      amount: "₹50,000 per year",
      deadline: "2024-02-15",
      eligibility: [
        "Must belong to SC/ST category",
        "Family income should be less than ₹8,00,000 per annum",
        "Should be enrolled in recognized institution"
      ],
      documents: [
        "Income Certificate",
        "Caste Certificate",
        "Marksheet",
        "Bonafide Certificate"
      ],
      status: "open"
    },
    {
      id: "2",
      name: "OBC Scholarship",
      description: "Scholarship for OBC students with merit",
      amount: "₹30,000 per year",
      deadline: "2024-02-28",
      eligibility: [
        "Must belong to OBC category",
        "Minimum 60% marks in previous year",
        "Family income should be less than ₹6,00,000 per annum"
      ],
      documents: [
        "Income Certificate",
        "OBC Certificate",
        "Marksheet",
        "Income Affidavit"
      ],
      status: "open"
    }
  ];

  const handleInputChange = (section: keyof FormData, field: string, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (field: keyof FormData['documents'], file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Application submitted successfully!");
      setCurrentStep(1);
      setFormData({
        personalInfo: { name: "", email: "", phone: "", address: "", dateOfBirth: "", gender: "", category: "" },
        academicInfo: { institution: "", course: "", year: "", percentage: "" },
        financialInfo: { annualIncome: "", familySize: "", occupation: "" },
        documents: { incomeCertificate: null, casteCertificate: null, marksheet: null, bonafideCertificate: null }
      });
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scholarship Application</h1>
          <p className="text-muted-foreground">Apply for scholarships with privacy protection</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600">Privacy Protected</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="available">Available Scholarships</TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Step {currentStep} of 4</h2>
                <span className="text-sm text-muted-foreground">{getStepProgress()}% Complete</span>
              </div>
              <Progress value={getStepProgress()} className="w-full" />
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.personalInfo.name}
                          onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.personalInfo.email}
                          onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.personalInfo.phone}
                          onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={formData.personalInfo.category}
                          onChange={(e) => handleInputChange('personalInfo', 'category', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select category</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="OBC">OBC</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="institution">Institution</Label>
                        <Input
                          id="institution"
                          value={formData.academicInfo.institution}
                          onChange={(e) => handleInputChange('academicInfo', 'institution', e.target.value)}
                          placeholder="Enter institution name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="course">Course</Label>
                        <Input
                          id="course"
                          value={formData.academicInfo.course}
                          onChange={(e) => handleInputChange('academicInfo', 'course', e.target.value)}
                          placeholder="Enter course name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <select
                          id="year"
                          value={formData.academicInfo.year}
                          onChange={(e) => handleInputChange('academicInfo', 'year', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="percentage">Percentage</Label>
                        <Input
                          id="percentage"
                          value={formData.academicInfo.percentage}
                          onChange={(e) => handleInputChange('academicInfo', 'percentage', e.target.value)}
                          placeholder="Enter percentage"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="annualIncome">Annual Income</Label>
                        <Input
                          id="annualIncome"
                          value={formData.financialInfo.annualIncome}
                          onChange={(e) => handleInputChange('financialInfo', 'annualIncome', e.target.value)}
                          placeholder="Enter annual income"
                        />
                      </div>
                      <div>
                        <Label htmlFor="familySize">Family Size</Label>
                        <Input
                          id="familySize"
                          value={formData.financialInfo.familySize}
                          onChange={(e) => handleInputChange('financialInfo', 'familySize', e.target.value)}
                          placeholder="Enter family size"
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.financialInfo.occupation}
                          onChange={(e) => handleInputChange('financialInfo', 'occupation', e.target.value)}
                          placeholder="Enter occupation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="incomeCertificate">Income Certificate</Label>
                        <Input
                          id="incomeCertificate"
                          type="file"
                          onChange={(e) => handleFileUpload('incomeCertificate', e.target.files?.[0] || null)}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                      <div>
                        <Label htmlFor="casteCertificate">Caste Certificate</Label>
                        <Input
                          id="casteCertificate"
                          type="file"
                          onChange={(e) => handleFileUpload('casteCertificate', e.target.files?.[0] || null)}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                      <div>
                        <Label htmlFor="marksheet">Marksheet</Label>
                        <Input
                          id="marksheet"
                          type="file"
                          onChange={(e) => handleFileUpload('marksheet', e.target.files?.[0] || null)}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bonafideCertificate">Bonafide Certificate</Label>
                        <Input
                          id="bonafideCertificate"
                          type="file"
                          onChange={(e) => handleFileUpload('bonafideCertificate', e.target.files?.[0] || null)}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Privacy Protection</h4>
                    <p className="text-sm text-blue-700">
                      Your documents will be processed using Zero-Knowledge Proofs to protect your privacy.
                      Only necessary information will be shared with scholarship providers.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 4 ? (
                  <Button onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scholarships.map((scholarship) => (
              <Card key={scholarship.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{scholarship.name}</CardTitle>
                    <Badge variant={scholarship.status === 'open' ? 'default' : 'secondary'}>
                      {scholarship.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{scholarship.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-600">{scholarship.amount}</span>
                    <span className="text-sm text-muted-foreground">
                      Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Eligibility</h4>
                    <ul className="text-sm space-y-1">
                      {scholarship.eligibility.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Required Documents</h4>
                    <div className="flex flex-wrap gap-2">
                      {scholarship.documents.map((doc, index) => (
                        <Badge key={index} variant="outline">
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full" disabled={scholarship.status !== 'open'}>
                    {scholarship.status === 'open' ? 'Apply Now' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 