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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // For professors, they can see all sessions, for students only their own
    const whereClause = session.user.role === "PROFESSOR" 
      ? {} 
      : { userId: session.user.id }

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.studySession.count({ where: whereClause })
    ])

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get sessions error:", error)
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

    const { title, sessionData } = await req.json()

    // Create session in database
    const studySession = await prisma.studySession.create({
      data: {
        userId: session.user.id,
        title,
        startTime: new Date(),
        isActive: true,
        metadata: {
          browserInfo: req.headers.get("user-agent"),
          ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        }
      }
    })

    // Upload large session data to S3 if provided
    let s3Key = null
    if (sessionData && Object.keys(sessionData).length > 0) {
      s3Key = await S3Service.uploadSessionData(
        session.user.id,
        studySession.id,
        sessionData
      )

      // Update session with S3 key
      await prisma.studySession.update({
        where: { id: studySession.id },
        data: { s3Key }
      })
    }

    return NextResponse.json({
      message: "Session created successfully",
      session: { ...studySession, s3Key }
    })
  } catch (error) {
    console.error("Create session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 