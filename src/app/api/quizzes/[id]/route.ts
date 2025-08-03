import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        submissions: session.user.role === "PROFESSOR" ? {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            answers: {
              include: {
                question: true,
                option: true
              }
            }
          }
        } : {
          where: { studentId: session.user.id },
          include: {
            answers: {
              include: {
                question: true,
                option: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true,
            questions: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === "STUDENT" && quiz.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Quiz not available" }, { status: 403 })
    }

    if (session.user.role === "PROFESSOR" && quiz.professorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can update quizzes" }, { status: 403 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { submissions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.professorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updateData = await req.json()

    // If quiz has submissions, only allow status and grading updates
    if (quiz.submissions.length > 0) {
      const allowedFields = ['status', 'grade', 'feedback']
      const hasDisallowedFields = Object.keys(updateData).some(
        key => !allowedFields.includes(key)
      )
      
      if (hasDisallowedFields) {
        return NextResponse.json(
          { error: "Cannot modify quiz content after submissions exist" },
          { status: 400 }
        )
      }
    }

    // Validate due date if provided
    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate)
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          { error: "Due date must be in the future" },
          { status: 400 }
        )
      }
      updateData.dueDate = dueDateObj
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true,
            questions: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Quiz updated successfully",
      quiz: updatedQuiz
    })
  } catch (error) {
    console.error("Update quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can delete quizzes" }, { status: 403 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { submissions: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.professorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Prevent deletion if there are submissions
    if (quiz.submissions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete quiz with existing submissions" },
        { status: 400 }
      )
    }

    await prisma.quiz.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Quiz deleted successfully"
    })
  } catch (error) {
    console.error("Delete quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 