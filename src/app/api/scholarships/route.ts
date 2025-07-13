import { NextRequest, NextResponse } from 'next/server';
import { scholarshipScraper, UserProfile } from '@/lib/scholarship-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    if (action === 'search' && query) {
      const results = await scholarshipScraper.searchScholarships(query);
      return NextResponse.json({ scholarships: results });
    }

    if (action === 'recommend') {
      // Get user profile from query parameters
      const profile: UserProfile = {
        income: searchParams.get('income') ? parseInt(searchParams.get('income')!) : undefined,
        caste: searchParams.get('caste') || undefined,
        marks: searchParams.get('marks') ? parseInt(searchParams.get('marks')!) : undefined,
        region: (searchParams.get('region') as 'rural' | 'urban') || undefined,
        disability: searchParams.get('disability') === 'true',
        age: searchParams.get('age') ? parseInt(searchParams.get('age')!) : undefined,
        course: searchParams.get('course') || undefined,
        institution: searchParams.get('institution') || undefined,
      };

      const recommendations = await scholarshipScraper.getRecommendations(profile);
      return NextResponse.json({ recommendations });
    }

    // Default: return all scholarships
    const scholarships = await scholarshipScraper.scrapeScholarships();
    return NextResponse.json({ scholarships });
  } catch (error) {
    console.error('Scholarship API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scholarships' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userProfile, query } = body;

    if (action === 'recommend' && userProfile) {
      const recommendations = await scholarshipScraper.getRecommendations(userProfile);
      return NextResponse.json({ recommendations });
    }

    if (action === 'search' && query) {
      const results = await scholarshipScraper.searchScholarships(query);
      return NextResponse.json({ scholarships: results });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Scholarship API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 