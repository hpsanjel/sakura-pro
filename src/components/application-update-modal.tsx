"use client"

import { useState, useEffect } from "react"
import { X, School, CheckCircle, XCircle, AlertCircle, Clock, Calendar, FileText, Loader2 } from "lucide-react"

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

interface ApplicationUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
  onSuccess: () => void
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

export default function ApplicationUpdateModal({ 
  isOpen, 
  onClose, 
  application, 
  onSuccess 
}: ApplicationUpdateModalProps) {
  const [newStatus, setNewStatus] = useState<Application['status']>("SUBMITTED")
  const [responseNotes, setResponseNotes] = useState("")
  const [responseDate, setResponseDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const statusOptions: Application['status'][] = [
    "SUBMITTED",
    "ACCEPTED", 
    "REJECTED", 
    "WAITLISTED", 
    "WITHDRAWN"
  ]

  useEffect(() => {
    if (application && isOpen) {
      setNewStatus(application.status)
      setResponseNotes(application.responseNotes || "")
      setResponseDate(
        application.responseDate 
          ? new Date(application.responseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      )
      setError("")
    }
  }, [application, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!application) return

    setIsSubmitting(true)
    setError("")

    try {
      // Clear response notes when moving from waitlisted/rejected to accepted
      let finalResponseNotes = responseNotes.trim() || null
      if (newStatus === "ACCEPTED" && 
          (application.status === "WAITLISTED" || application.status === "REJECTED")) {
        finalResponseNotes = null // Clear previous waitlist/rejection notes
      }

      const updateData = {
        status: newStatus,
        responseDate: responseDate,
        responseNotes: finalResponseNotes,
        submittedAt: newStatus === "SUBMITTED" && !application.submittedAt 
          ? new Date().toISOString() 
          : null
      }

      console.log("Sending application update:", updateData)

      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log("Error response:", errorData)
        throw new Error(errorData.error || "Failed to update application")
      }

      const data = await response.json()
      console.log("Success response:", data)
      
      // If application was accepted, check if we can update student status
      if (newStatus === "ACCEPTED") {
        await checkAndUpdateStudentStatus(application.studentId)
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkAndUpdateStudentStatus = async (studentId: string) => {
    try {
      // Get all applications for this student
      const appsResponse = await fetch(`/api/applications?studentId=${studentId}`)
      if (appsResponse.ok) {
        const applications = await appsResponse.json()
        const hasAcceptedApplication = applications.some((app: Application) => app.status === "ACCEPTED")
        const hasAllRejected = applications.length > 0 && 
          applications.every((app: Application) => app.status === "REJECTED")
        
        if (hasAcceptedApplication) {
          // Update student visa status to COE_APPLIED if they have an acceptance
          const updateResponse = await fetch(`/api/students/${studentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visaStatus: "COE_APPLIED" })
          })
          
          if (updateResponse.ok) {
            console.log("Student visa status updated to COE_APPLIED")
          } else {
            console.error("Failed to update student visa status")
          }
        } else if (hasAllRejected && applications.length > 0) {
          // All applications rejected - suggest next steps but don't change visa status
          console.log("All applications rejected - student may need to apply to more schools")
        }
      }
    } catch (error) {
      console.error("Error checking student status:", error)
    }
  }

  if (!isOpen || !application) return null

  const currentStatusConfig = applicationStatusConfig[application.status]
  const newStatusConfig = applicationStatusConfig[newStatus]
  const CurrentStatusIcon = currentStatusConfig.icon
  const NewStatusIcon = newStatusConfig.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Update Application Status</h2>
            <p className="text-gray-600 mt-1">
              Update response from {application.school.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Application Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Application Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">{application.school.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Student:</span>
                    <span className="font-medium">{application.student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Applied:</span>
                    <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${currentStatusConfig.color}`}>
                <CurrentStatusIcon className="w-3 h-3" />
                {currentStatusConfig.label}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Update Status To:
              </label>
              <div className="grid grid-cols-1 gap-3">
                {statusOptions.map((status) => {
                  const config = applicationStatusConfig[status]
                  const StatusIcon = config.icon
                  return (
                    <label
                      key={status}
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        newStatus === status
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={newStatus === status}
                        onChange={(e) => setNewStatus(e.target.value as Application['status'])}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            newStatus === status
                              ? "border-indigo-500"
                              : "border-gray-300"
                          }`}
                        >
                          {newStatus === status && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          )}
                        </div>
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Response Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Response Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Details / Notes
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter details about the school's response, conditions, next steps, etc."
              />
            </div>

            {/* Status Change Impact */}
            {newStatus === "ACCEPTED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Application Accepted!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      This will automatically update the student's visa status to "COE Applied" 
                      since they now have a school acceptance required for COE application.
                    </p>
                    {(application.status === "WAITLISTED" || application.status === "REJECTED") && (
                      <p className="text-sm text-green-700 mt-1 font-medium">
                        Previous waitlist/rejection notes will be cleared since the application is now accepted.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {newStatus === "REJECTED" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Application Rejected</h4>
                    <p className="text-sm text-red-700 mt-1">
                      The student will need to apply to other schools. Consider reviewing the rejection reasons 
                      and improving the application before reapplying.
                    </p>
                    <div className="mt-2 text-sm text-red-600">
                      <strong>Next Steps:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Review rejection reasons and address any issues</li>
                        <li>Consider applying to additional partner schools</li>
                        <li>Update documents if needed</li>
                        <li>Student remains in current visa status until accepted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || newStatus === application.status}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Update Application"}
          </button>
        </div>
      </div>
    </div>
  )
}
