export interface ScrapedScholarship {
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

export interface UserProfile {
  income?: number;
  caste?: string;
  marks?: number;
  region?: 'rural' | 'urban';
  disability?: boolean;
  age?: number;
  course?: string;
  institution?: string;
}

export interface ScholarshipRecommendation {
  scholarship: ScrapedScholarship;
  matchScore: number;
  matchReasons: string[];
  missingCriteria: string[];
}

class ScholarshipScraper {
  private scholarships: ScrapedScholarship[] = [];
  private lastScraped: Date | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock data that simulates scraped scholarships from various sources
    this.scholarships = [
      {
        id: "nsp-post-matric-sc",
        name: "National Scholarship Portal - Post Matric SC Scholarship",
        description: "Central government scholarship for Scheduled Caste students pursuing post-matriculation studies",
        amount: "₹25,000 - ₹1,20,000/year",
        eligibility: {
          incomeMax: 250000,
          caste: ["SC"],
          marksMin: 60,
          age: { min: 16, max: 30 }
        },
        deadline: "2024-12-31",
        status: "open",
        category: "caste",
        source: "National Scholarship Portal",
        url: "https://scholarships.gov.in",
        applicationUrl: "https://scholarships.gov.in/sc-post-matric",
        lastUpdated: "2024-01-15"
      },
      {
        id: "nsp-post-matric-st",
        name: "National Scholarship Portal - Post Matric ST Scholarship",
        description: "Central government scholarship for Scheduled Tribe students pursuing post-matriculation studies",
        amount: "₹25,000 - ₹1,20,000/year",
        eligibility: {
          incomeMax: 250000,
          caste: ["ST"],
          marksMin: 60,
          age: { min: 16, max: 30 }
        },
        deadline: "2024-12-31",
        status: "open",
        category: "caste",
        source: "National Scholarship Portal",
        url: "https://scholarships.gov.in",
        applicationUrl: "https://scholarships.gov.in/st-post-matric",
        lastUpdated: "2024-01-15"
      },
      {
        id: "nsp-obc-scholarship",
        name: "National Scholarship Portal - OBC Scholarship",
        description: "Central government scholarship for Other Backward Classes students",
        amount: "₹15,000 - ₹75,000/year",
        eligibility: {
          incomeMax: 450000,
          caste: ["OBC"],
          marksMin: 65,
          age: { min: 16, max: 30 }
        },
        deadline: "2024-12-31",
        status: "open",
        category: "caste",
        source: "National Scholarship Portal",
        url: "https://scholarships.gov.in",
        applicationUrl: "https://scholarships.gov.in/obc-scholarship",
        lastUpdated: "2024-01-15"
      },
      {
        id: "nsp-merit-cum-means",
        name: "National Scholarship Portal - Merit-cum-Means Scholarship",
        description: "Scholarship for students from economically weaker sections based on merit and means",
        amount: "₹20,000 - ₹1,00,000/year",
        eligibility: {
          incomeMax: 800000,
          caste: ["General", "OBC", "SC", "ST"],
          marksMin: 75,
          age: { min: 16, max: 30 }
        },
        deadline: "2024-12-31",
        status: "open",
        category: "merit",
        source: "National Scholarship Portal",
        url: "https://scholarships.gov.in",
        applicationUrl: "https://scholarships.gov.in/merit-cum-means",
        lastUpdated: "2024-01-15"
      },
      {
        id: "nsp-disability-scholarship",
        name: "National Scholarship Portal - Scholarship for Students with Disabilities",
        description: "Scholarship for students with disabilities pursuing higher education",
        amount: "₹30,000 - ₹1,50,000/year",
        eligibility: {
          incomeMax: 1000000,
          caste: ["General", "OBC", "SC", "ST"],
          marksMin: 50,
          disability: true,
          age: { min: 16, max: 35 }
        },
        deadline: "2024-12-31",
        status: "open",
        category: "disability",
        source: "National Scholarship Portal",
        url: "https://scholarships.gov.in",
        applicationUrl: "https://scholarships.gov.in/disability-scholarship",
        lastUpdated: "2024-01-15"
      },
      {
        id: "ugc-net-jrf",
        name: "UGC NET JRF Fellowship",
        description: "Junior Research Fellowship for candidates qualifying UGC NET",
        amount: "₹31,000/month + HRA",
        eligibility: {
          incomeMax: 800000,
          caste: ["General", "OBC", "SC", "ST"],
          marksMin: 55,
          course: ["PhD", "Research"],
          age: { min: 21, max: 30 }
        },
        deadline: "2024-06-30",
        status: "upcoming",
        category: "research",
        source: "University Grants Commission",
        url: "https://ugcnet.nta.nic.in",
        applicationUrl: "https://ugcnet.nta.nic.in/application",
        lastUpdated: "2024-01-10"
      },
      {
        id: "aicte-scholarship",
        name: "AICTE Pragati Scholarship for Girls",
        description: "Scholarship for girl students pursuing technical education",
        amount: "₹50,000/year",
        eligibility: {
          incomeMax: 800000,
          caste: ["General", "OBC", "SC", "ST"],
          marksMin: 70,
          course: ["Engineering", "Technology", "Architecture"],
          age: { min: 16, max: 25 }
        },
        deadline: "2024-11-30",
        status: "open",
        category: "merit",
        source: "All India Council for Technical Education",
        url: "https://www.aicte-india.org",
        applicationUrl: "https://www.aicte-india.org/pragati-scholarship",
        lastUpdated: "2024-01-12"
      },
      {
        id: "karnataka-rural-scholarship",
        name: "Karnataka Rural Student Scholarship",
        description: "State government scholarship for students from rural areas of Karnataka",
        amount: "₹25,000/year",
        eligibility: {
          incomeMax: 500000,
          caste: ["General", "OBC", "SC", "ST"],
          marksMin: 70,
          region: "rural",
          age: { min: 16, max: 25 }
        },
        deadline: "2024-10-31",
        status: "open",
        category: "regional",
        source: "Karnataka State Government",
        url: "https://karnataka.gov.in",
        applicationUrl: "https://karnataka.gov.in/rural-scholarship",
        lastUpdated: "2024-01-08"
      }
    ];
  }

  async scrapeScholarships(): Promise<ScrapedScholarship[]> {
    // Check if we need to refresh the cache
    if (this.lastScraped && (Date.now() - this.lastScraped.getTime()) < this.CACHE_DURATION) {
      return this.scholarships;
    }

    try {
      // In a real implementation, this would scrape from actual websites
      // For now, we'll simulate the scraping process
      console.log("Scraping scholarships from government websites...");
      
      // Simulate API calls to various scholarship portals
      await this.simulateScraping();
      
      this.lastScraped = new Date();
      return this.scholarships;
    } catch (error) {
      console.error("Error scraping scholarships:", error);
      // Return cached data if available
      return this.scholarships;
    }
  }

  private async simulateScraping() {
    // Simulate scraping from different sources
    const sources = [
      "https://scholarships.gov.in",
      "https://www.ugc.ac.in",
      "https://www.aicte-india.org",
      "https://karnataka.gov.in/scholarships"
    ];

    for (const source of sources) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      console.log(`Scraping from ${source}...`);
    }
  }

  async getRecommendations(userProfile: UserProfile): Promise<ScholarshipRecommendation[]> {
    const scholarships = await this.scrapeScholarships();
    const recommendations: ScholarshipRecommendation[] = [];

    for (const scholarship of scholarships) {
      const matchScore = this.calculateMatchScore(scholarship, userProfile);
      const matchReasons = this.getMatchReasons(scholarship, userProfile);
      const missingCriteria = this.getMissingCriteria(scholarship, userProfile);

      if (matchScore > 0) {
        recommendations.push({
          scholarship,
          matchScore,
          matchReasons,
          missingCriteria
        });
      }
    }

    // Sort by match score (highest first)
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateMatchScore(scholarship: ScrapedScholarship, profile: UserProfile): number {
    let score = 0;
    let totalCriteria = 0;

    // Income criteria
    if (scholarship.eligibility.incomeMax && profile.income) {
      totalCriteria++;
      if (profile.income <= scholarship.eligibility.incomeMax) {
        score += 1;
      }
    }

    // Caste criteria
    if (scholarship.eligibility.caste && profile.caste) {
      totalCriteria++;
      if (scholarship.eligibility.caste.includes(profile.caste)) {
        score += 1;
      }
    }

    // Marks criteria
    if (scholarship.eligibility.marksMin && profile.marks) {
      totalCriteria++;
      if (profile.marks >= scholarship.eligibility.marksMin) {
        score += 1;
      }
    }

    // Region criteria
    if (scholarship.eligibility.region && profile.region) {
      totalCriteria++;
      if (profile.region === scholarship.eligibility.region) {
        score += 1;
      }
    }

    // Disability criteria
    if (scholarship.eligibility.disability !== undefined && profile.disability !== undefined) {
      totalCriteria++;
      if (profile.disability === scholarship.eligibility.disability) {
        score += 1;
      }
    }

    // Age criteria
    if (scholarship.eligibility.age && profile.age) {
      totalCriteria++;
      const { min = 0, max = 100 } = scholarship.eligibility.age;
      if (profile.age >= min && profile.age <= max) {
        score += 1;
      }
    }

    // Course criteria
    if (scholarship.eligibility.course && profile.course) {
      totalCriteria++;
      if (scholarship.eligibility.course.some(c => 
        profile.course?.toLowerCase().includes(c.toLowerCase())
      )) {
        score += 1;
      }
    }

    return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0;
  }

  private getMatchReasons(scholarship: ScrapedScholarship, profile: UserProfile): string[] {
    const reasons: string[] = [];

    if (profile.income && scholarship.eligibility.incomeMax && profile.income <= scholarship.eligibility.incomeMax) {
      reasons.push(`Income (₹${profile.income.toLocaleString()}) meets criteria (≤₹${scholarship.eligibility.incomeMax.toLocaleString()})`);
    }

    if (profile.caste && scholarship.eligibility.caste && scholarship.eligibility.caste.includes(profile.caste)) {
      reasons.push(`Caste (${profile.caste}) is eligible`);
    }

    if (profile.marks && scholarship.eligibility.marksMin && profile.marks >= scholarship.eligibility.marksMin) {
      reasons.push(`Marks (${profile.marks}%) meet minimum requirement (≥${scholarship.eligibility.marksMin}%)`);
    }

    if (profile.region && scholarship.eligibility.region && profile.region === scholarship.eligibility.region) {
      reasons.push(`Region (${profile.region}) matches requirement`);
    }

    if (profile.disability !== undefined && scholarship.eligibility.disability !== undefined && profile.disability === scholarship.eligibility.disability) {
      reasons.push(profile.disability ? "Disability criteria met" : "No disability requirement");
    }

    return reasons;
  }

  private getMissingCriteria(scholarship: ScrapedScholarship, profile: UserProfile): string[] {
    const missing: string[] = [];

    if (scholarship.eligibility.incomeMax && (!profile.income || profile.income > scholarship.eligibility.incomeMax)) {
      missing.push(`Income must be ≤₹${scholarship.eligibility.incomeMax.toLocaleString()}`);
    }

    if (scholarship.eligibility.caste && (!profile.caste || !scholarship.eligibility.caste.includes(profile.caste))) {
      missing.push(`Caste must be one of: ${scholarship.eligibility.caste.join(', ')}`);
    }

    if (scholarship.eligibility.marksMin && (!profile.marks || profile.marks < scholarship.eligibility.marksMin)) {
      missing.push(`Marks must be ≥${scholarship.eligibility.marksMin}%`);
    }

    if (scholarship.eligibility.region && (!profile.region || profile.region !== scholarship.eligibility.region)) {
      missing.push(`Region must be: ${scholarship.eligibility.region}`);
    }

    if (scholarship.eligibility.disability !== undefined && profile.disability !== scholarship.eligibility.disability) {
      missing.push(scholarship.eligibility.disability ? "Disability certificate required" : "No disability allowed");
    }

    return missing;
  }

  async searchScholarships(query: string): Promise<ScrapedScholarship[]> {
    const scholarships = await this.scrapeScholarships();
    const searchTerm = query.toLowerCase();

    return scholarships.filter(scholarship => 
      scholarship.name.toLowerCase().includes(searchTerm) ||
      scholarship.description.toLowerCase().includes(searchTerm) ||
      scholarship.category.toLowerCase().includes(searchTerm) ||
      scholarship.source.toLowerCase().includes(searchTerm)
    );
  }

  async getScholarshipById(id: string): Promise<ScrapedScholarship | null> {
    const scholarships = await this.scrapeScholarships();
    return scholarships.find(s => s.id === id) || null;
  }
}

export const scholarshipScraper = new ScholarshipScraper(); 