"use client"

import { useState, useEffect } from "react"
import { X, DollarSign, Calendar, FileText, User, AlertCircle } from "lucide-react"

interface FeeModalProps {
  isOpen: boolean
  onClose: () => void
  fee?: any // For editing existing fee
  onSuccess: () => void
}

const feeTypes = [
  { value: "TUITION", label: "Tuition Fee", description: "School tuition fees" },
  { value: "CONSULTANCY", label: "Consultancy Fee", description: "Consultancy service charges" },
  { value: "APPLICATION", label: "Application Fee", description: "School application fees" },
  { value: "VISA", label: "Visa Fee", description: "Visa application and processing fees" },
  { value: "ACCOMMODATION", label: "Accommodation", description: "Housing and accommodation fees" },
  { value: "OTHER", label: "Other", description: "Miscellaneous fees" },
]

export default function FeeModal({ isOpen, onClose, fee, onSuccess }: FeeModalProps) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [studentId, setStudentId] = useState("")
  const [type, setType] = useState("TUITION")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")

  const isEditing = !!fee

  useEffect(() => {
    if (isOpen) {
      fetchStudents()
      if (fee) {
        // Set form data for editing
        setStudentId(fee.studentId)
        setType(fee.type)
        setTitle(fee.title)
        setDescription(fee.description || "")
        setAmount(fee.amount.toString())
        setDueDate(new Date(fee.dueDate).toISOString().split('T')[0])
      } else {
        // Reset form for creating
        resetForm()
      }
    }
  }, [isOpen, fee])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students?includeAllYears=true")
      if (response.ok) {
        const data = await response.json()
        setStudents(data || [])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      setError("Failed to load students")
    }
  }

  const resetForm = () => {
    setStudentId("")
    setType("TUITION")
    setTitle("")
    setDescription("")
    setAmount("")
    setDueDate("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const feeData = {
        studentId,
        type,
        title,
        description: description || null,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
      }

      const url = isEditing ? `/api/fees/${fee.id}` : "/api/fees"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save fee")
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Fee save error:", error)
      setError(error instanceof Error ? error.message : "Failed to save fee")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return ""
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(num)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Fee" : "Create New Fee"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditing ? "Update fee information" : "Add a new fee for a student"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a student</option>
                {students.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.passportNumber || 'No Passport'}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {feeTypes.map((feeType) => (
                  <option key={feeType.value} value={feeType.value}>
                    {feeType.label}
                  </option>
                ))}
              </select>
              {feeTypes.find(ft => ft.value === type)?.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {feeTypes.find(ft => ft.value === type)?.description}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., First Semester Tuition, Application Processing Fee"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional description of the fee"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (JPY) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(amount)}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {dueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Student Preview */}
          {studentId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Student Preview</h4>
              </div>
              {(() => {
                const student = students.find((s: any) => s.id === studentId)
                return student ? (
                  <div className="text-sm text-gray-600">
                    <p><strong>Name:</strong> {(student as any).name}</p>
                    <p><strong>Email:</strong> {(student as any).email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> {(student as any).phone || 'Not provided'}</p>
                    <p><strong>Visa Status:</strong> {(student as any).visaStatus}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Student not found</p>
                )
              })()}
            </div>
          )}

          {/* Fee Preview */}
          {title && amount && dueDate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Fee Preview</h4>
              </div>
              <div className="text-sm text-blue-800">
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Type:</strong> {feeTypes.find(ft => ft.value === type)?.label}</p>
                <p><strong>Amount:</strong> {formatCurrency(amount)}</p>
                <p><strong>Due:</strong> {new Date(dueDate).toLocaleDateString()}</p>
                {description && <p><strong>Description:</strong> {description}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : (isEditing ? "Update Fee" : "Create Fee")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
