"use client"

import { useState, useEffect } from "react"
import { X, School, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface PartnerSchool {
  id: string
  name: string
  address?: string
  website?: string
  isPartner: boolean
  _count: {
    applications: number
  }
}

interface SendToJapanModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  onSuccess: () => void
}

export default function SendToJapanModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName, 
  onSuccess 
}: SendToJapanModalProps) {
  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchPartnerSchools()
      setSelectedSchools([])
      setNotes("")
      setError("")
      setSuccess("")
    }
  }, [isOpen])

  const fetchPartnerSchools = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/schools?isPartner=true")
      if (!response.ok) {
        throw new Error("Failed to fetch partner schools")
      }
      const data = await response.json()
      setPartnerSchools(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load partner schools")
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolToggle = (schoolId: string) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedSchools.length === 0) {
      setError("Please select at least one school")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/students/${studentId}/send-to-japan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolIds: selectedSchools,
          notes: notes.trim() || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send applications")
      }

      const data = await response.json()
      setSuccess(data.message)
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose()
        onSuccess()
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send applications")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Send Applications to Japan</h2>
            <p className="text-gray-600 mt-1">
              Submit applications for <span className="font-semibold">{studentName}</span> to partner schools
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-gray-600">Loading partner schools...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Partner Schools Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Partner Schools</h3>
                
                {partnerSchools.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <School className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No partner schools available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please add partner schools to the system first
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {partnerSchools.map((school) => (
                      <div
                        key={school.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedSchools.includes(school.id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleSchoolToggle(school.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedSchools.includes(school.id)
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedSchools.includes(school.id) && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{school.name}</h4>
                            {school.address && (
                              <p className="text-sm text-gray-600 mt-1">{school.address}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {school.website && (
                                <a
                                  href={school.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-700 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Visit Website
                                </a>
                              )}
                              <span>{school._count.applications} applications</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add any notes about these applications..."
                />
              </div>

              {/* Selected Schools Summary */}
              {selectedSchools.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-2">
                    Selected Schools ({selectedSchools.length})
                  </h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    {selectedSchools.map(schoolId => {
                      const school = partnerSchools.find(s => s.id === schoolId)
                      return school ? <li key={schoolId}>• {school.name}</li> : null
                    })}
                  </ul>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedSchools.length === 0 || partnerSchools.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Sending..." : `Send to ${selectedSchools.length} School${selectedSchools.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
