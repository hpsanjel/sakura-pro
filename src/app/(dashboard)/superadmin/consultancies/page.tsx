"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Building, Mail, Phone, MapPin, Users, CheckCircle, XCircle, Clock, AlertCircle, Settings, Eye, Calendar, TrendingUp, Activity } from "lucide-react"

interface Consultancy {
  id: string
  name: string
  email: string
  phone: string
  address: string
  website?: string
  description?: string
  status: "PENDING" | "ACTIVE" | "REJECTED"
  createdAt: string
  updatedAt: string
  adminUsers?: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
  studentCount?: number
  recentActivity?: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

interface RejectModal {
  consultancyId: string
  consultancyName: string
  reason: string
}

export default function ConsultanciesManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [consultancies, setConsultancies] = useState<Consultancy[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "rejected">("pending")
  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "studentCount">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated" || session?.user?.role !== "SUPERADMIN") {
      router.push("/dashboard")
      return
    }

    fetchConsultancies()
  }, [status, session, router])

  const fetchConsultancies = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/superadmin/consultancies")
      if (!response.ok) throw new Error("Failed to fetch consultancies")
      const data = await response.json()
      setConsultancies(data)
    } catch (error) {
      console.error("Error fetching consultancies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveConsultancy = async (consultancyId: string) => {
    try {
      const response = await fetch(`/api/superadmin/consultancies/${consultancyId}/approve`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to approve consultancy")
      await fetchConsultancies()
    } catch (error) {
      console.error("Error approving consultancy:", error)
      alert("Failed to approve consultancy")
    }
  }

  const handleRejectConsultancy = async () => {
    if (!rejectModal?.consultancyId || !rejectModal.reason.trim()) {
      alert("Please provide a rejection reason")
      return
    }

    try {
      const response = await fetch(`/api/superadmin/consultancies/${rejectModal.consultancyId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectModal.reason }),
      })
      if (!response.ok) throw new Error("Failed to reject consultancy")
      
      setRejectModal(null)
      await fetchConsultancies()
    } catch (error) {
      console.error("Error rejecting consultancy:", error)
      alert("Failed to reject consultancy")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return Clock
      case "ACTIVE":
        return CheckCircle
      case "REJECTED":
        return XCircle
      default:
        return AlertCircle
    }
  }

  const filteredConsultancies = consultancies.filter((c) => {
    const matchesTab = 
      activeTab === "pending" ? c.status === "PENDING" :
      activeTab === "active" ? c.status === "ACTIVE" :
      activeTab === "rejected" ? c.status === "REJECTED" :
      true
    
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    
    return matchesTab && matchesSearch
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case "studentCount":
        comparison = (a.studentCount || 0) - (b.studentCount || 0)
        break
    }
    
    return sortOrder === "asc" ? comparison : -comparison
  })

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultancies...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.role !== "SUPERADMIN") {
    return null
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultancy Management</h1>
        <p className="text-gray-600">Review and approve consultancy registrations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Building className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{consultancies.length}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Total Consultancies</h3>
          <p className="text-gray-600 text-sm">Registered consultancies</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">
              {consultancies.filter(c => c.status === "PENDING").length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Approval</h3>
          <p className="text-gray-600 text-sm">Waiting for review</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">
              {consultancies.filter(c => c.status === "ACTIVE").length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Active</h3>
          <p className="text-gray-600 text-sm">Approved consultancies</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">
              {consultancies.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Total Students</h3>
          <p className="text-gray-600 text-sm">Across all consultancies</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search consultancies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="studentCount">Sort by Students</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({consultancies.filter((c) => c.status === "PENDING").length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "active"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Active ({consultancies.filter((c) => c.status === "ACTIVE").length})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "rejected"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Rejected ({consultancies.filter((c) => c.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* Consultancies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredConsultancies.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No consultancies found</h3>
              <p className="text-gray-600">
                {searchTerm ? "No consultancies match your search criteria." : `No ${activeTab} consultancies.`}
              </p>
            </div>
          </div>
        ) : (
          filteredConsultancies.map((consultancy) => {
            const StatusIcon = getStatusIcon(consultancy.status)
            
            return (
              <div key={consultancy.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{consultancy.name}</h3>
                    <p className="text-sm text-gray-600">{consultancy.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(consultancy.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    {consultancy.status}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {consultancy.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {consultancy.address}
                  </div>
                  {consultancy.website && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Building className="w-4 h-4" />
                      <a
                        href={consultancy.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                {consultancy.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{consultancy.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{consultancy.studentCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(consultancy.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {consultancy.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApproveConsultancy(consultancy.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModal({
                          consultancyId: consultancy.id,
                          consultancyName: consultancy.name,
                          reason: ""
                        })}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {consultancy.status === "ACTIVE" && (
                    <button
                      onClick={() => router.push(`/superadmin/consultancies/${consultancy.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  )}
                  
                  {consultancy.status === "REJECTED" && (
                    <button
                      onClick={() => setRejectModal({
                        consultancyId: consultancy.id,
                        consultancyName: consultancy.name,
                        reason: ""
                      })}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      View Reason
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {rejectModal.reason ? "Rejection Details" : "Reject Consultancy"}
            </h2>
            
            {rejectModal.reason ? (
              <div>
                <p className="text-gray-600 mb-4">
                  <strong>{rejectModal.consultancyName}</strong> was rejected for the following reason:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{rejectModal.reason}</p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setRejectModal(null)}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to reject <strong>{rejectModal.consultancyName}</strong>?
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Enter reason for rejection..."
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setRejectModal(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectConsultancy}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
