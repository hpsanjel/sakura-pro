"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { User, Phone, MapPin, GraduationCap, BookOpen, Calendar, FileText, Users, School, Clock, CheckCircle, AlertCircle, Settings, Mail, Shield, TrendingUp, Activity, CreditCard, Building, Book } from "lucide-react"

interface JapaneseClass {
  id: string
  name: string
  level: string
  consultancyId: string
  description?: string
}

interface ClassEnrollment {
  id: string
  classId: string
  scheduleId: string
  class: JapaneseClass
  schedule: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    room?: string
  }
  enrolledAt: string
  isActive: boolean
}

interface Student {
  id: string
  name: string
  passportNumber: string
  dateOfBirth: string
  phone: string
  address: string
  education: string
  japaneseLanguageLevel: string
  intake: string
  visaStatus: string
  category?: string
  email?: string
  userId?: string
  hasLoginAccess?: boolean
  loginSentAt?: string
  createdAt: string
  updatedAt: string
  documents: Document[]
  sponsors: Sponsor[]
  applications: Application[]
}

interface Document {
  id: string
  type: string
  status: string
  fileName?: string
  notes?: string
}

interface Sponsor {
  id: string
  name: string
  relation: string
  income?: string
  bankBalance?: string
}

interface Application {
  id: string
  status?: string
  notes?: string
  school: {
    id: string
    name: string
    address?: string
    website?: string
  }
}

const VISA_STAGES = [
  { key: "NEW_LEAD", label: "New Lead", color: "bg-gray-100 text-gray-800" },
  { key: "DOCS_PENDING", label: "Documents Pending", color: "bg-yellow-100 text-yellow-800" },
  { key: "DOCS_VERIFIED", label: "Documents Verified", color: "bg-blue-100 text-blue-800" },
  { key: "SENT_TO_JAPAN", label: "Sent to Japan", color: "bg-purple-100 text-purple-800" },
  { key: "COE_APPLIED", label: "COE Applied", color: "bg-indigo-100 text-indigo-800" },
  { key: "COE_APPROVED", label: "COE Approved", color: "bg-green-100 text-green-800" },
  { key: "VISA_APPLIED", label: "Visa Applied", color: "bg-orange-100 text-orange-800" },
  { key: "VISA_APPROVED", label: "Visa Approved", color: "bg-emerald-100 text-emerald-800" },
  { key: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
]

const visaStatusColors = VISA_STAGES.reduce((acc, stage) => {
  acc[stage.key] = stage.color
  return acc
}, {} as Record<string, string>)

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
  return `${displayHour}:${minute} ${ampm}`
}

const getDayName = (dayOfWeek: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek]
}

export default function StudentViewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountFormData, setAccountFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && studentId) {
      fetchStudentData(studentId)
    }
  }, [status, router, studentId])

  const fetchStudentData = async (id: string) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/students/${id}`)
      if (!response.ok) {
        throw new Error("Student not found")
      }

      const data = await response.json()
      setStudent(data)
    } catch (error) {
      console.error("Error fetching student:", error)
      setError(error instanceof Error ? error.message : "Failed to load student")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!student?.email) {
      alert("Student email is required to create account")
      return
    }

    try {
      const response = await fetch(`/api/students/${studentId}/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // No password needed - will be sent via email
      })

      if (!response.ok) {
        throw new Error("Failed to create account")
      }

      const result = await response.json()
      
      // Refresh student data
      await fetchStudentData(studentId)
      setShowAccountModal(false)
      
      // Show enhanced success message with visa status update information
      let message = `Student account created successfully! Welcome email has been sent to ${student.email} with password setup instructions.`
      
      if (result.automaticStatusChange) {
        message += `\n\n📋 Visa status automatically updated from "${result.previousVisaStatus}" to "${result.visaStatusUpdated}" since the student now has login access.`
      }
      
      alert(message)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create account")
    }
  }

  const handleRevokeAccess = async () => {
    if (!confirm("Are you sure you want to revoke this student's login access?")) {
      return
    }

    try {
      const response = await fetch(`/api/students/${studentId}/create-account`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to revoke access")
      }

      // Refresh student data
      await fetchStudentData(studentId)
      
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to revoke access")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-900 mb-2">Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Back to Students
          </Link>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <div className="p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <Link
                href="/students"
                className="inline-flex items-center text-purple-100 hover:text-white mb-4 transition-colors"
              >
                ← Back to Students
              </Link>
              <h1 className="text-4xl font-bold text-white mb-2">{student.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-purple-100">
                <span className="flex items-center gap-1">
                  <Book className="w-4 h-4" />
                  {student.passportNumber}
                </span>
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <div className="flex items-center gap-3">
            {student.hasLoginAccess ? (
              <button
                onClick={handleRevokeAccess}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Revoke Access
              </button>
            ) : (
              <button
                onClick={() => setShowAccountModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Create Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${visaStatusColors[student.visaStatus] || 'bg-gray-100 text-gray-800'}`}>
              {VISA_STAGES.find(stage => stage.key === student.visaStatus)?.label || student.visaStatus}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Visa Status</h3>
          <p className="text-gray-600 text-sm">Current application stage</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">
              {student.documents.filter(doc => doc.status === 'VERIFIED').length}/{student.documents.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <p className="text-gray-600 text-sm">Verified documents</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <School className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">
              {student.applications.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
          <p className="text-gray-600 text-sm">School applications</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">
              {student.sponsors.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sponsors</h3>
          <p className="text-gray-600 text-sm">Financial sponsors</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{student.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Passport Number</label>
                <p className="text-gray-900">{student.passportNumber}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{student.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{student.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{student.address}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Education</label>
                <p className="text-gray-900">{student.education}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Japanese Level</label>
                <p className="text-gray-900">{student.japaneseLanguageLevel}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Intake</label>
                <p className="text-gray-900">{student.intake}</p>
              </div>
              
              {student.category && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{student.category}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sponsors */}
          {student.sponsors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Sponsors
              </h2>
              
              <div className="space-y-4">
                {student.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                    <p className="text-sm text-gray-600">{sponsor.relation}</p>
                    {sponsor.income && (
                      <p className="text-sm text-gray-600">Income: {sponsor.income}</p>
                    )}
                    {sponsor.bankBalance && (
                      <p className="text-sm text-gray-600">Bank Balance: {sponsor.bankBalance}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{document.type}</h3>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      document.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      document.status === 'UPLOADED' ? 'bg-blue-100 text-blue-800' :
                      document.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.status}
                    </span>
                  </div>
                  
                  {document.fileName && (
                    <p className="text-sm text-gray-600 truncate">{document.fileName}</p>
                  )}
                  
                  {document.notes && (
                    <p className="text-sm text-gray-600 mt-1">{document.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          {student.applications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <School className="w-5 h-5" />
                School Applications
              </h2>
              
              <div className="space-y-4">
                {student.applications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{application.school.name}</h3>
                      {application.status && (
                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {application.status}
                        </span>
                      )}
                    </div>
                    
                    {application.school.address && (
                      <p className="text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {application.school.address}
                      </p>
                    )}
                    
                    {application.school.website && (
                      <a
                        href={application.school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Visit Website →
                      </a>
                    )}
                    
                    {application.notes && (
                      <p className="text-sm text-gray-600 mt-2">{application.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Student Account</h2>
            <p className="text-gray-600 mb-6">
              Send welcome email to <strong>{student?.name}</strong> at <strong>{student?.email}</strong> with password setup instructions.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Student receives welcome email immediately</li>
                    <li>• Email contains secure password setup link</li>
                    <li>• Student can set their own password</li>
                    <li>• Account becomes active after password setup</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAccountModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send Welcome Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
