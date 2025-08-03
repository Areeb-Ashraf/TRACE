import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

// POST /api/grades - Submit or update a grade for a submission or lesson progress
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role as UserRole, "canGradeSubmissions")) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to grade submissions." }, { status: 403 });
    }

    const {
      submissionId,
      lessonProgressId,
      grade,
      feedback,
    }: {
      submissionId?: string;
      lessonProgressId?: string;
      grade: number;
      feedback?: string;
    } = await req.json();

    if ((!submissionId && !lessonProgressId) || (submissionId && lessonProgressId)) {
      return NextResponse.json({ error: "You must provide either a submissionId or a lessonProgressId." }, { status: 400 });
    }

    if (grade === null || grade === undefined || grade < 0) {
        return NextResponse.json({ error: "A valid grade is required." }, { status: 400 });
    }

    let updatedRecord;

    if (submissionId) {
      // Logic for grading an assignment submission
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { assignment: { include: { class: true } } },
      });

      if (!submission || submission.assignment.class.professorId !== session.user.id) {
        return NextResponse.json({ error: "Submission not found or you do not have permission to grade it." }, { status: 404 });
      }

      updatedRecord = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback,
          status: "GRADED",
        },
      });
    } else if (lessonProgressId) {
      // Logic for grading a lesson
      const lessonProgress = await prisma.lessonProgress.findUnique({
        where: { id: lessonProgressId },
        include: { lesson: { include: { class: true } } },
      });

      if (!lessonProgress || lessonProgress.lesson.class.professorId !== session.user.id) {
        return NextResponse.json({ error: "Lesson progress not found or you do not have permission to grade it." }, { status: 404 });
      }

      updatedRecord = await prisma.lessonProgress.update({
        where: { id: lessonProgressId },
        data: {
          grade,
          feedback,
          status: "COMPLETED", // Assuming grading completes the lesson
        },
      });
    }

    return NextResponse.json({
      message: "Grade submitted successfully.",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Grade submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 