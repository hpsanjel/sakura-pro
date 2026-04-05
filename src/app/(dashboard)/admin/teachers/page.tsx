"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Upload,
  Download,
  Clock,
  AlertCircle,
  Award,
  GraduationCap,
  Phone,
} from "lucide-react"

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  experience: string
  qualification: string
  status: string
  salary: number
  hireDate: string
  documents: Array<{
    type: string
    status: string
    url?: string
  }>
  classes: Array<{
    id: string
    name: string
    level: string
  }>
}

interface PayslipFormData {
  teacherId: string
  month: string
  year: string
  basicSalary: number
  overtime: number
  bonus: number
  taxDeduction: number
  insuranceDed: number
  otherDed: number
  sendEmail: boolean
}

export default function TeachersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPayslipFormModal, setShowPayslipFormModal] = useState(false)
  const [generatingPayslip, setGeneratingPayslip] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    qualification: "",
    salary: "",
    status: "APPLICANT"
  })
  
  const [payslipFormData, setPayslipFormData] = useState<PayslipFormData>({
    teacherId: "",
    month: "",
    year: "",
    basicSalary: 0,
    overtime: 0,
    bonus: 0,
    taxDeduction: 0,
    insuranceDed: 0,
    otherDed: 0,
    sendEmail: false
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchTeachers()
    }
  }, [status, router])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/teachers')
      if (!response.ok) throw new Error('Failed to fetch teachers')
      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTeacher ? `/api/admin/teachers/${editingTeacher.id}` : '/api/admin/teachers'
      const method = editingTeacher ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to save teacher')
      
      setShowModal(false)
      setEditingTeacher(null)
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        qualification: "",
        salary: "",
        status: "APPLICANT"
      })
      fetchTeachers()
    } catch (error) {
      console.error('Error saving teacher:', error)
      alert('Failed to save teacher')
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      specialization: teacher.specialization,
      experience: teacher.experience,
      qualification: teacher.qualification,
      salary: teacher.salary.toString(),
      status: teacher.status
    })
    setShowModal(true)
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return
    
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete teacher')
      fetchTeachers()
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('Failed to delete teacher')
    }
  }

  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setShowDetailsModal(true)
  }

  const handleGeneratePayslip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return
    
    try {
      setGeneratingPayslip(true)
      const response = await fetch('/api/admin/teachers/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payslipFormData)
      })
      
      if (!response.ok) throw new Error('Failed to generate payslip')
      
      setShowPayslipFormModal(false)
      alert('Payslip generated successfully!')
    } catch (error) {
      console.error('Error generating payslip:', error)
      alert('Failed to generate payslip')
    } finally {
      setGeneratingPayslip(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'APPLICANT': return 'bg-blue-100 text-blue-800'
      case 'SCREENING': return 'bg-yellow-100 text-yellow-800'
      case 'INTERVIEW': return 'bg-purple-100 text-purple-800'
      case 'OFFERED': return 'bg-indigo-100 text-indigo-800'
      case 'HIRED': return 'bg-emerald-100 text-emerald-800'
      case 'PROBATION': return 'bg-orange-100 text-orange-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || teacher.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === "ACTIVE").length,
    applicants: teachers.filter(t => ["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED"].includes(t.status)).length,
    hired: teachers.filter(t => ["HIRED", "PROBATION", "ACTIVE"].includes(t.status)).length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Teachers Management
            </h1>
            <p className="text-blue-100 mb-4">
              Manage teacher profiles, documents, and payroll
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">{stats.total} Total Teachers</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{stats.active} Active</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{stats.applicants} Applicants</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search teachers..."
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
          <option value="ACTIVE">Active</option>
          <option value="APPLICANT">Applicant</option>
          <option value="SCREENING">Screening</option>
          <option value="INTERVIEW">Interview</option>
          <option value="OFFERED">Offered</option>
          <option value="HIRED">Hired</option>
          <option value="PROBATION">Probation</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No teachers found
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                        <div className="text-sm text-gray-500">{teacher.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.specialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.experience}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(teacher.status)}`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${teacher.salary.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(teacher)}
                          className="text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Hire New Teacher'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="APPLICANT">Applicant</option>
                    <option value="SCREENING">Screening</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFERED">Offered</option>
                    <option value="HIRED">Hired</option>
                    <option value="PROBATION">Probation</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTeacher(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingTeacher ? 'Update' : 'Hire'} Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {showDetailsModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">Teacher Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedTeacher.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedTeacher.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedTeacher.phone}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialization:</span>
                    <span className="font-medium">{selectedTeacher.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{selectedTeacher.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qualification:</span>
                    <span className="font-medium">{selectedTeacher.qualification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary:</span>
                    <span className="font-medium">${selectedTeacher.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTeacher.status)}`}>
                      {selectedTeacher.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleEdit(selectedTeacher)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Teacher
                </button>
                <button
                  onClick={() => {
                    setPayslipFormData(prev => ({ ...prev, teacherId: selectedTeacher.id }))
                    setShowDetailsModal(false)
                    setShowPayslipFormModal(true)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Generate Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Form Modal */}
      {showPayslipFormModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Payslip</h2>
            <p className="text-gray-600 mb-4">Teacher: {selectedTeacher.name}</p>
            
            <form onSubmit={handleGeneratePayslip}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={payslipFormData.month}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, month: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Month</option>
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      value={payslipFormData.year}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2024"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payslipFormData.basicSalary || selectedTeacher.salary}
                    onChange={(e) => setPayslipFormData(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overtime</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payslipFormData.overtime}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, overtime: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payslipFormData.bonus}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Deduction</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payslipFormData.taxDeduction}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, taxDeduction: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Deduction</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payslipFormData.insuranceDed}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, insuranceDed: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payslipFormData.otherDed}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, otherDed: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={payslipFormData.sendEmail}
                    onChange={(e) => setPayslipFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700">
                    Send payslip via email to teacher
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayslipFormModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingPayslip}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {generatingPayslip ? 'Generating...' : 'Generate Payslip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
