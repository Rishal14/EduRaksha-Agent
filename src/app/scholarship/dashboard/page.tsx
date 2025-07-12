"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  TrendingUp, 
  Award,
  Eye,
  Download,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";

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
    institution: string;
    course: string;
  };
  feedback?: string;
}

const mockApplications: Application[] = [
  {
    id: "app-001",
    scholarshipId: "sc-post-matric",
    scholarshipName: "SC Post-Matric Scholarship",
    amount: "₹25,000/year",
    status: "approved",
    submittedAt: "2024-01-15T10:30:00Z",
    reviewedAt: "2024-01-20T14:15:00Z",
    eligibilityProofs: {
      incomeProof: { verified: true },
      casteProof: { verified: true },
      marksProof: { verified: true }
    },
    studentData: {
      name: "Rahul Kumar",
      email: "rahul@example.com",
      institution: "Delhi University",
      course: "Computer Science"
    },
    feedback: "Application approved based on verified eligibility criteria."
  },
  {
    id: "app-002",
    scholarshipId: "merit-cum-means",
    scholarshipName: "Merit-cum-Means Scholarship",
    amount: "₹15,000/year",
    status: "under_review",
    submittedAt: "2024-01-18T09:45:00Z",
    eligibilityProofs: {
      incomeProof: { verified: true },
      marksProof: { verified: true }
    },
    studentData: {
      name: "Priya Sharma",
      email: "priya@example.com",
      institution: "Mumbai University",
      course: "Engineering"
    }
  },
  {
    id: "app-003",
    scholarshipId: "rural-student",
    scholarshipName: "Rural Student Scholarship",
    amount: "₹20,000/year",
    status: "pending",
    submittedAt: "2024-01-22T16:20:00Z",
    eligibilityProofs: {
      incomeProof: { verified: true },
      regionProof: { verified: true },
      marksProof: { verified: true }
    },
    studentData: {
      name: "Amit Patel",
      email: "amit@example.com",
      institution: "Gujarat University",
      course: "Agriculture"
    }
  }
];

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

export default function ScholarshipDashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredApplications = applications.filter(app => {
    if (selectedTab === "all") return true;
    return app.status === selectedTab;
  });

  const stats = {
    total: applications.length,
    approved: applications.filter(app => app.status === 'approved').length,
    pending: applications.filter(app => app.status === 'pending').length,
    underReview: applications.filter(app => app.status === 'under_review').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  const totalAmount = applications
    .filter(app => app.status === 'approved')
    .reduce((sum, app) => sum + parseInt(app.amount.replace(/[^\d]/g, '')), 0);

  const handleViewApplication = (applicationId: string) => {
    router.push(`/scholarship/application/${applicationId}`);
  };

  const handleDownloadProof = (application: Application) => {
    // Simulate downloading proof data
    const proofData = {
      applicationId: application.id,
      scholarshipName: application.scholarshipName,
      eligibilityProofs: application.eligibilityProofs,
      submittedAt: application.submittedAt
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
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Scholarship Dashboard
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Track your scholarship applications and view your privacy-preserving eligibility proofs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.underReview}</div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Awarded</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>
            Track the status of your scholarship applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="under_review">Review ({stats.underReview})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No applications found for this status.</p>
                    <Button 
                      onClick={() => router.push('/scholarship')}
                      className="mt-4"
                    >
                      Apply for Scholarships
                    </Button>
                  </div>
                ) : (
                  filteredApplications.map((application) => (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.scholarshipName}
                              </h3>
                              <Badge className={getStatusColor(application.status)}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1">
                                  {application.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <span className="text-sm text-gray-600">Amount:</span>
                                <p className="font-semibold text-green-600">{application.amount}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Submitted:</span>
                                <p className="text-sm">
                                  {new Date(application.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Institution:</span>
                                <p className="text-sm">{application.studentData.institution}</p>
                              </div>
                            </div>

                            {/* Eligibility Proofs Summary */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Eligibility Proofs:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(application.eligibilityProofs).map(([key, proof]: [string, any]) => (
                                  <Badge 
                                    key={key} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {key.replace('Proof', '').replace(/([A-Z])/g, ' $1').trim()}
                                    {proof.verified && (
                                      <CheckCircle className="w-3 h-3 ml-1 text-green-600" />
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {application.feedback && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Feedback:</span> {application.feedback}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewApplication(application.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadProof(application)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Proof
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => router.push('/scholarship')}>
              Apply for New Scholarship
            </Button>
            <Button variant="outline" onClick={() => router.push('/wallet')}>
              View SSI Wallet
            </Button>
            <Button variant="outline" onClick={() => router.push('/zkp-generator')}>
              Generate New Proofs
            </Button>
            <Button variant="outline" onClick={() => router.push('/chat')}>
              Ask AI Assistant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 