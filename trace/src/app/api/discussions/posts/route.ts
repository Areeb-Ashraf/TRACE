import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/discussions/posts?boardId=xxx - Get posts for a discussion board
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to the discussion board
    const discussionBoard = await prisma.discussionBoard.findFirst({
      where: {
        id: boardId,
        assignment: {
          class: {
            OR: [
              { professorId: user.id },
              {
                students: {
                  some: {
                    studentId: user.id,
                  },
                },
              },
            ],
          },
        },
      },
    });

    if (!discussionBoard) {
      return NextResponse.json(
        { error: 'Discussion board not found or access denied' },
        { status: 404 }
      );
    }

    // Get posts for the discussion board (only top-level posts, replies will be included)
    const posts = await prisma.discussionPost.findMany({
      where: {
        boardId,
        parentId: null, // Only top-level posts
      },
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
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching discussion posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussion posts' },
      { status: 500 }
    );
  }
}

// POST /api/discussions/posts - Create a new discussion post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, content, parentId } = await request.json();

    if (!boardId || !content) {
      return NextResponse.json(
        { error: 'Board ID and content are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to the discussion board
    const discussionBoard = await prisma.discussionBoard.findFirst({
      where: {
        id: boardId,
        assignment: {
          class: {
            OR: [
              { professorId: user.id },
              {
                students: {
                  some: {
                    studentId: user.id,
                  },
                },
              },
            ],
          },
        },
      },
    });

    if (!discussionBoard) {
      return NextResponse.json(
        { error: 'Discussion board not found or access denied' },
        { status: 404 }
      );
    }

    // If this is a reply, check if the parent post exists and is in the same board
    if (parentId) {
      const parentPost = await prisma.discussionPost.findFirst({
        where: {
          id: parentId,
          boardId,
        },
      });

      if (!parentPost) {
        return NextResponse.json(
          { error: 'Parent post not found' },
          { status: 404 }
        );
      }
    }

    // Create the post
    const post = await prisma.discussionPost.create({
      data: {
        content,
        boardId,
        authorId: user.id,
        parentId: parentId || null,
      },
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
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error creating discussion post:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion post' },
      { status: 500 }
    );
  }
} 