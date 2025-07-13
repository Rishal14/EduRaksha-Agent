"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, Shield, GraduationCap, DollarSign, Search, Filter, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScrapedScholarship {
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
    age?: {
      min?: number;
      max?: number;
    };
    course?: string[];
    institution?: string[];
  };
  deadline: string;
  status: 'open' | 'closed' | 'upcoming';
  category: 'merit' | 'need' | 'caste' | 'disability' | 'regional' | 'sports' | 'research';
  source: string;
  url?: string;
  applicationUrl?: string;
  lastUpdated: string;
}

interface ScholarshipRecommendation {
  scholarship: ScrapedScholarship;
  matchScore: number;
  matchReasons: string[];
  missingCriteria: string[];
}

interface UserProfile {
  income?: number;
  caste?: string;
  marks?: number;
  region?: 'rural' | 'urban';
  disability?: boolean;
  age?: number;
  course?: string;
  institution?: string;
}

export default function EnhancedScholarshipPage() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<ScrapedScholarship[]>([]);
  const [recommendations, setRecommendations] = useState<ScholarshipRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadScholarships();
    loadUserProfile();
  }, []);

  const loadScholarships = async () => {
    try {
      const response = await fetch('/api/scholarships');
      const data = await response.json();
      setScholarships(data.scholarships || []);
    } catch (error) {
      console.error('Error loading scholarships:', error);
      toast.error('Failed to load scholarships');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = () => {
    // Load user profile from SSI wallet or localStorage
    const selectedCredential = localStorage.getItem('selectedCredential');
    if (selectedCredential) {
      try {
        const credential = JSON.parse(selectedCredential);
        const profile: UserProfile = {};

        switch (credential.type) {
          case 'IncomeCredential':
            const income = credential.claims.annualIncome;
            if (income) {
              profile.income = parseInt(income.toString().replace(/[^\d]/g, ''));
            }
            break;
          case 'CasteCredential':
            profile.caste = credential.claims.caste;
            break;
          case 'EducationalCredential':
            const marks = credential.claims.percentage;
            if (marks) {
              profile.marks = parseInt(marks.toString());
            }
            break;
          case 'RegionCredential':
            profile.region = credential.claims.region;
            break;
          case 'DisabilityCredential':
            profile.disability = credential.claims.hasDisability;
            break;
        }

        setUserProfile(profile);
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }
  };

  const getRecommendations = async () => {
    if (Object.keys(userProfile).length === 0) {
      toast.error('Please add credentials to your SSI wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'recommend',
          userProfile,
        }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setShowRecommendations(true);
      toast.success(`Found ${data.recommendations?.length || 0} matching scholarships!`);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const searchScholarships = async () => {
    if (!searchQuery.trim()) {
      loadScholarships();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/scholarships?action=search&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setScholarships(data.scholarships || []);
    } catch (error) {
      console.error('Error searching scholarships:', error);
      toast.error('Failed to search scholarships');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScholarships = scholarships.filter(scholarship => {
    if (selectedCategory !== "all" && scholarship.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'merit': return <GraduationCap className="w-3 h-3" />;
      case 'need': return <DollarSign className="w-3 h-3" />;
      case 'caste': return <Shield className="w-3 h-3" />;
      case 'disability': return <Shield className="w-3 h-3" />;
      case 'regional': return <Shield className="w-3 h-3" />;
      case 'sports': return <Shield className="w-3 h-3" />;
      case 'research': return <GraduationCap className="w-3 h-3" />;
      default: return <Shield className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'merit': return 'bg-blue-100 text-blue-800';
      case 'need': return 'bg-green-100 text-green-800';
      case 'caste': return 'bg-purple-100 text-purple-800';
      case 'disability': return 'bg-orange-100 text-orange-800';
      case 'regional': return 'bg-yellow-100 text-yellow-800';
      case 'sports': return 'bg-red-100 text-red-800';
      case 'research': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Smart Scholarship Finder
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover scholarships from government portals and get personalized recommendations based on your credentials.
          All data is scraped from official sources and updated regularly.
        </p>
      </div>

      {/* User Profile Summary */}
      {Object.keys(userProfile).length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Shield className="w-5 h-5" />
              <span>Your Profile (from SSI Wallet)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {userProfile.income && (
                <div>
                  <span className="text-green-700 font-medium">Income:</span>
                  <span className="text-green-600 ml-1">₹{userProfile.income.toLocaleString()}</span>
                </div>
              )}
              {userProfile.caste && (
                <div>
                  <span className="text-green-700 font-medium">Caste:</span>
                  <span className="text-green-600 ml-1">{userProfile.caste}</span>
                </div>
              )}
              {userProfile.marks && (
                <div>
                  <span className="text-green-700 font-medium">Marks:</span>
                  <span className="text-green-600 ml-1">{userProfile.marks}%</span>
                </div>
              )}
              {userProfile.region && (
                <div>
                  <span className="text-green-700 font-medium">Region:</span>
                  <span className="text-green-600 ml-1">{userProfile.region}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                onClick={getRecommendations}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Get Personalized Recommendations
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/wallet')}
              >
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Scholarships</CardTitle>
          <CardDescription>
            Search from {scholarships.length} scholarships scraped from government portals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Search scholarships by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchScholarships()}
                />
              </div>
              <Button onClick={searchScholarships} disabled={isLoading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter by:</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="merit">Merit-based</option>
                  <option value="need">Need-based</option>
                  <option value="caste">Caste-based</option>
                  <option value="disability">Disability</option>
                  <option value="regional">Regional</option>
                  <option value="sports">Sports</option>
                  <option value="research">Research</option>
                </select>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Star className="w-5 h-5" />
              <span>Personalized Recommendations</span>
            </CardTitle>
            <CardDescription>
              Based on your profile, here are the best matching scholarships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec, index) => (
                <Card key={rec.scholarship.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-green-800">{rec.scholarship.name}</CardTitle>
                        <CardDescription className="mt-2 text-green-700">
                          {rec.scholarship.description}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {rec.matchScore.toFixed(0)}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Amount:</span>
                        <span className="font-semibold text-green-800">{rec.scholarship.amount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Source:</span>
                        <span className="text-sm text-green-600">{rec.scholarship.source}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Deadline:</span>
                        <span className="text-sm">{new Date(rec.scholarship.deadline).toLocaleDateString()}</span>
                      </div>
                      
                      {rec.matchReasons.length > 0 && (
                        <div className="pt-3 border-t border-green-200">
                          <h4 className="text-sm font-medium text-green-800 mb-2">Why this matches:</h4>
                          <ul className="space-y-1 text-sm text-green-700">
                            {rec.matchReasons.slice(0, 3).map((reason, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex space-x-2 pt-3">
                        <Button 
                          onClick={() => router.push(`/scholarship/application/${rec.scholarship.id}`)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Apply Now
                        </Button>
                        {rec.scholarship.applicationUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(rec.scholarship.applicationUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Scholarships */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Scholarships</CardTitle>
          <CardDescription>
            {isLoading ? "Loading scholarships..." : `${filteredScholarships.length} scholarships found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScholarships.map((scholarship) => (
                <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
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
                        <span className="text-sm text-gray-600">Source:</span>
                        <span className="text-sm">{scholarship.source}</span>
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

                      <div className="flex space-x-2 pt-3">
                        <Button 
                          onClick={() => router.push(`/scholarship/application/${scholarship.id}`)}
                          className="flex-1"
                          disabled={scholarship.status !== 'open'}
                        >
                          Apply Now
                        </Button>
                        {scholarship.applicationUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(scholarship.applicationUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 