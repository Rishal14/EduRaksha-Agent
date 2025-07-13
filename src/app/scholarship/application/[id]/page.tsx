"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Shield,
  Lock
} from "lucide-react";

interface ApplicationData {
  id: string;
  scholarshipName: string;
  status: string;
  submittedAt: string;
  documents: Document[];
  personalInfo: PersonalInfo;
  academicInfo: AcademicInfo;
  financialInfo: FinancialInfo;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  category: string;
}

interface AcademicInfo {
  institution: string;
  course: string;
  year: string;
  percentage: string;
  documents: string[];
}

interface FinancialInfo {
  annualIncome: string;
  familySize: string;
  occupation: string;
  documents: string[];
}

export default function ApplicationPage() {
  const params = useParams();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockApplication: ApplicationData = {
      id: params.id as string,
      scholarshipName: "SC/ST Scholarship 2024",
      status: "submitted",
      submittedAt: "2024-01-15T10:30:00Z",
      documents: [
        {
          id: "1",
          name: "Income Certificate.pdf",
          type: "income_certificate",
          uploadedAt: "2024-01-15T10:25:00Z",
          status: "verified"
        },
        {
          id: "2",
          name: "Caste Certificate.pdf",
          type: "caste_certificate",
          uploadedAt: "2024-01-15T10:26:00Z",
          status: "verified"
        },
        {
          id: "3",
          name: "Marksheet.pdf",
          type: "academic",
          uploadedAt: "2024-01-15T10:27:00Z",
          status: "pending"
        }
      ],
      personalInfo: {
        name: "Rahul Kumar",
        email: "rahul.kumar@email.com",
        phone: "+91 98765 43210",
        address: "123, Main Street, Bangalore, Karnataka",
        dateOfBirth: "2000-05-15",
        gender: "Male",
        category: "SC"
      },
      academicInfo: {
        institution: "Bangalore University",
        course: "Bachelor of Engineering",
        year: "3rd Year",
        percentage: "85%",
        documents: ["Marksheet.pdf", "Bonafide Certificate.pdf"]
      },
      financialInfo: {
        annualIncome: "₹2,50,000",
        familySize: "4",
        occupation: "Student",
        documents: ["Income Certificate.pdf", "Bank Statement.pdf"]
      }
    };

    setTimeout(() => {
      setApplication(mockApplication);
      setIsLoading(false);
    }, 1000);
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "default";
      case "approved": return "default";
      case "rejected": return "destructive";
      case "pending": return "secondary";
      default: return "secondary";
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Application not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{application.scholarshipName}</h1>
          <p className="text-muted-foreground">Application ID: {application.id}</p>
        </div>
        <Badge variant={getStatusColor(application.status)}>
          {application.status.toUpperCase()}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{application.documents.length}</div>
                <p className="text-sm text-muted-foreground">
                  {application.documents.filter(d => d.status === 'verified').length} verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">95%</div>
                <p className="text-sm text-muted-foreground">Excellent protection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  ZKP Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">3</div>
                <p className="text-sm text-muted-foreground">Proofs created</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(application.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Under Review</p>
                    <p className="text-sm text-muted-foreground">Expected: 2-3 weeks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Review and manage your application documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getDocumentStatusIcon(doc.status)}
                      <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-sm text-muted-foreground">{application.personalInfo.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{application.personalInfo.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm text-muted-foreground">{application.personalInfo.phone}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="outline">{application.personalInfo.category}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Institution</Label>
                  <p className="text-sm text-muted-foreground">{application.academicInfo.institution}</p>
                </div>
                <div>
                  <Label>Course</Label>
                  <p className="text-sm text-muted-foreground">{application.academicInfo.course}</p>
                </div>
                <div>
                  <Label>Year</Label>
                  <p className="text-sm text-muted-foreground">{application.academicInfo.year}</p>
                </div>
                <div>
                  <Label>Percentage</Label>
                  <p className="text-sm text-muted-foreground">{application.academicInfo.percentage}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Annual Income</Label>
                  <p className="text-sm text-muted-foreground">{application.financialInfo.annualIncome}</p>
                </div>
                <div>
                  <Label>Family Size</Label>
                  <p className="text-sm text-muted-foreground">{application.financialInfo.familySize}</p>
                </div>
                <div>
                  <Label>Occupation</Label>
                  <p className="text-sm text-muted-foreground">{application.financialInfo.occupation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Protection
              </CardTitle>
              <CardDescription>
                Your data is protected using Zero-Knowledge Proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✓ Data Minimization</h4>
                  <p className="text-sm text-green-700">
                    Only necessary information is shared with scholarship providers
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">✓ Zero-Knowledge Proofs</h4>
                  <p className="text-sm text-blue-700">
                    Your sensitive data is never exposed, only cryptographic proofs
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">✓ Selective Disclosure</h4>
                  <p className="text-sm text-purple-700">
                    You control exactly what information is revealed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 