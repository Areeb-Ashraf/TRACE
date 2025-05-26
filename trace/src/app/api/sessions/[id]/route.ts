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

    const studySession = await prisma.studySession.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!studySession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && studySession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get session data from S3 if available
    let sessionData = null
    if (studySession.s3Key) {
      try {
        sessionData = await S3Service.getSessionData(studySession.s3Key)
      } catch (error) {
        console.error("Error fetching session data from S3:", error)
      }
    }

    return NextResponse.json({
      session: studySession,
      sessionData
    })
  } catch (error) {
    console.error("Get session error:", error)
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

    const { title, endTime, sessionData, isActive } = await req.json()

    const studySession = await prisma.studySession.findUnique({
      where: { id: params.id }
    })

    if (!studySession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && studySession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Calculate total time if endTime is provided
    let totalTime = null
    if (endTime) {
      const start = new Date(studySession.startTime)
      const end = new Date(endTime)
      totalTime = Math.floor((end.getTime() - start.getTime()) / 1000) // in seconds
    }

    // Update session data in S3 if provided
    let s3Key = studySession.s3Key
    if (sessionData) {
      if (s3Key) {
        // Update existing S3 data
        await S3Service.uploadSessionData(studySession.userId, params.id, sessionData)
      } else {
        // Create new S3 data
        s3Key = await S3Service.uploadSessionData(studySession.userId, params.id, sessionData)
      }
    }

    // Update session in database
    const updatedSession = await prisma.studySession.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(totalTime !== null && { totalTime }),
        ...(isActive !== undefined && { isActive }),
        ...(s3Key && { s3Key })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Session updated successfully",
      session: updatedSession
    })
  } catch (error) {
    console.error("Update session error:", error)
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

    const studySession = await prisma.studySession.findUnique({
      where: { id: params.id }
    })

    if (!studySession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && studySession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete S3 data if exists
    if (studySession.s3Key) {
      try {
        await S3Service.deleteFile(studySession.s3Key)
      } catch (error) {
        console.error("Error deleting S3 file:", error)
      }
    }

    // Delete session from database
    await prisma.studySession.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Session deleted successfully"
    })
  } catch (error) {
    console.error("Delete session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 