"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Calendar, Users, FileText, GraduationCap, MessageSquare, TrendingUp, Settings, Info, Building } from "lucide-react"

interface Consultancy {
  id: string
  name: string
  selectedYear: number
}

interface YearStats {
  year: number
  students: number
  applications: number
  documents: number
  enrollments: number
  interviews: number
}

export default function YearManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [consultancy, setConsultancy] = useState<Consultancy | null>(null)
  const [yearStats, setYearStats] = useState<YearStats | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchYearManagementData()
    }
  }, [status, session, router])

  useEffect(() => {
    if (selectedYear && consultancy) {
      fetchYearStats(selectedYear)
    }
  }, [selectedYear, consultancy])

  const fetchYearManagementData = async () => {
    try {
      const response = await fetch("/api/admin/year-management")
      if (response.ok) {
        const data = await response.json()
        setConsultancy(data.consultancy)
        setSelectedYear(data.consultancy.selectedYear)
        setAvailableYears(data.availableYears)
      }
    } catch (error) {
      console.error("Error fetching year management data:", error)
      setError("Failed to load year management data")
    } finally {
      setLoading(false)
    }
  }

  const fetchYearStats = async (year: number) => {
    try {
      const response = await fetch(`/api/admin/year-management/stats?year=${year}`)
      if (response.ok) {
        const stats = await response.json()
        setYearStats(stats)
      }
    } catch (error) {
      console.error("Error fetching year stats:", error)
    }
  }

  const handleYearChange = async (year: number) => {
    setUpdating(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/year-management", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedYear: year }),
      })

      if (response.ok) {
        setSelectedYear(year)
        setSuccess("Year updated successfully!")
        setConsultancy(prev => prev ? { ...prev, selectedYear: year } : null)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update year")
      }
    } catch (error) {
      console.error("Error updating year:", error)
      setError("Failed to update year")
    } finally {
      setUpdating(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Year Management
          </h1>
          <p className="text-blue-100 mb-4">
            Manage and track data by academic year
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Current Year: {selectedYear}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">{consultancy?.name || "Loading..."}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          </div>
        )}


        {/* Year Selector */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Academic Year</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearChange(year)}
                disabled={updating}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedYear === year
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 font-semibold"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                } ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="text-lg font-bold">{year}</div>
                <div className="text-xs text-gray-500">Academic Year</div>
              </button>
            ))}
          </div>
        </div>

        {/* Year Statistics */}
        {yearStats && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Year {selectedYear} Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{yearStats.students}</div>
                    <div className="text-sm text-blue-600">Total Students</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{yearStats.applications}</div>
                    <div className="text-sm text-green-600">Applications</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{yearStats.documents}</div>
                    <div className="text-sm text-purple-600">Documents</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{yearStats.enrollments}</div>
                    <div className="text-sm text-yellow-600">Enrollments</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{yearStats.interviews}</div>
                    <div className="text-sm text-red-600">Interviews</div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white mr-4">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {yearStats.students > 0 ? Math.round((yearStats.enrollments / yearStats.students) * 100) : 0}%
                    </div>
                    <div className="text-sm text-indigo-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white mt-8">
          <div className="flex items-start">
            <Info className="w-6 h-6 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-3">About Year Management</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-sm">Changing the year immediately updates all user dashboards</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-sm">Historical data remains accessible when switching years</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-sm">This ensures consistent data viewing across your organization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
