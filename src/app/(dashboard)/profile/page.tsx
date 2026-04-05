"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  consultancyId: string
  createdAt: string
  // Additional fields based on role
  phone?: string
  address?: string
  bio?: string
  avatar?: string
  qualifications?: string
  specialization?: string
  experience?: string
  dateOfBirth?: string
  passportNumber?: string
  japaneseLevel?: string
  education?: string
  workExperience?: string
  studyGoals?: string
  preferredStudyField?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    fetchProfileData()
  }, [status, session])

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile")
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const profileData = await response.json()
      setProfile(profileData)
    } catch (error) {
      console.error("Error fetching profile data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })

      if (!response.ok) throw new Error("Failed to update profile")

      setSuccess("Profile updated successfully")
      setEditMode(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!response.ok) throw new Error("Failed to update password")

      setSuccess("Password updated successfully")
      const form = e.target as HTMLFormElement
      form.reset()
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const renderPersonalInfo = () => (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {editMode ? (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile?.name || ""}
                onChange={(e) => setProfile({...profile!, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={profile?.phone || ""}
                onChange={(e) => setProfile({...profile!, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio / Description
            </label>
            <textarea
              value={profile?.bio || ""}
              onChange={(e) => setProfile({...profile!, bio: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="text-lg text-gray-900">{profile?.name || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-lg text-gray-900">{profile?.email || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="text-lg text-gray-900">{profile?.phone || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                profile?.role === 'COUNSELOR' ? 'bg-blue-100 text-blue-800' :
                profile?.role === 'TEACHER' ? 'bg-green-100 text-green-800' :
                profile?.role === 'STUDENT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {profile?.role}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bio / Description</h3>
            <p className="text-gray-900">
              {profile?.bio || "No bio provided"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
            <p className="text-gray-900">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const renderRoleSpecificInfo = () => {
    if (!profile) return null

    switch (profile.role) {
      case 'STUDENT':
        return (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Student Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Passport Number</h3>
                  <p className="text-gray-900">{profile.passportNumber || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="text-gray-900">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Japanese Level</h3>
                  <p className="text-gray-900">{profile.japaneseLevel || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Education</h3>
                  <p className="text-gray-900">{profile.education || "Not provided"}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Work Experience</h3>
                <p className="text-gray-900">{profile.workExperience || "Not provided"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Study Goals</h3>
                <p className="text-gray-900">{profile.studyGoals || "Not provided"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Preferred Study Field</h3>
                <p className="text-gray-900">{profile.preferredStudyField || "Not provided"}</p>
              </div>
            </div>
          </div>
        )

      case 'TEACHER':
        return (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Teacher Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Qualifications</h3>
                  <p className="text-gray-900">{profile.qualifications || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Specialization</h3>
                  <p className="text-gray-900">{profile.specialization || "Not provided"}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                <p className="text-gray-900">{profile.experience || "Not provided"}</p>
              </div>
            </div>
          </div>
        )

      case 'COUNSELOR':
        return (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Counselor Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Qualifications</h3>
                  <p className="text-gray-900">{profile.qualifications || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Specialization</h3>
                  <p className="text-gray-900">{profile.specialization || "Not provided"}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                <p className="text-gray-900">{profile.experience || "Not provided"}</p>
              </div>
            </div>
          </div>
        )

      case 'ADMIN':
        return (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Admin Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">System Access</h3>
                <p className="text-gray-900">Full administrative privileges</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Responsibilities</h3>
                <ul className="text-gray-900 list-disc list-inside">
                  <li>User management</li>
                  <li>System configuration</li>
                  <li>Report generation</li>
                  <li>Consultancy settings</li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderPasswordChange = () => (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <>
      <style>{`
        /* ── Layout for Sidebar ── */
        .db-main    { margin-left: 260px; min-height: calc(100vh - 64px); }
        .db-inner   { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
      `}</style>
      
      <div style={{ display: "flex" }}>

        <main className="db-main">
          <div className="db-inner">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-2 text-gray-600">
                Manage your personal information and account settings
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "personal"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Personal Info
                </button>
                {profile?.role !== 'SUPERADMIN' && (
                  <button
                    onClick={() => setActiveTab("role")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "role"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {profile?.role === 'STUDENT' ? 'Student Info' : 
                     profile?.role === 'TEACHER' ? 'Teacher Info' :
                     profile?.role === 'COUNSELOR' ? 'Counselor Info' : 'Admin Info'}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("security")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "security"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Security
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "personal" && renderPersonalInfo()}
            {activeTab === "role" && renderRoleSpecificInfo()}
            {activeTab === "security" && renderPasswordChange()}
          </div>
        </main>
      </div>
    </>
  )
}
