import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		// Validate email
		if (!email || typeof email !== "string") {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (!user) {
			// For security, don't reveal whether email exists
			return NextResponse.json(
				{
					message: "If an account exists with this email, a password reset link has been sent.",
				},
				{ status: 200 },
			);
		}

		// Delete existing reset tokens for this email
		await prisma.passwordResetToken.deleteMany({
			where: { email: email.toLowerCase() },
		});

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

		// Set expiry to 1 hour from now
		const expires = new Date(Date.now() + 60 * 60 * 1000);

		// Save token to database
		await prisma.passwordResetToken.create({
			data: {
				email: email.toLowerCase(),
				token: hashedToken,
				expires,
			},
		});

		// Build reset link
		const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

		// Send email
		await sendPasswordResetEmail(email, resetLink, user.name || "User");

		return NextResponse.json(
			{
				message: "If an account exists with this email, a password reset link has been sent.",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 });
	}
}
