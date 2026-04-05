import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, message } = body;

    if (!name || !email || !phone || !address) {
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
        { error: "A consultancy with this email already exists" },
        { status: 400 }
      );
    }

    // For now, we'll just log the registration request
    // In a real application, you might:
    // 1. Store this in a separate "registration_requests" table
    // 2. Send an email notification to the superadmin
    // 3. Create a pending consultancy record
    
    console.log("New consultancy registration request:", {
      name,
      email,
      phone,
      address,
      message,
      timestamp: new Date().toISOString(),
    });

    // You could also send an email to the superadmin here
    // Example: await sendNotificationEmail({ name, email, phone, address, message });

    return NextResponse.json(
      { 
        message: "Registration request submitted successfully. We'll contact you soon.",
        success: true 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing registration:", error);
    return NextResponse.json(
      { error: "Failed to process registration request" },
      { status: 500 }
    );
  }
}
