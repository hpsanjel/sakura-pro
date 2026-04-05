"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalSchools: number
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  totalClasses: number
  activeTeachers: number
  recentEnrollments: number
  documentsPending: number
  documentsVerified: number
}

interface VisaStatusData {
  status: string
  count: number
  percentage: number
}

interface LanguageLevelData {
  level: string
  count: number
}

interface MonthlyData {
  month: string
  students: number
  applications: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user: string
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [visaStatusData, setVisaStatusData] = useState<VisaStatusData[]>([])
  const [languageLevelData, setLanguageLevelData] = useState<LanguageLevelData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedReport, setSelectedReport] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchReportsData()
  }, [status, session, router])

  const fetchReportsData = async () => {
    try {
      // Fetch data individually to handle partial failures
      const responses = await Promise.allSettled([
        fetch("/api/reports/stats"),
        fetch("/api/reports/visa-status"),
        fetch("/api/reports/language-levels"),
        fetch("/api/reports/monthly-data"),
        fetch("/api/reports/recent-activity")
      ])

      const [statsRes, visaRes, languageRes, monthlyRes, activityRes] = responses

      // Handle each response individually
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json()
        setStats(statsData)
        console.log('Stats data:', statsData) // Debug log
      }
      
      if (visaRes.status === 'fulfilled' && visaRes.value.ok) {
        const visaData = await visaRes.value.json()
        setVisaStatusData(visaData)
        console.log('Visa status data:', visaData) // Debug log
        
        // Calculate total from visa status data for comparison
        const visaTotal = visaData.reduce((sum: number, item: any) => sum + item.count, 0)
        console.log('Visa status total:', visaTotal) // Debug log
      }
      
      if (languageRes.status === 'fulfilled' && languageRes.value.ok) {
        setLanguageLevelData(await languageRes.value.json())
      }
      
      if (monthlyRes.status === 'fulfilled' && monthlyRes.value.ok) {
        setMonthlyData(await monthlyRes.value.json())
      }
      
      if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
        setRecentActivity(await activityRes.value.json())
      }

      // Check if all requests failed
      const allFailed = responses.every(res => 
        res.status === 'rejected' || (res.status === 'fulfilled' && !res.value.ok)
      )
      
      if (allFailed) {
        setError("Failed to load reports data. Please try again.")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/reports/download/${reportType}`)
      if (!response.ok) throw new Error("Failed to download report")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to download report")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Reports & Analytics
              </h1>
              <p className="text-blue-100 mb-4">
                Comprehensive overview of your consultancy's performance and insights
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">Real-time Analytics</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                    {/* Show discrepancy warning */}
                    {stats && visaStatusData.length > 0 && (
                      <div className="mt-1">
                        {(() => {
                          const visaTotal = visaStatusData.reduce((sum, item) => sum + item.count, 0)
                          if (visaTotal !== stats.totalStudents) {
                            return (
                              <div className="flex items-center text-xs text-orange-600">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Visa total: {visaTotal}
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Partner Schools</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalSchools || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalClasses || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Reports Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Visa Status Distribution */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Visa Status Distribution</h2>
                {visaStatusData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>Loading visa status data...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visaStatusData.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            item.status === 'VISA_APPROVED' ? 'bg-green-500' :
                            item.status === 'VISA_APPLIED' ? 'bg-orange-500' :
                            item.status === 'COE_APPROVED' ? 'bg-emerald-500' :
                            item.status === 'COE_APPLIED' ? 'bg-indigo-500' :
                            item.status === 'SENT_TO_JAPAN' ? 'bg-purple-500' :
                            item.status === 'DOCS_VERIFIED' ? 'bg-blue-500' :
                            item.status === 'DOCS_PENDING' ? 'bg-yellow-500' :
                            item.status === 'NEW_LEAD' ? 'bg-gray-500' :
                            'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">{item.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">{item.count}</span>
                          <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Level Distribution */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Level Distribution</h2>
                {languageLevelData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>Loading language level data...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {languageLevelData.map((item) => (
                      <div key={item.level} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            item.level === 'N1' ? 'bg-red-500' :
                            item.level === 'N2' ? 'bg-orange-500' :
                            item.level === 'N3' ? 'bg-yellow-500' :
                            item.level === 'N4' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">{item.level}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.count} students</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Downloadable Reports */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => handleDownloadReport('students')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Student Report</p>
                      <p className="text-xs text-gray-500">Complete student database</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadReport('applications')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Applications Report</p>
                      <p className="text-xs text-gray-500">All school applications</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadReport('visa-status')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Visa Status Report</p>
                      <p className="text-xs text-gray-500">Student visa progress</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadReport('financial')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Financial Report</p>
                      <p className="text-xs text-gray-500">Revenue and expenses</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadReport('enrollments')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Enrollment Report</p>
                      <p className="text-xs text-gray-500">Class enrollments data</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadReport('documents')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Documents Report</p>
                      <p className="text-xs text-gray-500">Document status tracking</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p>Loading recent activity...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          activity.type === 'student_added' ? 'bg-green-500' :
                          activity.type === 'application_submitted' ? 'bg-blue-500' :
                          activity.type === 'visa_updated' ? 'bg-purple-500' :
                          activity.type === 'document_uploaded' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
    </div>
  )
}
