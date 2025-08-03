import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { UserRole } from "@prisma/client"

// GET /api/classes - Get all classes for a professor or classes a student is enrolled in
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "PROFESSOR") {
      const classes = await prisma.class.findMany({
        where: { professorId: session.user.id },
        include: {
          _count: {
            select: {
              students: true,
              assignments: true,
              quizzes: true,
              lessons: true,
            },
          },
        },
      });
      return NextResponse.json(classes);
    } else if (session.user.role === "STUDENT") {
      const studentClasses = await prisma.studentOnClass.findMany({
        where: { studentId: session.user.id },
        include: {
          class: {
            include: {
              professor: {
                select: { id: true, name: true, email: true },
              },
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: session.user.id, status: "GRADED" },
                  },
                },
              },
              lessons: {
                include: {
                  progress: {
                    where: { studentId: session.user.id, status: "COMPLETED" },
                  },
                },
              },
            },
          },
        },
      });

      const classesWithGrades = studentClasses.map((sc) => {
        const { class: classData } = sc;
        const assignmentGrades = classData.assignments.flatMap((a) =>
          a.submissions.map((s) => s.grade ?? 0)
        );
        const lessonGrades = classData.lessons.flatMap((l) =>
          l.progress.map((p) => p.grade ?? 0)
        );

        const allGrades = [...assignmentGrades, ...lessonGrades];
        const avgGrade =
          allGrades.length > 0
            ? allGrades.reduce((acc, grade) => acc + grade, 0) / allGrades.length
            : 100; // Default to 100 if no grades yet

        return {
          ...sc,
          class: {
            ...classData,
            avgGrade,
          },
        };
      });

      return NextResponse.json(classesWithGrades);
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create a new class (Admins and Professors only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the new permissions system to check for access
    if (!hasPermission(session.user.role as UserRole, "canManageClasses")) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to create classes." }, { status: 403 })
    }

    const { name, description, professorId }: { name: string; description?: string; professorId?: string } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    }

    let classCreatorId = session.user.id;

    // If the user is an ADMIN, they can specify a professor to create the class for
    if (session.user.role === 'ADMIN' && professorId) {
      const professor = await prisma.user.findUnique({ where: { id: professorId } });
      if (!professor || professor.role !== 'PROFESSOR') {
        return NextResponse.json({ error: "Invalid professor ID provided." }, { status: 400 });
      }
      classCreatorId = professor.id;
    } else if (session.user.role !== 'PROFESSOR') {
      // If not an admin, must be a professor to create a class for themselves
      return NextResponse.json({ error: "You must be a professor to create a class." }, { status: 403 });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        professorId: classCreatorId
      }
    })

    return NextResponse.json({
      message: "Class created successfully",
      class: newClass
    })
  } catch (error) {
    console.error("Create class error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 