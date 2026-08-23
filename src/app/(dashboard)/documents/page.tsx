"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Plus, Search, Filter, Eye, Edit, Trash2, Phone, Calendar, BookOpen, FileText, AlertCircle, CheckCircle, Clock, User, Mail, GraduationCap, TrendingUp, Activity, Settings, ArrowRight, RefreshCw, Download, Upload, MessageSquare, CheckCircle2, XCircle, FileCheck, FileX } from "lucide-react"

interface Document {
  id: string
  type: string
  status: "MISSING" | "UPLOADED" | "VERIFIED" | "REJECTED"
  fileName?: string
  filePath?: string
  notes?: string
  uploadedAt?: string
  uploadedBy?: string
  verifiedAt?: string
  verifiedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  createdAt: string
}

interface Student {
  id: string
  name: string
  passportNumber: string
  email?: string
  phone?: string
  japaneseLanguageLevel: string
  intake: string
  visaStatus: string
  createdAt: string
  documents?: Document[]
}

interface StudentWithDocuments extends Student {
  documents: Document[]
}

const documentStatusConfig = {
  MISSING: { color: 'bg-gray-500', label: 'Missing', icon: FileX },
  UPLOADED: { color: 'bg-green-500', label: 'Uploaded', icon: Upload },
  VERIFIED: { color: 'bg-green-600', label: 'Verified', icon: CheckCircle2 },
  REJECTED: { color: 'bg-red-500', label: 'Rejected', icon: XCircle },
}

const REQUIRED_DOCUMENT_TYPES = [
  "Passport",
  "Academic Transcripts",
  "Bank Statement",
  "Sponsorship Documents",
  "Statement of Purpose (SOP)",
  "Birth Certificate",
  "Police Clearance Certificate",
  "Medical Certificate",
  "Photographs (Passport Size)",
  "Language Proficiency Certificate"
]

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDocuments | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [uploading, setUploading] = useState(false)
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadFormData, setUploadFormData] = useState({
    documentType: "",
    file: null as File | null,
    notes: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      const userRole = session?.user?.role
      
      if (userRole === "STUDENT") {
        // Students view their own documents
        fetchStudentDocuments()
      } else if (["ADMIN", "COUNSELOR", "TEACHER", "SUPERADMIN"].includes(userRole || "")) {
        // Admin/Counselor/Teacher view all students' documents
        fetchStudents()
      } else {
        setError("You don't have permission to access documents")
        setLoading(false)
        return
      }
    }
  }, [status, router, session])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch('/api/students')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch students (${response.status})`)
      }
      
      const data = await response.json()
      
      // Ensure all students have documents array
      const studentsWithDocs = data.map((student: Student) => ({
        ...student,
        documents: student.documents || []
      }))
      
      setStudents(studentsWithDocs)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError(error instanceof Error ? error.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDocuments = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch('/api/students/me/documents')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error("Please log in to view your documents")
        } else if (response.status === 403) {
          throw new Error("This page is for students only")
        } else if (response.status === 404) {
          throw new Error("Student record not found. Please contact your counselor.")
        } else {
          throw new Error(errorData.error || `Failed to fetch your documents (${response.status})`)
        }
      }
      
      const documents = await response.json()
      
      // Create a single student entry for the current student
      const currentUser = session?.user
      const studentEntry: StudentWithDocuments = {
        id: currentUser?.id || '',
        name: currentUser?.name || 'Student',
        passportNumber: 'N/A',
        email: currentUser?.email,
        phone: '',
        japaneseLanguageLevel: '',
        intake: '',
        visaStatus: '',
        createdAt: new Date().toISOString(),
        documents: documents || []
      }
      
      setStudents([studentEntry])
    } catch (error) {
      console.error('Error fetching student documents:', error)
      setError(error instanceof Error ? error.message : 'Failed to load your documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStudent || !uploadFormData.file || !uploadFormData.documentType) {
      alert('Please select a document type and file')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', uploadFormData.file)
      formData.append('type', uploadFormData.documentType) // Note: API expects 'type' not 'documentType'
      formData.append('notes', uploadFormData.notes)
      
      // Use different endpoint for students vs admin
      const endpoint = session?.user?.role === 'STUDENT' 
        ? '/api/students/me/documents' 
        : `/api/students/${selectedStudent.id}/documents`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to upload document')
      
      const result = await response.json()
      console.log('✅ Document uploaded successfully:', result.fileName || 'Unknown file')
      
      setShowUploadModal(false)
      setUploadFormData({ documentType: "", file: null, notes: "" })
      
      // Update local state immediately for better UX
      if (selectedStudent && result) {
        console.log("Updating local state for uploaded document:", result.id)
        
        // Update students list
        setStudents(prevStudents => 
          prevStudents.map(student => {
            if (student.id === selectedStudent.id) {
              const updatedStudent = {
                ...student,
                documents: [
                  // Remove any existing document of the same type
                  ...student.documents.filter(doc => doc.type !== uploadFormData.documentType),
                  // Add the new document (API returns document directly, not wrapped)
                  result
                ]
              }
              
              // Also update selectedStudent if it's the same student
              if (selectedStudent.id === student.id) {
                setSelectedStudent(updatedStudent)
              }
              
              return updatedStudent
            }
            return student
          })
        )
      }
      
      // Fallback: Refresh from server to ensure consistency
      setTimeout(() => {
        if (session?.user?.role === 'STUDENT') {
          fetchStudentDocuments()
        } else {
          fetchStudents()
        }
      }, 500)
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentAction = async (documentId: string, action: 'verify' | 'reject' | 'reset', reason?: string) => {
    try {
      // Check if session exists
      if (!session) {
        throw new Error("No active session found. Please log in again.")
      }
      
      // Set processing state
      setProcessingDocumentId(documentId)
      
      const requestBody = reason ? { reason } : {}
      
      const response = await fetch(`/api/documents/${documentId}?action=${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.")
        } else if (response.status === 403) {
          throw new Error("You don't have permission to verify documents")
        } else if (response.status === 404) {
          throw new Error("Document not found")
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again.")
        } else {
          throw new Error(errorData.error || `Failed to ${action} document`)
        }
      }
      
      const result = await response.json()
      
      // Show success message with more context
      let actionText: string
      if (action === 'verify') {
        actionText = 'verified successfully'
      } else if (action === 'reject') {
        actionText = reason ? `rejected: "${reason}"` : 'rejected'
      } else {
        actionText = 'reset to uploaded status'
      }
      
      // Use a more subtle notification instead of alert
      console.log(`✅ Document ${actionText}`)
      // You could replace this with a toast notification in the future
      
      // Close preview modal if open
      if (showPreviewModal) {
        setShowPreviewModal(false)
        setSelectedDocument(null)
        setRejectReason("")
      }
      
      // Update local state immediately for better UX
      console.log("Updating local state for document:", documentId, "to status:", action)
      console.log("Current students count:", students.length)
      
      setStudents(prevStudents => {
        const updatedStudents = prevStudents.map(student => {
          const documentInStudent = student.documents.find(doc => doc.id === documentId)
          if (documentInStudent) {
            console.log("Found document in student:", student.name, "current status:", documentInStudent.status)
            let newStatus: Document['status'] = documentInStudent.status
            let newVerifiedAt: string | undefined = documentInStudent.verifiedAt
            let newVerifiedBy: string | undefined = documentInStudent.verifiedBy
            let newRejectedAt: string | undefined = documentInStudent.rejectedAt
            let newRejectedBy: string | undefined = documentInStudent.rejectedBy
            let newRejectionReason: string | undefined = documentInStudent.rejectionReason
            
            if (action === 'verify') {
              newStatus = 'VERIFIED'
              newVerifiedAt = new Date().toISOString()
              newVerifiedBy = session?.user?.name || session?.user?.email || 'Unknown'
              newRejectedAt = undefined
              newRejectedBy = undefined
              newRejectionReason = undefined
            } else if (action === 'reject') {
              newStatus = 'REJECTED'
              newRejectedAt = new Date().toISOString()
              newRejectedBy = session?.user?.name || session?.user?.email || 'Unknown'
              newVerifiedAt = undefined
              newVerifiedBy = undefined
              newRejectionReason = reason
            } else if (action === 'reset') {
              newStatus = 'UPLOADED'
              newVerifiedAt = undefined
              newVerifiedBy = undefined
              newRejectedAt = undefined
              newRejectedBy = undefined
              newRejectionReason = undefined
            }
            
            console.log("Setting new status:", newStatus, "for document:", documentId)
            const updatedStudent = {
              ...student,
              documents: student.documents.map(doc => 
                doc.id === documentId 
                  ? { 
                      ...doc, 
                      status: newStatus,
                      verifiedAt: newVerifiedAt,
                      verifiedBy: newVerifiedBy,
                      rejectedAt: newRejectedAt,
                      rejectedBy: newRejectedBy,
                      rejectionReason: newRejectionReason
                    }
                  : doc
              )
            }
            
            // Also update selectedStudent if it's the same student
            if (selectedStudent && selectedStudent.id === student.id) {
              setSelectedStudent(updatedStudent)
            }
            
            return updatedStudent
          }
          return student
        })
        
        console.log("State updated. New students count:", updatedStudents.length)
        return updatedStudents
      })
      
      // Clear processing state
      setProcessingDocumentId(null)
      
      // Refresh from server to ensure consistency (but with local state update, this should be seamless)
      setTimeout(() => {
        if (session?.user?.role === 'STUDENT') {
          fetchStudentDocuments()
        } else {
          fetchStudents()
        }
      }, 500) // Short delay to ensure server processed the change
    } catch (error) {
      console.error(`❌ Error ${action}ing document:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} document`)
      setProcessingDocumentId(null)
    }
  }

  const getDocumentStats = (documents: Document[]) => {
    const total = documents.length
    const uploaded = documents.filter(doc => doc.status === 'UPLOADED').length
    const verified = documents.filter(doc => doc.status === 'VERIFIED').length
    const rejected = documents.filter(doc => doc.status === 'REJECTED').length
    const missing = documents.filter(doc => doc.status === 'MISSING').length
    const progressPercent = total > 0 ? Math.round(((uploaded + verified) / total) * 100) : 0

    return { total, uploaded, verified, rejected, missing, progressPercent }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.passportNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || student.visaStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Student View
  if (session.user?.role === 'STUDENT') {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">My Documents</h1>
          <p className="text-blue-100 mb-6">
            Upload and track your required documents
          </p>
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-600">Your document list is empty. This might be because your account was just created.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {students.map(student => {
              const documentStats = getDocumentStats(student.documents)
              
              return (
                <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{student.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {student.passportNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {student.intake}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                          <FileText className="w-3 h-3" />
                          {student.visaStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Document Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">File Info</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Action</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {REQUIRED_DOCUMENT_TYPES.map(docType => {
                            const document = student.documents.find(doc => doc.type === docType)
                            const status = document?.status || 'MISSING'
                            const config = documentStatusConfig[status as keyof typeof documentStatusConfig]
                            
                            return (
                              <tr key={docType} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900 text-sm">{docType}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} text-white`}>
                                    <config.icon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {document ? (
                                    <div className="text-xs text-gray-600">
                                      {document.fileName && <p className="truncate font-medium">{document.fileName}</p>}
                                      {document.uploadedAt && (
                                        <p>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">No file uploaded</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {document && (
                                    <div className="text-xs text-gray-600">
                                      {document.verifiedAt && document.verifiedBy && (
                                        <p className="text-green-600">
                                          Verified by {document.verifiedBy} on {new Date(document.verifiedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                      {document.rejectedAt && document.rejectedBy && (
                                        <p className="text-red-600">
                                          Rejected by {document.rejectedBy} on {new Date(document.rejectedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                      {document.notes && (
                                        <p className="text-gray-500 mt-1">Notes: {document.notes}</p>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-center">
                                    {status === 'MISSING' && (
                                      <button
                                        onClick={() => {
                                          setSelectedStudent(student)
                                          setUploadFormData(prev => ({ ...prev, documentType: docType }))
                                          setShowUploadModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                      >
                                        <Upload className="w-3 h-3" />
                                        Upload
                                      </button>
                                    )}
                                    
                                    {status === 'UPLOADED' && document && (
                                      <button
                                        onClick={() => {
                                          setSelectedDocument(document)
                                          setShowPreviewModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Review
                                      </button>
                                    )}
                                    
                                    {status === 'REJECTED' && document && (
                                      <div className="flex flex-col items-center gap-1">
                                        {document.rejectionReason && (
                                          <div className="text-xs text-red-500 italic text-center max-w-[150px] truncate" title={document.rejectionReason}>
                                            "{document.rejectionReason}"
                                          </div>
                                        )}
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student)
                                            setUploadFormData(prev => ({ ...prev, documentType: docType }))
                                            setShowUploadModal(true)
                                          }}
                                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                                        >
                                          <Upload className="w-3 h-3" />
                                          Re-upload
                                        </button>
                                      </div>
                                    )}
                                    
                                    {status === 'VERIFIED' && document && (
                                      <button
                                        onClick={() => {
                                          setSelectedDocument(document)
                                          setShowPreviewModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                          <FileX className="w-3 h-3" />
                          {documentStats.missing} Missing
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                          <Upload className="w-3 h-3" />
                          {documentStats.uploaded} Uploaded
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          {documentStats.verified} Verified
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Progress: {documentStats.progressPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h2>
              <p className="text-gray-600 mb-4">Student: {selectedStudent.name}</p>
              
              <form onSubmit={handleFileUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={uploadFormData.documentType}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, documentType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select document type</option>
                      {REQUIRED_DOCUMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={uploadFormData.notes}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add any notes about this document..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Counselor/Admin/Staff View
  return (
    <div className="p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Documents Review</h1>
        <p className="text-blue-100 mb-6">
          Review and manage student documents
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              Awaiting Review: {students.reduce((acc, student) => 
                acc + student.documents.filter(doc => doc.status === 'UPLOADED').length, 0
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">
              Approved: {students.reduce((acc, student) => 
                acc + student.documents.filter(doc => doc.status === 'VERIFIED').length, 0
              )}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="NEW_LEAD">New Lead</option>
          <option value="DOCS_PENDING">Documents Pending</option>
          <option value="DOCS_VERIFIED">Documents Verified</option>
          <option value="SENT_TO_JAPAN">Sent to Japan</option>
          <option value="COE_APPLIED">COE Applied</option>
          <option value="COE_RECEIVED">COE Received</option>
          <option value="VISA_APPLIED">Visa Applied</option>
          <option value="VISA_APPROVED">Visa Approved</option>
          <option value="TRAVEL_READY">Travel Ready</option>
        </select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">No students match your search criteria.</p>
            </div>
          </div>
        ) : (
          filteredStudents.map(student => {
            const documentStats = getDocumentStats(student.documents)
            
            return (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{student.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {student.passportNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {student.intake}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Document Stats Section */}
                  <div className="flex items-center gap-3">
                    {/* Visa Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                      <FileText className="w-3 h-3" />
                      {student.visaStatus.replace('_', ' ')}
                    </div>
                    
                    {/* Document Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      {documentStats.missing > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                          <FileX className="w-3 h-3" />
                          {documentStats.missing}
                        </span>
                      )}
                      {documentStats.uploaded > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                          <Upload className="w-3 h-3" />
                          {documentStats.uploaded}
                        </span>
                      )}
                      {documentStats.verified > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          {documentStats.verified}
                        </span>
                      )}
                      {documentStats.rejected > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md">
                          <XCircle className="w-3 h-3" />
                          {documentStats.rejected}
                        </span>
                      )}
                    </div>
                    
                    {/* Review Button */}
                    <button
                      onClick={() => {
                        setSelectedStudent(student)
                        setShowDetailsModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Document Progress</h4>
                    <span className="text-sm text-gray-600">
                      {documentStats.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${documentStats.progressPercent}%` }}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {documentStats.total - documentStats.uploaded - documentStats.verified} documents remaining
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedStudent.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedStudent.passportNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedStudent.intake}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                    <FileText className="w-3 h-3" />
                    {selectedStudent.visaStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Document Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">File Info</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Action</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {REQUIRED_DOCUMENT_TYPES.map(docType => {
                            const document = selectedStudent.documents.find(doc => doc.type === docType)
                            const status = document?.status || 'MISSING'
                            const config = documentStatusConfig[status as keyof typeof documentStatusConfig]
                            
                            return (
                              <tr key={docType} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900 text-sm">{docType}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} text-white`}>
                                    <config.icon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  {document ? (
                                    <div className="text-xs text-gray-600">
                                      {document.fileName && <p className="truncate font-medium">{document.fileName}</p>}
                                      {document.uploadedAt && (
                                        <p>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">No file uploaded</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {document && (
                                    <div className="text-xs text-gray-600">
                                      {document.verifiedAt && (
                                        <p className="text-green-600">
                                          Verified by {document.verifiedBy} on {new Date(document.verifiedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                      {document.rejectedAt && (
                                        <p className="text-red-600">
                                          Rejected by {document.rejectedBy} on {new Date(document.rejectedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                      {document.notes && (
                                        <p className="text-gray-500 mt-1">Notes: {document.notes}</p>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex justify-center">
                                    {status === 'MISSING' && (
                                      <button
                                        onClick={() => {
                                          setSelectedStudent(selectedStudent)
                                          setUploadFormData(prev => ({ ...prev, documentType: docType }))
                                          setShowUploadModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                      >
                                        <Upload className="w-3 h-3" />
                                        Upload Document
                                      </button>
                                    )}
                                    
                                    {status === 'UPLOADED' && document && (
                                      <button
                                        onClick={() => {
                                          setSelectedDocument(document)
                                          setShowPreviewModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Review Document
                                      </button>
                                    )}
                                    
                                    {status === 'REJECTED' && document && (
                                      <div className="flex flex-col items-center gap-1">
                                        {document.rejectionReason && (
                                          <div className="text-xs text-red-500 italic text-center max-w-[150px] truncate" title={document.rejectionReason}>
                                            "{document.rejectionReason}"
                                          </div>
                                        )}
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(selectedStudent)
                                            setUploadFormData(prev => ({ ...prev, documentType: docType }))
                                            setShowUploadModal(true)
                                          }}
                                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                                        >
                                          <Upload className="w-3 h-3" />
                                          Re-upload Document
                                        </button>
                                      </div>
                                    )}
                                    
                                    {status === 'VERIFIED' && document && (
                                      <button
                                        onClick={() => {
                                          setSelectedDocument(document)
                                          setShowPreviewModal(true)
                                        }}
                                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View Document
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Document</h2>
            <p className="text-gray-600 mb-4">Student: {selectedStudent.name}</p>
            
            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={uploadFormData.documentType}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select document type</option>
                    {REQUIRED_DOCUMENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={uploadFormData.notes}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any notes about this document..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Document Preview</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{selectedDocument.type}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedDocument.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                      selectedDocument.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedDocument.status}
                    </span>
                  </div>
                  {selectedDocument.fileName && (
                    <p className="text-sm text-gray-600 mt-1">File: {selectedDocument.fileName}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setSelectedDocument(null)
                    setRejectReason("")
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-6 overflow-auto">
              {selectedDocument.filePath ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  {selectedDocument.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="max-w-2xl mx-auto">
                      <img 
                        src={`/api/documents/${selectedDocument.id}/download`}
                        alt={selectedDocument.type}
                        className="w-full h-auto rounded-lg shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Unable to load image preview</p>
                      </div>
                    </div>
                  ) : selectedDocument.fileName?.toLowerCase().match(/\.(pdf)$/i) ? (
                    <div className="max-w-3xl mx-auto">
                      <iframe
                        src={`/api/documents/${selectedDocument.id}/download`}
                        className="w-full h-96 rounded-lg shadow-lg"
                        title={selectedDocument.type}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Unable to load PDF preview</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                      <a
                        href={`/api/documents/${selectedDocument.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download File
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Document file not available</p>
                </div>
              )}
              
              {selectedDocument.notes && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Notes:</h4>
                  <p className="text-blue-700">{selectedDocument.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(selectedDocument.status === 'UPLOADED' || selectedDocument.status === 'VERIFIED' || selectedDocument.status === 'REJECTED') && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {selectedDocument.status === 'UPLOADED' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter reason for rejection (optional)..."
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDocumentAction(selectedDocument.id, 'verify')}
                        disabled={processingDocumentId === selectedDocument.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {processingDocumentId === selectedDocument.id ? (
                          <>
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Verify Document
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDocumentAction(selectedDocument.id, 'reject', rejectReason)}
                        disabled={processingDocumentId === selectedDocument.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {processingDocumentId === selectedDocument.id ? (
                          <>
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Reject Document
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center text-gray-600">
                      {selectedDocument.status === 'VERIFIED' ? (
                        <p>This document has been verified. You can reset it to uploaded status if needed.</p>
                      ) : (
                        <p>This document has been rejected. You can reset it to uploaded status to allow re-upload.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDocumentAction(selectedDocument.id, 'reset')}
                        disabled={processingDocumentId === selectedDocument.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                      >
                        {processingDocumentId === selectedDocument.id ? (
                          <>
                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Reset to Uploaded
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
