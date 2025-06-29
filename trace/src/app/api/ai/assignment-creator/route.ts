import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AssignmentCreatorService } from '@/lib/ai/assignment-creator';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only professors can create assignments
    if (session.user.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Only professors can create AI assignments' }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || action !== 'create_assignment') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const assignmentService = new AssignmentCreatorService();
    return await handleCreateAssignment(assignmentService, data, session.user.id);

  } catch (error: any) {
    console.error('AI Assignment Creator API Error:', error);
    
    // Handle specific AI service errors
    if (error.message?.includes('API key')) {
      return NextResponse.json({ 
        error: 'AI service not configured. Please check your API keys.' 
      }, { status: 500 });
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'AI service rate limit exceeded. Please try again in a moment.' 
      }, { status: 429 });
    }
    
    if (error.message?.includes('context length')) {
      return NextResponse.json({ 
        error: 'Content too long for AI processing. Please shorten your input.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to process request. Please try again.' 
    }, { status: 500 });
  }
}

async function handleCreateAssignment(service: AssignmentCreatorService, data: any, professorId: string) {
  // Validate required fields
  const requiredFields = ['subject', 'topic', 'learningObjectives', 'difficulty', 'type', 'duration'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return NextResponse.json({ 
        error: `Missing required field: ${field}` 
      }, { status: 400 });
    }
  }

  // Validate learning objectives
  if (!Array.isArray(data.learningObjectives) || data.learningObjectives.length === 0) {
    return NextResponse.json({ 
      error: 'At least one learning objective is required' 
    }, { status: 400 });
  }

  // Validate duration
  if (typeof data.duration !== 'number' || data.duration < 15 || data.duration > 240) {
    return NextResponse.json({ 
      error: 'Duration must be a number between 15 and 240 minutes' 
    }, { status: 400 });
  }

  // Validate difficulty
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(data.difficulty)) {
    return NextResponse.json({ 
      error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` 
    }, { status: 400 });
  }

  // Validate type
  const validTypes = ['essay', 'project', 'presentation', 'research', 'discussion', 'quiz'];
  if (!validTypes.includes(data.type)) {
    return NextResponse.json({ 
      error: `Invalid assignment type. Must be one of: ${validTypes.join(', ')}` 
    }, { status: 400 });
  }

  try {
    const assignment = await service.createAssignment({
      subject: data.subject,
      topic: data.topic,
      learningObjectives: data.learningObjectives,
      difficulty: data.difficulty,
      type: data.type,
      duration: data.duration,
      requirements: data.requirements
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Assignment created successfully'
    });

  } catch (error: any) {
    console.error('Assignment creation failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create assignment' 
    }, { status: 500 });
  }
} 