"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Receipt
} from "lucide-react"
import FeeModal from "@/components/fee-modal"
import UnifiedPaymentModal from "@/components/unified-payment-modal"
import EditPaymentModal from "@/components/edit-payment-modal"
import FinancialSettingsModal from "@/components/financial-settings-modal"

interface Fee {
  id: string
  studentId: string
  type: string
  title: string
  description?: string
  amount: number
  dueDate: string
  paidAmount: number
  status: string
  createdAt: string
  student: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  payments: Payment[]
  _count: {
    payments: number
  }
}

interface Payment {
  id: string
  feeId: string
  amount: number
  paymentDate: string
  method: string
  status: string
  transactionId?: string
  notes?: string
  fee: {
    id: string
    title: string
    amount: number
    paidAmount: number
    student: {
      id: string
      name: string
      email?: string
      phone?: string
    }
  }
}

interface FinancialSummary {
  overview: {
    totalFees: number
    totalPaid: number
    totalOutstanding: number
    totalFeesCount: number
    upcomingPaymentsCount: number
    overduePaymentsCount: number
  }
  feesByType: Record<string, { totalAmount: number; totalPaid: number; count: number }>
  feesByStatus: Record<string, { totalAmount: number; count: number }>
  paymentsByMethod: Record<string, { totalAmount: number; count: number }>
  upcomingPayments: Fee[]
  overduePayments: Fee[]
}

const feeTypeConfig = {
  TUITION: { label: "Tuition Fee", color: "bg-blue-500", icon: FileText },
  CONSULTANCY: { label: "Consultancy Fee", color: "bg-purple-500", icon: Users },
  APPLICATION: { label: "Application Fee", color: "bg-green-500", icon: FileText },
  VISA: { label: "Visa Fee", color: "bg-orange-500", icon: CreditCard },
  ACCOMMODATION: { label: "Accommodation", color: "bg-teal-500", icon: Settings },
  OTHER: { label: "Other", color: "bg-gray-500", icon: FileText },
}

const paymentStatusConfig = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  PARTIAL: { label: "Partial", color: "bg-blue-500", icon: Clock },
  PAID: { label: "Paid", color: "bg-green-500", icon: CheckCircle },
  OVERDUE: { label: "Overdue", color: "bg-red-500", icon: AlertCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: AlertCircle },
  REFUNDED: { label: "Refunded", color: "bg-purple-500", icon: ArrowDownRight },
}

const paymentMethodConfig = {
  CASH: { label: "Cash", color: "bg-green-500" },
  BANK_TRANSFER: { label: "Bank Transfer", color: "bg-blue-500" },
  CREDIT_CARD: { label: "Credit Card", color: "bg-purple-500" },
  ONLINE_PAYMENT: { label: "Online Payment", color: "bg-orange-500" },
  CHEQUE: { label: "Cheque", color: "bg-teal-500" },
  OTHER: { label: "Other", color: "bg-gray-500" },
}

export default function FinancialPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [fees, setFees] = useState<Fee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "fees" | "payments" | "upcoming" | "overdue" | "office-expenses">("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterType, setFilterType] = useState("")
  const [error, setError] = useState("")
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const allTabs = ["overview", "fees", "payments", "upcoming", "overdue", "office-expenses"] as const
    const availableTabs = allTabs.filter(tab => {
      // Hide office-expenses tab from students
      if (tab === "office-expenses") {
        const canAccess = ['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '')
        console.log('Office Expenses tab access check:', {
          userRole: session?.user?.role,
          canAccess,
          tab
        })
        return canAccess
      }
      return true
    })
    console.log('Available tabs:', availableTabs)
    return availableTabs
  }
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchFinancialData()
    }
  }, [status])

  // Reset active tab if it's not available for current user role
  useEffect(() => {
    if (status === "authenticated") {
      const availableTabs = getAvailableTabs()
      if (!availableTabs.includes(activeTab)) {
        setActiveTab("overview")
      }
    }
  }, [status, activeTab])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch financial summary
      const summaryResponse = await fetch("/api/financial/summary")
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData)
      }

      // Fetch fees with student information
      const feesResponse = await fetch("/api/fees")
      if (feesResponse.ok) {
        const feesData = await feesResponse.json()
        setFees(feesData)
      }

      // Fetch payments with detailed information
      const paymentsResponse = await fetch("/api/payments")
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData)
      }
    } catch (error) {
      console.error("Error fetching financial data:", error)
      setError("Failed to load financial data")
    } finally {
      setLoading(false)
    }
  }

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || fee.status === filterStatus
    const matchesType = !filterType || fee.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.fee.student.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleCreateFee = () => {
    setSelectedFee(null)
    setShowFeeModal(true)
  }

  const handleEditFee = (fee: Fee) => {
    setSelectedFee(fee)
    setShowFeeModal(true)
  }

  const handleRecordPayment = (fee: Fee) => {
    setSelectedFee(fee)
    setShowPaymentModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowEditPaymentModal(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment? This will update the fee status accordingly.")) {
      return
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete payment")
      }

      fetchFinancialData()
    } catch (error) {
      console.error("Delete payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to delete payment")
    }
  }

  const handleDeleteFee = async (feeId: string) => {
    if (!confirm("Are you sure you want to delete this fee? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/fees/${feeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete fee")
      }

      fetchFinancialData()
    } catch (error) {
      console.error("Delete fee error:", error)
      setError(error instanceof Error ? error.message : "Failed to delete fee")
    }
  }

  const handleOpenSettings = () => {
    setShowSettingsModal(true)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const isAdminOrCounselor = session?.user?.role === "ADMIN" || session?.user?.role === "COUNSELOR"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAdminOrCounselor && (
                <button
                  onClick={handleCreateFee}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Fee
                </button>
              )}
              {session?.user?.role === "ADMIN" && (
                <button
                  onClick={handleOpenSettings}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              )}
              <Link
                href="/financial/reports"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {getAvailableTabs().map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "office-expenses" ? "Office Expenses" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "upcoming" && summary && summary.overview && summary.overview.upcomingPaymentsCount > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    {summary.overview.upcomingPaymentsCount}
                  </span>
                )}
                {tab === "overdue" && summary && summary.overview && summary.overview.overduePaymentsCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {summary.overview.overduePaymentsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && summary && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Fees</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.overview.totalFees)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.overview.totalPaid)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Outstanding</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.overview.totalOutstanding)}</p>
                  </div>
                </div>
              </div>
              
              {/* Office Expenses Card - Only for ADMIN and COUNSELOR */}
              {['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '') && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Receipt className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Office Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency((summary.overview as any)?.totalExpenses || 0)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Number of Fees</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.overview.totalFeesCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fees by Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees by Type</h3>
                <div className="space-y-3">
                  {Object.entries(summary.feesByType).map(([type, data]) => {
                    const config = feeTypeConfig[type as keyof typeof feeTypeConfig]
                    const percentage = summary.overview.totalFees > 0 ? (data.totalAmount / summary.overview.totalFees) * 100 : 0
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${config.color} mr-2`}></div>
                          <span className="text-sm font-medium text-gray-700">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(data.totalAmount)}</p>
                          <p className="text-xs text-gray-500">{data.count} fees</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === "fees" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search fees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(paymentStatusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  {Object.entries(feeTypeConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fees List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFees.map((fee) => {
                      const typeConfig = feeTypeConfig[fee.type as keyof typeof feeTypeConfig]
                      const statusConfig = paymentStatusConfig[fee.status as keyof typeof paymentStatusConfig]
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <tr key={fee.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{fee.student.name}</div>
                              <div className="text-sm text-gray-500">{fee.student.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{fee.title}</div>
                              <div className="text-sm text-gray-500">{typeConfig.label}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(fee.amount)}</div>
                              <div className="text-sm text-gray-500">Paid: {formatCurrency(fee.paidAmount)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(fee.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} text-white`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              {isAdminOrCounselor && (
                                <>
                                  <button 
                                    onClick={() => handleEditFee(fee)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleRecordPayment(fee)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Record Payment"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                  {session?.user?.role === "ADMIN" && (
                                    <button 
                                      onClick={() => handleDeleteFee(fee.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly... */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            
            {payments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group payments by student */}
                {(() => {
                  const paymentsByStudent = payments.reduce((acc, payment) => {
                    const studentName = payment.fee.student.name
                    if (!acc[studentName]) {
                      acc[studentName] = {
                        student: payment.fee.student,
                        payments: []
                      }
                    }
                    acc[studentName].payments.push(payment)
                    return acc
                  }, {} as Record<string, { student: any, payments: any[] }>)

                  return Object.entries(paymentsByStudent).map(([studentName, studentData]) => (
                    <div key={studentName} className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Student Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{studentName}</h4>
                            <p className="text-sm text-gray-600">{studentData.student.email || 'No email'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total Payments</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(studentData.payments.reduce((sum, p) => sum + p.amount, 0))}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment List */}
                      <div className="divide-y divide-gray-200">
                        {studentData.payments.map((payment) => (
                          <div key={payment.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-medium text-gray-900">{payment.fee.title}</h5>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {payment.status}
                                  </span>
                                  {isAdminOrCounselor && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleEditPayment(payment)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Edit Payment"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      {session?.user?.role === "ADMIN" && (
                                        <button
                                          onClick={() => handleDeletePayment(payment.id)}
                                          className="text-red-600 hover:text-red-900"
                                          title="Delete Payment"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>
                                    <p><strong>Amount:</strong> {formatCurrency(payment.amount)}</p>
                                    <p><strong>Method:</strong> {payment.method.replace('_', ' ')}</p>
                                    <p><strong>Date:</strong> {formatDate(payment.paymentDate)}</p>
                                  </div>
                                  <div>
                                    <p><strong>Transaction ID:</strong> {payment.transactionId || 'N/A'}</p>
                                    <p><strong>Received By:</strong> {payment.receivedBy || 'System'}</p>
                                    <p><strong>Fee Type:</strong> {payment.fee.type.replace('_', ' ')}</p>
                                  </div>
                                </div>

                                {/* Payment Notes */}
                                {payment.notes && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded">
                                    <p className="text-sm text-gray-700">
                                      <strong>Notes:</strong> {payment.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Transfer Details */}
                                {payment.transferDetails && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded">
                                    <p className="text-sm font-medium text-blue-900 mb-2">Transfer Details:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                                      {payment.transferDetails.bankName && (
                                        <p><strong>Bank:</strong> {payment.transferDetails.bankName}</p>
                                      )}
                                      {payment.transferDetails.accountNumber && (
                                        <p><strong>Account:</strong> {payment.transferDetails.accountNumber}</p>
                                      )}
                                      {payment.transferDetails.accountHolder && (
                                        <p><strong>Holder:</strong> {payment.transferDetails.accountHolder}</p>
                                      )}
                                      {payment.transferDetails.transferDate && (
                                        <p><strong>Transfer Date:</strong> {formatDate(payment.transferDetails.transferDate)}</p>
                                      )}
                                      {payment.transferDetails.referenceNumber && (
                                        <p><strong>Reference:</strong> {payment.transferDetails.referenceNumber}</p>
                                      )}
                                      {payment.transferDetails.fromAccount && (
                                        <p><strong>From:</strong> {payment.transferDetails.fromAccount}</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Receipt Attachments */}
                                {payment.receiptUrls && payment.receiptUrls.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Receipts:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {payment.receiptUrls.map((url: string, index: number) => (
                                        <a
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 transition-colors"
                                        >
                                          <FileText className="w-4 h-4 mr-1" />
                                          Receipt {index + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="ml-4 text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "upcoming" && summary && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Payments</h3>
            {summary.upcomingPayments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming payments in the next 30 days</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summary.upcomingPayments.map((fee) => {
                        const typeConfig = feeTypeConfig[fee.type as keyof typeof feeTypeConfig]
                        const statusConfig = paymentStatusConfig[fee.status as keyof typeof paymentStatusConfig]
                        const remainingAmount = fee.amount - fee.paidAmount
                        const paymentProgress = fee.amount > 0 ? (fee.paidAmount / fee.amount) * 100 : 0

                        return (
                          <tr key={fee.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{fee.student.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{fee.title}</div>
                              <div className="text-sm text-gray-500">{typeConfig.label}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span>{formatCurrency(fee.amount)}</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-green-600 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={fee.paidAmount > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                                {formatCurrency(fee.paidAmount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${
                                remainingAmount === 0 ? "text-green-600" :
                                remainingAmount > 0 ? "text-orange-600" : "text-gray-900"
                              }`}>
                                {formatCurrency(remainingAmount)}
                              </span>
                              {fee.paidAmount > 0 && remainingAmount > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {paymentProgress.toFixed(1)}% paid
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(fee.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} text-white`}>
                                {statusConfig.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "overdue" && summary && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Payments</h3>
            {summary.overduePayments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">No overdue payments</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Overdue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summary.overduePayments.map((fee) => {
                        const typeConfig = feeTypeConfig[fee.type as keyof typeof feeTypeConfig]
                        const daysOverdue = Math.ceil((new Date().getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                        const remainingAmount = fee.amount - fee.paidAmount
                        const paymentProgress = fee.amount > 0 ? (fee.paidAmount / fee.amount) * 100 : 0

                        return (
                          <tr key={fee.id} className="bg-red-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{fee.student.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{fee.title}</div>
                              <div className="text-sm text-gray-500">{typeConfig.label}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex flex-col">
                                <span>{formatCurrency(fee.amount)}</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-green-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={fee.paidAmount > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                                {formatCurrency(fee.paidAmount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-bold ${
                                remainingAmount === 0 ? "text-green-600" : 
                                remainingAmount > 0 ? "text-red-600" : "text-gray-900"
                              }`}>
                                {formatCurrency(remainingAmount)}
                              </span>
                              {fee.paidAmount > 0 && remainingAmount > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {paymentProgress.toFixed(1)}% paid
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatDate(fee.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {daysOverdue} days
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Office Expenses Tab */}
        {activeTab === "office-expenses" && ['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Office Expenses</h3>
              <Link
                href="/financial/office-expenses"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Expenses
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Office Expenses Management</h4>
              <p className="text-gray-600 mb-4">
                Track and manage all office expenses including utilities, supplies, and operational costs.
              </p>
              <Link
                href="/financial/office-expenses"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Office Expenses
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Fee Modal */}
      <FeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        fee={selectedFee}
        onSuccess={() => {
          fetchFinancialData()
          setShowFeeModal(false)
        }}
      />

      {/* Unified Payment Modal */}
      {selectedFee && (
        <UnifiedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          fee={{
            id: selectedFee.id,
            title: selectedFee.title,
            amount: selectedFee.amount,
            paidAmount: selectedFee.paidAmount,
            student: selectedFee.student,
          }}
          onSuccess={() => {
            fetchFinancialData()
            setShowPaymentModal(false)
          }}
        />
      )}

      {/* Edit Payment Modal */}
      {selectedPayment && (
        <EditPaymentModal
          isOpen={showEditPaymentModal}
          onClose={() => setShowEditPaymentModal(false)}
          payment={{
            ...selectedPayment,
            fee: {
              id: selectedPayment.feeId || '',
              title: selectedPayment.fee?.title || 'Unknown Fee',
              amount: selectedPayment.fee?.amount || 0,
              paidAmount: selectedPayment.fee?.paidAmount || 0,
              student: {
                name: selectedPayment.fee?.student?.name || 'Unknown Student',
                email: selectedPayment.fee?.student?.email,
              }
            }
          }}
          onSuccess={() => {
            fetchFinancialData()
            setShowEditPaymentModal(false)
          }}
        />
      )}

      {/* Financial Settings Modal */}
      <FinancialSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSuccess={() => {
          fetchFinancialData()
          setShowSettingsModal(false)
        }}
      />
    </div>
  )
}
