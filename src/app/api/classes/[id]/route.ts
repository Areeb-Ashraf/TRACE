import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/classes/[id] - Get a specific class by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const classId = params.id

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        students: {
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
        assignments: {},
        quizzes: {},
        lessons: {}
      }
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Authorization check
    if (session.user.role === "PROFESSOR" && classData.professorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user.role === "STUDENT") {
      const isStudentEnrolled = await prisma.studentOnClass.findFirst({
        where: {
          studentId: session.user.id,
          classId: classId,
        },
      });

      if (!isStudentEnrolled && classData.professorId !== session.user.id) { // Allow professor to view their own class
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json(classData)
  } catch (error) {
    console.error("Get class by ID error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/classes/[id] - Update a class (Professor only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const classId = params.id

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can update classes" }, { status: 403 })
    }

    const { name, description }: { name?: string; description?: string } = await req.json()

    if (!name && !description) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Verify professor owns the class
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass || existingClass.professorId !== session.user.id) {
      return NextResponse.json({ error: "Class not found or forbidden" }, { status: 403 })
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { name, description }
    })

    return NextResponse.json({
      message: "Class updated successfully",
      class: updatedClass
    })
  } catch (error) {
    console.error("Update class error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/classes/[id] - Delete a class (Professor only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const classId = params.id

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can delete classes" }, { status: 403 })
    }

    // Verify professor owns the class
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass || existingClass.professorId !== session.user.id) {
      return NextResponse.json({ error: "Class not found or forbidden" }, { status: 403 })
    }

    await prisma.class.delete({
      where: { id: classId }
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Delete class error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

 