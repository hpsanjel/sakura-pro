"use client"

import { useState, useRef } from "react"
import { X, DollarSign, CreditCard, Calendar, FileText, Upload, Camera, Receipt, AlertCircle, CheckCircle, Plus, Minus } from "lucide-react"

interface UnifiedPaymentModalProps {
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
  { value: "CASH", label: "Cash", icon: DollarSign, requiresTransferDetails: false },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: CreditCard, requiresTransferDetails: true },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard, requiresTransferDetails: false },
  { value: "ONLINE_PAYMENT", label: "Online Payment", icon: CreditCard, requiresTransferDetails: true },
  { value: "CHEQUE", label: "Cheque", icon: FileText, requiresTransferDetails: true },
  { value: "OTHER", label: "Other", icon: FileText, requiresTransferDetails: false },
]

export default function UnifiedPaymentModal({ isOpen, onClose, fee, onSuccess }: UnifiedPaymentModalProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("BANK_TRANSFER")
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [showReceiptSection, setShowReceiptSection] = useState(false)
  
  // Transfer details for bank transfers and online payments
  const [transferDetails, setTransferDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    transferDate: "",
    referenceNumber: "",
    fromAccount: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const remainingAmount = fee.amount - fee.paidAmount

  const selectedMethod = paymentMethods.find(pm => pm.value === method)
  const requiresTransferDetails = selectedMethod?.requiresTransferDetails || false

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
    
    // Show preview for first image file
    const imageFile = files.find(file => file.type.startsWith('image/'))
    if (imageFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (uploadedFiles.length === 1) {
      setReceiptPreview(null)
    }
  }

  const uploadToCloudinary = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('feeId', fee.id)
      formData.append('studentName', fee.student.name)
      
      try {
        const response = await fetch("/api/payments/upload-cloudinary", {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.url)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload receipt')
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error)
        throw new Error('Failed to upload receipt to cloud storage')
      }
    }
    
    return uploadedUrls
  }

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

      // Upload receipts to Cloudinary if available
      let receiptUrls: string[] = []
      if (uploadedFiles.length > 0) {
        receiptUrls = await uploadToCloudinary(uploadedFiles)
      }

      // Prepare payment data
      const paymentData: any = {
        feeId: fee.id,
        amount: paymentAmount,
        method,
        transactionId: transactionId || null,
        notes: notes || null,
        receiptUrls,
      }

      // Add transfer details if required
      if (requiresTransferDetails) {
        paymentData.transferDetails = {
          bankName: transferDetails.bankName || null,
          accountNumber: transferDetails.accountNumber || null,
          accountHolder: transferDetails.accountHolder || null,
          transferDate: transferDetails.transferDate ? new Date(transferDetails.transferDate).toISOString() : null,
          referenceNumber: transferDetails.referenceNumber || null,
          fromAccount: transferDetails.fromAccount || null,
        }
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process payment")
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAmount("")
    setMethod("BANK_TRANSFER")
    setTransactionId("")
    setNotes("")
    setUploadedFiles([])
    setReceiptPreview(null)
    setShowReceiptSection(false)
    setTransferDetails({
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      transferDate: "",
      referenceNumber: "",
      fromAccount: "",
    })
    setError("")
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
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-6">
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
                Transaction ID / Reference
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Transaction reference number"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Additional payment details or notes"
              />
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment Receipt</h3>
              <button
                type="button"
                onClick={() => setShowReceiptSection(!showReceiptSection)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {showReceiptSection ? (
                  <span className="flex items-center">
                    <Minus className="w-4 h-4 mr-1" />
                    Hide Receipt Upload
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Receipt (Optional)
                  </span>
                )}
              </button>
            </div>

            {showReceiptSection && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="w-12 h-12 text-gray-400" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Camera className="w-4 h-4 inline mr-2" />
                      Upload Receipt
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Images, PDF, or documents (Max 10MB per file)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Receipt Preview */}
            {receiptPreview && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Receipt Preview:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <img src={receiptPreview} alt="Receipt preview" className="w-full h-48 object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Transfer Details (for bank transfers, online payments, cheques) */}
          {requiresTransferDetails && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-4 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Transfer Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={transferDetails.bankName}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Tokyo Mitsubishi Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={transferDetails.accountNumber}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Recipient account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    value={transferDetails.accountHolder}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Recipient account holder name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    value={transferDetails.transferDate}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, transferDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={transferDetails.referenceNumber}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Bank reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Account
                  </label>
                  <input
                    type="text"
                    value={transferDetails.fromAccount}
                    onChange={(e) => setTransferDetails(prev => ({ ...prev, fromAccount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Sender account details"
                  />
                </div>
              </div>
            </div>
          )}

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
              {loading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
