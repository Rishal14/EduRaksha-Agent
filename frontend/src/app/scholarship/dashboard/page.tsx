"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  scholarshipName: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';
  submittedAt: string;
  documents: number;
  progress: number;
}

export default function ScholarshipDashboardPage() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: "1",
      scholarshipName: "SC/ST Scholarship 2024",
      status: "approved",
      submittedAt: "2024-01-15",
      documents: 5,
      progress: 100
    },
    {
      id: "2",
      scholarshipName: "OBC Scholarship",
      status: "pending",
      submittedAt: "2024-01-10",
      documents: 4,
      progress: 80
    },
    {
      id: "3",
      scholarshipName: "Merit Scholarship",
      status: "submitted",
      submittedAt: "2024-01-05",
      documents: 3,
      progress: 60
    },
    {
      id: "4",
      scholarshipName: "Sports Scholarship",
      status: "draft",
      submittedAt: "",
      documents: 1,
      progress: 20
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "pending": return "secondary";
      case "submitted": return "default";
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected": return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "submitted": return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const stats = {
    total: applications.length,
    approved: applications.filter(app => app.status === 'approved').length,
    pending: applications.filter(app => app.status === 'pending').length,
    draft: applications.filter(app => app.status === 'draft').length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scholarship Dashboard</h1>
          <p className="text-muted-foreground">Manage your scholarship applications</p>
        </div>
        <Link href="/scholarship">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Incomplete</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Your scholarship applications and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(application.status)}
                  <div>
                    <h3 className="font-medium">{application.scholarshipName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {application.submittedAt ? 
                        `Submitted: ${new Date(application.submittedAt).toLocaleDateString()}` : 
                        'Draft - Not submitted'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(application.status)}>
                        {application.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {application.documents} docs
                      </span>
                    </div>
                    {application.status !== 'draft' && (
                      <Progress value={application.progress} className="w-24 mt-1" />
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/scholarship/application/${application.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    {application.status === 'approved' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/scholarship">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Start New Application
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Verify Documents
              </Button>
            </Link>
            <Link href="/wallet">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Credentials
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 