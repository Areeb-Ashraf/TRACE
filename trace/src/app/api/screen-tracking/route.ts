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
    const { submissionId, activities, summary } = body;

    if (!submissionId || !activities) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save screen tracking data
    const screenTracking = await prisma.screenTracking.create({
      data: {
        submissionId,
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

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Get screen tracking data for the submission
    const screenTracking = await prisma.screenTracking.findFirst({
      where: {
        submissionId,
        userId: session.user.id,
      },
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