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
    const skip = (page - 1) * limit

    let whereClause = {}
    
    if (session.user.role === "PROFESSOR") {
      // Professors see lessons they created
      whereClause = { professorId: session.user.id }
    } else if (session.user.role === "STUDENT") {
      // Students see published lessons
      whereClause = { status: "PUBLISHED" }
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
      sourceS3Key
    } = await req.json()

    if (!title || !description || !content) {
      return NextResponse.json(
        { error: "Title, description, and content are required" },
        { status: 400 }
      )
    }

    // Create lesson with sections in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          professorId: session.user.id,
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