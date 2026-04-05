"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface School {
  id: string
  name: string
  address?: string
  website?: string
}

interface FormData {
  name: string
  address: string
  website: string
}

export default function EditSchoolPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [school, setSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    website: "",
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchSchool()
  }, [status, session, router, params.id])

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/schools/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setSubmitError("School not found")
        } else {
          throw new Error("Failed to fetch school")
        }
        return
      }
      
      const data = await response.json()
      setSchool(data)
      setFormData({
        name: data.name,
        address: data.address || "",
        website: data.website || "",
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "School name is required"
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/schools/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update school")
      }

      setSuccess("School updated successfully!")
      setTimeout(() => {
        router.push(`/schools/${params.id}`)
      }, 1500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (submitError && !school) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                <p className="text-gray-600 mb-4">{submitError}</p>
                <Link
                  href="/schools"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Back to Schools
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* ── Layout for Sidebar ── */
        .db-main    { margin-left: 260px; min-height: calc(100vh - 64px); }
        .db-inner   { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
      `}</style>
      
      <div style={{ display: "flex" }}>

        <main className="db-main">
          <div className="db-inner" style={{ maxWidth: "800px" }}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center">
                <Link
                  href={`/schools/${params.id}`}
                  className="text-gray-600 hover:text-gray-700 mr-4"
                >
                  ← Back to School
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Partner School</h1>
                  <p className="mt-2 text-gray-600">
                    Update school information and details
                  </p>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* School Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter school name"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter school address"
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.website ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="https://www.school-website.com"
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Link
                    href={`/schools/${params.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Updating..." : "Update School"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
