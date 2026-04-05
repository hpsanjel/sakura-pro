"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "authenticated") {
      // User is logged in, redirect to dashboard
      router.push("/dashboard");
    } else {
      // User is not authenticated, redirect to signin
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
    </div>
  );
}
