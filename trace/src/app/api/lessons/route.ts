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
      // Professors see lessons they created, filtered by classId if provided
      whereClause = { professorId: session.user.id }
      if (classId) {
        whereClause.classId = classId
      }
    } else if (session.user.role === "STUDENT") {
      // Students see published lessons for classes they are enrolled in
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

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
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
          },
          _count: {
            select: {
              progress: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.lesson.count({ where: whereClause })
    ])

    return NextResponse.json({
      lessons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get lessons error:", error)
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
      return NextResponse.json({ error: "Only professors can create lessons" }, { status: 403 })
    }

    const { 
      title, 
      description, 
      subject,
      topic,
      difficulty = "intermediate",
      estimatedTime, 
      learningObjectives = [],
      content,
      resources = [],
      sections = [],
      status = "DRAFT",
      sourceType = "manual",
      sourceS3Key,
      classId // New: Add classId to the request body
    }: { 
      title: string; 
      description: string; 
      subject?: string;
      topic?: string;
      difficulty?: string;
      estimatedTime?: number; 
      learningObjectives?: string[];
      content: string;
      resources?: string[];
      sections?: any[];
      status?: string;
      sourceType?: string;
      sourceS3Key?: string;
      classId: string; // New: classId is required
    } = await req.json()

    if (!title || !description || !content || !classId) { // New: classId is required
      return NextResponse.json(
        { error: "Title, description, content, and class are required" },
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

    // Create lesson with sections in a transaction
    const result = await prisma.$transaction(async (tx: Parameters<typeof prisma.$transaction>[0]) => {
      const lesson = await tx.lesson.create({
        data: {
          professorId: session.user.id,
          classId, // New: Add classId to lesson creation
          title,
          description,
          subject,
          topic,
          difficulty,
          estimatedTime,
          learningObjectives,
          content,
          resources,
          status,
          sourceType,
          sourceS3Key
        }
      })

      // Create sections if provided
      if (sections.length > 0) {
        await tx.lessonSection.createMany({
          data: sections.map((section: any, index: number) => ({
            lessonId: lesson.id,
            title: section.title,
            content: section.content,
            order: section.order || index + 1,
            sectionType: section.sectionType || 'content',
            metadata: section.metadata || {}
          }))
        })
      }

      // Fetch the complete lesson with sections
      return await tx.lesson.findUnique({
        where: { id: lesson.id },
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
          },
          _count: {
            select: {
              progress: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      message: "Lesson created successfully",
      lesson: result
    })
  } catch (error) {
    console.error("Create lesson error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 