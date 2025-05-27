import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { S3Service } from "@/lib/s3"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: {
          include: {
            professor: {
              select: {
                id: true,
                name: true,
                email: true
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
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check permissions
    const isStudent = session.user.role === "STUDENT" && submission.studentId === session.user.id
    const isProfessor = session.user.role === "PROFESSOR" && submission.assignment.professorId === session.user.id

    if (!isStudent && !isProfessor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get additional data from S3 if available
    let sessionData = null
    let referenceData = null
    let analysisData = null

    try {
      if (submission.sessionS3Key) {
        sessionData = await S3Service.getSessionData(submission.sessionS3Key)
      }
      if (submission.referenceS3Key) {
        referenceData = await S3Service.getReferenceData(submission.referenceS3Key)
      }
      if (submission.analysisS3Key && isProfessor) {
        // Only professors can see analysis data
        analysisData = await S3Service.getReferenceData(submission.analysisS3Key)
      }
    } catch (error) {
      console.error("Error fetching S3 data:", error)
    }

    return NextResponse.json({
      submission,
      sessionData: isProfessor ? sessionData : null, // Students don't see session data
      referenceData: isProfessor ? referenceData : null, // Students don't see reference data
      analysisData
    })
  } catch (error) {
    console.error("Get submission error:", error)
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

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const { 
      textContent, 
      wordCount, 
      timeSpent, 
      sessionData, 
      referenceData,
      isSubmitting = false,
      grade,
      feedback
    } = await req.json()

    // Check permissions for different operations
    const isStudent = session.user.role === "STUDENT" && submission.studentId === session.user.id
    const isProfessor = session.user.role === "PROFESSOR" && submission.assignment.professorId === session.user.id

    if (!isStudent && !isProfessor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Students can only update their own submissions, professors can grade
    if (isStudent) {
      // Check if assignment is past due
      if (new Date() > submission.assignment.dueDate) {
        return NextResponse.json({ error: "Assignment is past due" }, { status: 403 })
      }

      // Check if already submitted
      if (submission.status === "SUBMITTED") {
        return NextResponse.json({ error: "Submission already submitted" }, { status: 400 })
      }

      let sessionS3Key = submission.sessionS3Key
      let referenceS3Key = submission.referenceS3Key
      let analysisS3Key = null

      // Upload session data to S3 if provided
      if (sessionData) {
        sessionS3Key = await S3Service.uploadSessionData(
          session.user.id,
          `submission_${params.id}_session`,
          sessionData
        )
      }

      // Upload reference data to S3 if provided
      if (referenceData) {
        referenceS3Key = await S3Service.uploadReferenceData(
          session.user.id,
          `submission_${params.id}_reference`,
          referenceData
        )
      }

      // If submitting, perform analysis
      if (isSubmitting && sessionData && referenceData) {
        try {
          const analysisResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              actions: sessionData,
              referenceActions: referenceData,
              textContent
            }),
          })

          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json()
            analysisS3Key = await S3Service.uploadReferenceData(
              session.user.id,
              `submission_${params.id}_analysis`,
              analysisResult
            )
          }
        } catch (error) {
          console.error("Analysis failed:", error)
          // Continue with submission even if analysis fails
        }
      }

      const updateData: any = {
        ...(textContent !== undefined && { textContent }),
        ...(wordCount !== undefined && { wordCount }),
        ...(timeSpent !== undefined && { timeSpent }),
        ...(sessionS3Key && { sessionS3Key }),
        ...(referenceS3Key && { referenceS3Key }),
        ...(analysisS3Key && { analysisS3Key })
      }

      if (isSubmitting) {
        updateData.status = "SUBMITTED"
        updateData.submittedAt = new Date()
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id: params.id },
        data: updateData,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true
            }
          }
        }
      })

      return NextResponse.json({
        message: isSubmitting ? "Submission submitted successfully" : "Submission updated successfully",
        submission: updatedSubmission
      })
    } 
    
    if (isProfessor) {
      // Professor grading
      const updateData: any = {}
      
      if (grade !== undefined) {
        updateData.grade = grade
      }
      
      if (feedback !== undefined) {
        updateData.feedback = feedback
      }

      if (Object.keys(updateData).length > 0) {
        updateData.status = "GRADED"
        
        const updatedSubmission = await prisma.submission.update({
          where: { id: params.id },
          data: updateData,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            assignment: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })

        return NextResponse.json({
          message: "Submission graded successfully",
          submission: updatedSubmission
        })
      }
    }

    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
  } catch (error) {
    console.error("Update submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 