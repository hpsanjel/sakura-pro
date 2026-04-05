"use client"

import { useState, useEffect } from "react"
import { School, Calendar, FileText, CheckCircle, Clock, XCircle, AlertCircle, Edit, ExternalLink } from "lucide-react"

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
  school: {
    id: string
    name: string
    isPartner: boolean
    website?: string
  }
}

interface StudentApplicationsPanelProps {
  studentId: string
  onUpdateApplication: (application: Application) => void
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

export default function StudentApplicationsPanel({ 
  studentId, 
  onUpdateApplication 
}: StudentApplicationsPanelProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [studentId])

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/applications?studentId=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const hasAcceptedApplication = applications.some(app => app.status === "ACCEPTED")
  const hasRejectedApplications = applications.some(app => app.status === "REJECTED")
  const allRejected = applications.length > 0 && applications.every(app => app.status === "REJECTED")
  const hasPendingApplications = applications.some(app => app.status === "PENDING" || app.status === "SUBMITTED" || app.status === "WAITLISTED")

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">School Applications</h3>
        <div className="flex gap-2">
          {hasAcceptedApplication && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              ✓ School Acceptance Received
            </span>
          )}
          {allRejected && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              All Applications Rejected
            </span>
          )}
          {hasRejectedApplications && !allRejected && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
              Some Rejections
            </span>
          )}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-8">
          <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h4>
          <p className="text-gray-600">
            This student hasn't been sent to any partner schools yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusConfig = applicationStatusConfig[application.status]
            const StatusIcon = statusConfig.icon
            
            return (
              <div
                key={application.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <School className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">{application.school.name}</h4>
                      {application.school.isPartner && (
                        <span className="text-xs text-green-600 font-medium">Partner</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-1 text-xs text-gray-500 mb-3">
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

                    {/* Notes */}
                    {application.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Application Notes:</span> {application.notes}
                      </div>
                    )}

                    {/* Response Notes */}
                    {application.responseNotes && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">School Response:</span> {application.responseNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onUpdateApplication(application)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Update Status"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {application.school.website && (
                      <a
                        href={application.school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Visit School Website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* COE Status Indicator */}
      {applications.length > 0 && !hasAcceptedApplication && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              {allRejected ? (
                <>
                  <h4 className="font-medium text-yellow-900">All Applications Rejected</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Student needs to apply to additional schools. Consider reviewing rejection reasons 
                    and improving the application strategy.
                  </p>
                  <div className="mt-2 text-sm text-yellow-600">
                    <strong>Recommended Actions:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Apply to more partner schools</li>
                      <li>Review and strengthen application documents</li>
                      <li>Address specific rejection reasons</li>
                      <li>Consider different schools or programs</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-medium text-yellow-900">COE Application Not Available</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Student needs at least one school acceptance before applying for COE.
                    {hasPendingApplications && " Some applications are still pending."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {hasAcceptedApplication && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Ready for COE Application</h4>
              <p className="text-sm text-green-700 mt-1">
                This student has received school acceptance and can now apply for COE.
                {hasRejectedApplications && " Some applications were rejected, but at least one was accepted."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
