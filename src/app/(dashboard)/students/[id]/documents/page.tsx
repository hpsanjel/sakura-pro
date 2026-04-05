"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Eye, Clock, User, ArrowLeft } from "lucide-react"

interface Document {
  id: string
  type: string
  status: string
  fileName?: string
  filePath?: string
  notes?: string
  uploadedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  createdAt: string
}

interface Student {
  id: string
  name: string
  passportNumber: string
}

const documentStatusColors = {
  MISSING: "bg-gray-100 text-gray-800",
  UPLOADED: "bg-blue-100 text-blue-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
}

const documentStatusIcons = {
  MISSING: XCircle,
  UPLOADED: Clock,
  VERIFIED: CheckCircle,
  REJECTED: XCircle,
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

export default function StudentDocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectDocumentId, setRejectDocumentId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedDocumentType, setSelectedDocumentType] = useState("")
  const [uploadNotes, setUploadNotes] = useState("")
  const [uploading, setUploading] = useState(false)

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

    if (status === "authenticated" && params.id) {
      fetchStudentAndDocuments()
    }
  }, [status, session, router, params.id])

  const fetchStudentAndDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      // First get student info
      const studentResponse = await fetch(`/api/students/${params.id}`)
      if (!studentResponse.ok) {
        throw new Error("Failed to fetch student")
      }
      const studentData = await studentResponse.json()
      setStudent(studentData)

      // Then get documents
      const documentsResponse = await fetch(`/api/students/${params.id}/documents`)
      if (!documentsResponse.ok) {
        throw new Error("Failed to fetch documents")
      }
      const documentsData = await documentsResponse.json()
      setDocuments(documentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDocumentType || !fileInputRef.current?.files?.[0]) {
      setError("Please select a document type and file")
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', fileInputRef.current.files[0])
      formData.append('documentType', selectedDocumentType)
      formData.append('notes', uploadNotes)

      const response = await fetch(`/api/students/${params.id}/documents`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload document')
      }

      // Reset form
      setSelectedDocumentType("")
      setUploadNotes("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh documents
      await fetchStudentAndDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const handleVerifyDocument = async (documentId: string) => {
    try {
      setUpdatingId(documentId)
      
      const response = await fetch(`/api/documents/${documentId}/verify`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to verify document')
      }

      await fetchStudentAndDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify document")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRejectDocument = async () => {
    if (!rejectDocumentId || !rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    try {
      setUpdatingId(rejectDocumentId)
      
      const response = await fetch(`/api/documents/${rejectDocumentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (!response.ok) {
        throw new Error('Failed to reject document')
      }

      // Close modal and reset
      setShowRejectModal(false)
      setRejectDocumentId(null)
      setRejectionReason("")

      await fetchStudentAndDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject document")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDownloadDocument = async (documentId: string, fileName?: string, filePath?: string) => {
    try {
      // If it's a Cloudinary URL, open it directly in a new tab
      if (filePath && filePath.startsWith('https://res.cloudinary.com')) {
        window.open(filePath, '_blank')
        return
      }

      // Otherwise, use the download API
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download document")
    }
  }

  const getDocumentStats = () => {
    const total = REQUIRED_DOCUMENT_TYPES.length
    const uploaded = documents.filter(doc => doc.status === 'UPLOADED').length
    const verified = documents.filter(doc => doc.status === 'VERIFIED').length
    const rejected = documents.filter(doc => doc.status === 'REJECTED').length
    const missing = total - documents.length

    return { total, uploaded, verified, rejected, missing }
  }

  const canUploadDocument = (documentType: string) => {
    const existingDoc = documents.find(doc => doc.type === documentType)
    return !existingDoc || existingDoc.status === "MISSING" || existingDoc.status === "REJECTED"
  }

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

  if (error && !student) {
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
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  const stats = getDocumentStats()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6">
          <Link
            href={`/students/${params.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Documents - {student.name}
          </h1>
          <p className="text-gray-600">Passport: {student.passportNumber}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Missing</h3>
          <p className="text-2xl font-bold text-gray-500">{stats.missing}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Uploaded</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.uploaded}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Verified</h3>
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Document
        </h2>
        
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select document type</option>
                {REQUIRED_DOCUMENT_TYPES.map(type => (
                  <option 
                    key={type} 
                    value={type}
                    disabled={!canUploadDocument(type)}
                  >
                    {type} {!canUploadDocument(type) && '(Already uploaded)'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any notes about this document..."
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Documents
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {REQUIRED_DOCUMENT_TYPES.map(docType => {
            const document = documents.find(doc => doc.type === docType)
            const status = document?.status || 'MISSING'
            const StatusIcon = documentStatusIcons[status as keyof typeof documentStatusIcons]
            
            return (
              <div key={docType} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{docType}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${documentStatusColors[status as keyof typeof documentStatusColors]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status}
                      </span>
                    </div>
                    
                    {document && (
                      <div className="text-sm text-gray-600 space-y-1">
                        {document.fileName && (
                          <p>File: {document.fileName}</p>
                        )}
                        {document.uploadedAt && (
                          <p>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</p>
                        )}
                        {document.notes && (
                          <p>Notes: {document.notes}</p>
                        )}
                        {document.rejectedAt && (
                          <p className="text-red-600">Rejected: {new Date(document.rejectedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    
                    {!document && (
                      <p className="text-sm text-gray-500">Document not uploaded</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {document && status === 'UPLOADED' && (
                      <>
                        <button
                          onClick={() => handleDownloadDocument(document.id, document.fileName, document.filePath)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerifyDocument(document.id)}
                          disabled={updatingId === document.id}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          title="Verify"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {updatingId === document.id ? '...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => {
                            setRejectDocumentId(document.id)
                            setShowRejectModal(true)
                          }}
                          disabled={updatingId === document.id}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                          {updatingId === document.id ? '...' : 'Reject'}
                        </button>
                      </>
                    )}
                    
                    {document && status === 'VERIFIED' && (
                      <button
                        onClick={() => handleDownloadDocument(document.id, document.fileName, document.filePath)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Document</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter reason for rejection..."
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectDocumentId(null)
                  setRejectionReason("")
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={updatingId === rejectDocumentId}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {updatingId === rejectDocumentId ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
