"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users, ArrowLeft, Calendar, MapPin, Users2, BookOpen,
  Clock, CheckCircle, XCircle, AlertCircle, Star, Award,
  BarChart3, TrendingUp, Target, Activity
} from "lucide-react"

interface Student {
  id: string
  name: string
  passportNumber?: string
  email?: string
}

interface Enrollment {
  id: string
  student: Student
  enrolledAt: string
  isActive: boolean
  status: string
}

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
  isActive: boolean
}

interface ClassDetails {
  id: string
  name: string
  level: string
  description?: string
  maxStudents: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  schedules: Schedule[]
  enrollments: Enrollment[]
  _count: {
    enrollments: number
  }
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const levelConfig: Record<string, any> = {
  N5: { label: "N5 - Beginner", color: "#10b981", accent: "#10b98120", Icon: BookOpen },
  N4: { label: "N4 - Elementary", color: "#3b82f6", accent: "#3b82f620", Icon: BookOpen },
  N3: { label: "N3 - Intermediate", color: "#8b5cf6", accent: "#8b5cf620", Icon: BookOpen },
  N2: { label: "N2 - Upper-Intermediate", color: "#f59e0b", accent: "#f59e0b20", Icon: BookOpen },
  N1: { label: "N1 - Advanced", color: "#ef4444", accent: "#ef444420", Icon: BookOpen },
}

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    if (status === "authenticated" && session.user.role !== "TEACHER") {
      router.push("/dashboard")
      return
    }
    if (status === "authenticated") fetchClassDetails()
  }, [status, session, router])

  const fetchClassDetails = async () => {
    try {
      const { id } = await params
      const res = await fetch(`/api/teacher/classes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setClassDetails(data)
      } else {
        console.error("Failed to fetch class details")
      }
    } catch (error) {
      console.error("Error fetching class details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Class not found</h2>
            <p className="text-gray-600 mb-4">The class you're looking for doesn't exist or you don't have access to it.</p>
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Classes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const config = levelConfig[classDetails.level]
  const Icon = config.Icon
  const enrollmentPercentage = (classDetails._count.enrollments / classDetails.maxStudents) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teacher/classes"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Link>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center`} style={{ backgroundColor: config.color }}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{classDetails.name}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium`} style={{ backgroundColor: config.color, color: "white" }}>
                      {config.label}
                    </span>
                    {classDetails.isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(classDetails.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {classDetails.description && (
              <p className="text-gray-600 mt-4">{classDetails.description}</p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">{classDetails._count.enrollments}</span>
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="text-xs text-gray-500 mt-1">of {classDetails.maxStudents} capacity</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{classDetails.schedules.length}</span>
            </div>
            <div className="text-sm text-gray-600">Weekly Sessions</div>
            <div className="text-xs text-gray-500 mt-1">Scheduled classes</div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">{Math.round(enrollmentPercentage)}%</span>
            </div>
            <div className="text-sm text-gray-600">Enrollment Rate</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${enrollmentPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h2>
            <div className="space-y-4">
              {classDetails.schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        {dayNames[schedule.dayOfWeek]}
                      </span>
                      {schedule.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.room && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {schedule.room}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrolled Students
            </h2>
            {classDetails.enrollments.length > 0 ? (
              <div className="space-y-3">
                {classDetails.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users2 className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{enrollment.student.name}</div>
                        {enrollment.student.email && (
                          <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Enrolled</div>
                      <div className="text-xs text-gray-400">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No students enrolled yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
