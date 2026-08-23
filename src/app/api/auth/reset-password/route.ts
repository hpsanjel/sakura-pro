import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const { token, email, password, confirmPassword } = await request.json();

		// Validate inputs
		if (!token || !email || !password || !confirmPassword) {
			return NextResponse.json({ error: "All fields are required" }, { status: 400 });
		}

		if (password !== confirmPassword) {
			return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
		}

		// Validate password strength
		if (password.length < 8) {
			return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
		}

		// Hash the token from the URL to compare with database
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		// Find the reset token
		const resetToken = await prisma.passwordResetToken.findUnique({
			where: { token: hashedToken },
		});

		if (!resetToken) {
			return NextResponse.json({ error: "Invalid or expired password reset link" }, { status: 400 });
		}

		// Check if token has expired
		if (resetToken.expires < new Date()) {
			// Delete expired token
			await prisma.passwordResetToken.delete({
				where: { token: hashedToken },
			});

			return NextResponse.json({ error: "Password reset link has expired. Please request a new one." }, { status: 400 });
		}

		// Check if email matches
		if (resetToken.email !== email.toLowerCase()) {
			return NextResponse.json({ error: "Email does not match" }, { status: 400 });
		}

		// Find the user
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 400 });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Update user password
		await prisma.user.update({
			where: { email: email.toLowerCase() },
			data: { password: hashedPassword },
		});

		// Delete the used reset token
		await prisma.passwordResetToken.delete({
			where: { token: hashedToken },
		});

		// Delete all other reset tokens for this email (clean up)
		await prisma.passwordResetToken.deleteMany({
			where: { email: email.toLowerCase() },
		});

		return NextResponse.json(
			{
				message: "Password has been reset successfully. You can now log in with your new password.",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Reset password error:", error);
		return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 });
	}
}
