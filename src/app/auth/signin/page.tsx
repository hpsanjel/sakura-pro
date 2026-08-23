"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError("Invalid email or password");
			} else if (result?.ok) {
				router.push("/dashboard");
				router.refresh();
			}
		} catch (error) {
			setError("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
			{/* Background Gradients */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/8 to-transparent rounded-full blur-3xl"></div>
			<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-blue-400/6 to-transparent rounded-full blur-3xl"></div>

			{/* Login Box */}
			<div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 shadow-2xl z-10">
				{/* Logo */}
				<div className="text-center mb-10">
					<h1 className="text-3xl font-bold text-white mb-2 font-syne">
						StudyAbroad <span className="text-yellow-400">Pro</span>
					</h1>
					<p className="text-gray-400 text-sm">Student visa management system</p>
				</div>

				{/* Login Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
							<AlertCircle className="w-5 h-5" />
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email" required />
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="block text-sm font-medium text-gray-300">Password</label>
							<Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
								Forgot password?
							</Link>
						</div>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your password" required />
						</div>
					</div>

					<button type="submit" disabled={isLoading} className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
						{isLoading ? (
							<>
								<div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
								Signing in...
							</>
						) : (
							<>
								Sign In
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>
				</form>

				{/* Footer */}
				<div className="mt-8 text-center">
					<p className="text-gray-500 text-sm">Contact your administrator for account access</p>
				</div>
			</div>
		</div>
	);
}
