import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import sanitize from "@/lib/sanitize";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = "STUDENT" } = await req.json();

    // Sanitize all string inputs
    const sanitizedEmail = sanitize(email);
    const sanitizedName = sanitize(name);
    const sanitizedRole = sanitize(role);

    if (!sanitizedEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: sanitizedEmail } });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: sanitizedRole.toUpperCase() as UserRole,
        verificationCode,
        verificationCodeExpires,
        emailVerified: null, // User needs to verify email first
      },
    });

    // Send verification email
    try {
      await sendEmail({
        to: sanitizedEmail,
        subject: "Verify Your TRACE Account",
        html: generateVerificationEmail(verificationCode),
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Delete the user if email fails to send
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Account created successfully. Please check your email for a verification code.",
      requiresVerification: true,
      email: sanitizedEmail,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 