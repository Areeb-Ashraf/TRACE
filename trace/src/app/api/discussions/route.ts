import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/discussions - Get all discussion boards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get discussion boards based on user role and class enrollment
    let discussionBoards;

    if (user.role === 'PROFESSOR') {
      // Professors can see discussion boards for their classes
      discussionBoards = await prisma.discussionBoard.findMany({
        where: {
          assignment: {
            class: {
              professorId: user.id,
            },
          },
        },
        include: {
          assignment: {
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
          posts: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          assignment: {
            createdAt: 'desc',
          },
        },
      });
    } else {
      // Students can see discussion boards for classes they're enrolled in
      discussionBoards = await prisma.discussionBoard.findMany({
        where: {
          assignment: {
            class: {
              students: {
                some: {
                  studentId: user.id,
                },
              },
            },
          },
        },
        include: {
          assignment: {
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
          posts: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          assignment: {
            createdAt: 'desc',
          },
        },
      });
    }

    return NextResponse.json({ discussionBoards });
  } catch (error) {
    console.error('Error fetching discussion boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussion boards' },
      { status: 500 }
    );
  }
}

// POST /api/discussions - Create a new discussion board
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId, prompt } = await request.json();

    if (!assignmentId || !prompt) {
      return NextResponse.json(
        { error: 'Assignment ID and prompt are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is the professor of the assignment's class
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        class: {
          professorId: user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if discussion board already exists for this assignment
    const existingBoard = await prisma.discussionBoard.findUnique({
      where: { assignmentId },
    });

    if (existingBoard) {
      return NextResponse.json(
        { error: 'Discussion board already exists for this assignment' },
        { status: 400 }
      );
    }

    // Create discussion board
    const discussionBoard = await prisma.discussionBoard.create({
      data: {
        assignmentId,
        prompt,
      },
      include: {
        assignment: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ discussionBoard });
  } catch (error) {
    console.error('Error creating discussion board:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion board' },
      { status: 500 }
    );
  }
} 