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
  Building,
  User,
} from "lucide-react"


interface Employee {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  address?: string
  designation: string
  department?: string
  category: string
  experience?: string
  qualifications?: string
  skills?: string
  previousCompanies?: string
  status: string
  employmentType: string
  salary?: number
  currency?: string
  hireDate?: string
  employeeId?: string
  createdAt: string
  user: {
    id: string
    email: string
    name?: string
    role: string
  }
  _count: {
    documents: number
    payslips: number
  }
}

const statusConfig = {
  APPLICANT: { label: "Applicant", icon: Clock },
  SCREENING: { label: "Screening", icon: AlertCircle },
  INTERVIEW: { label: "Interview", icon: Users },
  OFFERED: { label: "Offered", icon: FileText },
  HIRED: { label: "Hired", icon: CheckCircle },
  PROBATION: { label: "Probation", icon: Award },
  ACTIVE: { label: "Active", icon: CheckCircle },
  ON_LEAVE: { label: "On Leave", icon: Calendar },
  TERMINATED: { label: "Terminated", icon: XCircle },
}

const employmentConfig = {
  FULL_TIME: { label: "Full Time", icon: Briefcase },
  PART_TIME: { label: "Part Time", icon: Clock },
  CONTRACT: { label: "Contract", icon: FileText },
  FREELANCE: { label: "Freelance", icon: Users },
}

const categoryConfig = {
  ADMINISTRATION: { label: "Administration", icon: Building },
  MARKETING: { label: "Marketing", icon: Award },
  LANGUAGE: { label: "Language", icon: GraduationCap },
  COUNSELORS: { label: "Counselors", icon: Users },
  IT: { label: "IT", icon: Award },
  FINANCE: { label: "Finance", icon: DollarSign },
  HR: { label: "HR", icon: Users },
  OPERATIONS: { label: "Operations", icon: Briefcase },
  MANAGEMENT: { label: "Management", icon: Award },
  OTHER: { label: "Other", icon: User },
}

export default function EmployeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    designation: "",
    department: "",
    category: "OTHER",
    role: "EMPLOYEE",
    experience: "",
    qualifications: "",
    skills: "",
    previousCompanies: "",
    employmentType: "FULL_TIME",
    salary: "",
    currency: "USD",
    status: "APPLICANT",
    employeeId: "",
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showPayslipsModal, setShowPayslipsModal] = useState(false)
  const [showPayslipFormModal, setShowPayslipFormModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    type: "CV",
    title: "",
    notes: "",
  })
  const [generatingPayslip, setGeneratingPayslip] = useState(false)
  const [payslipFormData, setPayslipFormData] = useState({
    payPeriod: "",
    basicSalary: "",
    housingAllow: "",
    transportAllow: "",
    mealAllow: "",
    otherAllow: "",
    taxDeduction: "",
    insuranceDed: "",
    otherDed: "",
    currency: "USD",
    sendEmail: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchEmployees()
    }
  }, [session])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError("")

    try {
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
      }

      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newEmployee = await response.json()
        setEmployees(prev => [newEmployee, ...prev])
        setShowModal(false)
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          address: "",
          designation: "",
          department: "",
          category: "OTHER",
          role: "EMPLOYEE",
          experience: "",
          qualifications: "",
          skills: "",
          previousCompanies: "",
          employmentType: "FULL_TIME",
          salary: "",
          currency: "USD",
          status: "APPLICANT",
          employeeId: "",
        })
      } else {
        const error = await response.json()
        setFormError(error.error || "Failed to create employee")
      }
    } catch (error) {
      console.error("Error creating employee:", error)
      setFormError("Failed to create employee")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber || "",
      address: employee.address || "",
      designation: employee.designation,
      department: employee.department || "",
      category: employee.category,
      role: employee.user.role || "EMPLOYEE",
      experience: employee.experience || "",
      qualifications: employee.qualifications || "",
      skills: employee.skills || "",
      previousCompanies: employee.previousCompanies || "",
      employmentType: employee.employmentType,
      salary: employee.salary?.toString() || "",
      currency: employee.currency || "USD",
      status: employee.status,
      employeeId: employee.employeeId || "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    setSubmitting(true)
    setFormError("")

    try {
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
      }

      const response = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const updatedEmployee = await response.json()
        setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e))
        setShowEditModal(false)
        setEditingEmployee(null)
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          address: "",
          designation: "",
          department: "",
          category: "OTHER",
          role: "EMPLOYEE",
          experience: "",
          qualifications: "",
          skills: "",
          previousCompanies: "",
          employmentType: "FULL_TIME",
          salary: "",
          currency: "USD",
          status: "APPLICANT",
          employeeId: "",
        })
      } else {
        const error = await response.json()
        setFormError(error.error || "Failed to update employee")
      }
    } catch (error) {
      console.error("Error updating employee:", error)
      setFormError("Failed to update employee")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setEmployees(prev => prev.filter(e => e.id !== employee.id))
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete employee")
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
      alert("Failed to delete employee")
    }
  }

  const handleViewProfile = (employee: Employee) => {
    // For now, just show an alert with employee details
    alert(`Employee Profile:\n\nName: ${employee.firstName} ${employee.lastName}\nEmail: ${employee.email}\nDesignation: ${employee.designation}\nDepartment: ${employee.department || 'N/A'}\nCategory: ${employee.category}\nStatus: ${employee.status}\nEmployment: ${employee.employmentType}\n${employee.salary ? `Salary: ${employee.salary} ${employee.currency || 'USD'}/month` : ''}\n${employee.experience ? `Experience: ${employee.experience}` : ''}\n${employee.qualifications ? `Qualifications: ${employee.qualifications}` : ''}`)
  }

  const handleManageDocuments = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDocumentsModal(true)
    fetchDocuments(employee.id)
  }

  const handleManagePayslips = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowPayslipsModal(true)
  }

  const handleGeneratePayslip = () => {
    // Pre-fill basic salary from employee data if available
    if (selectedEmployee?.salary) {
      setPayslipFormData(prev => ({
        ...prev,
        basicSalary: selectedEmployee.salary?.toString() || "",
        currency: selectedEmployee.currency || "USD",
      }))
    }
    setShowPayslipFormModal(true)
  }

  const handlePayslipFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEmployee) return

    setGeneratingPayslip(true)

    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployee.id}/payslips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payPeriod: payslipFormData.payPeriod,
          basicSalary: parseFloat(payslipFormData.basicSalary) || 0,
          housingAllow: parseFloat(payslipFormData.housingAllow) || 0,
          transportAllow: parseFloat(payslipFormData.transportAllow) || 0,
          mealAllow: parseFloat(payslipFormData.mealAllow) || 0,
          otherAllow: parseFloat(payslipFormData.otherAllow) || 0,
          taxDeduction: parseFloat(payslipFormData.taxDeduction) || 0,
          insuranceDed: parseFloat(payslipFormData.insuranceDed) || 0,
          otherDed: parseFloat(payslipFormData.otherDed) || 0,
          currency: payslipFormData.currency,
          sendEmail: payslipFormData.sendEmail,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Payslip generated successfully!\n\nPDF Generated: ${result.pdfGenerated ? 'Yes' : 'No'}\nEmail Sent: ${result.emailSent ? 'Yes' : 'No'}\nNet Salary: ${result.netSalary} ${result.currency}`)
        setShowPayslipFormModal(false)
        setPayslipFormData({
          payPeriod: "",
          basicSalary: "",
          housingAllow: "",
          transportAllow: "",
          mealAllow: "",
          otherAllow: "",
          taxDeduction: "",
          insuranceDed: "",
          otherDed: "",
          currency: "USD",
          sendEmail: true,
        })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate payslip")
      }
    } catch (error) {
      console.error("Error generating payslip:", error)
      alert("Failed to generate payslip")
    } finally {
      setGeneratingPayslip(false)
    }
  }

  const fetchDocuments = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const handleUploadDocument = (documentType?: string) => {
    // Pre-select the document type if provided
    if (documentType) {
      setUploadFormData(prev => ({ ...prev, type: documentType }))
    } else {
      // Reset to default if no document type specified
      setUploadFormData({ type: "CV", title: "", notes: "" })
    }
    setShowUploadModal(true)
  }

  const handleCloseUploadModal = () => {
    setShowUploadModal(false)
    // Reset form to default values
    setUploadFormData({ type: "CV", title: "", notes: "" })
  }

  const handleDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEmployee) return

    const fileInputElement = document.querySelector('input[name="file"]') as HTMLInputElement
    const file = fileInputElement?.files?.[0]

    if (!file) {
      alert('Please select a file to upload')
      return
    }

    setUploadingDocument(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("file", file)
      formDataToSend.append("type", uploadFormData.type)
      formDataToSend.append("title", uploadFormData.title || uploadFormData.type)
      formDataToSend.append("notes", uploadFormData.notes)

      const response = await fetch(`/api/admin/employees/${selectedEmployee.id}/documents`, {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        const newDocument = await response.json()
        setDocuments(prev => [...prev, newDocument])
        setShowUploadModal(false)
        setUploadFormData({ type: "CV", title: "", notes: "" })
        // Reset file input
        if (fileInputElement) fileInputElement.value = ""
      } else {
        const error = await response.json()
        alert(error.error || "Failed to upload document")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      alert("Failed to upload document")
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDownloadDocument = async (doc: any) => {
    try {
      // Show loading state
      const downloadButton = document.querySelector(`[data-download-id="${doc.id}"]`) as HTMLButtonElement
      if (downloadButton) {
        downloadButton.disabled = true
        downloadButton.innerHTML = '<span style="animation: spin 1s linear infinite;">⏳</span>'
      }

      // For Cloudinary URLs, we can directly download them
      if (doc.filePath.includes('cloudinary')) {
        // Try to fetch the file first to ensure it's available
        try {
          const response = await fetch(doc.filePath, { method: 'HEAD' })
          if (!response.ok) {
            throw new Error('File not available')
          }
        } catch (error) {
          console.error('File not accessible:', error)
          alert('File is not available for download')
          return
        }

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a')
        link.href = doc.filePath
        link.download = doc.fileName
        link.target = '_blank'
        
        // Trigger the download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // For other URLs, open in new tab
        window.open(doc.filePath, '_blank')
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      alert("Failed to download document")
    } finally {
      // Restore button state
      const downloadButton = document.querySelector(`[data-download-id="${doc.id}"]`) as HTMLButtonElement
      if (downloadButton) {
        downloadButton.disabled = false
        downloadButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
      }
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "ALL" || employee.status === filterStatus
    const matchesCategory = filterCategory === "ALL" || employee.category === filterCategory
    const matchesType = filterType === "ALL" || employee.employmentType === filterType
    
    return matchesSearch && matchesStatus && matchesCategory && matchesType
  })

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "ACTIVE").length,
    applicants: employees.filter(e => ["APPLICANT", "SCREENING", "INTERVIEW", "OFFERED"].includes(e.status)).length,
    hired: employees.filter(e => ["HIRED", "PROBATION", "ACTIVE"].includes(e.status)).length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Employees Management
                  </h1>
                  <p className="text-blue-100 mb-4">
                    Manage employee profiles, documents, and payroll
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{stats.total} Total Employees</span>
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
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl" onClick={() => setShowModal(true)}>
                  <Plus className="w-5 h-5" /> Hire Employee
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-3 mb-7 flex-wrap items-center">
              <div className="relative flex-1 min-w-55">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  className="w-full px-3.5 py-2.5 pl-10 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                  placeholder="Search employees by name, email, designation, department..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 shadow-sm cursor-pointer transition-colors focus:outline-none focus:border-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select className="px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 shadow-sm cursor-pointer transition-colors focus:outline-none focus:border-blue-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="ALL">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select className="px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 shadow-sm cursor-pointer transition-colors focus:outline-none focus:border-blue-500" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                {Object.entries(employmentConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Employees Grid */}
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Users className="w-14 h-14 text-gray-500 mx-auto mb-4 block" />
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">No employees found</h3>
                <p className="text-sm text-gray-600 mb-5">
                  {searchTerm || filterStatus !== "ALL" || filterCategory !== "ALL" || filterType !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Start by hiring your first employee."}
                </p>
                {!searchTerm && filterStatus === "ALL" && filterCategory === "ALL" && filterType === "ALL" && (
                  <button className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4" /> Hire Employee
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => {
                  const statusInfo = statusConfig[employee.status as keyof typeof statusConfig]
                  const employmentInfo = employmentConfig[employee.employmentType as keyof typeof employmentConfig]
                  const categoryInfo = categoryConfig[employee.category as keyof typeof categoryConfig]
                  const StatusIcon = statusInfo?.icon || Clock
                  const EmploymentIcon = employmentInfo?.icon || Briefcase
                  const CategoryIcon = categoryInfo?.icon || User

                  return (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col">
                      <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="text-lg font-bold text-gray-900 mb-1">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-600 mb-2">{employee.email}</div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            employee.status === 'APPLICANT' || employee.status === 'SCREENING' || employee.status === 'INTERVIEW' || employee.status === 'OFFERED' 
                              ? 'bg-yellow-50 text-yellow-600' 
                              : employee.status === 'HIRED' || employee.status === 'PROBATION' 
                              ? 'bg-green-50 text-green-600'
                              : employee.status === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            <StatusIcon className="w-3 h-3" /> {statusInfo?.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-purple-50 text-purple-600">
                            <CategoryIcon className="w-3 h-3" /> {categoryInfo?.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="px-5 py-5 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Briefcase className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="font-semibold text-gray-900">Designation:</span> {employee.designation}
                        </div>
                        {employee.department && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Building className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">Department:</span> {employee.department}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <EmploymentIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="font-semibold text-gray-900">Employment:</span> {employmentInfo?.label}
                        </div>
                        {employee.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">Phone:</span> {employee.phoneNumber}
                          </div>
                        )}
                        {employee.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Award className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">Experience:</span> {employee.experience}
                          </div>
                        )}
                        {employee.employeeId && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">Employee ID:</span> {employee.employeeId}
                          </div>
                        )}
                      </div>
                      
                      <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {employee.salary ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              {employee.salary.toLocaleString()} {employee.currency || 'USD'}/month
                            </div>
                          ) : (
                            'Salary not set'
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 text-xs cursor-pointer transition-all hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1" onClick={() => handleViewProfile(employee)}>
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 text-xs cursor-pointer transition-all hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1" onClick={() => handleEdit(employee)}>
                            <Edit className="w-3 h-3" />
                          </button>
                          <button className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 text-xs cursor-pointer transition-all hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1" onClick={() => handleManageDocuments(employee)}>
                            <FileText className="w-3 h-3" />
                          </button>
                          <button className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 text-xs cursor-pointer transition-all hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1" onClick={() => handleDelete(employee)}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

      {/* Hire Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Hire New Employee</h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={() => setShowModal(false)}>
                <XCircle />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6">
                {formError && <div className="text-xs text-red-500 mt-1">{formError}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Designation *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Engineer, Marketing Manager"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Engineering, Marketing"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">User Role *</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="COUNSELOR">Counselor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STUDENT">Student</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employment Type</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                    >
                      {Object.entries(employmentConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salary (Monthly)</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="NPR">NPR</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Initial Status</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee ID</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="Optional unique identifier"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full address"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Experience</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Years of experience and relevant details"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Qualifications</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    placeholder="Academic and professional qualifications"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Skills</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="Relevant skills and competencies"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Previous Companies</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="previousCompanies"
                    value={formData.previousCompanies}
                    onChange={handleInputChange}
                    placeholder="Previous work experience and companies"
                  />
                </div>
              </div>
              
              <div className="px-5 py-5 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                  {submitting ? 'Hiring...' : 'Hire Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={() => setShowEditModal(false)}>
                <XCircle />
              </button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="px-6 py-6">
                {formError && <div className="text-xs text-red-500 mt-1">{formError}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Designation *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">User Role *</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="COUNSELOR">Counselor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STUDENT">Student</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employment Type</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                    >
                      {Object.entries(employmentConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salary (Monthly)</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salary}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="NPR">NPR</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee ID</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Experience</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Qualifications</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Skills</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Previous Companies</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="previousCompanies"
                    value={formData.previousCompanies}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="px-5 py-5 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDocumentsModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Documents - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={() => setShowDocumentsModal(false)}>
                <XCircle />
              </button>
            </div>
            
            <div className="px-6 py-6">
              <div className="mb-5">
                <button className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all" onClick={() => handleUploadDocument()}>
                  <Upload /> Upload Document
                </button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <FileText className="w-14 h-14 text-gray-500 mx-auto mb-4 block" />
                  <h3 className="text-xl font-bold text-gray-900 mb-1.5">No documents uploaded</h3>
                  <p className="text-sm text-gray-600 mb-5">Start by uploading the first document.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold mb-1">{doc.title}</div>
                        <div className="text-sm text-gray-600">
                          {doc.type} • {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                        {doc.notes && (
                          <div className="text-xs text-gray-600 mt-1">
                            {doc.notes}
                          </div>
                        )}
                      </div>
                      <button 
                        className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 text-xs cursor-pointer transition-all hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1"
                        onClick={() => handleDownloadDocument(doc)}
                        data-download-id={doc.id}
                      >
                        <Download />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseUploadModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={handleCloseUploadModal}>
                <XCircle />
              </button>
            </div>
            
            <form onSubmit={handleDocumentUpload}>
              <div className="px-6 py-6">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Document Type *</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="type"
                    value={uploadFormData.type}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="CV">CV</option>
                    <option value="Cover Letter">Cover Letter</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Degree">Degree</option>
                    <option value="Transcript">Transcript</option>
                    <option value="Passport">Passport</option>
                    <option value="Visa">Visa</option>
                    <option value="Contract">Contract</option>
                    <option value="Police Clearance">Police Clearance</option>
                    <option value="Health Cert">Health Certificate</option>
                    <option value="Photo ID">Photo ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="title"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Optional custom title"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">File *</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors resize-y min-h-20 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                    name="notes"
                    value={uploadFormData.notes}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes about this document"
                  />
                </div>
              </div>
              
              <div className="px-5 py-5 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={handleCloseUploadModal}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all" disabled={uploadingDocument}>
                  {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslips Modal */}
      {showPayslipsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPayslipsModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Payslips - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={() => setShowPayslipsModal(false)}>
                <XCircle />
              </button>
            </div>
            
            <div className="px-6 py-6">
              <div className="mb-5">
                <button className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all" onClick={handleGeneratePayslip}>
                  <Plus /> Generate Payslip
                </button>
              </div>
              
              <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <DollarSign className="w-14 h-14 text-gray-500 mx-auto mb-4 block" />
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">No payslips generated</h3>
                <p className="text-sm text-gray-600 mb-5">Generate the first payslip for this employee.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payslip Modal */}
      {showPayslipFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPayslipFormModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Generate Payslip</h2>
              <button className="w-8 h-8 rounded-lg bg-gray-50 border-none flex items-center justify-center cursor-pointer transition-all hover:bg-gray-200" onClick={() => setShowPayslipFormModal(false)}>
                <XCircle />
              </button>
            </div>
            
            <form onSubmit={handlePayslipFormSubmit}>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pay Period *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="payPeriod"
                      value={payslipFormData.payPeriod}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, payPeriod: e.target.value }))}
                      placeholder="e.g., March 2024, 2024-03"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Basic Salary *</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="basicSalary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.basicSalary}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, basicSalary: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Housing Allowance</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="housingAllow"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.housingAllow}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, housingAllow: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Transport Allowance</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="transportAllow"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.transportAllow}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, transportAllow: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meal Allowance</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="mealAllow"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.mealAllow}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, mealAllow: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Other Allowance</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="otherAllow"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.otherAllow}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, otherAllow: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tax Deduction</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="taxDeduction"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.taxDeduction}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, taxDeduction: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Insurance Deduction</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="insuranceDed"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.insuranceDed}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, insuranceDed: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Other Deduction</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="otherDed"
                      type="number"
                      min="0"
                      step="0.01"
                      value={payslipFormData.otherDed}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, otherDed: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="currency"
                      value={payslipFormData.currency}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="NPR">NPR</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Send Email</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 transition-colors focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/12"
                      name="sendEmail"
                      value={payslipFormData.sendEmail ? 'true' : 'false'}
                      onChange={(e) => setPayslipFormData(prev => ({ ...prev, sendEmail: e.target.value === 'true' }))}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-5 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={() => setShowPayslipFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all" disabled={generatingPayslip}>
                  {generatingPayslip ? 'Generating...' : 'Generate Payslip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
