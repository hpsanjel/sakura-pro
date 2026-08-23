"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send reset email");
			}

			setSuccess(true);
			setEmail("");
		} catch (error) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
				{/* Background Gradients */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/8 to-transparent rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-400/6 to-transparent rounded-full blur-3xl"></div>

				{/* Success Card */}
				<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
					<div className="text-center">
						<div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
							<CheckCircle className="w-8 h-8 text-green-500" />
						</div>

						<h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>

						<p className="text-gray-400 mb-6">
							We've sent a password reset link to <span className="font-semibold text-white">{email}</span>
						</p>

						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
							<p className="text-sm text-blue-300">
								<strong>Note:</strong> The reset link will expire in 1 hour. If you don't receive the email, check your spam folder or try again.
							</p>
						</div>

						<div className="space-y-3">
							<p className="text-gray-400 text-sm">Didn't receive the email?</p>
							<button onClick={() => setSuccess(false)} className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors">
								Try Another Email
							</button>

							<Link href="/auth/signin" className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-2">
								<ArrowLeft className="w-5 h-5" />
								Back to Sign In
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
			{/* Background Gradients */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/8 to-transparent rounded-full blur-3xl"></div>
			<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-400/6 to-transparent rounded-full blur-3xl"></div>

			{/* Forgot Password Box */}
			<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
				{/* Logo */}
				<div className="text-center mb-10">
					<Link href="/auth/signin" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-6">
						<ArrowLeft className="w-5 h-5" />
						Back to Sign In
					</Link>

					<h1 className="text-3xl font-bold text-white mb-2 font-syne">Reset Password</h1>
					<p className="text-gray-400 text-sm">Enter your email address and we'll send you a link to reset your password</p>
				</div>

				{/* Forgot Password Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
							<AlertCircle className="w-5 h-5 flex-shrink-0" />
							<span className="text-sm">{error}</span>
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email address" required />
						</div>
						<p className="text-xs text-gray-500 mt-2">We'll send a password reset link to this email address</p>
					</div>

					<button type="submit" disabled={isLoading} className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
								Sending Link...
							</>
						) : (
							<>
								Send Reset Link
								<Mail className="w-5 h-5" />
							</>
						)}
					</button>
				</form>

				{/* Footer */}
				<div className="mt-8 text-center space-y-4">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-700"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-2 bg-gray-900 text-gray-500">Remember your password?</span>
						</div>
					</div>

					<Link href="/auth/signin" className="inline-block text-blue-400 hover:text-blue-300 transition-colors font-medium">
						Sign In Here
					</Link>
				</div>

				{/* Security Info */}
				<div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
					<p className="text-xs text-gray-400 text-center">
						🔐 <strong>Password Reset Security:</strong> The reset link will expire in 1 hour for your security. Never share this link with anyone.
					</p>
				</div>
			</div>
		</div>
	);
}
