"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, Edit, Save, AlertCircle, Sparkles } from "lucide-react"
import { TASK_CATEGORIES, TASK_TEMPLATES, TaskTemplate } from "@/lib/taskTemplates"

interface TemplateManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function TemplateManagerModal({ isOpen, onClose, onSuccess }: TemplateManagerModalProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<Partial<TaskTemplate>>({
    categoryId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    estimatedDays: 3,
    checklistItems: [""],
    helpfulLinks: [""],
    counselorNotes: ""
  })

  useEffect(() => {
    if (isOpen) {
      setTemplates(TASK_TEMPLATES)
      setError("")
      setEditingTemplate(null)
      setIsCreating(false)
    }
  }, [isOpen])

  const startCreate = () => {
    setFormData({
      categoryId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      estimatedDays: 3,
      checklistItems: [""],
      helpfulLinks: [""],
      counselorNotes: ""
    })
    setIsCreating(true)
    setEditingTemplate(null)
  }

  const startEdit = (template: TaskTemplate) => {
    setFormData(template)
    setEditingTemplate(template)
    setIsCreating(false)
  }

  const saveTemplate = () => {
    if (!formData.categoryId || !formData.title?.trim()) {
      setError("Please fill in required fields")
      return
    }

    if (isCreating) {
      const newTemplate: TaskTemplate = {
        id: `custom_${Date.now()}`,
        categoryId: formData.categoryId!,
        title: formData.title!,
        description: formData.description || "",
        priority: formData.priority!,
        estimatedDays: formData.estimatedDays,
        checklistItems: formData.checklistItems?.filter(item => item.trim()) || [],
        helpfulLinks: formData.helpfulLinks?.filter(link => link.trim()) || [],
        counselorNotes: formData.counselorNotes
      }
      setTemplates(prev => [...prev, newTemplate])
    } else if (editingTemplate) {
      const updatedTemplate: TaskTemplate = {
        ...editingTemplate,
        categoryId: formData.categoryId!,
        title: formData.title!,
        description: formData.description || "",
        priority: formData.priority!,
        estimatedDays: formData.estimatedDays,
        checklistItems: formData.checklistItems?.filter(item => item.trim()) || [],
        helpfulLinks: formData.helpfulLinks?.filter(link => link.trim()) || [],
        counselorNotes: formData.counselorNotes
      }
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
    }

    setIsCreating(false)
    setEditingTemplate(null)
  }

  const deleteTemplate = (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  const cancelEdit = () => {
    setIsCreating(false)
    setEditingTemplate(null)
    setError("")
  }

  const updateFormData = (field: keyof TaskTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklistItems: [...(prev.checklistItems || []), ""]
    }))
  }

  const updateChecklistItem = (index: number, value: string) => {
    setFormData(prev => {
      const items = [...(prev.checklistItems || [])]
      items[index] = value
      return { ...prev, checklistItems: items }
    })
  }

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: (prev.checklistItems || []).filter((_, i) => i !== index)
    }))
  }

  const addHelpfulLink = () => {
    setFormData(prev => ({
      ...prev,
      helpfulLinks: [...(prev.helpfulLinks || []), ""]
    }))
  }

  const updateHelpfulLink = (index: number, value: string) => {
    setFormData(prev => {
      const links = [...(prev.helpfulLinks || [])]
      links[index] = value
      return { ...prev, helpfulLinks: links }
    })
  }

  const removeHelpfulLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      helpfulLinks: (prev.helpfulLinks || []).filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Task Template Manager
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Template List */}
          {!isCreating && !editingTemplate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Available Templates</h3>
                <button
                  onClick={startCreate}
                  className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>

              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{template.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            template.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            template.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            template.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {template.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {TASK_CATEGORIES.find(c => c.id === template.categoryId)?.icon} 
                            {TASK_CATEGORIES.find(c => c.id === template.categoryId)?.name}
                          </span>
                          <span>{template.estimatedDays} days</span>
                          <span>{template.checklistItems?.length} checklist items</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(template)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {template.id.startsWith('custom_') && (
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Form */}
          {(isCreating || editingTemplate) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isCreating ? "Create New Template" : "Edit Template"}
              </h3>

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
                    {TASK_CATEGORIES.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => updateFormData("priority", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter template title"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe what this task involves"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Days
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDays}
                    onChange={(e) => updateFormData("estimatedDays", parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Days to complete"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counselor Notes
                </label>
                <textarea
                  value={formData.counselorNotes}
                  onChange={(e) => updateFormData("counselorNotes", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Notes for counselors using this template"
                />
              </div>

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
                  {(formData.checklistItems || []).map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder={`Checklist item ${index + 1}`}
                      />
                      {(formData.checklistItems || []).length > 1 && (
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
                  {(formData.helpfulLinks || []).map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateHelpfulLink(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="https://example.com"
                      />
                      {(formData.helpfulLinks || []).length > 1 && (
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

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  {isCreating ? "Create Template" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
