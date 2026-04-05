"use client"

import { useState } from "react"
import { X, DollarSign, CreditCard, Calendar, FileText } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  fee: {
    id: string
    title: string
    amount: number
    paidAmount: number
    student: {
      name: string
      email?: string
    }
  }
  onSuccess: () => void
}

const paymentMethods = [
  { value: "CASH", label: "Cash", icon: DollarSign },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: CreditCard },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
  { value: "ONLINE_PAYMENT", label: "Online Payment", icon: CreditCard },
  { value: "CHEQUE", label: "Cheque", icon: FileText },
  { value: "OTHER", label: "Other", icon: FileText },
]

export default function PaymentModal({ isOpen, onClose, fee, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("CASH")
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const remainingAmount = fee.amount - fee.paidAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const paymentAmount = parseFloat(amount)
      
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        setError("Please enter a valid amount")
        return
      }

      if (paymentAmount > remainingAmount) {
        setError(`Amount cannot exceed remaining balance of ¥${remainingAmount.toLocaleString()}`)
        return
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feeId: fee.id,
          amount: paymentAmount,
          method,
          transactionId: transactionId || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process payment")
      }

      onSuccess()
      onClose()
      // Reset form
      setAmount("")
      setMethod("CASH")
      setTransactionId("")
      setNotes("")
    } catch (error) {
      console.error("Payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-gray-600 mt-1">{fee.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Fee Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Student</span>
            <span className="text-sm font-medium text-gray-900">{fee.student.name}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Amount</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(fee.amount)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Already Paid</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(fee.paidAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Remaining</span>
            <span className="text-lg font-bold text-indigo-600">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Maximum: {formatCurrency(remainingAmount)}</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional transaction reference"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional payment notes"
              />
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
              disabled={loading || !amount}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
