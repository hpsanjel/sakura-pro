import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

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
    const { name, email, phone, address, status, selectedYear } = body;

    if (!name || !email || !phone || !address || !status || !selectedYear) {
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

    const consultancy = await prisma.consultancy.create({
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

    return NextResponse.json(consultancy, { status: 201 });
  } catch (error) {
    console.error("Error creating consultancy:", error);
    return NextResponse.json(
      { error: "Failed to create consultancy" },
      { status: 500 }
    );
  }
}
