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
    const classId = searchParams.get("classId") // Get classId from query params
    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (session.user.role === "PROFESSOR") {
      // Professors see assignments they created, filtered by classId if provided
      whereClause = { professorId: session.user.id }
      if (classId) {
        whereClause.classId = classId
      }
    } else if (session.user.role === "STUDENT") {
      // Students see published assignments for classes they are enrolled in
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
        const enrolledClassIds = studentClasses.map((sc: { classId: string; }) => sc.classId)
        whereClause.classId = { in: enrolledClassIds }
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where: whereClause,
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
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
              grade: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.assignment.count({ where: whereClause })
    ])

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get assignments error:", error)
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
      return NextResponse.json({ error: "Only professors can create assignments" }, { status: 403 })
    }

    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      estimatedTime, 
      maxWords, 
      minWords,
      status = "DRAFT",
      classId // New field
    }: { 
      title: string; 
      description: string; 
      instructions?: string; 
      dueDate: string; 
      estimatedTime?: number; 
      maxWords?: number; 
      minWords?: number; 
      status?: string; // Use string for status initially
      classId: string; 
    } = await req.json()

    if (!title || !description || !dueDate || !classId) {
      return NextResponse.json(
        { error: "Title, description, due date, and class are required" },
        { status: 400 }
      )
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

    const assignment = await prisma.assignment.create({
      data: {
        professorId: session.user.id,
        classId,
        title,
        description,
        instructions,
        dueDate: dueDateObj,
        estimatedTime,
        maxWords,
        minWords,
        status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" // Cast to valid enum values
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
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
            submissions: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Assignment created successfully",
      assignment
    })
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 