import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { S3Service } from "@/lib/s3"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get("assignmentId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (session.user.role === "STUDENT") {
      // Students see only their own submissions
      whereClause.studentId = session.user.id
      if (assignmentId) {
        whereClause.assignmentId = assignmentId
      }
    } else if (session.user.role === "PROFESSOR") {
      // Professors see submissions for their assignments
      if (assignmentId) {
        // Verify the assignment belongs to this professor
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId, professorId: session.user.id }
        })
        if (!assignment) {
          return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }
        whereClause.assignmentId = assignmentId
      } else {
        // Get all submissions for professor's assignments
        whereClause.assignment = { professorId: session.user.id }
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: whereClause,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              professor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.submission.count({ where: whereClause })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get submissions error:", error)
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

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can create submissions" }, { status: 403 })
    }

    const { assignmentId } = await req.json()

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    // Verify assignment exists and is published
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    if (assignment.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Assignment is not available" }, { status: 403 })
    }

    // Check if assignment is past due
    if (new Date() > assignment.dueDate) {
      return NextResponse.json({ error: "Assignment is past due" }, { status: 403 })
    }

    // Check if student already has a submission for this assignment
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id
        }
      }
    })

    if (existingSubmission) {
      if (existingSubmission.status === "SUBMITTED") {
        return NextResponse.json({ error: "Assignment already submitted" }, { status: 400 })
      }
      // Return existing submission if it's still in progress
      return NextResponse.json({
        message: "Resuming existing submission",
        submission: existingSubmission
      })
    }

    // Create new submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: session.user.id,
        status: "IN_PROGRESS"
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            instructions: true,
            dueDate: true,
            estimatedTime: true,
            maxWords: true,
            minWords: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Submission created successfully",
      submission
    })
  } catch (error) {
    console.error("Create submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 