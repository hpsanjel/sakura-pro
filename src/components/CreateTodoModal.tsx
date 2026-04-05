"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Calendar, User, AlertCircle, Sparkles } from "lucide-react"
import { TASK_CATEGORIES, TASK_TEMPLATES, getTasksByCategory, getTaskTemplate } from "@/lib/taskTemplates"

interface CreateTodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  students: Array<{ id: string; name: string; email: string; intake?: string }>
  categories: Array<{ id: string; name: string; icon: string; color: string }>
}

interface TodoFormData {
  studentIds: string[]
  categoryId: string
  templateId: string
  title: string
  description: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: string
  estimatedDays: string
  counselorNotes: string
  checklistItems: string[]
  helpfulLinks: string[]
}

export default function CreateTodoModal({ isOpen, onClose, onSuccess, students, categories }: CreateTodoModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [useTemplate, setUseTemplate] = useState(true)
  const [availableTemplates, setAvailableTemplates] = useState(TASK_TEMPLATES)
  const [formData, setFormData] = useState<TodoFormData>({
    studentIds: [],
    categoryId: "",
    templateId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    estimatedDays: "",
    counselorNotes: "",
    checklistItems: [""],
    helpfulLinks: [""]
  })

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens and auto-select first category
      const firstCategoryId = categories.length > 0 ? categories[0].id : ""
      setFormData({
        studentIds: [],
        categoryId: firstCategoryId,
        templateId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        estimatedDays: "",
        counselorNotes: "",
        checklistItems: [""],
        helpfulLinks: [""]
      })
      setUseTemplate(true)
      setError("")
    }
  }, [isOpen, categories])

  // Update available templates when category changes
  useEffect(() => {
    if (formData.categoryId) {
      // Map database category names to hardcoded template category IDs
      const categoryMapping: Record<string, string> = {
        "Accommodation": "accommodation",
        "Application Documents": "application_docs", 
        "Communication": "communication",
        "Financial Documents": "financial_docs",
        "Health & Medical": "health_medical",
        "Language Preparation": "language_preparation",
        "Pre-Departure": "pre_departure",
        "Visa Preparation": "visa_preparation"
      }
      
      // Find the category from the categories prop
      const selectedCategory = categories.find(c => c.id === formData.categoryId)
      if (selectedCategory) {
        const templateCategoryId = categoryMapping[selectedCategory.name]
        if (templateCategoryId) {
          const templates = getTasksByCategory(templateCategoryId)
          setAvailableTemplates(templates)
        } else {
          setAvailableTemplates([])
        }
      } else {
        setAvailableTemplates([])
      }
      
      // Reset template selection
      setFormData(prev => ({ ...prev, templateId: "" }))
    } else {
      setAvailableTemplates(TASK_TEMPLATES)
    }
  }, [formData.categoryId, categories])

  // Auto-populate form when template is selected
  useEffect(() => {
    if (formData.templateId && useTemplate) {
      const template = getTaskTemplate(formData.templateId)
      if (template) {
        setFormData(prev => ({
          ...prev,
          title: template.title,
          description: template.description,
          priority: template.priority,
          estimatedDays: template.estimatedDays?.toString() || "",
          counselorNotes: template.counselorNotes || "",
          checklistItems: template.checklistItems.length > 0 ? template.checklistItems : [""],
          helpfulLinks: template.helpfulLinks || [""]
        }))
      }
    }
  }, [formData.templateId, useTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.studentIds.length || !formData.title.trim()) {
      setError("Please select students and enter a task title")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create tasks for each selected student
      const taskPromises = formData.studentIds.map(studentId => {
        const payload = {
          studentId,
          categoryId: formData.categoryId, // Use the selected category (auto-selected first one)
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
          counselorNotes: formData.counselorNotes.trim() || null,
          checklistItems: formData.checklistItems.filter(item => item.trim()),
          helpfulLinks: formData.helpfulLinks.filter(link => link.trim())
        }

        return fetch("/api/student-todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      })

      const results = await Promise.all(taskPromises)
      
      // Check each response for errors
      for (let i = 0; i < results.length; i++) {
        const response = results[i]
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Task ${i} failed:`, response.status, errorText)
        }
      }
      
      // Check if all requests were successful
      const hasErrors = results.some(response => !response.ok)
      if (hasErrors) {
        console.log("Some tasks failed to create")
        throw new Error("Failed to create some tasks")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating todo:", error)
      setError(error instanceof Error ? error.message : "Failed to create task")
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
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create New Task
            </h2>
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

          {/* Template Options */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-purple-900">Quick Task Creation</h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="useTemplate"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="useTemplate" className="text-sm text-purple-800">
                Use predefined task templates for faster creation
              </label>
            </div>
          </div>

          {/* Template Selection */}
          {useTemplate && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Task Template</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateFormData("categoryId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {formData.categoryId && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const selectedCategory = categories.find(c => c.id === formData.categoryId)
                        if (!selectedCategory) return "0 templates available"
                        
                        const categoryMapping: Record<string, string> = {
                          "Accommodation": "accommodation",
                          "Application Documents": "application_docs", 
                          "Communication": "communication",
                          "Financial Documents": "financial_docs",
                          "Health & Medical": "health_medical",
                          "Language Preparation": "language_preparation",
                          "Pre-Departure": "pre_departure",
                          "Visa Preparation": "visa_preparation"
                        }
                        
                        const templateCategoryId = categoryMapping[selectedCategory.name]
                        const templates = templateCategoryId ? getTasksByCategory(templateCategoryId) : []
                        return `${templates.length} templates available`
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Template
                  </label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => updateFormData("templateId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={!formData.categoryId}
                  >
                    <option value="">Select a template</option>
                    {availableTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  {formData.templateId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Template will auto-fill the form below
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Students <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => updateFormData("studentIds", students.map(s => s.id))}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Select All ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormData("studentIds", [])}
                    className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {students.length === 0 ? (
                    <p className="text-gray-500 text-sm">No students available</p>
                  ) : (
                    <div className="space-y-2">
                      {students.map(student => (
                        <label key={student.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.studentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateFormData("studentIds", [...formData.studentIds, student.id])
                              } else {
                                updateFormData("studentIds", formData.studentIds.filter(id => id !== student.id))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {student.email}
                              {student.intake && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {student.intake}
                                </span>
                              )}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.studentIds.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.studentIds.length} student{formData.studentIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

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
              {formData.templateId && (
                <p className="text-xs text-purple-600 mt-1">
                  Auto-filled from template
                </p>
              )}
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
              {formData.templateId && (
                <p className="text-xs text-purple-600 mt-1">
                  Auto-filled from template
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {formData.templateId && (
                  <p className="text-xs text-purple-600 mt-1">
                    Auto-filled from template
                  </p>
                )}
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
            {formData.templateId && (
              <p className="text-xs text-purple-600 mt-1">
                Auto-filled from template
              </p>
            )}
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
            {formData.templateId && (
              <p className="text-xs text-purple-600 mt-2">
                Auto-filled from template
              </p>
            )}
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
            {formData.templateId && (
              <p className="text-xs text-purple-600 mt-2">
                Auto-filled from template
              </p>
            )}
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
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : `Create Task${formData.studentIds.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
