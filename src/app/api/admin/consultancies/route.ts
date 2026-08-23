import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendConsultancyWelcomeEmail } from "@/lib/email";
import { generateSetupToken } from "@/lib/tokens";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consultancies = await prisma.consultancy.findMany({
      include: {
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(consultancies);
  } catch (error) {
    console.error("Error fetching consultancies:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultancies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, status, selectedYear, adminName, adminEmail } = body;

    if (!name || !email || !phone || !address || !status || !selectedYear || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if consultancy with this email already exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { email },
    });

    if (existingConsultancy) {
      return NextResponse.json(
        { error: "Consultancy with this email already exists" },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create the consultancy and its admin user together
    const result = await prisma.$transaction(async (tx) => {
      const consultancy = await tx.consultancy.create({
        data: {
          id: `consultancy-${Date.now()}`,
          name,
          email,
          phone,
          address,
          status,
          selectedYear,
        },
      });

      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: null, // No password initially, admin will set it via email
          role: "ADMIN",
          consultancyId: consultancy.id,
        },
      });

      return { consultancy, admin };
    });

    // Generate setup token and email the admin a password-setup link
    const setupToken = await generateSetupToken(
      result.admin.id,
      result.admin.email,
      "ADMIN",
      result.consultancy.id
    );

    try {
      await sendConsultancyWelcomeEmail(
        result.consultancy.email,
        result.consultancy.name,
        result.admin.email,
        result.admin.name || "Admin",
        setupToken
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue anyway - consultancy creation succeeded
    }

    return NextResponse.json(
      {
        ...result.consultancy,
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          name: result.admin.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating consultancy:", error);
    return NextResponse.json(
      { error: "Failed to create consultancy" },
      { status: 500 }
    );
  }
}
