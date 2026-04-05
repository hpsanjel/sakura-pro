"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Plus, Search, Filter, Eye, Edit, Trash2, Phone, Calendar, BookOpen, FileText, AlertCircle, CheckCircle, Clock, User, Mail, GraduationCap, TrendingUp, Activity, Settings } from "lucide-react"

interface Student {
  id: string
  name: string
  passportNumber: string
  dateOfBirth: string
  phone: string
  japaneseLanguageLevel: string
  intake: string
  visaStatus: string
  createdAt: string
  _count: {
    documents: number
    sponsors: number
    applications: number
  }
}

const visaStatusConfig = {
  NEW_LEAD: { color: 'bg-gray-500', label: 'New Lead', icon: User },
  DOCS_PENDING: { color: 'bg-yellow-500', label: 'Documents Pending', icon: Clock },
  DOCS_VERIFIED: { color: 'bg-blue-500', label: 'Documents Verified', icon: CheckCircle },
  SENT_TO_JAPAN: { color: 'bg-purple-500', label: 'Sent to Japan', icon: Mail },
  COE_APPLIED: { color: 'bg-indigo-500', label: 'COE Applied', icon: FileText },
  COE_APPROVED: { color: 'bg-green-500', label: 'COE Approved', icon: CheckCircle },
  VISA_APPLIED: { color: 'bg-orange-500', label: 'Visa Applied', icon: Clock },
  VISA_APPROVED: { color: 'bg-emerald-500', label: 'Visa Approved', icon: CheckCircle },
  REJECTED: { color: 'bg-red-500', label: 'Rejected', icon: AlertCircle },
}

export default function StudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterLevel, setFilterLevel] = useState("ALL")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'COUNSELOR') {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchStudents()
    }
  }, [status, session, router])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students")
      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }
      const data = await response.json()
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const deleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) {
      return
    }

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete student")
      }

      // Refresh the students list
      fetchStudents()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student")
    }
  }

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      </>
    )
  }

  return (
    <>
      
      <div className="flex">

        <main className="flex-1 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Students
              </h1>
              <p className="text-lg text-white/80 mb-6">
                Manage all students in your consultancy
              </p>
            </div>
              <div className="flex items-center gap-4 flex-wrap">
                {(session?.user.role === 'ADMIN' || session?.user.role === 'COUNSELOR') && (
                  <Link href="/students/add" className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group">
                    <Plus className="w-5 h-5" />
                    Add New Student
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  </Link>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-1 min-w-[300px] relative border border-gray-200 rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  placeholder="Search students by name, passport, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-5 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 cursor-pointer"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="NEW_LEAD">New Lead</option>
                <option value="DOCS_PENDING">Documents Pending</option>
                <option value="DOCS_VERIFIED">Documents Verified</option>
                <option value="SENT_TO_JAPAN">Sent to Japan</option>
                <option value="COE_APPLIED">COE Applied</option>
                <option value="COE_APPROVED">COE Approved</option>
                <option value="VISA_APPLIED">Visa Applied</option>
                <option value="VISA_APPROVED">Visa Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select 
                className="px-5 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 cursor-pointer"
                value={filterLevel} 
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="ALL">All Levels</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            {/* Students Grid */}
            {students.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Users className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No students found</h2>
                <div className="text-gray-600 mb-6">
                  {(session?.user.role === 'ADMIN' || session?.user.role === 'COUNSELOR') ? (
                    <>
                      Start by adding your first student to the system.
                      <br />
                      <Link href="/students/add" className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group mt-4">
                        <Plus className="w-5 h-5" />
                        Add Your First Student
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                      </Link>
                    </>
                  ) : (
                    "No students have been added to the system yet."
                  )}
                </div>
              </div>
            ) : (
              <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students
                  .filter(student => {
                    const matchesSearch = searchTerm === "" || 
                      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      student.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      student.phone.toLowerCase().includes(searchTerm.toLowerCase())
                    
                    const matchesStatus = filterStatus === "ALL" || student.visaStatus === filterStatus
                    const matchesLevel = filterLevel === "ALL" || student.japaneseLanguageLevel === filterLevel
                    
                    return matchesSearch && matchesStatus && matchesLevel
                  })
                  .map((student) => {
                    const statusConfig = visaStatusConfig[student.visaStatus as keyof typeof visaStatusConfig]
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <div key={student.id} className="bg-indigo-50 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full text-xs font-semibold text-white uppercase tracking-wide ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </div>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.phone}</p>
                            </div>
                          </div>
                        </div>
{/*                         
                        <div className="grid grid-cols-1 gap-6 mb-6">
                          <div className="flex items-center gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700 font-medium">{student.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700 font-medium">
                              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <BookOpen className="w-4 h-4 text-gray-500" /> Language Level:
                            <span className="text-sm text-gray-700 font-medium">{student.japaneseLanguageLevel}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-500" /> Intake: 
                            <span className="text-sm text-gray-700 font-medium">{student.intake}</span>
                          </div>
                        </div> */}
                        
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          {/* <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm text-gray-700 font-semibold">{student._count.documents} doc</span>
                          </div> */}
                          {/* <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm text-gray-700 font-semibold">{student._count.sponsors} sponsors</span>
                          </div> */}
                          {/* <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm text-gray-700 font-semibold">{student._count.applications} application/s</span>
                          </div> */}
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-gray-200/50">
                          <Link href={`/students/${student.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-all duration-200 hover:transform hover:-translate-y-0.5">
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          {(session?.user.role === 'ADMIN' || session?.user.role === 'COUNSELOR') && (
                            <>
                              <Link href={`/students/${student.id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-100 transition-all duration-200 hover:transform hover:-translate-y-0.5">
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => deleteStudent(student.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all duration-200 hover:transform hover:-translate-y-0.5"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
