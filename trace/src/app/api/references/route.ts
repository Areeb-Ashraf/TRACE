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

    // For professors, they can see all references, for students only their own
    const whereClause = session.user.role === "PROFESSOR" 
      ? {} 
      : { userId: session.user.id }

    const [references, total] = await Promise.all([
      prisma.reference.findMany({
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
      prisma.reference.count({ where: whereClause })
    ])

    return NextResponse.json({
      references,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Get references error:", error)
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

    const { title, url, referenceData } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Create reference in database
    const reference = await prisma.reference.create({
      data: {
        userId: session.user.id,
        title,
        url,
        metadata: {
          browserInfo: req.headers.get("user-agent"),
          ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        }
      }
    })

    // Upload large reference data to S3 if provided
    let s3Key = null
    if (referenceData && Object.keys(referenceData).length > 0) {
      s3Key = await S3Service.uploadReferenceData(
        session.user.id,
        reference.id,
        referenceData
      )

      // Update reference with S3 key
      await prisma.reference.update({
        where: { id: reference.id },
        data: { s3Key }
      })
    }

    return NextResponse.json({
      message: "Reference created successfully",
      reference: { ...reference, s3Key }
    })
  } catch (error) {
    console.error("Create reference error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 