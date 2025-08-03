import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can start quiz submissions" }, { status: 403 })
    }

    const { quizId } = await req.json()

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 })
    }

    // Check if quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (quiz.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Quiz is not available" }, { status: 403 })
    }

    // Check if quiz is past due date
    if (new Date() > quiz.dueDate) {
      return NextResponse.json({ error: "Quiz submission deadline has passed" }, { status: 400 })
    }

    // Check if student already has a submission
    const existingSubmission = await prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId: quizId,
          studentId: session.user.id
        }
      }
    })

    if (existingSubmission) {
      if (existingSubmission.status === "SUBMITTED") {
        return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
      }
      
      // Return existing submission with full quiz data including questions
      const fullSubmission = await prisma.quizSubmission.findUnique({
        where: {
          id: existingSubmission.id
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  options: true
                },
                orderBy: { order: 'asc' }
              }
            }
          },
          answers: {
            include: {
              question: true,
              option: true
            }
          }
        }
      })
      
      return NextResponse.json({
        message: "Resuming existing quiz submission",
        submission: fullSubmission
      })
    }

    // Calculate total points
    const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0)

    // Create new submission
    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: quizId,
        studentId: session.user.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        totalPoints: totalPoints
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        answers: {
          include: {
            question: true,
            option: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Quiz submission started successfully",
      submission
    })
  } catch (error) {
    console.error("Start quiz submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const quizId = searchParams.get("quizId")
    const studentId = searchParams.get("studentId")

    let whereClause: any = {}

    if (session.user.role === "PROFESSOR") {
      // Professors can see submissions for their quizzes
      if (quizId) {
        // Verify professor owns the quiz
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId }
        })
        
        if (!quiz || quiz.professorId !== session.user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        
        whereClause.quizId = quizId
      } else {
        // Get all submissions for professor's quizzes
        whereClause.quiz = {
          professorId: session.user.id
        }
      }
      
      if (studentId) {
        whereClause.studentId = studentId
      }
    } else if (session.user.role === "STUDENT") {
      // Students can only see their own submissions
      whereClause.studentId = session.user.id
      if (quizId) {
        whereClause.quizId = quizId
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submissions = await prisma.quizSubmission.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            timeLimit: true,
            allowReview: true
          }
        },
        student: session.user.role === "PROFESSOR" ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined,
        answers: {
          include: {
            question: {
              include: {
                options: true
              }
            },
            option: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Get quiz submissions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 