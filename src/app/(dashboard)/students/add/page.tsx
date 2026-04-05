"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Phone, MapPin, Mail, Calendar, BookOpen, GraduationCap, AlertCircle, CheckCircle } from "lucide-react"

interface FormData {
  name: string
  passportNumber: string
  dateOfBirth: string
  phone: string
  address: string
  education: string
  japaneseLanguageLevel: string
  intake: string
  visaStatus: string
  category: string
  email: string
  studyGoals: string
  preferredStudyField: string
  workExperience: string
  financialProof: string
}

interface FormErrors {
  [key: string]: string
}

const STUDENT_CATEGORIES = [
  { value: "VISITOR", label: "👋 Visitor", description: "Just exploring options" },
  { value: "PROSPECT", label: "🎯 Prospect", description: "Interested in studying in Japan" },
  { value: "APPLIED", label: "📝 Applied", description: "Application submitted to schools" },
  { value: "COMMITTED", label: "💰 Committed", description: "Deposit paid, preparing documents" },
  { value: "ENROLLED", label: "📚 Enrolled", description: "Enrolled in Japanese language school" },
  { value: "ALUMNI", label: "🎓 Alumni", description: "Completed studies in Japan" }
]

const VISA_STATUSES = [
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "DOCS_PENDING", label: "Documents Pending" },
  { value: "DOCS_VERIFIED", label: "Documents Verified" },
  { value: "SENT_TO_JAPAN", label: "Sent to Japan" },
  { value: "COE_APPLIED", label: "COE Applied" },
  { value: "COE_RECEIVED", label: "COE Received" },
  { value: "VISA_APPLIED", label: "Visa Applied" },
  { value: "VISA_APPROVED", label: "Visa Approved" },
  { value: "TRAVEL_READY", label: "Travel Ready" }
]

export default function AddStudentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    passportNumber: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    education: "",
    japaneseLanguageLevel: "N5",
    intake: "April",
    visaStatus: "NEW_LEAD",
    category: "VISITOR",
    email: "",
    studyGoals: "",
    preferredStudyField: "",
    workExperience: "",
    financialProof: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

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
  }, [status, session, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name, Phone, Address, and Email are mandatory
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required"
    } else if (!/^(98\d{8}|97\d{8}|01\d{9})$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = "Please enter a valid Nepali phone number (98xxxxxxxx or 97xxxxxxxx)"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Optional fields - only validate if provided
    if (formData.passportNumber.trim() && formData.passportNumber.length < 7) {
      newErrors.passportNumber = "Passport number must be at least 7 characters"
    }

    if (formData.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear()
      if (age < 16 || age > 35) {
        newErrors.dateOfBirth = "Student age should be between 16-35 years for Japan study visa"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create student')
      }

      router.push('/students')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isFieldRequired = (key: string): boolean => {
    if (['name', 'phone', 'address', 'email'].includes(key)) return true
    return false
  }

  const hasError = (key: string): boolean => {
    const value = formData[key as keyof FormData]
    if (isFieldRequired(key)) return value !== "" && value !== null && value !== undefined
    return false
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Count total errors to show summary
  const totalErrors = Object.values(errors).filter(error => error !== "").length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Student</h1>
          <p className="text-gray-600">
            Enter information for Nepali student applying to study in Japan 🇯🇵
          </p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {submitError}
        </div>
      )}

      {totalErrors > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Please fix the following errors:
          </h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {Object.entries(errors).filter(([_, error]) => error !== "").map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}:</span> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter student's full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="98xxxxxxxx or 97xxxxxxxx"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="student@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Number
              </label>
              <input
                type="text"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.passportNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Passport number (if available)"
              />
              {errors.passportNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.passportNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Academic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Background
              </label>
              <textarea
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe educational background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Japanese Language Level
              </label>
              <select
                value={formData.japaneseLanguageLevel}
                onChange={(e) => handleInputChange('japaneseLanguageLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="N5">N5 (Basic)</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1 (Advanced)</option>
                <option value="None">No Japanese knowledge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Intake
              </label>
              <select
                value={formData.intake}
                onChange={(e) => handleInputChange('intake', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="January">January</option>
                <option value="April">April</option>
                <option value="July">July</option>
                <option value="October">October</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Goals
              </label>
              <textarea
                value={formData.studyGoals}
                onChange={(e) => handleInputChange('studyGoals', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What are your study goals in Japan?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Study Field
              </label>
              <input
                type="text"
                value={formData.preferredStudyField}
                onChange={(e) => handleInputChange('preferredStudyField', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Engineering, Business, IT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Experience
              </label>
              <textarea
                value={formData.workExperience}
                onChange={(e) => handleInputChange('workExperience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe any relevant work experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Proof
              </label>
              <textarea
                value={formData.financialProof}
                onChange={(e) => handleInputChange('financialProof', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe financial situation and sponsor details"
              />
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Status Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {STUDENT_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label} - {category.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visa Status
              </label>
              <select
                value={formData.visaStatus}
                onChange={(e) => handleInputChange('visaStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {VISA_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/students"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Student...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Create Student
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
