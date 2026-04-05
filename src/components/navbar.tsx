"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
  const { data: session } = useSession()

  const getRoleBadgeClass = () => {
    const role = session?.user?.role?.toLowerCase()
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase"
    
    switch(role) {
      case 'admin':
        return `${baseClasses} bg-red-50 text-red-600`
      case 'counselor':
        return `${baseClasses} bg-blue-50 text-blue-600`
      case 'student':
        return `${baseClasses} bg-green-50 text-green-600`
      default:
        return baseClasses
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 flex items-center justify-center h-16">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-gray-900 no-underline tracking-tight hover:text-gray-800 transition-colors">
          StudyAbroad <span className="text-indigo-500">Pro</span>
        </Link>

  
      </div>
    </nav>
  )
}
