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

    let whereClause: any = { id: lessonId }
    
    if (session.user.role === "STUDENT") {
      // Students can only see published lessons
      whereClause.status = "PUBLISHED"
    } else if (session.user.role === "PROFESSOR") {
      // Professors can only see their own lessons
      whereClause.professorId = session.user.id
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lesson = await prisma.lesson.findUnique({
      where: whereClause,
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sections: {
          orderBy: { order: 'asc' }
        },
        progress: session.user.role === "PROFESSOR" ? {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        } : {
          where: { studentId: session.user.id },
          select: {
            id: true,
            status: true,
            progressData: true,
            timeSpent: true,
            completedAt: true,
            lastAccessAt: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    console.error("Get lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can update lessons" }, { status: 403 })
    }

    const { id: lessonId } = await params
    const updateData = await req.json()

    // Verify the lesson belongs to the professor
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        professorId: session.user.id
      }
    })

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sections: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Lesson updated successfully",
      lesson: updatedLesson
    })
  } catch (error) {
    console.error("Update lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can delete lessons" }, { status: 403 })
    }

    const { id: lessonId } = await params

    // Verify the lesson belongs to the professor
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        professorId: session.user.id
      }
    })

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Delete the lesson (cascade will handle related records)
    await prisma.lesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully"
    })
  } catch (error) {
    console.error("Delete lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 