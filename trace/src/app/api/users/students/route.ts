import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  console.log("[/api/users/students] GET request received");
  try {
    const session = await getServerSession(authOptions)
    console.log("[/api/users/students] Session:", session);
    
    if (!session) {
      console.log("[/api/users/students] Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow professors and admins to fetch students
    if (!hasPermission(session.user.role as UserRole, "canManageClasses")) {
      console.log(`[/api/users/students] Forbidden: User role '${session.user.role}' does not have 'canManageClasses' permission.`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT"
      },
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
    console.log("[/api/users/students] Fetched students count:", students.length);

    return NextResponse.json({ users: students })
  } catch (error) {
    console.error("[/api/users/students] Get students error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 