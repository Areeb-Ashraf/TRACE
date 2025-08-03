import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  console.log("[/api/users] GET request received");
  try {
    const session = await getServerSession(authOptions)
    console.log("[/api/users] Session:", session);
    
    if (!session) {
      console.log("[/api/users] Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the new permissions system to check for access
    if (!hasPermission(session.user.role as UserRole, "canManageUsers")) {
      console.log(`[/api/users] Forbidden: User role '${session.user.role}' does not have 'canManageUsers' permission.`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    console.log("[/api/users] Filtering by role:", role);

    let whereClause: any = {}
    if (role) {
      whereClause.role = role.toUpperCase() // Ensure role is uppercase to match Prisma enum
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    })
    console.log("[/api/users] Fetched users count:", users.length);

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[/api/users] Get users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 