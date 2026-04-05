"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, User, Filter, Plus, CheckCircle, XCircle, AlertCircle, MessageSquare, Star, Users, Video, Building } from "lucide-react"

interface Student {
  id: string
  name: string
  passportNumber: string
  japaneseLanguageLevel: string
}

interface Interview {
  id: string
  studentId: string
  type: "MOCK" | "REAL" | "EMBASSY"
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
  scheduledAt: string
  duration?: number
  location?: string
  notes?: string
  feedback?: string
  score?: number
  createdAt: string
  updatedAt: string
  student: Student
}

const typeLabels = {
  MOCK: "Mock Interview",
  REAL: "Real Interview",
  EMBASSY: "Embassy Interview"
}

const statusLabels = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled"
}

const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-yellow-100 text-yellow-800"
}

const typeColors = {
  MOCK: "bg-yellow-100 text-yellow-800",
  REAL: "bg-blue-100 text-blue-800",
  EMBASSY: "bg-purple-100 text-purple-800"
}

const typeIcons = {
  MOCK: Users,
  REAL: Video,
  EMBASSY: Building
}

export default function TeacherInterviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("")
  const [formData, setFormData] = useState({
    studentId: "",
    type: "MOCK" as "MOCK" | "REAL" | "EMBASSY",
    scheduledAt: "",
    duration: 60,
    location: "",
    notes: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "TEACHER") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchInterviews()
      fetchStudents()
    }
  }, [status, session, router, filterStatus, filterType])

  const fetchInterviews = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append("status", filterStatus)
      if (filterType) params.append("type", filterType)

      const response = await fetch(`/api/teacher/interviews?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInterviews(data)
      }
    } catch (error) {
      console.error("Error fetching interviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/teacher/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          studentId: "",
          type: "MOCK",
          scheduledAt: "",
          duration: 60,
          location: "",
          notes: ""
        })
        fetchInterviews()
      }
    } catch (error) {
      console.error("Error creating interview:", error)
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview Management</h1>
            <p className="text-blue-100 mb-4">Schedule and manage student interviews</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{interviews.length} Total</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{interviews.filter(i => i.status === 'COMPLETED').length} Completed</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{interviews.filter(i => i.status === 'SCHEDULED').length} Scheduled</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {showCreateForm ? (
              <>
                <XCircle className="w-5 h-5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Schedule Interview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{interviews.length}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Total Interviews</h3>
          <p className="text-gray-600 text-sm">All scheduled interviews</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">
              {interviews.filter(i => i.status === "SCHEDULED").length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled</h3>
          <p className="text-gray-600 text-sm">Upcoming interviews</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">
              {interviews.filter(i => i.status === "COMPLETED").length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
          <p className="text-gray-600 text-sm">Finished interviews</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">
              {new Set(interviews.map(i => i.studentId)).size}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
          <p className="text-gray-600 text-sm">Unique students</p>
        </div>
      </div>

      {/* Create Interview Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Schedule New Interview</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.passportNumber}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  required
                  min="15"
                  max="180"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Room 101, Online via Zoom, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any additional notes for the interview..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Schedule Interview
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-5 h-5" />
            Filters:
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Types</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interviews List */}
      <div className="space-y-6">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews found</h3>
            <p className="text-gray-600">
              {filterStatus || filterType ? "No interviews match your filters." : "No interviews scheduled yet."}
            </p>
          </div>
        ) : (
          interviews.map((interview) => {
            const TypeIcon = typeIcons[interview.type]
            const dateTime = formatDateTime(interview.scheduledAt)
            
            return (
              <div key={interview.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Section - Student and Type Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeColors[interview.type]}`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {typeLabels[interview.type]}
                          </h3>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[interview.status]}`}>
                            {statusLabels[interview.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{interview.student.name}</span>
                        <span className="text-gray-500">({interview.student.passportNumber})</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{dateTime.date}</span>
                        <Clock className="w-4 h-4" />
                        <span>{dateTime.time}</span>
                      </div>
                      
                      {interview.location && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{interview.location}</span>
                        </div>
                      )}
                      
                      {interview.duration && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{interview.duration} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Section - Actions and Additional Info */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-2">
                      {interview.score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">{interview.score}/10</span>
                        </div>
                      )}
                    </div>
                    
                    {interview.notes && (
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">Notes</span>
                        </div>
                        <p className="text-sm text-gray-600">{interview.notes}</p>
                      </div>
                    )}
                    
                    {interview.feedback && (
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">Feedback</span>
                        </div>
                        <p className="text-sm text-gray-600">{interview.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
