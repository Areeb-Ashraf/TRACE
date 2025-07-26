import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/classes/[id]/enroll - Enroll a student in a class (Professor only)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const classId = params.id

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can enroll students" }, { status: 403 })
    }

    const { studentId }: { studentId: string } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Verify professor owns the class
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass || existingClass.professorId !== session.user.id) {
      return NextResponse.json({ error: "Class not found or forbidden" }, { status: 403 })
    }

    // Check if student exists
    const studentExists = await prisma.user.findUnique({
      where: { id: studentId, role: "STUDENT" },
    });

    if (!studentExists) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if student is already enrolled
    const alreadyEnrolled = await prisma.studentOnClass.findFirst({
      where: { studentId, classId },
    });

    if (alreadyEnrolled) {
      return NextResponse.json({ message: "Student already enrolled in this class" }, { status: 200 })
    }

    const enrollment = await prisma.studentOnClass.create({
      data: {
        studentId,
        classId,
      },
    });

    return NextResponse.json({
      message: "Student enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/classes/[id]/enroll - Unenroll a student from a class (Professor only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const classId = params.id

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Only professors can unenroll students" }, { status: 403 })
    }

    const { studentId }: { studentId: string } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    // Verify professor owns the class
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass || existingClass.professorId !== session.user.id) {
      return NextResponse.json({ error: "Class not found or forbidden" }, { status: 403 })
    }

    const unenrollment = await prisma.studentOnClass.deleteMany({
      where: {
        studentId,
        classId,
      },
    });

    if (unenrollment.count === 0) {
      return NextResponse.json({ message: "Student not enrolled in this class" }, { status: 404 })
    }

    return NextResponse.json({ message: "Student unenrolled successfully" })
  } catch (error) {
    console.error("Unenroll student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 