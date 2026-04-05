"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Package, DollarSign, Calendar, MapPin, User, AlertCircle, Loader2 } from "lucide-react"

const INVENTORY_CATEGORIES = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "UTILITY", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAINING", label: "Training" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SOFTWARE", label: "Software" },
  { value: "LICENSES", label: "Licenses" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
]

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "BROKEN", label: "Broken" },
]

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "LOST", label: "Lost" },
  { value: "DISPOSED", label: "Disposed" },
]

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilograms" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
  { value: "sqm", label: "Square Meters" },
  { value: "boxes", label: "Boxes" },
  { value: "sets", label: "Sets" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
]

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
}

export default function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "FURNITURE",
    subcategory: "",
    sku: "",
    quantity: "1",
    unit: "pcs",
    location: "",
    purchaseDate: "",
    purchaseCost: "",
    currentValue: "",
    condition: "NEW",
    status: "AVAILABLE",
    supplier: "",
    warrantyExpiry: "",
    lastMaintenance: "",
    nextMaintenance: "",
    notes: "",
    imageUrl: "",
  })

  // Check if user can edit (ADMIN or COUNSELOR)
  const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'COUNSELOR'

  useEffect(() => {
    if (status === "authenticated" && !canEdit) {
      router.push("/inventory")
      return
    }

    if (status === "authenticated" && canEdit) {
      fetchInventoryItem()
    }
  }, [status, canEdit, params])

  const fetchInventoryItem = async () => {
    try {
      const { id } = await params
      const response = await fetch(`/api/inventory/${id}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory item")
      }

      const data = await response.json()
      setInventoryItem(data)
      
      // Auto-populate form with existing data
      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "FURNITURE",
        subcategory: data.subcategory || "",
        sku: data.sku || "",
        quantity: data.quantity?.toString() || "1",
        unit: data.unit || "pcs",
        location: data.location || "",
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : "",
        purchaseCost: data.purchaseCost?.toString() || "",
        currentValue: data.currentValue?.toString() || "",
        condition: data.condition || "NEW",
        status: data.status || "AVAILABLE",
        supplier: data.supplier || "",
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry).toISOString().split('T')[0] : "",
        lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance).toISOString().split('T')[0] : "",
        nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance).toISOString().split('T')[0] : "",
        notes: data.notes || "",
        imageUrl: data.imageUrl || "",
      })
    } catch (error) {
      console.error("Error fetching inventory item:", error)
      setError("Failed to load inventory item")
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canEdit) {
      setError("You don't have permission to edit inventory items")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { id } = await params
      
      // Convert numeric fields and handle empty strings
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity.toString()),
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiry: formData.warrantyExpiry || null,
        lastMaintenance: formData.lastMaintenance || null,
        nextMaintenance: formData.nextMaintenance || null,
        // Convert empty strings to null for optional fields
        description: formData.description || null,
        subcategory: formData.subcategory || null,
        sku: formData.sku || null,
        location: formData.location || null,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
        imageUrl: formData.imageUrl || null,
      }

      const response = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Validation error:", errorData)
        
        // Show detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: any) => detail.message).join(", ")
          throw new Error(`Validation failed: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || "Failed to update inventory item")
      }

      setSuccess("Inventory item updated successfully!")
      
      // Redirect back to inventory page after a short delay
      setTimeout(() => {
        router.push("/inventory")
      }, 1500)
      
    } catch (error: any) {
      console.error("Error updating inventory item:", error)
      setError(error.message || "Failed to update inventory item")
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory item...</p>
        </div>
      </div>
    )
  }

  if (error && !inventoryItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/inventory" className="text-blue-600 hover:text-blue-800">
            Back to Inventory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/inventory" 
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Inventory
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Inventory Item</h1>
            </div>
            {inventoryItem && (
              <div className="text-sm text-gray-500">
                SKU: {inventoryItem.sku || "No SKU"}
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU / Barcode
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
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
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
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
            </div>
          </div>

          {/* Quantity & Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Quantity & Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UNIT_OPTIONS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Office A, Shelf 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Cost
                  <span className="text-xs text-gray-500 ml-1">(per unit)</span>
                </label>
                <input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.quantity && formData.quantity !== "1" && formData.purchaseCost && (
                  <div className="text-xs text-gray-500 mt-1">
                    Total: ${(parseFloat(formData.purchaseCost) * parseInt(formData.quantity)).toFixed(2)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value
                  <span className="text-xs text-gray-500 ml-1">(per unit)</span>
                </label>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.quantity && formData.quantity !== "1" && formData.currentValue && (
                  <div className="text-xs text-gray-500 mt-1">
                    Total: ${(parseFloat(formData.currentValue) * parseInt(formData.quantity)).toFixed(2)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Condition & Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Condition & Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONDITION_OPTIONS.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Maintenance
                </label>
                <input
                  type="date"
                  name="lastMaintenance"
                  value={formData.lastMaintenance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Maintenance
                </label>
                <input
                  type="date"
                  name="nextMaintenance"
                  value={formData.nextMaintenance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Additional notes about this item..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/inventory"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
