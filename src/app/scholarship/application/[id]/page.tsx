"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowLeft,
  Download,
  Share2,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Award,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewedAt?: string;
  eligibilityProofs: any;
  studentData: {
    name: string;
    email: string;
    phone: string;
    institution: string;
    course: string;
    year: string;
  };
  feedback?: string;
  timeline: {
    date: string;
    status: string;
    description: string;
  }[];
}

const mockApplication: Application = {
  id: "app-001",
  scholarshipId: "sc-post-matric",
  scholarshipName: "SC Post-Matric Scholarship",
  amount: "₹25,000/year",
  status: "approved",
  submittedAt: "2024-01-15T10:30:00Z",
  reviewedAt: "2024-01-20T14:15:00Z",
  eligibilityProofs: {
    incomeProof: { 
      verified: true, 
      type: "income_threshold",
      threshold: 250000,
      proof: "zkp_proof_data_income"
    },
    casteProof: { 
      verified: true, 
      type: "caste_verification",
      allowedCastes: ["SC"],
      proof: "zkp_proof_data_caste"
    },
    marksProof: { 
      verified: true, 
      type: "marks_threshold",
      threshold: 60,
      proof: "zkp_proof_data_marks"
    }
  },
  studentData: {
    name: "Rahul Kumar",
    email: "rahul@example.com",
    phone: "+91 98765 43210",
    institution: "Delhi University",
    course: "Computer Science",
    year: "2"
  },
  feedback: "Application approved based on verified eligibility criteria. All privacy-preserving proofs have been validated successfully.",
  timeline: [
    {
      date: "2024-01-15T10:30:00Z",
      status: "submitted",
      description: "Application submitted with privacy-preserving proofs"
    },
    {
      date: "2024-01-16T09:15:00Z",
      status: "proofs_verified",
      description: "Zero-knowledge proofs verified successfully"
    },
    {
      date: "2024-01-18T14:30:00Z",
      status: "under_review",
      description: "Application under review by scholarship committee"
    },
    {
      date: "2024-01-20T14:15:00Z",
      status: "approved",
      description: "Application approved - scholarship granted"
    }
  ]
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
    case 'under_review': return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
    default: return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'under_review': return 'bg-yellow-100 text-yellow-800';
    case 'pending': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTimelineIcon = (status: string) => {
  switch (status) {
    case 'submitted': return <FileText className="w-4 h-4" />;
    case 'proofs_verified': return <Shield className="w-4 h-4" />;
    case 'under_review': return <Clock className="w-4 h-4" />;
    case 'approved': return <Award className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch application details
    setTimeout(() => {
      setApplication(mockApplication);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleDownloadProof = () => {
    if (!application) return;

    const proofData = {
      applicationId: application.id,
      scholarshipName: application.scholarshipName,
      eligibilityProofs: application.eligibilityProofs,
      submittedAt: application.submittedAt,
      studentData: {
        name: application.studentData.name,
        email: application.studentData.email,
        institution: application.studentData.institution,
        course: application.studentData.course
      }
    };
    
    const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarship-proof-${application.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Proof downloaded successfully!");
  };

  const handleShareApplication = () => {
    if (!application) return;
    
    // Simulate sharing functionality
    const shareData = {
      title: `Scholarship Application - ${application.scholarshipName}`,
      text: `My application for ${application.scholarshipName} is ${application.status}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Application link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Not Found</h2>
        <p className="text-gray-600 mb-4">The application you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/scholarship/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/scholarship/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {application.scholarshipName}
            </h1>
            <p className="text-gray-600">Application ID: {application.id}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadProof}>
            <Download className="w-4 h-4 mr-2" />
            Download Proof
          </Button>
          <Button variant="outline" onClick={handleShareApplication}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(application.status)}
                <span>Application Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge className={getStatusColor(application.status)}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{application.amount}</p>
                  <p className="text-sm text-gray-600">Scholarship Amount</p>
                </div>
              </div>
              
              {application.feedback && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Feedback:</span> {application.feedback}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Proofs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy-Preserving Proofs</span>
              </CardTitle>
              <CardDescription>
                Your eligibility has been verified using Zero-Knowledge Proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(application.eligibilityProofs).map(([key, proof]: [string, any]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {key.replace('Proof', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Type: {proof.type}</p>
                      {proof.threshold && <p>Threshold: {proof.threshold}</p>}
                      {proof.allowedCastes && <p>Allowed: {proof.allowedCastes.join(', ')}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        Proof Hash: {proof.proof.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <EyeOff className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Privacy Protected</p>
                    <p className="text-xs text-green-700">
                      Your personal data remains private. Only proof of eligibility is shared with the scholarship committee.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getTimelineIcon(event.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{application.studentData.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{application.studentData.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{application.studentData.phone}</span>
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{application.studentData.institution}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{application.studentData.course} - Year {application.studentData.year}</span>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted:</span>
                <span className="text-sm">
                  {new Date(application.submittedAt).toLocaleDateString()}
                </span>
              </div>
              {application.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reviewed:</span>
                  <span className="text-sm">
                    {new Date(application.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Processing Time:</span>
                <span className="text-sm">
                  {application.reviewedAt 
                    ? `${Math.ceil((new Date(application.reviewedAt).getTime() - new Date(application.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : 'In progress'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                View Similar Scholarships
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                Apply for Another
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 