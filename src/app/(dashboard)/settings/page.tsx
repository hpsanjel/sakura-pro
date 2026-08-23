"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface ConsultancySettings {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: string
}

interface UserSettings {
  id: string
  name: string
  email: string
  role: string
  consultancyId: string
  selectedYear: number
}

interface SystemSettings {
  enableEmailNotifications: boolean
  enableSmartNotifications: boolean
  defaultClassSize: number
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [consultancySettings, setConsultancySettings] = useState<ConsultancySettings | null>(null)
  const [users, setUsers] = useState<UserSettings[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [userProfile, setUserProfile] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      setLoading(false)
      return
    }

    if (status === "authenticated") {
      fetchSettingsData()
    }
  }, [status, router, session])

  const fetchSettingsData = async () => {
    try {
      // Fetch each API individually to identify which one fails
      const profileRes = await fetch("/api/settings/profile")
      const consultancyRes = await fetch("/api/settings/consultancy")
      const usersRes = await fetch("/api/settings/users")
      const systemRes = await fetch("/api/settings/system")

      // Check each response individually
      if (!profileRes.ok) {
        console.error("Profile API failed:", profileRes.status, profileRes.statusText)
        throw new Error(`Failed to fetch profile settings: ${profileRes.statusText}`)
      }
      if (!consultancyRes.ok) {
        console.error("Consultancy API failed:", consultancyRes.status, consultancyRes.statusText)
        throw new Error(`Failed to fetch consultancy settings: ${consultancyRes.statusText}`)
      }
      if (!usersRes.ok) {
        console.error("Users API failed:", usersRes.status, usersRes.statusText)
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`)
      }
      if (!systemRes.ok) {
        console.error("System API failed:", systemRes.status, systemRes.statusText)
        throw new Error(`Failed to fetch system settings: ${systemRes.statusText}`)
      }

      // Parse JSON responses
      const profileData = await profileRes.json()
      const consultancyData = await consultancyRes.json()
      const usersData = await usersRes.json()
      const systemData = await systemRes.json()

      setUserProfile(profileData)
      setConsultancySettings(consultancyData)
      setUsers(usersData)
      setSystemSettings(systemData)
    } catch (error) {
      console.error("Error fetching settings data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete user")

      setUsers(users.filter(user => user.id !== userId))
      setSuccess("User deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
          <p className="mt-3 text-gray-600">
            Only a consultancy Admin can manage these settings. If you need something changed here, ask your Admin.
          </p>
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
          <div className="db-inner">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your consultancy settings, users, and system preferences
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
              <nav className="-mb-px flex space-x-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === "profile"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Profile
                </button>
                {session?.user.role === "ADMIN" && (
                  <>
                    <button
                      onClick={() => setActiveTab("consultancy")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === "consultancy"
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Consultancy
                    </button>
                    <button
                      onClick={() => setActiveTab("users")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === "users"
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Users
                    </button>
                    <button
                      onClick={() => setActiveTab("system")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === "system"
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      System
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading profile settings...</p>
                  </div>
                ) : userProfile ? (
                  <div>
                    {/* User Information */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          👤 Name
                        </label>
                        <input
                          type="text"
                          value={userProfile.name}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📧 Email
                        </label>
                        <input
                          type="email"
                          value={userProfile.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏢 Role
                        </label>
                        <input
                          type="text"
                          value={userProfile.role}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      </div>

                      {/* Year Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📅 Current Working Year
                        </label>
                        {session?.user.role === 'ADMIN' ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                              <div>
                                <div className="font-medium text-indigo-900">
                                  {userProfile.selectedYear}
                                </div>
                                <div className="text-sm text-indigo-700">
                                  Consultancy-wide active year
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => router.push('/admin/year-management')}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                              >
                                Manage Year
                              </button>
                            </div>
                            <div className="text-sm text-gray-600">
                              This year applies to all users in your consultancy. 
                              Click "Manage Year" to change it for everyone.
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <div className="font-medium text-gray-900">
                              {userProfile.selectedYear}
                            </div>
                            <div className="text-sm text-gray-600">
                              Set by your consultancy administrator
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Information Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">About Year Management</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                          {session?.user.role === 'ADMIN' ? (
                            <>
                              <p>• As an admin, you can control the active working year for your entire consultancy</p>
                              <p>• This year setting applies to all users - counselors, teachers, and staff</p>
                              <p>• All dashboards, reports, and data will be filtered to this year</p>
                              <p>• Use the Year Management page to change years and view statistics</p>
                            </>
                          ) : (
                            <>
                              <p>• The working year is set by your consultancy administrator</p>
                              <p>• All data you see is filtered to this year for consistency</p>
                              <p>• Contact your admin if you need to work with a different year</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No profile data found</p>
                  </div>
                )}
              </div>
            )}

            {/* Consultancy Settings - Admin Only */}
            {activeTab === "consultancy" && session?.user.role === "ADMIN" && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Consultancy Settings</h2>
                {consultancySettings ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setSaving(true)
                    setError("")
                    setSuccess("")

                    try {
                      const response = await fetch("/api/settings/consultancy", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(consultancySettings)
                      })

                      if (!response.ok) throw new Error("Failed to update consultancy settings")

                      setSuccess("Consultancy settings updated successfully!")
                      setTimeout(() => setSuccess(""), 3000)
                    } catch (error) {
                      setError(error instanceof Error ? error.message : "An error occurred")
                    } finally {
                      setSaving(false)
                    }
                  }}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Consultancy Name
                        </label>
                        <input
                          type="text"
                          value={consultancySettings.name}
                          onChange={(e) => setConsultancySettings({...consultancySettings, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={consultancySettings.email}
                          onChange={(e) => setConsultancySettings({...consultancySettings, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={consultancySettings.phone || ""}
                          onChange={(e) => setConsultancySettings({...consultancySettings, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          value={consultancySettings.address || ""}
                          onChange={(e) => setConsultancySettings({...consultancySettings, address: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No consultancy data found</p>
                  </div>
                )}
              </div>
            )}

            {/* Users Management - Admin Only */}
            {activeTab === "users" && session?.user.role === "ADMIN" && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">User Management</h2>
                {users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'COUNSELOR' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'TEACHER' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            )}

            {/* System Settings - Admin Only */}
            {activeTab === "system" && session?.user.role === "ADMIN" && (
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h2>
                {systemSettings ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setSaving(true)
                    setError("")
                    setSuccess("")

                    try {
                      const response = await fetch("/api/settings/system", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(systemSettings)
                      })

                      if (!response.ok) throw new Error("Failed to update system settings")

                      setSuccess("System settings updated successfully!")
                      setTimeout(() => setSuccess(""), 3000)
                    } catch (error) {
                      setError(error instanceof Error ? error.message : "An error occurred")
                    } finally {
                      setSaving(false)
                    }
                  }}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Notifications
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.enableEmailNotifications}
                            onChange={(e) => setSystemSettings({...systemSettings, enableEmailNotifications: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Enable email notifications
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Smart Notifications
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.enableSmartNotifications}
                            onChange={(e) => setSystemSettings({...systemSettings, enableSmartNotifications: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Enable smart notifications
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Class Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={systemSettings.defaultClassSize}
                          onChange={(e) => setSystemSettings({...systemSettings, defaultClassSize: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No system settings found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
