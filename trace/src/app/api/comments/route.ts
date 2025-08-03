import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/comments - Fetch comments with strict privacy filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get("assignmentId")
    const quizId = searchParams.get("quizId") 
    const lessonId = searchParams.get("lessonId")

    // Must specify exactly one target
    const targetCount = [assignmentId, quizId, lessonId].filter(Boolean).length
    if (targetCount !== 1) {
      return NextResponse.json({ 
        error: "Must specify exactly one target: assignmentId, quizId, or lessonId" 
      }, { status: 400 })
    }

    // Build where clause for the target
    let whereClause: any = {}
    let targetInfo: any = null

    if (assignmentId) {
      whereClause.assignmentId = assignmentId
      // Get assignment info to verify class ownership
      targetInfo = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { professor: true, class: true }
      })
    } else if (quizId) {
      whereClause.quizId = quizId
      // Get quiz info to verify class ownership
      targetInfo = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { professor: true, class: true }
      })
    } else if (lessonId) {
      whereClause.lessonId = lessonId
      // Get lesson info to verify class ownership
      targetInfo = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { professor: true, class: true }
      })
    }

    if (!targetInfo) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 })
    }

    // PRIVACY ENFORCEMENT: Only show comments to:
    // 1. The professor who owns the class
    // 2. The student who wrote each specific comment
    let comments
    
    if (session.user.role === "PROFESSOR" && session.user.id === targetInfo.professorId) {
      // Professor can see ALL comments for their class content
      comments = await prisma.comment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    } else if (session.user.role === "STUDENT") {
      // Students can ONLY see their own comments
      comments = await prisma.comment.findMany({
        where: {
          ...whereClause,
          userId: session.user.id // Only their own comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/comments - Create a new comment (students only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ 
        error: "Only students can create comments" 
      }, { status: 403 })
    }

    const { content, assignmentId, quizId, lessonId } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Comment content is required" 
      }, { status: 400 })
    }

    // Must specify exactly one target
    const targets = [assignmentId, quizId, lessonId].filter(Boolean)
    if (targets.length !== 1) {
      return NextResponse.json({ 
        error: "Must specify exactly one target: assignmentId, quizId, or lessonId" 
      }, { status: 400 })
    }

    // Verify the student has access to the target (is enrolled in the class)
    let hasAccess = false
    
    if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { 
          class: {
            include: {
              students: {
                where: { studentId: session.user.id }
              }
            }
          }
        }
      })
      hasAccess = !!(assignment && assignment.class.students.length > 0)
    } else if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { 
          class: {
            include: {
              students: {
                where: { studentId: session.user.id }
              }
            }
          }
        }
      })
      hasAccess = !!(quiz && quiz.class.students.length > 0)
    } else if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { 
          class: {
            include: {
              students: {
                where: { studentId: session.user.id }
              }
            }
          }
        }
      })
      hasAccess = !!(lesson && lesson.class.students.length > 0)
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: "You don't have access to comment on this item" 
      }, { status: 403 })
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        assignmentId,
        quizId,
        lessonId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 