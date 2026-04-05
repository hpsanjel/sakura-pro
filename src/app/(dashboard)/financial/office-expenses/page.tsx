"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Plus, Search, Filter, Calendar, Download, 
  Receipt, DollarSign, CreditCard, Building, Plane, Utensils, Smartphone, PiggyBank,
  Lock, RefreshCw, AlertCircle, MoreVertical, Home, Zap, Users, Megaphone, Briefcase, Wrench, Shield, GraduationCap,
  File
} from "lucide-react"

interface OfficeExpense {
  id: string
  title: string
  description?: string
  category: string
  amount: number
  expenseMode: string
  expenseDate: string
  receiptUrl?: string
  reference?: string
  notes?: string
  tags: string[]
  isRecurring: boolean
  recurringType?: string
  recurringEnd?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

interface ExpenseTemplate {
  id: string
  title: string
  description?: string
  category: string
  suggestedAmount?: number
  expenseMode: string
  isCommon: boolean
  isActive: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

const EXPENSE_CATEGORIES = [
  { value: "ALL", label: "All Categories", icon: DollarSign, color: "bg-gray-100 text-gray-800" },
  { value: "RENT", label: "Rent", icon: Building, color: "bg-purple-100 text-purple-800" },
  { value: "UTILITIES", label: "Utilities", icon: Zap, color: "bg-blue-100 text-blue-800" },
  { value: "SALARIES", label: "Salaries", icon: Users, color: "bg-green-100 text-green-800" },
  { value: "MARKETING", label: "Marketing", icon: Megaphone, color: "bg-pink-100 text-pink-800" },
  { value: "EQUIPMENT", label: "Equipment", icon: Briefcase, color: "bg-indigo-100 text-indigo-800" },
  { value: "SUPPLIES", label: "Supplies", icon: File, color: "bg-yellow-100 text-yellow-800" },
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench, color: "bg-orange-100 text-orange-800" },
  { value: "INSURANCE", label: "Insurance", icon: Shield, color: "bg-teal-100 text-teal-800" },
  { value: "LEGAL", label: "Legal", icon: File, color: "bg-red-100 text-red-800" },
  { value: "TRAINING", label: "Training", icon: GraduationCap, color: "bg-cyan-100 text-cyan-800" },
  { value: "TRAVEL", label: "Travel", icon: Plane, color: "bg-emerald-100 text-emerald-800" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: Utensils, color: "bg-violet-100 text-violet-800" },
  { value: "SUBSCRIPTIONS", label: "Subscriptions", icon: Smartphone, color: "bg-slate-100 text-slate-800" },
  { value: "BANKING", label: "Banking", icon: CreditCard, color: "bg-lime-100 text-lime-800" },
  { value: "TAX", label: "Tax", icon: PiggyBank, color: "bg-amber-100 text-amber-800" },
  { value: "MISCELLANEOUS", label: "Miscellaneous", icon: MoreVertical, color: "bg-gray-100 text-gray-800" },
]

const EXPENSE_MODES = [
  { value: "ALL", label: "All Modes" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
  { value: "OTHER", label: "Other" },
]

const CATEGORY_COLORS: Record<string, string> = {
  RENT: "bg-purple-100 text-purple-800",
  UTILITIES: "bg-blue-100 text-blue-800",
  SALARIES: "bg-green-100 text-green-800",
  MARKETING: "bg-pink-100 text-pink-800",
  EQUIPMENT: "bg-indigo-100 text-indigo-800",
  SUPPLIES: "bg-yellow-100 text-yellow-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  INSURANCE: "bg-teal-100 text-teal-800",
  LEGAL: "bg-red-100 text-red-800",
  TRAINING: "bg-cyan-100 text-cyan-800",
  TRAVEL: "bg-emerald-100 text-emerald-800",
  ENTERTAINMENT: "bg-violet-100 text-violet-800",
  SUBSCRIPTIONS: "bg-slate-100 text-slate-800",
  BANKING: "bg-lime-100 text-lime-800",
  TAX: "bg-amber-100 text-amber-800",
  MISCELLANEOUS: "bg-gray-100 text-gray-800",
}

const MODE_COLORS: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  BANK_TRANSFER: "bg-blue-100 text-blue-800",
  CREDIT_CARD: "bg-purple-100 text-purple-800",
  DEBIT_CARD: "bg-indigo-100 text-indigo-800",
  CHEQUE: "bg-orange-100 text-orange-800",
  ONLINE_PAYMENT: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export default function OfficeExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expenses, setExpenses] = useState<OfficeExpense[]>([])
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedMode, setSelectedMode] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MISCELLANEOUS",
    amount: "",
    expenseMode: "CASH",
    expenseDate: new Date().toISOString().split('T')[0],
    reference: "",
    notes: "",
    tags: [] as string[],
    isRecurring: false,
    recurringType: "MONTHLY",
    recurringEnd: "",
  })

  // Check if user can add expenses (ADMIN or COUNSELOR)
  const canAdd = session?.user?.role === 'ADMIN' || session?.user?.role === 'COUNSELOR'

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses()
      fetchTemplates()
    }
  }, [status, selectedCategory, selectedMode, searchQuery, startDate, endDate])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError("")
      
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      })
      
      if (selectedCategory !== "ALL") params.append("category", selectedCategory)
      if (selectedMode !== "ALL") params.append("expenseMode", selectedMode)
      if (searchQuery) params.append("search", searchQuery)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const response = await fetch(`/api/office-expenses?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch expenses")
      }

      const data = await response.json()
      setExpenses(data.expenses || [])
      
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setError("Failed to load expenses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/office-expenses/templates?isCommon=true")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }

      const data = await response.json()
      setTemplates(data.templates || [])
      
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === "checkbox") {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleTemplateSelect = (template: ExpenseTemplate) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description || "",
      category: template.category,
      amount: template.suggestedAmount?.toString() || "",
      expenseMode: template.expenseMode,
      tags: template.tags,
    }))
    setShowTemplates(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canAdd) {
      setError("You don't have permission to add expenses")
      return
    }

    setLoading(true)
    setError("")

    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        amount: parseFloat(formData.amount),
        expenseMode: formData.expenseMode,
        expenseDate: formData.expenseDate,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags,
        isRecurring: formData.isRecurring,
        recurringType: formData.recurringType,
      }

      // Only include recurringEnd if it's not empty
      if (formData.recurringEnd) {
        submitData.recurringEnd = formData.recurringEnd
      }

      const response = await fetch("/api/office-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        const errorMessage = errorData.details ? 
          `Validation failed: ${JSON.stringify(errorData.details)}` : 
          errorData.error || "Failed to create expense"
        throw new Error(errorMessage)
      }

      setShowAddModal(false)
      setFormData({
        title: "",
        description: "",
        category: "MISCELLANEOUS",
        amount: "",
        expenseMode: "CASH",
        expenseDate: new Date().toISOString().split('T')[0],
        reference: "",
        notes: "",
        tags: [],
        isRecurring: false,
        recurringType: "MONTHLY",
        recurringEnd: "",
      })
      
      await fetchExpenses()
      
    } catch (error: any) {
      console.error("Error creating expense:", error)
      setError(error.message || "Failed to create expense")
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expenseDate)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const getCategoryIcon = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category)
    return cat?.icon || DollarSign
  }

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800"
  }

  const getModeColor = (mode: string) => {
    return MODE_COLORS[mode] || "bg-gray-100 text-gray-800"
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading office expenses...</p>
        </div>
      </div>
    )
  }

  // Restrict access to ADMIN and COUNSELOR only
  if (status === "authenticated" && !['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to access office expenses.</p>
          <p className="text-gray-500 text-sm mt-2">This area is restricted to administrators and counselors only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Office Expenses</h1>
              <p className="text-gray-600 mt-1">Track and manage office expenses</p>
            </div>
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">${thisMonthExpenses.toFixed(2)}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== "ALL" || selectedMode !== "ALL" || startDate || endDate
                  ? "Try adjusting your filters"
                  : "Start by adding your first expense"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => {
                    const CategoryIcon = getCategoryIcon(expense.category)
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                          {expense.description && (
                            <div className="text-xs text-gray-500">{expense.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {expense.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">${expense.amount.toFixed(2)}</div>
                          {expense.isRecurring && (
                            <div className="text-xs text-gray-500">Recurring</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getModeColor(expense.expenseMode)}`}>
                            {expense.expenseMode.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {expense.tags.map((tag, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {expense.receiptUrl && (
                              <button className="text-blue-600 hover:text-blue-800">
                                <Receipt className="w-4 h-4" />
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-800">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Add Office Expense</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                {/* Quick Templates */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Quick Templates</label>
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {showTemplates ? "Hide" : "Show"} Templates
                    </button>
                  </div>
                  
                  {showTemplates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {templates.map((template) => {
                        const CategoryIcon = getCategoryIcon(template.category)
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                          >
                            <CategoryIcon className="w-4 h-4 mr-2 text-gray-600" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{template.title}</div>
                              <div className="text-xs text-gray-500">
                                {template.category} • ${template.suggestedAmount || 0}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EXPENSE_CATEGORIES.filter(cat => cat.value !== "ALL").map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode *
                    </label>
                    <select
                      name="expenseMode"
                      value={formData.expenseMode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EXPENSE_MODES.filter(mode => mode.value !== "ALL").map(mode => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleInputChange}
                      placeholder="Bill number, receipt ID..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                        Recurring Expense
                      </label>
                    </div>
                  </div>

                  {formData.isRecurring && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurring Type
                        </label>
                        <select
                          name="recurringType"
                          value={formData.recurringType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurring End Date
                        </label>
                        <input
                          type="date"
                          name="recurringEnd"
                          value={formData.recurringEnd}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
