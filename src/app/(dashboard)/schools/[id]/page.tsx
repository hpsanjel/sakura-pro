"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Building, ArrowLeft, Edit, Trash2, Users, Globe, MapPin, Calendar, AlertCircle, ExternalLink, User, FileText } from "lucide-react"

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
  applications: Array<{
    id: string
    status?: string
    appliedAt: string
    student: {
      id: string
      name: string
      passportNumber: string
      visaStatus: string
    }
  }>
}

export default function SchoolDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

    fetchSchool()
  }, [status, session, router, params.id])

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/schools/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("School not found")
        } else {
          throw new Error("Failed to fetch school")
        }
        return
      }
      
      const data = await response.json()
      setSchool(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this school? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/schools/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete school")
      }

      router.push("/schools")
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred")
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
                  <p className="text-white/80 font-medium">Loading school details...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    )
  }

  if (error || !school) {
    return (
      <>
        <div className="flex">
          <main className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 min-h-[calc(100vh-64px)]">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-600 mb-6">{error || "School not found"}</p>
                <Link
                  href="/schools"
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Schools
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                </Link>
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

        <main className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Back Navigation */}
            <div className="mb-6">
              <Link
                href="/schools"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Schools
              </Link>
            </div>

            {/* Header Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                    <Building className="w-10 h-10" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                      {school.name}
                    </h1>
                    <div className="flex items-center gap-6 text-white/80 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{school._count.applications} applications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Added {new Date(school.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {session?.user.role === "ADMIN" && (
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/schools/${school.id}/edit`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit School
                        </Link>
                        <button
                          onClick={handleDelete}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm text-red-200 rounded-xl hover:bg-red-500/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden mb-8">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  School Information
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">School Name</h3>
                      <p className="text-lg text-gray-900 font-semibold">{school.name}</p>
                    </div>
                    {school.address && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </h3>
                        <p className="text-gray-900">{school.address}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    {school.website && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website
                        </h3>
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                        >
                          {school.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Total Applications
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600">{school._count.applications}</span>
                        <span className="text-gray-500">students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications Section */}
            <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Student Applications ({school.applications.length})
                  </h2>
                  {school.applications.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Last updated {Math.max(...school.applications.map(app => new Date(app.appliedAt).getTime())) > 0 
                        ? new Date(Math.max(...school.applications.map(app => new Date(app.appliedAt).getTime()))).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                {school.applications.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-500">Students haven't applied to this school yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {school.applications.map((application) => (
                      <div key={application.id} className="bg-gray-50/50 rounded-xl p-6 hover:bg-gray-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {application.student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.student.visaStatus.replace('_', ' ')} • {application.student.passportNumber}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {application.status || "Pending"}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(application.appliedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <Link
                              href={`/students/${application.student.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              View
                              <ArrowLeft className="w-4 h-4 rotate-180" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
