import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
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

    // Check if consultancy exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { id },
    });

    if (!existingConsultancy) {
      return NextResponse.json(
        { error: "Consultancy not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingConsultancy.email) {
      const emailExists = await prisma.consultancy.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Consultancy with this email already exists" },
          { status: 400 }
        );
      }
    }

    const consultancy = await prisma.consultancy.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        status,
        selectedYear,
      },
    });

    return NextResponse.json(consultancy);
  } catch (error) {
    console.error("Error updating consultancy:", error);
    return NextResponse.json(
      { error: "Failed to update consultancy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.email || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if consultancy exists
    const existingConsultancy = await prisma.consultancy.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
      },
    });

    if (!existingConsultancy) {
      return NextResponse.json(
        { error: "Consultancy not found" },
        { status: 404 }
      );
    }

    // Check if consultancy has users or students
    if (existingConsultancy._count.users > 0 || existingConsultancy._count.students > 0) {
      return NextResponse.json(
        { error: "Cannot delete consultancy with existing users or students" },
        { status: 400 }
      );
    }

    await prisma.consultancy.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Consultancy deleted successfully" });
  } catch (error) {
    console.error("Error deleting consultancy:", error);
    return NextResponse.json(
      { error: "Failed to delete consultancy" },
      { status: 500 }
    );
  }
}
