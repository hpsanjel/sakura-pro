"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ApplicationUpdateModal from "@/components/application-update-modal"
import { 
  School, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Search,
  Filter,
  User,
  ExternalLink,
  Plus,
  Users,
  Send,
  Loader2
} from "lucide-react"

interface Application {
  id: string
  studentId: string
  schoolId: string
  appliedAt: string
  status: "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WAITLISTED" | "WITHDRAWN"
  notes?: string
  submittedAt?: string
  responseDate?: string
  responseNotes?: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    name: string
    passportNumber?: string
    visaStatus: string
  }
  school: {
    id: string
    name: string
    isPartner: boolean
  }
}

interface Student {
  id: string
  name: string
  passportNumber?: string
  visaStatus: string
  japaneseLanguageLevel: string
  phone: string
}

interface PartnerSchool {
  id: string
  name: string
  address?: string
  website?: string
  isPartner: boolean
}

const applicationStatusConfig = {
  PENDING: { 
    color: 'bg-gray-100 text-gray-800', 
    label: 'Pending', 
    icon: Clock,
    description: 'Application being prepared'
  },
  SUBMITTED: { 
    color: 'bg-blue-100 text-blue-800', 
    label: 'Submitted', 
    icon: FileText,
    description: 'Application sent to school'
  },
  ACCEPTED: { 
    color: 'bg-green-100 text-green-800', 
    label: 'Accepted', 
    icon: CheckCircle,
    description: 'Application approved by school'
  },
  REJECTED: { 
    color: 'bg-red-100 text-red-800', 
    label: 'Rejected', 
    icon: XCircle,
    description: 'Application rejected by school'
  },
  WAITLISTED: { 
    color: 'bg-yellow-100 text-yellow-800', 
    label: 'Waitlisted', 
    icon: AlertCircle,
    description: 'Application placed on waiting list'
  },
  WITHDRAWN: { 
    color: 'bg-gray-100 text-gray-800', 
    label: 'Withdrawn', 
    icon: XCircle,
    description: 'Application withdrawn'
  }
}

const visaStatusConfig = {
  NEW_LEAD: { color: 'bg-gray-500', label: 'New Lead' },
  DOCS_PENDING: { color: 'bg-yellow-500', label: 'Documents Pending' },
  DOCS_VERIFIED: { color: 'bg-blue-500', label: 'Documents Verified' },
  SENT_TO_JAPAN: { color: 'bg-purple-500', label: 'Sent to Japan' },
  COE_APPLIED: { color: 'bg-indigo-500', label: 'COE Applied' },
  COE_APPROVED: { color: 'bg-green-500', label: 'COE Approved' },
  VISA_APPLIED: { color: 'bg-orange-500', label: 'Visa Applied' },
  VISA_APPROVED: { color: 'bg-emerald-500', label: 'Visa Approved' },
  REJECTED: { color: 'bg-red-500', label: 'Rejected' },
}

export default function ApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterStudent, setFilterStudent] = useState("")
  
  // Bulk application state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [showBulkApplyModal, setShowBulkApplyModal] = useState(false)
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkNotes, setBulkNotes] = useState("")
  const [activeTab, setActiveTab] = useState<"applications" | "bulk">("applications")
  const [studentVisaFilter, setStudentVisaFilter] = useState("ALL")
  
  // Application update state
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  const isAdminOrCounselor = session?.user.role === 'ADMIN' || session?.user.role === 'COUNSELOR'
  const isStudent = session?.user.role === 'STUDENT'
  const isAdmin = session?.user.role === 'ADMIN'

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      // Students only need to fetch applications, no bulk functionality
      if (isStudent || activeTab === "applications") {
        fetchApplications()
      } else if (isAdminOrCounselor && activeTab === "bulk") {
        fetchStudentsAndSchools()
      }
    }
  }, [status, session, router, activeTab])

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStudent) params.append('studentId', filterStudent)
      if (filterStatus !== "ALL") params.append('status', filterStatus)

      const response = await fetch(`/api/applications?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch applications")
      }
      const data = await response.json()
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsAndSchools = async () => {
    try {
      console.log("Fetching students and schools for bulk apply...")
      // Fetch all students in consultancy (not just DOCS_VERIFIED) and include all years
      const studentsResponse = await fetch("/api/students?includeAllYears=true")
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        console.log("Students fetched:", studentsData?.length || 0)
        console.log("Student data:", studentsData)
        setStudents(studentsData || [])
      } else {
        console.error("Failed to fetch students:", studentsResponse.status)
        const errorData = await studentsResponse.json()
        console.error("Error details:", errorData)
      }

      // Fetch partner schools
      const schoolsResponse = await fetch("/api/schools?isPartner=true")
      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json()
        console.log("Schools fetched:", schoolsData?.length || 0)
        console.log("Schools data:", schoolsData)
        setPartnerSchools(schoolsData || [])
      } else {
        console.error("Failed to fetch schools:", schoolsResponse.status)
        const errorData = await schoolsResponse.json()
        console.error("Schools error details:", errorData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && activeTab === "applications") {
      fetchApplications()
    }
  }, [filterStatus, filterStudent])

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSchoolToggle = (schoolId: string) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    )
  }

  const handleUpdateApplication = (application: Application) => {
    setSelectedApplication(application)
    setShowUpdateModal(true)
  }

  // Check if student has been rejected by a specific school
  const isSchoolDisabledForStudent = (studentId: string, schoolId: string) => {
    const studentApplications = applications.filter(app => 
      app.studentId === studentId && app.schoolId === schoolId
    )
    return studentApplications.some(app => app.status === "REJECTED")
  }

  // Get disabled schools for a student (schools that rejected them)
  const getDisabledSchoolsForStudent = (studentId: string) => {
    const studentApplications = applications.filter(app => app.studentId === studentId)
    return studentApplications
      .filter(app => app.status === "REJECTED")
      .map(app => app.schoolId)
  }

  const handleApplicationUpdateSuccess = () => {
    fetchApplications()
    if (activeTab === "bulk") {
      fetchStudentsAndSchools()
    }
  }

  const handleBulkApply = async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student")
      return
    }
    if (selectedSchools.length === 0) {
      setError("Please select at least one school")
      return
    }

    setBulkApplying(true)
    setError("")

    try {
      // Create applications for each student-school combination
      const promises = selectedStudents.flatMap(studentId =>
        selectedSchools.map(schoolId =>
          fetch(`/api/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              schoolId,
              notes: bulkNotes.trim() || undefined
            })
          })
        )
      )

      const results = await Promise.allSettled(promises)
      const failed = results.filter(result => result.status === 'rejected')
      
      if (failed.length === 0) {
        // All successful - update student visa statuses
        await Promise.all(
          selectedStudents.map(studentId =>
            fetch(`/api/students/${studentId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ visaStatus: 'SENT_TO_JAPAN' })
            })
          )
        )

        // Reset state
        setSelectedStudents([])
        setSelectedSchools([])
        setBulkNotes("")
        setShowBulkApplyModal(false)
        
        // Refresh data
        fetchStudentsAndSchools()
        fetchApplications()
      } else {
        throw new Error(`Failed to create ${failed.length} applications`)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create applications")
    } finally {
      setBulkApplying(false)
    }
  }

  const filteredApplications = applications.filter(application => {
    const matchesSearch = searchTerm === "" || 
      application.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.student.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === "" || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVisaStatus = studentVisaFilter === "ALL" || student.visaStatus === studentVisaFilter
    
    return matchesSearch && matchesVisaStatus
  })

  // Debug logging
  console.log("Total students:", students.length)
  console.log("Filtered students:", filteredStudents.length)
  console.log("Search term:", searchTerm)
  console.log("Visa filter:", studentVisaFilter)
  console.log("Partner schools:", partnerSchools.length)
  if (students.length > 0) {
    console.log("Students:", students.map(s => ({ name: s.name, visaStatus: s.visaStatus })))
  }
  if (partnerSchools.length > 0) {
    console.log("Partner schools:", partnerSchools.map(s => ({ name: s.name, isPartner: s.isPartner })))
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">School Applications</h1>
                <p className="mt-2 text-gray-600">
                  {isStudent 
                    ? "Track your school application status and progress"
                    : "Track and manage student applications to partner schools"
                  }
                </p>
              </div>
              {isAdmin && (
                <Link
                  href="/schools/add"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Partner School
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          {isAdminOrCounselor && (
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "applications"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  View Applications
                </button>
                <button
                  onClick={() => setActiveTab("bulk")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "bulk"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Bulk Apply
                </button>
              </nav>
            </div>
          )}

          {/* Student Welcome Message */}
          {isStudent && applications.length === 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">No Applications Yet</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your applications will appear here once your counselor submits them to partner schools.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Applications Tab */}
          {(activeTab === "applications" || isStudent) && (
            <>
              {/* Search and Filters - Only for Admin/Counselor */}
              {isAdminOrCounselor && (
                <div className="flex gap-4 mb-6 flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search by student name, school, or passport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    {Object.entries(applicationStatusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>

                  {isAdminOrCounselor && (
                    <select 
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filterStudent} 
                      onChange={(e) => setFilterStudent(e.target.value)}
                    >
                      <option value="">All Students</option>
                      {applications
                        .reduce((unique, app) => {
                          if (!unique.some(student => student.id === app.student.id)) {
                            unique.push(app.student)
                          }
                          return unique
                        }, [] as typeof applications[0]['student'][])
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(student => (
                          <option key={`student-filter-${student.id}`} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              )}

              {/* Applications Grid */}
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600">
                    {isStudent 
                      ? "Your applications will appear here once submitted by your counselor"
                      : (searchTerm || filterStatus !== "ALL" || filterStudent 
                        ? "Try adjusting your search or filters"
                        : "Start by sending student applications to partner schools")
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApplications.map((application) => {
                    const statusConfig = applicationStatusConfig[application.status]
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <div key={`app-${application.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </div>
                          {application.school.isPartner && (
                            <span className="text-xs text-green-600 font-medium">Partner</span>
                          )}
                        </div>

                        {/* School Info */}
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <School className="w-4 h-4 text-indigo-600" />
                            {application.school.name}
                          </h3>
                          {application.notes && (
                            <p className="text-sm text-gray-600 line-clamp-2">{application.notes}</p>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{application.student.name}</span>
                          </div>
                          {application.student.passportNumber && (
                            <div className="text-xs text-gray-500 mt-1">
                              Passport: {application.student.passportNumber}
                            </div>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                          </div>
                          {application.submittedAt && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              <span>Submitted: {new Date(application.submittedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {application.responseDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              <span>Response: {new Date(application.responseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Response Notes */}
                        {application.responseNotes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">School Response:</span> {application.responseNotes}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                          {isAdminOrCounselor && (
                            <>
                              <button
                                onClick={() => handleUpdateApplication(application)}
                                className="flex-1 text-center px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                Update Status
                              </button>
                              <Link
                                href={`/students/${application.studentId}`}
                                className="flex-1 text-center px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                View Student
                              </Link>
                            </>
                          )}
                          {isStudent && (
                            <div className="flex-1 text-center px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg">
                              Your Application
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Bulk Apply Tab - Available for Admin and Counselor */}
          {activeTab === "bulk" && isAdminOrCounselor && (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Search students by name or passport..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={studentVisaFilter} 
                    onChange={(e) => setStudentVisaFilter(e.target.value)}
                  >
                    <option value="ALL">All Visa Statuses</option>
                    {Object.entries(visaStatusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Students ({filteredStudents.length})
                    {studentVisaFilter !== "ALL" && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        - {visaStatusConfig[studentVisaFilter as keyof typeof visaStatusConfig]?.label}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {selectedStudents.length} selected
                    </span>
                    {selectedStudents.length > 0 && (
                      <button
                        onClick={() => setShowBulkApplyModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        <Send className="w-4 h-4" />
                        Apply to Schools
                      </button>
                    )}
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">
                      {searchTerm || studentVisaFilter !== "ALL" 
                        ? "Try adjusting your search or filters" 
                        : "No students available in this consultancy"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => {
                      // Check if student has existing applications
                      const studentApplications = applications.filter(app => app.studentId === student.id)
                      const hasAcceptedApplication = studentApplications.some(app => app.status === "ACCEPTED")
                      const hasRejectedApplications = studentApplications.some(app => app.status === "REJECTED")
                      const hasPendingApplications = studentApplications.some(app => 
                        app.status === "PENDING" || app.status === "SUBMITTED" || app.status === "WAITLISTED"
                      )
                      
                      return (
                        <div
                          key={`student-${student.id}`}
                          className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 ${
                            hasAcceptedApplication ? 'border-green-200 bg-green-50' : 
                            hasRejectedApplications ? 'border-red-200 bg-red-50' : 
                            'border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {student.name}
                              {hasAcceptedApplication && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  ✓ Accepted
                                </span>
                              )}
                              {hasRejectedApplications && !hasAcceptedApplication && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                  Rejected
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.passportNumber && `Passport: ${student.passportNumber} • `}
                              Level: {student.japaneseLanguageLevel} • {student.phone}
                            </div>
                            {studentApplications.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {studentApplications.length} application{studentApplications.length > 1 ? 's' : ''} 
                                {hasAcceptedApplication && ' • Ready for COE'}
                                {hasPendingApplications && !hasAcceptedApplication && ' • Pending'}
                                {hasRejectedApplications && !hasAcceptedApplication && !hasPendingApplications && ' • All rejected'}
                              </div>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${visaStatusConfig[student.visaStatus as keyof typeof visaStatusConfig]?.color}`}>
                            {visaStatusConfig[student.visaStatus as keyof typeof visaStatusConfig]?.label}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Legend */}
          <div className="mt-8 bg-white rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Application Status Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(applicationStatusConfig).map(([key, config]) => {
                const StatusIcon = config.icon
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{config.label}</h4>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Apply Modal */}
      {showBulkApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Apply to Schools</h2>
                <p className="text-gray-600 mt-1">
                  Send applications for {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} to partner schools
                </p>
              </div>
              <button
                onClick={() => setShowBulkApplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Selected Students */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Selected Students ({selectedStudents.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId)
                      return student ? (
                        <div key={studentId} className="text-sm text-gray-700">
                          • {student.name}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              </div>

              {/* School Selection */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Select Partner Schools</h3>
                
                {/* Show warnings for schools with previous rejections */}
                {selectedStudents.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId)
                      if (!student) return null
                      
                      const disabledSchools = getDisabledSchoolsForStudent(studentId)
                      if (disabledSchools.length === 0) return null
                      
                      return (
                        <div key={studentId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-yellow-800">
                                <strong>{student.name}</strong> has been rejected by {disabledSchools.length} school{disabledSchools.length > 1 ? 's' : ''} before. Those schools will be disabled.
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {partnerSchools.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <School className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No partner schools available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please add partner schools to the system first
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {partnerSchools.map((school) => {
                      // Check if this school is disabled for any selected student
                      const disabledForStudents = selectedStudents.filter(studentId => 
                        isSchoolDisabledForStudent(studentId, school.id)
                      )
                      const isDisabled = disabledForStudents.length > 0
                      
                      return (
                        <div
                          key={`school-${school.id}`}
                          className={`border rounded-lg p-4 transition-all ${
                            isDisabled 
                              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                              : selectedSchools.includes(school.id)
                                ? "border-indigo-500 bg-indigo-50 cursor-pointer"
                                : "border-gray-200 hover:border-gray-300 cursor-pointer"
                          }`}
                          onClick={() => !isDisabled && handleSchoolToggle(school.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isDisabled
                                    ? "border-gray-300 bg-gray-200"
                                    : selectedSchools.includes(school.id)
                                      ? "border-indigo-500 bg-indigo-500"
                                      : "border-gray-300"
                                }`}
                              >
                                {selectedSchools.includes(school.id) && !isDisabled && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                                {isDisabled && (
                                  <XCircle className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{school.name}</div>
                              {school.address && (
                                <div className="text-sm text-gray-600 mt-1">{school.address}</div>
                              )}
                              {isDisabled && (
                                <div className="text-sm text-red-600 mt-2">
                                  {disabledForStudents.length > 1 ? (
                                    <>Disabled for {disabledForStudents.length} students with previous rejections</>
                                  ) : (
                                    <>Disabled for {students.find(s => s.id === disabledForStudents[0])?.name} (rejected before)</>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Notes (Optional)
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add notes for these applications..."
                />
              </div>

              {/* Summary */}
              {selectedSchools.length > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h4 className="font-medium text-indigo-900 mb-2">
                    Application Summary
                  </h4>
                  <p className="text-sm text-indigo-700">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} × {selectedSchools.length} school{selectedSchools.length !== 1 ? 's' : ''} = {selectedStudents.length * selectedSchools.length} total applications
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">
                    All selected students will be updated to "Sent to Japan" status
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowBulkApplyModal(false)}
                disabled={bulkApplying}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkApply}
                disabled={bulkApplying || selectedSchools.length === 0 || partnerSchools.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkApplying && <Loader2 className="w-4 h-4 animate-spin" />}
                {bulkApplying ? "Creating Applications..." : `Create ${selectedStudents.length * selectedSchools.length} Applications`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Update Modal */}
      <ApplicationUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        application={selectedApplication}
        onSuccess={handleApplicationUpdateSuccess}
      />
    </div>
  )
}
