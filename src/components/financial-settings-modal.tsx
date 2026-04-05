"use client"

import { useState, useEffect } from "react"
import { X, Settings, DollarSign, Calendar, AlertCircle } from "lucide-react"

interface FinancialSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FinancialSettingsModal({ isOpen, onClose, onSuccess }: FinancialSettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Form state
  const [consultancyFeePercent, setConsultancyFeePercent] = useState("10.0")
  const [tuitionFeeRange, setTuitionFeeRange] = useState("500000-1500000")
  const [paymentDueDays, setPaymentDueDays] = useState("30")
  const [lateFeePercent, setLateFeePercent] = useState("5.0")
  const [currency, setCurrency] = useState("JPY")

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/financial/settings")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setConsultancyFeePercent(data.consultancyFeePercent?.toString() || "10.0")
          setTuitionFeeRange(data.tuitionFeeRange || "500000-1500000")
          setPaymentDueDays(data.paymentDueDays?.toString() || "30")
          setLateFeePercent(data.lateFeePercent?.toString() || "5.0")
          setCurrency(data.currency || "JPY")
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Failed to load financial settings")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const settingsData = {
        consultancyFeePercent: parseFloat(consultancyFeePercent),
        tuitionFeeRange,
        paymentDueDays: parseInt(paymentDueDays),
        lateFeePercent: parseFloat(lateFeePercent),
        currency,
      }

      const response = await fetch("/api/financial/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      setSuccess("Financial settings updated successfully!")
      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess("")
      }, 1500)
    } catch (error) {
      console.error("Settings save error:", error)
      setError(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return ""
    
    const currencyMap: Record<string, string> = {
      JPY: 'ja-JP',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
    }
    
    try {
      return new Intl.NumberFormat(currencyMap[currency] || 'ja-JP', {
        style: 'currency',
        currency: currency,
      }).format(num)
    } catch {
      return `${currency} ${num.toLocaleString()}`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Financial Settings</h2>
            <p className="text-gray-600 mt-1">Configure consultancy financial parameters</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800">{success}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Consultancy Fee Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultancy Fee Percentage (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={consultancyFeePercent}
                  onChange={(e) => setConsultancyFeePercent(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Percentage charged as consultancy fee (typically 5-20% of tuition)
              </p>
            </div>

            {/* Tuition Fee Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuition Fee Range
              </label>
              <input
                type="text"
                value={tuitionFeeRange}
                onChange={(e) => setTuitionFeeRange(e.target.value)}
                placeholder="e.g., 500000-1500000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical tuition fee range in your currency (e.g., 500000-1500000)
              </p>
              {tuitionFeeRange.includes('-') && (
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Min: {formatCurrency(tuitionFeeRange.split('-')[0], currency)}</span>
                  <span>Max: {formatCurrency(tuitionFeeRange.split('-')[1], currency)}</span>
                </div>
              )}
            </div>

            {/* Payment Due Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reminder Days
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-sm text-gray-600">days before due date</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Send payment reminders this many days before due date
              </p>
            </div>

            {/* Late Fee Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee Percentage (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={lateFeePercent}
                  onChange={(e) => setLateFeePercent(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Late fee percentage applied to overdue payments
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Primary currency for all financial transactions
              </p>
            </div>
          </div>

          {/* Settings Preview */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">Settings Preview</h4>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Consultancy Fee:</strong> {consultancyFeePercent}% of tuition</p>
              <p><strong>Tuition Range:</strong> {tuitionFeeRange} {currency}</p>
              <p><strong>Payment Reminders:</strong> {paymentDueDays} days before due date</p>
              <p><strong>Late Fee:</strong> {lateFeePercent}% for overdue payments</p>
              <p><strong>Currency:</strong> {currency}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
