"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Calendar, User, AlertCircle } from "lucide-react"

interface EditTodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  todo: any // The todo to edit
  students: Array<{ id: string; name: string; email: string }>
  categories: Array<{ id: string; name: string; icon: string; color: string }>
}

interface TodoFormData {
  studentId: string
  categoryId: string
  title: string
  description: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE" | "BLOCKED"
  dueDate: string
  estimatedDays: string
  counselorNotes: string
  checklistItems: string[]
  helpfulLinks: string[]
}

export default function EditTodoModal({ isOpen, onClose, onSuccess, todo, students, categories }: EditTodoModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<TodoFormData>({
    studentId: "",
    categoryId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "",
    estimatedDays: "",
    counselorNotes: "",
    checklistItems: [""],
    helpfulLinks: [""]
  })

  useEffect(() => {
    if (isOpen && todo) {
      // Pre-fill form with todo data
      setFormData({
        studentId: todo.studentId || "",
        categoryId: todo.categoryId || "",
        title: todo.title || "",
        description: todo.description || "",
        priority: todo.priority || "MEDIUM",
        status: todo.status || "PENDING",
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : "",
        estimatedDays: todo.estimatedDays?.toString() || "",
        counselorNotes: todo.counselorNotes || "",
        checklistItems: todo.checklistItems?.map((item: any) => item.title) || [""],
        helpfulLinks: todo.helpfulLinks || [""]
      })
      setError("")
    }
  }, [isOpen, todo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.studentId || !formData.categoryId || !formData.title.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        studentId: formData.studentId,
        categoryId: formData.categoryId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        counselorNotes: formData.counselorNotes.trim() || null,
        checklistItems: formData.checklistItems.filter(item => item.trim()),
        helpfulLinks: formData.helpfulLinks.filter(link => link.trim())
      }

      const response = await fetch(`/api/student-todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update task")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating todo:", error)
      setError(error instanceof Error ? error.message : "Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof TodoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklistItems: [...prev.checklistItems, ""]
    }))
  }

  const updateChecklistItem = (index: number, value: string) => {
    setFormData(prev => {
      const items = [...prev.checklistItems]
      items[index] = value
      return { ...prev, checklistItems: items }
    })
  }

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((_, i) => i !== index)
    }))
  }

  const addHelpfulLink = () => {
    setFormData(prev => ({
      ...prev,
      helpfulLinks: [...prev.helpfulLinks, ""]
    }))
  }

  const updateHelpfulLink = (index: number, value: string) => {
    setFormData(prev => {
      const links = [...prev.helpfulLinks]
      links[index] = value
      return { ...prev, helpfulLinks: links }
    })
  }

  const removeHelpfulLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      helpfulLinks: prev.helpfulLinks.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => updateFormData("studentId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => updateFormData("categoryId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide detailed instructions for this task"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => updateFormData("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateFormData("dueDate", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Days
                </label>
                <input
                  type="number"
                  value={formData.estimatedDays}
                  onChange={(e) => updateFormData("estimatedDays", e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Days to complete"
                />
              </div>
            </div>
          </div>

          {/* Counselor Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Counselor Notes
            </label>
            <textarea
              value={formData.counselorNotes}
              onChange={(e) => updateFormData("counselorNotes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes for the student or internal notes"
            />
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Checklist Items
              </label>
              <button
                type="button"
                onClick={addChecklistItem}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.checklistItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Checklist item ${index + 1}`}
                  />
                  {formData.checklistItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Helpful Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Helpful Links
              </label>
              <button
                type="button"
                onClick={addHelpfulLink}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Link
              </button>
            </div>
            <div className="space-y-2">
              {formData.helpfulLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateHelpfulLink(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                  {formData.helpfulLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHelpfulLink(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
