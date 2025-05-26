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

    const reference = await prisma.reference.findUnique({
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

    if (!reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && reference.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get reference data from S3 if available
    let referenceData = null
    if (reference.s3Key) {
      try {
        referenceData = await S3Service.getReferenceData(reference.s3Key)
      } catch (error) {
        console.error("Error fetching reference data from S3:", error)
      }
    }

    return NextResponse.json({
      reference,
      referenceData
    })
  } catch (error) {
    console.error("Get reference error:", error)
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

    const { title, url, referenceData } = await req.json()

    const reference = await prisma.reference.findUnique({
      where: { id: params.id }
    })

    if (!reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && reference.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update reference data in S3 if provided
    let s3Key = reference.s3Key
    if (referenceData) {
      if (s3Key) {
        // Update existing S3 data
        await S3Service.uploadReferenceData(reference.userId, params.id, referenceData)
      } else {
        // Create new S3 data
        s3Key = await S3Service.uploadReferenceData(reference.userId, params.id, referenceData)
      }
    }

    // Update reference in database
    const updatedReference = await prisma.reference.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(url !== undefined && { url }),
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
      message: "Reference updated successfully",
      reference: updatedReference
    })
  } catch (error) {
    console.error("Update reference error:", error)
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

    const reference = await prisma.reference.findUnique({
      where: { id: params.id }
    })

    if (!reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== "PROFESSOR" && reference.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete S3 data if exists
    if (reference.s3Key) {
      try {
        await S3Service.deleteFile(reference.s3Key)
      } catch (error) {
        console.error("Error deleting S3 file:", error)
      }
    }

    // Delete reference from database
    await prisma.reference.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Reference deleted successfully"
    })
  } catch (error) {
    console.error("Delete reference error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 