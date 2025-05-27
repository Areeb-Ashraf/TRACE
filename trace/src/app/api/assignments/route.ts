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
      // Professors see assignments they created
      whereClause = { professorId: session.user.id }
    } else if (session.user.role === "STUDENT") {
      // Students see published assignments
      whereClause = { status: "PUBLISHED" }
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
      status = "DRAFT"
    } = await req.json()

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: "Title, description, and due date are required" },
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

    const assignment = await prisma.assignment.create({
      data: {
        professorId: session.user.id,
        title,
        description,
        instructions,
        dueDate: dueDateObj,
        estimatedTime,
        maxWords,
        minWords,
        status
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
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