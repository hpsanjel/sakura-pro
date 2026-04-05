"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building, Plus, Users, ExternalLink, Globe, MapPin, Calendar, AlertCircle } from "lucide-react"

interface School {
  id: string
  name: string
  address?: string
  website?: string
  createdAt: string
  updatedAt: string
  _count: {
    applications: number
  }
}

export default function SchoolsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && 
        session.user.role !== "ADMIN" && 
        session.user.role !== "COUNSELOR") {
      router.push("/dashboard")
      return
    }

    fetchSchools()
  }, [status, session, router])

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools")
      if (!response.ok) throw new Error("Failed to fetch schools")
      
      const data = await response.json()
      setSchools(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <>
        <div className="flex">
          <main className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 min-h-[calc(100vh-64px)]">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-white/80 font-medium">Loading schools...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      
      <div className="flex">

        <main className="flex-1  min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Partner Schools
                  </h1>
                  <p className="text-blue-100 mb-4">
                    {session?.user.role === "ADMIN" 
                      ? "Manage partner schools and their information"
                      : "View partner schools information"
                    }
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{schools.length} Schools</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{schools.reduce((acc, school) => acc + school._count.applications, 0)} Applications</span>
                    </div>
                  </div>
                </div>
                {session?.user.role === "ADMIN" && (
                  <Link
                    href="/schools/add"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Add School
                  </Link>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Schools Grid */}
            {schools.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Building className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No schools found</h2>
                <p className="text-gray-600 mb-6">
                  {session?.user.role === "ADMIN" 
                    ? "Get started by adding your first partner school"
                    : "No schools have been added to the system yet"
                  }
                </p>
                {session?.user.role === "ADMIN" && (
                  <Link
                    href="/schools/add"
                    className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First School
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map((school) => (
                  <div key={school.id} className="bg-indigo-50 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-0.5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                          <Building className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{school.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Added {new Date(school.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      {school.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{school.address}</span>
                        </div>
                      )}
                      
                      {school.website && (
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                          <Users className="w-3 h-3 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-600">{school._count.applications}</span>
                          <span className="text-xs text-indigo-500">applications</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/schools/${school.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            View
                          </Link>
                          {session?.user.role === "ADMIN" && (
                            <Link
                              href={`/schools/${school.id}/edit`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
