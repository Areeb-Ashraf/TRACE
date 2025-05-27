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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
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
            grade: true,
            feedback: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === "STUDENT" && assignment.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Assignment not available" }, { status: 403 })
    }

    if (session.user.role === "PROFESSOR" && assignment.professorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error("Get assignment error:", error)
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
      return NextResponse.json({ error: "Only professors can update assignments" }, { status: 403 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    if (assignment.professorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      estimatedTime, 
      maxWords, 
      minWords,
      status
    } = await req.json()

    // Validate due date if provided
    let dueDateObj
    if (dueDate) {
      dueDateObj = new Date(dueDate)
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          { error: "Due date must be in the future" },
          { status: 400 }
        )
      }
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(dueDateObj && { dueDate: dueDateObj }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(maxWords !== undefined && { maxWords }),
        ...(minWords !== undefined && { minWords }),
        ...(status && { status })
      },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
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
      message: "Assignment updated successfully",
      assignment: updatedAssignment
    })
  } catch (error) {
    console.error("Update assignment error:", error)
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
      return NextResponse.json({ error: "Only professors can delete assignments" }, { status: 403 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        submissions: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    if (assignment.professorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if there are submitted assignments
    const submittedCount = assignment.submissions.filter(s => s.status === "SUBMITTED").length
    if (submittedCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete assignment with ${submittedCount} submitted submissions` },
        { status: 400 }
      )
    }

    // Delete assignment (submissions will be cascade deleted)
    await prisma.assignment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Assignment deleted successfully"
    })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 