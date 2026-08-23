"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
			<ResetPasswordForm />
		</Suspense>
	);
}

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const token = searchParams.get("token");
	const email = searchParams.get("email");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	// Validate URL parameters
	useEffect(() => {
		if (!token || !email) {
			setError("Invalid or missing reset link. Please request a new password reset.");
		}
	}, [token, email]);

	// Validate password strength in real-time
	useEffect(() => {
		const errors: string[] = [];

		if (password) {
			if (password.length < 8) {
				errors.push("At least 8 characters");
			}
			if (!/[a-z]/.test(password)) {
				errors.push("At least one lowercase letter");
			}
			if (!/[A-Z]/.test(password)) {
				errors.push("At least one uppercase letter");
			}
			if (!/[0-9]/.test(password)) {
				errors.push("At least one number");
			}
			if (!/[!@#$%^&*]/.test(password)) {
				errors.push("At least one special character (!@#$%^&*)");
			}
		}

		setValidationErrors(errors);
	}, [password]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");
		setSuccess(false);

		// Validate inputs
		if (!password || !confirmPassword) {
			setError("All fields are required");
			setIsLoading(false);
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setIsLoading(false);
			return;
		}

		if (validationErrors.length > 0) {
			setError("Password does not meet the required criteria");
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					email,
					password,
					confirmPassword,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to reset password");
			}

			setSuccess(true);
			setPassword("");
			setConfirmPassword("");

			// Redirect to signin after 2 seconds
			setTimeout(() => {
				router.push("/auth/signin");
			}, 2000);
		} catch (error) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	if (!token || !email) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/8 to-transparent rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-400/6 to-transparent rounded-full blur-3xl"></div>

				<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
					<div className="text-center">
						<div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
							<AlertCircle className="w-8 h-8 text-red-500" />
						</div>

						<h1 className="text-2xl font-bold text-white mb-3">Invalid Reset Link</h1>

						<p className="text-gray-400 mb-6">The password reset link is invalid or has expired. Please request a new one.</p>

						<Link href="/auth/forgot-password" className="inline-block w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors">
							Request New Reset Link
						</Link>

						<Link href="/auth/signin" className="inline-block w-full mt-3 bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition-colors">
							Back to Sign In
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/8 to-transparent rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-400/6 to-transparent rounded-full blur-3xl"></div>

				<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
					<div className="text-center">
						<div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
							<CheckCircle className="w-8 h-8 text-green-500" />
						</div>

						<h1 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h1>

						<p className="text-gray-400 mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>

						<p className="text-gray-500 text-sm mb-6">Redirecting to sign in page...</p>

						<Link href="/auth/signin" className="inline-block w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
							Go to Sign In
							<ArrowRight className="w-5 h-5" />
						</Link>
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

			{/* Reset Password Box */}
			<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
				{/* Header */}
				<div className="text-center mb-10">
					<Link href="/auth/signin" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-6">
						<ArrowLeft className="w-5 h-5" />
						Back to Sign In
					</Link>

					<h1 className="text-3xl font-bold text-white mb-2 font-syne">Create New Password</h1>
					<p className="text-gray-400 text-sm">Enter a strong password to secure your account</p>
				</div>

				{/* Reset Password Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
							<AlertCircle className="w-5 h-5 flex-shrink-0" />
							<span className="text-sm">{error}</span>
						</div>
					)}

					{/* New Password */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter new password" required />
							<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
								{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
							</button>
						</div>
					</div>

					{/* Password Strength Indicator */}
					{password && (
						<div className="space-y-2">
							<p className="text-xs font-medium text-gray-400">Password Requirements:</p>
							<div className="space-y-1">
								{[
									{ check: password.length >= 8, label: "At least 8 characters" },
									{ check: /[a-z]/.test(password), label: "At least one lowercase letter" },
									{ check: /[A-Z]/.test(password), label: "At least one uppercase letter" },
									{ check: /[0-9]/.test(password), label: "At least one number" },
									{ check: /[!@#$%^&*]/.test(password), label: "At least one special character (!@#$%^&*)" },
								].map((req, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<div className={`w-4 h-4 rounded-full ${req.check ? "bg-green-500" : "bg-gray-700"}`}></div>
										<span className={`text-xs ${req.check ? "text-green-400" : "text-gray-500"}`}>{req.label}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Confirm Password */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${confirmPassword && password !== confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-blue-500"}`} placeholder="Confirm password" required />
							<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300">
								{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
							</button>
						</div>
						{confirmPassword && password !== confirmPassword && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
					</div>

					{/* Submit Button */}
					<button type="submit" disabled={isLoading || validationErrors.length > 0 || !password || !confirmPassword} className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
								Resetting Password...
							</>
						) : (
							<>
								Reset Password
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>
				</form>

				{/* Security Info */}
				<div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
					<p className="text-xs text-gray-400 text-center">
						🔐 <strong>Security Tip:</strong> Use a unique password that you haven't used before. Avoid sharing your password with anyone.
					</p>
				</div>
			</div>
		</div>
	);
}
