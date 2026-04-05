"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import DocumentsSummary from "@/components/documents-summary"
import PipelineSummary from "@/components/pipeline-summary"
import VisaTimeline from "@/components/visa-timeline"
import Link from "next/link"
import { Users, Building, FileText, GraduationCap, Calendar, Clock, BookOpen, TrendingUp, Activity, User, Home, Settings, Database, School, MessageSquare, BarChart3, CheckCircle, AlertCircle, Upload, ArrowRight, RefreshCw, Plus, XCircle } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [studentVisaStatus, setStudentVisaStatus] = useState<string>("NEW_LEAD")
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSchools: 0,
    activeApplications: 0,
    recentActivity: []
  })

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch stats
  useEffect(() => {
    if (session?.user) {
      fetchStats()
      if (session.user.role === "STUDENT") {
        fetchStudentVisaStatus()
      }
    }
  }, [session])

  const fetchStudentVisaStatus = async () => {
    try {
      const response = await fetch('/api/students/me/visa-status')
      if (response.ok) {
        const data = await response.json()
        setStudentVisaStatus(data.visaStatus)
      }
    } catch (error) {
      console.error("Error fetching student visa status:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalStudents: data.totalStudents || 0,
          activeStudents: data.activeStudents || 0,
          totalSchools: data.totalSchools || 0,
          activeApplications: data.activeApplications || 0,
          recentActivity: data.recentActivity || []
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const user = {
    id: session?.user?.id || "",
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    role: session?.user?.role || "",
    consultancyId: session?.user?.consultancyId || ""
  }

  const firstName = user.name.split(' ')[0] || 'User'
  
  const roleDescriptions: Record<string, string> = {
    'SUPERADMIN': 'Super Administrator',
    'ADMIN': 'Administrator',
    'COUNSELOR': 'Counselor',
    'TEACHER': 'Teacher',
    'STUDENT': 'Student'
  }

  return (
    <div className="p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-blue-100 mb-4">
          {roleDescriptions[user.role] || "Welcome to your dashboard"}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDateTime(currentDateTime)}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {user.role === "STUDENT" ? null : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalStudents}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Total Students</h3>
          <p className="text-gray-500 text-sm">Active enrollments</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Building className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalSchools}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Partner Schools</h3>
          <p className="text-gray-500 text-sm">Educational institutions</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.activeApplications}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Active Applications</h3>
          <p className="text-gray-500 text-sm">In progress</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.activeStudents}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Active Students</h3>
          <p className="text-gray-500 text-sm">Currently enrolled</p>
        </div>
      </div>
      )}

      {/* Quick Actions */}
      {user.role === "STUDENT" ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/student-todos" className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              <CheckCircle className="w-4 h-4" />
              My To-Do List
            </Link>
            
            <Link href="/documents" className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
              <FileText className="w-4 h-4" />
              Documents
            </Link>
            
            <Link href="/financial" className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Financial Status
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/students/add" className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4" />
              Add Student
            </Link>
            
            <Link href="/student-todos" className="inline-flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
              <CheckCircle className="w-4 h-4" />
              Student To-Dos
            </Link>
          
            <Link href="/students" className="inline-flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              <Users className="w-4 h-4" />
              View All Students
            </Link>
          
            <Link href="/documents" className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
              <FileText className="w-4 h-4" />
              Documents
            </Link>
          
            <Link href="/financial" className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Financial
            </Link>
          </div>
        </div>
      )}
          
          
            {/* Visa Timeline - Only for Students */}
      {user.role === "STUDENT" && (
        <VisaTimeline currentStatus={studentVisaStatus} />
      )}

      {/* Recent Activity - Only for Admins and Counselors */}
      {(user.role === "ADMIN" || user.role === "COUNSELOR") && (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.description}</p>
                  <p className="text-gray-500 text-sm">{activity.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
