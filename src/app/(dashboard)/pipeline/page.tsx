"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Plus, Search, Filter, Eye, Edit, Trash2, Phone, Calendar, BookOpen, FileText, AlertCircle, CheckCircle, Clock, User, Mail, GraduationCap, TrendingUp, Activity, Settings, ArrowRight, RefreshCw, GripVertical, MoreVertical } from "lucide-react"

interface Student {
  id: string
  name: string
  passportNumber: string
  japaneseLanguageLevel: string
  intake: string
  visaStatus: string
  createdAt: string
  updatedAt: string
  documents: Array<{
    type: string
    status: string
  }>
  sponsors: Array<{
    name: string
    relation: string
  }>
  applications: Array<{
    school: {
      name: string
    }
  }>
  enrollments: Array<{
    class: {
      name: string
      level: string
    }
  }>
}

interface PipelineData {
  pipeline: Record<string, Student[]>
  stats: Record<string, number>
  totalStudents: number
}

const VISA_STAGES = [
  { key: "NEW_LEAD", label: "New Lead", color: "bg-gray-500", icon: User },
  { key: "DOCS_PENDING", label: "Documents Pending", color: "bg-yellow-500", icon: Clock },
  { key: "DOCS_VERIFIED", label: "Documents Verified", color: "bg-blue-500", icon: CheckCircle },
  { key: "SENT_TO_JAPAN", label: "Sent to Japan", color: "bg-purple-500", icon: Mail },
  { key: "COE_APPLIED", label: "COE Applied", color: "bg-indigo-500", icon: FileText },
  { key: "COE_APPROVED", label: "COE Approved", color: "bg-green-500", icon: CheckCircle },
  { key: "VISA_APPLIED", label: "Visa Applied", color: "bg-orange-500", icon: FileText },
  { key: "VISA_APPROVED", label: "Visa Approved", color: "bg-emerald-500", icon: CheckCircle },
  { key: "REJECTED", label: "Rejected", color: "bg-red-500", icon: AlertCircle },
]

export default function PipelinePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pipelineData, setPipelineData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalError, setModalError] = useState("")
  const [modalErrors, setModalErrors] = useState<string[]>([])
  const [draggedStudent, setDraggedStudent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState("ALL")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchPipelineData()
    }
  }, [status, router])

  const fetchPipelineData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch('/api/pipeline')
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline data')
      }
      
      const data = await response.json()
      setPipelineData(data)
    } catch (error) {
      console.error('Error fetching pipeline data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (student: Student) => {
    setDraggedStudent(student)
  }

  const handleDragEnd = () => {
    setDraggedStudent(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    
    if (!draggedStudent) return
    
    updateStudentStatus(draggedStudent.id, targetStatus)
    setDraggedStudent(null)
  }

  const getStudentStats = (student: Student) => {
    const totalDocs = 10 // Required documents count
    const uploadedDocs = student.documents.filter(doc => doc.status === "UPLOADED").length
    const verifiedDocs = student.documents.filter(doc => doc.status === "VERIFIED").length
    const progressPercentage = Math.round((uploadedDocs / totalDocs) * 100)
    
    return { totalDocs, uploadedDocs, verifiedDocs, progressPercentage }
  }

  const updateStudentStatus = async (studentId: string, newStatus: string) => {
    try {
      setUpdating(studentId)
      
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId: studentId, 
          visaStatus: newStatus 
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
          // Show detailed validation errors in modal
          setModalErrors(errorData.details)
          setModalError(`Cannot update student status: Missing required documents`)
          setShowErrorModal(true)
        } else {
          setModalError(errorData.error || 'Failed to update student status')
          setModalErrors([])
          setShowErrorModal(true)
        }
        return
      }
      
      // Refresh pipeline data
      fetchPipelineData()
    } catch (error) {
      console.error('Error updating student status:', error)
      setModalError(error instanceof Error ? error.message : 'Failed to update student status')
      setModalErrors([])
      setShowErrorModal(true)
    } finally {
      setUpdating(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-900 mb-4">Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchPipelineData}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
  <>
    <div className="p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Visa Pipeline</h1>
        <p className="text-blue-100 mb-6">
          Track student progress through Japan visa application stages
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total: {pipelineData?.totalStudents || 0}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">All Stages</option>
          {VISA_STAGES.map(stage => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {VISA_STAGES.map(stage => {
          const stageStudents = pipelineData?.pipeline[stage.key] || []
          const filteredStageStudents = selectedStage === "ALL" || selectedStage === stage.key 
            ? stageStudents.filter((student: any) => 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : []

          return (
            <div key={stage.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className={`${stage.color} text-white p-4`}>
                <div className="flex items-center gap-3">
                  <stage.icon className="w-5 h-5" />
                  <h3 className="font-semibold">{stage.label}</h3>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {filteredStageStudents.length}
                  </span>
                </div>
              </div>
              
              <div 
                className="p-4 min-h-[200px] space-y-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {filteredStageStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students in this stage</p>
                ) : (
                  filteredStageStudents.map((student: any) => (
                    <div
                      key={student.id}
                      draggable
                      onDragStart={() => handleDragStart(student)}
                      onDragEnd={handleDragEnd}
                      className={`bg-gray-50 rounded-lg p-4 cursor-move border border-gray-200 hover:shadow-md transition-shadow ${
                        draggedStudent?.id === student.id ? 'opacity-50' : ''
                      } ${updating === student.id ? 'animate-pulse' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Link 
                            href={`/students/${student.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {student.name}
                          </Link>
                          <div className="text-sm text-gray-600 mt-1">
                            {student.passportNumber}
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{student.japaneseLanguageLevel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{student.intake}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Documents</span>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const stats = getStudentStats(student)
                              return (
                                <>
                                  <span>{stats.uploadedDocs}/{stats.totalDocs}</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${stats.progressPercentage}%` }}
                                    />
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  {/* Professional Error Modal */}
  {showErrorModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Status Update Failed</h3>
              <p className="text-sm text-gray-600">Cannot update student status</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-3">{modalError}</p>
            
            {modalErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Document Requirements:</h4>
                <ul className="space-y-1">
                  {modalErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowErrorModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
