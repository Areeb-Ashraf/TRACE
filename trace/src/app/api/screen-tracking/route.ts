import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, quizSubmissionId, activities, summary } = body;

    if (!activities) {
      return NextResponse.json({ error: 'Activities are required' }, { status: 400 });
    }

    if (!submissionId && !quizSubmissionId) {
      return NextResponse.json({ error: 'Either submissionId or quizSubmissionId is required' }, { status: 400 });
    }

    // Save screen tracking data
    const screenTracking = await prisma.screenTracking.create({
      data: {
        submissionId: submissionId || null,
        quizSubmissionId: quizSubmissionId || null,
        userId: session.user.id,
        activities: JSON.stringify(activities),
        summary: JSON.stringify(summary),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      screenTrackingId: screenTracking.id 
    });

  } catch (error) {
    console.error('Error saving screen tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to save screen tracking data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const quizSubmissionId = searchParams.get('quizSubmissionId');

    if (!submissionId && !quizSubmissionId) {
      return NextResponse.json({ error: 'Either submissionId or quizSubmissionId is required' }, { status: 400 });
    }

    // Build where clause based on submission type
    const whereClause: any = {
      userId: session.user.id,
    };

    if (submissionId) {
      whereClause.submissionId = submissionId;
    } else if (quizSubmissionId) {
      whereClause.quizSubmissionId = quizSubmissionId;
    }

    // Get screen tracking data for the submission
    const screenTracking = await prisma.screenTracking.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!screenTracking) {
      return NextResponse.json({ 
        activities: [], 
        summary: null 
      });
    }

    return NextResponse.json({
      activities: JSON.parse(screenTracking.activities),
      summary: screenTracking.summary ? JSON.parse(screenTracking.summary) : null,
      createdAt: screenTracking.createdAt,
    });

  } catch (error) {
    console.error('Error fetching screen tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screen tracking data' },
      { status: 500 }
    );
  }
} 