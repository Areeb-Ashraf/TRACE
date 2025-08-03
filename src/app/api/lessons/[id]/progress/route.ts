import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: lessonId } = await params

    if (session.user.role === "STUDENT") {
      // Students can only see their own progress
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          lessonId_studentId: {
            lessonId: lessonId,
            studentId: session.user.id
          }
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      })

      if (!progress?.lesson || progress.lesson.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Lesson not found or not available" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        progress: {
          id: progress.id,
          status: progress.status,
          progressData: progress.progressData,
          timeSpent: progress.timeSpent,
          completedAt: progress.completedAt,
          lastAccessAt: progress.lastAccessAt
        }
      })
    } else if (session.user.role === "PROFESSOR") {
      // Professors can see all student progress for their lessons
      const lesson = await prisma.lesson.findUnique({
        where: {
          id: lessonId,
          professorId: session.user.id
        }
      })

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
      }

      const allProgress = await prisma.lessonProgress.findMany({
        where: {
          lessonId: lessonId
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          lastAccessAt: 'desc'
        }
      })

      return NextResponse.json({
        success: true,
        progress: allProgress
      })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

  } catch (error) {
    console.error('Get lesson progress error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can update progress" }, { status: 403 })
    }

    const { id: lessonId } = await params
    const { 
      status, 
      progressData, 
      timeSpent, 
      sectionProgress,
      completed = false 
    } = await req.json()

    // Verify lesson exists and is published
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: lessonId,
        status: "PUBLISHED"
      },
      select: { id: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or not available" }, { status: 404 })
    }

    // Update or create progress
    const updatedProgress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_studentId: {
          lessonId: lessonId,
          studentId: session.user.id
        }
      },
      update: {
        status: status || 'IN_PROGRESS',
        progressData: progressData || {},
        timeSpent: timeSpent || undefined,
        completedAt: completed ? new Date() : null,
        lastAccessAt: new Date()
      },
      create: {
        lessonId: lessonId,
        studentId: session.user.id,
        status: status || 'IN_PROGRESS',
        progressData: progressData || {},
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null,
        lastAccessAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      progress: {
        id: updatedProgress.id,
        status: updatedProgress.status,
        progressData: updatedProgress.progressData,
        timeSpent: updatedProgress.timeSpent,
        completedAt: updatedProgress.completedAt,
        lastAccessAt: updatedProgress.lastAccessAt
      }
    })

  } catch (error) {
    console.error('Update lesson progress error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can mark lessons as complete" }, { status: 403 })
    }

    const { id: lessonId } = await params

    // Verify lesson exists and is published
    const lesson = await prisma.lesson.findUnique({
      where: { 
        id: lessonId,
        status: "PUBLISHED"
      },
      select: { id: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found or not available" }, { status: 404 })
    }

    // Get current progress to preserve existing data
    const currentProgress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: lessonId,
          studentId: session.user.id
        }
      }
    })

    // Get lesson sections for completion tracking
    const fullLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { sections: true }
    })

    // Mark lesson as completed
    const completedProgress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_studentId: {
          lessonId: lessonId,
          studentId: session.user.id
        }
      },
      update: {
        status: 'COMPLETED',
        progressData: {
          ...(currentProgress?.progressData as any || {}),
          percentage: 100,
          completedSections: fullLesson?.sections.map((_, index) => index) || [],
          allSectionsCompleted: true
        },
        completedAt: new Date(),
        lastAccessAt: new Date()
      },
      create: {
        lessonId: lessonId,
        studentId: session.user.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        lastAccessAt: new Date(),
        progressData: {
          percentage: 100,
          completedSections: fullLesson?.sections.map((_, index) => index) || [],
          allSectionsCompleted: true
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Lesson marked as completed",
      progress: {
        id: completedProgress.id,
        status: completedProgress.status,
        completedAt: completedProgress.completedAt
      }
    })

  } catch (error) {
    console.error('Complete lesson error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
} 