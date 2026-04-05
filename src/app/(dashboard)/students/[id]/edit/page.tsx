"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { getStatusDescription, getRequiredDocumentsForStatus } from "@/lib/client-helpers"
import Link from "next/link"
import SendToJapanModal from "@/components/send-to-japan-modal"
import ApplicationUpdateModal from "@/components/application-update-modal"
import StudentApplicationsPanel from "@/components/student-applications-panel"

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
  studyGoals?: string
  preferredStudyField?: string
  workExperience?: string
  financialProof?: string
  createdAt: string
  updatedAt: string
}

interface JapaneseClass {
  id: string
  name: string
  level: string
  description?: string
  maxStudents: number
  isActive: boolean
  schedules: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    room?: string
  }>
  _count: {
    enrollments: number
  }
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

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
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
  // Convert 24-hour time to 12-hour format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12 // Convert 0 to 12
  return `${displayHour}:${minutes} ${ampm}`
}

const timeToMinutes = (time: string) => {
  // Convert time string to minutes since midnight for comparison
  const [hours, minutes] = time.split(':')
  return parseInt(hours) * 60 + parseInt(minutes)
}

const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
  // Check if two time ranges overlap
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)
  
  return (s1 < e2 && s2 < e1) // Overlap if start1 < end2 and start2 < end1
}

export default function EditStudentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [availableClasses, setAvailableClasses] = useState<JapaneseClass[]>([])
  const [currentEnrollments, setCurrentEnrollments] = useState<ClassEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [enrollmentError, setEnrollmentError] = useState("")
  const [enrollmentSuccess, setEnrollmentSuccess] = useState("")
  const [showSendToJapanModal, setShowSendToJapanModal] = useState(false)
  const [previousVisaStatus, setPreviousVisaStatus] = useState("")
  
  // Application update state
  const [showApplicationUpdateModal, setShowApplicationUpdateModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    passportNumber: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    education: "",
    japaneseLanguageLevel: "N5",
    intake: "April",
    visaStatus: "NEW_LEAD",
    studyGoals: "",
    preferredStudyField: "",
    workExperience: "",
    financialProof: "",
  })

  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedScheduleId, setSelectedScheduleId] = useState("")

  // Reset form when studentId changes
  useEffect(() => {
    setFormData({
      name: "",
      passportNumber: "",
      dateOfBirth: "",
      phone: "",
      address: "",
      education: "",
      japaneseLanguageLevel: "N5",
      intake: "April",
      visaStatus: "NEW_LEAD",
      studyGoals: "",
      preferredStudyField: "",
      workExperience: "",
      financialProof: "",
    })
    setSelectedClassId("")
    setSelectedScheduleId("")
    setError("")
    setSuccess("")
    setEnrollmentError("")
    setEnrollmentSuccess("")
  }, [studentId])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && !["ADMIN", "COUNSELOR"].includes(session.user.role)) {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated" && studentId) {
      fetchAllData()
    }
  }, [status, session, router, studentId])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [studentRes, enrollmentRes, classesRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/students/${studentId}/enrollments`),
        fetch("/api/classes")
      ])

      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setStudent(studentData)
        const visaStatus = studentData.visaStatus
        setPreviousVisaStatus(visaStatus)
        setFormData({
          name: studentData.name,
          passportNumber: studentData.passportNumber,
          dateOfBirth: new Date(studentData.dateOfBirth).toISOString().split('T')[0],
          phone: studentData.phone,
          address: studentData.address,
          education: studentData.education,
          japaneseLanguageLevel: studentData.japaneseLanguageLevel,
          intake: studentData.intake,
          visaStatus: visaStatus,
          studyGoals: studentData.studyGoals || "",
          preferredStudyField: studentData.preferredStudyField || "",
          workExperience: studentData.workExperience || "",
          financialProof: studentData.financialProof || "",
        })
      }

      if (enrollmentRes.ok) {
        const enrollmentData = await enrollmentRes.json()
        setCurrentEnrollments(enrollmentData)
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setAvailableClasses(classesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load student data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if visa status is being changed to SENT_TO_JAPAN
    if (formData.visaStatus === 'SENT_TO_JAPAN' && previousVisaStatus !== 'SENT_TO_JAPAN') {
      setShowSendToJapanModal(true)
      return
    }
    
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
          // Show detailed validation errors
          const errorMessage = errorData.details.join("; ")
          throw new Error(`Visa status update failed: ${errorMessage}`)
        } else {
          throw new Error(errorData.error || "Failed to update student")
        }
      }

      setSuccess("Student updated successfully!")
      setPreviousVisaStatus(formData.visaStatus)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnroll = async () => {
    // Clear previous enrollment messages
    setEnrollmentError("")
    setEnrollmentSuccess("")

    if (!selectedClassId || !selectedScheduleId) {
      setEnrollmentError("Please select both a class and schedule")
      return
    }

    // Check for time conflicts with existing enrollments
    const selectedClass = availableClasses.find(c => c.id === selectedClassId)
    const selectedSchedule = selectedClass?.schedules.find(s => s.id === selectedScheduleId)

    if (!selectedSchedule) {
      setEnrollmentError("Invalid schedule selected")
      return
    }

    const hasTimeConflict = currentEnrollments.some(enrollment => {
      const existingSchedule = enrollment.schedule
      // Check if same day and overlapping time
      return existingSchedule.dayOfWeek === selectedSchedule.dayOfWeek &&
        hasTimeOverlap(existingSchedule.startTime, existingSchedule.endTime, selectedSchedule.startTime, selectedSchedule.endTime)
    })

    if (hasTimeConflict) {
      setEnrollmentError("Student is already enrolled in another class at this time")
      return
    }

    try {
      const response = await fetch(`/api/students/${studentId}/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: selectedClassId,
          scheduleId: selectedScheduleId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enroll student")
      }

      setEnrollmentSuccess("Student enrolled successfully!")
      setSelectedClassId("")
      setSelectedScheduleId("")
      fetchAllData()
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleUnenroll = async (enrollmentId: string) => {
    // Clear previous enrollment messages
    setEnrollmentError("")
    setEnrollmentSuccess("")

    try {
      const response = await fetch(`/api/students/${studentId}/enrollments/${enrollmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to unenroll student")
      }

      setEnrollmentSuccess("Student unenrolled successfully!")
      fetchAllData()
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleSendToJapanSuccess = () => {
    // Refresh student data to show updated status
    fetchAllData()
    setSuccess("Applications sent to Japan successfully!")
  }

  const handleUpdateApplication = (application: any) => {
    setSelectedApplication(application)
    setShowApplicationUpdateModal(true)
  }

  const handleApplicationUpdateSuccess = () => {
    // Refresh student data to show updated visa status if changed
    fetchAllData()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Student not found</h1>
          <Link href="/students" className="text-indigo-600 hover:text-indigo-700">
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  const selectedClass = availableClasses.find(c => c.id === selectedClassId)

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .class-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .class-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .enrollment-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #3b82f6;
        }
      `}</style>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
                <p className="mt-2 text-gray-600">
                  Update student information and manage class enrollments
                </p>
              </div>
              <Link
                href={`/students/${studentId}`}
                className="text-gray-600 hover:text-gray-700"
              >
                ← Back to Student
              </Link>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          {/* Student Information Form */}
          <div className="form-section">
            <h2 className="text-xl font-semibold mb-6">Student Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.passportNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+977-98XXXXXXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.education}
                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Japanese Level *
                  </label>
                  <select
                    value={formData.japaneseLanguageLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, japaneseLanguageLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intake *
                  </label>
                  <select
                    value={formData.intake}
                    onChange={(e) => setFormData(prev => ({ ...prev, intake: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                    <option value="January">January</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visa Status *
                  </label>
                  <select
                    value={formData.visaStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, visaStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {VISA_STAGES.map(stage => (
                      <option key={stage.key} value={stage.key}>{stage.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status Requirements */}
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Status Requirements</h4>
                    <p className="text-sm text-blue-700">
                      {getStatusDescription(formData.visaStatus)}
                    </p>
                    {getRequiredDocumentsForStatus(formData.visaStatus).length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">Required Documents:</h5>
                        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                          {getRequiredDocumentsForStatus(formData.visaStatus).map((doc, index) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Study Goals
                  </label>
                  <textarea
                    value={formData.studyGoals}
                    onChange={(e) => setFormData(prev => ({ ...prev, studyGoals: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Student's goals for studying in Japan..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Study Field
                  </label>
                  <input
                    type="text"
                    value={formData.preferredStudyField}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredStudyField: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Information Technology, Business, Engineering..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Experience
                  </label>
                  <textarea
                    value={formData.workExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, workExperience: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Previous work experience (if any)..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Financial Proof Details
                  </label>
                  <textarea
                    value={formData.financialProof}
                    onChange={(e) => setFormData(prev => ({ ...prev, financialProof: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Bank balance, sponsor details, etc..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Student"}
                </button>
              </div>
            </form>
          </div>

          {/* Class Enrollment Section */}
          <div className="form-section">
            <h2 className="text-xl font-semibold mb-6">Class Enrollment</h2>

            {/* Current Enrollments */}
            {currentEnrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Enrollments</h3>
                <div className="space-y-3">
                  {currentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="enrollment-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{enrollment.class.name}</h4>
                          <p className="text-sm text-gray-600">
                            {enrollment.class.level} • {dayNames[enrollment.schedule.dayOfWeek]} {formatTime(enrollment.schedule.startTime)} - {formatTime(enrollment.schedule.endTime)}
                            {enrollment.schedule.room && ` • Room ${enrollment.schedule.room}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnenroll(enrollment.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Unenroll
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Enrollment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enroll in New Class</h3>
              
              {/* Enrollment Alerts */}
              {enrollmentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {enrollmentError}
                </div>
              )}
              {enrollmentSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                  {enrollmentSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value)
                      setSelectedScheduleId("")
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose a class...</option>
                    {availableClasses.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.level}) - {classItem._count.enrollments}/{classItem.maxStudents} students
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClass && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Schedule
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose schedule...</option>
                      {selectedClass.schedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {dayNames[schedule.dayOfWeek]} {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          {schedule.room && ` • Room ${schedule.room}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedClass && (
                <div className="class-card mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedClass.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedClass.description}</p>
                  <div className="text-sm text-gray-500">
                    Level: {selectedClass.level} • Max Students: {selectedClass.maxStudents}
                  </div>
                </div>
              )}

              <button
                onClick={handleEnroll}
                disabled={!selectedClassId || !selectedScheduleId}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enroll Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Panel */}
      <div className="mb-8">
        <StudentApplicationsPanel
          studentId={studentId}
          onUpdateApplication={handleUpdateApplication}
        />
      </div>

      {/* Send to Japan Modal */}
      <SendToJapanModal
        isOpen={showSendToJapanModal}
        onClose={() => setShowSendToJapanModal(false)}
        studentId={studentId}
        studentName={student.name}
        onSuccess={handleSendToJapanSuccess}
      />

      {/* Application Update Modal */}
      <ApplicationUpdateModal
        isOpen={showApplicationUpdateModal}
        onClose={() => setShowApplicationUpdateModal(false)}
        application={selectedApplication}
        onSuccess={handleApplicationUpdateSuccess}
      />
    </div>
  )
}
