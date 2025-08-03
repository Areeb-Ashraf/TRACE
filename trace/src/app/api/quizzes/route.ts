import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const classId = searchParams.get("classId") // New: Get classId from query params
    const skip = (page - 1) * limit

    let whereClause: any = {}
    
    if (session.user.role === "PROFESSOR") {
      // Professors see quizzes they created, filtered by classId if provided
      whereClause = { professorId: session.user.id }
      if (classId) {
        whereClause.classId = classId
      }
    } else if (session.user.role === "STUDENT") {
      // Students see published quizzes for classes they are enrolled in
      whereClause = { status: "PUBLISHED" }
      if (classId) {
        // If a specific classId is provided, filter by it
        whereClause.classId = classId
      } else {
        // Otherwise, get all classes the student is enrolled in
        const studentClasses = await prisma.studentOnClass.findMany({
          where: { studentId: session.user.id },
          select: { classId: true },
        })
        const enrolledClassIds = studentClasses.map((sc: { classId: string }) => sc.classId)
        whereClause.classId = { in: enrolledClassIds }
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: whereClause,
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: { // New: Include class information
            select: {
              id: true,
              name: true
            }
          },
          questions: {
            include: {
              options: true
            }
          },
          submissions: session.user.role === "PROFESSOR" ? {
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
              submittedAt: true,
              score: true,
              grade: true
            }
          },
          _count: {
            select: {
              submissions: true,
              questions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.quiz.count({ where: whereClause })
    ])

    return NextResponse.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can create quizzes" }, { status: 403 })
    }

    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      estimatedTime,
      timeLimit,
      allowReview,
      randomizeQuestions,
      randomizeOptions,
      status = "DRAFT",
      questions,
      classId // New: Add classId to the request body
    }: { 
      title: string; 
      description: string; 
      instructions?: string; 
      dueDate: string; 
      estimatedTime?: number;
      timeLimit?: number;
      allowReview?: boolean;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      status?: string;
      questions: any[];
      classId: string; // New: classId is required
    } = await req.json()

    if (!title || !description || !dueDate || !classId) { // New: classId is required
      return NextResponse.json(
        { error: "Title, description, due date, and class are required" },
        { status: 400 }
      )
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      )
    }

    // Validate questions and options
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.question || !question.options || !Array.isArray(question.options)) {
        return NextResponse.json(
          { error: `Question ${i + 1} is missing question text or options` },
          { status: 400 }
        )
      }

      if (question.options.length < 2) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least 2 options` },
          { status: 400 }
        )
      }

      console.log(`\n🔍 Validating Question ${i + 1}:`)
      console.log(`  - Question: "${question.question.substring(0, 50)}..."`)
      console.log(`  - Type: ${question.type}`)
      console.log(`  - Options:`)
      question.options.forEach((opt: any, idx: number) => {
        console.log(`    ${idx + 1}. "${opt.text}" - isCorrect: ${opt.isCorrect} (type: ${typeof opt.isCorrect})`)
      })

      const correctOptions = question.options.filter((opt: any) => opt.isCorrect === true)
      console.log(`  - Correct options found: ${correctOptions.length}`)
      
      if (correctOptions.length === 0) {
        return NextResponse.json(
          { error: `Question ${i + 1} must have at least one correct answer` },
          { status: 400 }
        )
      }

      if (question.type === 'TRUE_FALSE' && question.options.length !== 2) {
        return NextResponse.json(
          { error: `True/False questions must have exactly 2 options` },
          { status: 400 }
        )
      }
    }

    // Validate due date is in the future
    const dueDateObj = new Date(dueDate)
    if (dueDateObj <= new Date()) {
      return NextResponse.json(
        { error: "Due date must be in the future" },
        { status: 400 }
      )
    }

    // Verify professor owns the class
    const professorOwnsClass = await prisma.class.findFirst({
      where: {
        id: classId,
        professorId: session.user.id,
      },
    });

    if (!professorOwnsClass) {
      return NextResponse.json({ error: "Professor does not own this class" }, { status: 403 });
    }

    console.log('\n📝 Creating quiz with questions and options...')

    const quiz = await prisma.quiz.create({
      data: {
        professorId: session.user.id,
        classId, // New: Add classId to quiz creation
        title,
        description,
        instructions,
        dueDate: dueDateObj,
        estimatedTime,
        timeLimit,
        allowReview,
        randomizeQuestions,
        randomizeOptions,
        status,
        questions: {
          create: questions.map((q: any, index: number) => {
            console.log(`\n📋 Creating Question ${index + 1}: "${q.question.substring(0, 30)}..."`)
            return {
              type: q.type || 'MULTIPLE_CHOICE',
              question: q.question,
              points: q.points || 1,
              order: index + 1,
              explanation: q.explanation,
              options: {
                create: q.options.map((opt: any, optIndex: number) => {
                  const optionData = {
                    text: opt.text,
                    isCorrect: Boolean(opt.isCorrect), // Ensure it's explicitly boolean
                    order: optIndex + 1
                  }
                  console.log(`  📝 Option ${optIndex + 1}: "${opt.text}" - isCorrect: ${optionData.isCorrect}`)
                  return optionData
                })
              }
            }
          })
        }
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: { // New: Include class information after creation
          select: {
            id: true,
            name: true
          }
        },
        questions: {
          include: {
            options: true
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

    console.log('✅ Quiz created successfully with ID:', quiz.id)

    return NextResponse.json({
      message: "Quiz created successfully",
      quiz
    })
  } catch (error) {
    console.error("Create quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 