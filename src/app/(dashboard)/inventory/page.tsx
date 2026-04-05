"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, Package, 
  DollarSign, AlertCircle, TrendingUp, TrendingDown, 
  MoreVertical, Download, RefreshCw 
} from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sku?: string
  quantity: number
  unit: string
  location?: string
  purchaseDate?: string
  purchaseCost?: number
  currentValue?: number
  condition: string
  status: string
  supplier?: string
  warrantyExpiry?: string
  lastMaintenance?: string
  nextMaintenance?: string
  notes?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  transactions: any[]
  _count: {
    transactions: number
  }
}

interface InventorySummary {
  category: string
  status: string
  _sum: {
    quantity: number | null
    purchaseCost: number | null
    currentValue: number | null
  }
  _count: {
    id: number
  }
}

const INVENTORY_CATEGORIES = [
  { value: "ALL", label: "All Categories", icon: Package },
  { value: "FURNITURE", label: "Furniture", icon: Package },
  { value: "ELECTRONICS", label: "Electronics", icon: Package },
  { value: "STATIONERY", label: "Stationery", icon: Package },
  { value: "EQUIPMENT", label: "Equipment", icon: Package },
  { value: "SUPPLIES", label: "Supplies", icon: Package },
  { value: "MAINTENANCE", label: "Maintenance", icon: Package },
  { value: "UTILITY", label: "Utilities", icon: Package },
  { value: "RENT", label: "Rent", icon: Package },
  { value: "MARKETING", label: "Marketing", icon: Package },
  { value: "TRAINING", label: "Training", icon: Package },
  { value: "TRANSPORT", label: "Transport", icon: Package },
  { value: "SOFTWARE", label: "Software", icon: Package },
  { value: "LICENSES", label: "Licenses", icon: Package },
  { value: "INSURANCE", label: "Insurance", icon: Package },
  { value: "OTHER", label: "Other", icon: Package },
]

const INVENTORY_STATUS = [
  { value: "ALL", label: "All Status" },
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "LOST", label: "Lost" },
  { value: "DISPOSED", label: "Disposed" },
]

const CONDITION_COLORS = {
  NEW: "bg-green-100 text-green-800",
  GOOD: "bg-blue-100 text-blue-800",
  FAIR: "bg-yellow-100 text-yellow-800",
  POOR: "bg-orange-100 text-orange-800",
  DAMAGED: "bg-red-100 text-red-800",
  BROKEN: "bg-red-200 text-red-900",
}

const STATUS_COLORS = {
  AVAILABLE: "bg-green-100 text-green-800",
  IN_USE: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  RETIRED: "bg-gray-100 text-gray-800",
  LOST: "bg-red-100 text-red-800",
  DISPOSED: "bg-red-200 text-red-900",
}

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchInventory()
    }
  }, [status, router, currentPage, selectedCategory, selectedStatus, searchQuery])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError("")
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })
      
      if (selectedCategory !== "ALL") params.append("category", selectedCategory)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`/api/inventory?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch inventory")
      }
      
      const data = await response.json()
      setInventory(data.inventory)
      setSummary(data.summary || [])
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      setError(error instanceof Error ? error.message : "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete inventory item")
      }
      
      fetchInventory()
    } catch (error) {
      console.error("Error deleting inventory item:", error)
      alert(error instanceof Error ? error.message : "Failed to delete inventory item")
    }
  }

  const calculateTotalValue = () => {
    return summary.reduce((total, item) => total + (item._sum.currentValue || 0), 0)
  }

  const calculateTotalItems = () => {
    return summary.reduce((total, item) => total + (item._sum.quantity || 0), 0)
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-900 mb-4">Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const isAdmin = session?.user?.role === 'ADMIN'
  const canEdit = isAdmin || session?.user?.role === 'COUNSELOR'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
            <p className="text-blue-100">Track office furniture, equipment, and consultancy expenditures</p>
          </div>
          {canEdit && (
            <Link
              href="/inventory/add"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{inventory.length}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Items</h3>
          <p className="text-sm text-gray-500">Unique inventory items</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{calculateTotalItems()}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Quantity</h3>
          <p className="text-sm text-gray-500">All items combined</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">
              ${calculateTotalValue().toFixed(2)}
            </span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Value</h3>
          <p className="text-sm text-gray-500">Current inventory value</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">
              {inventory.filter(item => item.status === "MAINTENANCE").length}
            </span>
          </div>
          <h3 className="text-gray-600 font-medium">Maintenance</h3>
          <p className="text-sm text-gray-500">Items needing attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {INVENTORY_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {INVENTORY_STATUS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">No inventory items found</p>
                    <p className="text-sm mb-4">Get started by adding your first inventory item</p>
                    {canEdit && (
                      <Link
                        href="/inventory/add"
                        className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Item
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                        )}
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.category}</div>
                      {item.subcategory && (
                        <div className="text-xs text-gray-500">{item.subcategory}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.currentValue ? (
                          <>
                            ${item.currentValue.toFixed(2)}
                            {item.quantity > 1 && (
                              <span className="text-xs text-gray-500 ml-1">
                                (${(item.currentValue * item.quantity).toFixed(2)} total)
                              </span>
                            )}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                      {item.purchaseCost && (
                        <div className="text-xs text-gray-500">
                          Paid: ${item.purchaseCost.toFixed(2)}
                          {item.quantity > 1 && (
                            <span className="ml-1">
                              (${(item.purchaseCost * item.quantity).toFixed(2)} total)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${CONDITION_COLORS[item.condition as keyof typeof CONDITION_COLORS]}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.location || "Not specified"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canEdit && (
                          <>
                            <Link
                              href={`/inventory/${item.id}/edit`}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, inventory.length)} of {inventory.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
