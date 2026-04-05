import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuthProtection() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If user is explicitly unauthenticated, redirect to signin
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const handleSignOut = async () => {
    try {
      // Clear any local storage data
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from NextAuth
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/signin'
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: force redirect to signin
      window.location.href = '/auth/signin'
    }
  }

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    handleSignOut
  }
}
