'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Users, MessageSquare, Calendar, Search, Plus, Edit, Trash2, Play, Pause, Zap, Filter } from 'lucide-react'
import { TriggerEvent, TimingType, RecipientType, NotificationChannel, NotificationPriority } from '@/generated/prisma'

interface ReminderTemplate {
  id: string
  name: string
  description?: string
  triggerEvent: TriggerEvent
  timingType: TimingType
  timingValue?: number
  messageTemplate: string
  inAppMessage?: string
  recipientType: RecipientType
  priority: NotificationPriority
  channels: NotificationChannel[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function WorkflowManagement() {
  const [templates, setTemplates] = useState<ReminderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<TriggerEvent | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerEvent: '' as TriggerEvent,
    timingType: 'IMMEDIATE' as TimingType,
    timingValue: 7,
    messageTemplate: '',
    inAppMessage: '',
    recipientType: 'STUDENT' as RecipientType,
    priority: 'MEDIUM' as NotificationPriority,
    channels: ['IN_APP'] as NotificationChannel[]
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...')
      const response = await fetch('/api/workflows/templates')
      console.log('Templates response status:', response.status)
      
      if (response.ok) {
        let data
        try {
          data = await response.json()
          console.log('Templates data:', data)
          setTemplates(data.templates || [])
        } catch (jsonError) {
          console.error('JSON parsing error in fetchTemplates:', jsonError)
          // Don't try to read the body again - just set empty templates
          setTemplates([])
        }
      } else {
        console.error('Error fetching templates - Status:', response.status)
        // Don't try to read the error response body - just set empty templates
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Template name is required')
      return
    }
    if (!formData.triggerEvent) {
      alert('Trigger event is required')
      return
    }
    if (!formData.messageTemplate.trim()) {
      alert('Message template is required')
      return
    }
    if (formData.channels.length === 0) {
      alert('At least one notification channel is required')
      return
    }
    
    // Prepare data for API
    const submissionData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      messageTemplate: formData.messageTemplate.trim(),
      inAppMessage: formData.inAppMessage.trim() || undefined,
      timingValue: formData.timingType !== 'IMMEDIATE' ? formData.timingValue : undefined
    }
    
    console.log('Form data being submitted:', submissionData)
    
    try {
      // Test the body parsing first
      console.log('Testing body parsing...')
      const testResponse = await fetch('/api/test-body', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })
      
      if (testResponse.ok) {
        const testResult = await testResponse.json()
        console.log('Test body parsing result:', testResult)
      } else {
        console.error('Test body parsing failed - Status:', testResponse.status)
      }
      
      // Now try the actual API
      const url = editingTemplate 
        ? `/api/workflows/templates/${editingTemplate.id}`
        : '/api/workflows/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      console.log('Making request to:', url, 'Method:', method)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      console.log('Response status:', response.status)
      
      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        // Don't try to read the body again - just show a generic error
        alert('Server response error. Please check the console for details.')
        return
      }
      
      console.log('Response data:', responseData)

      if (response.ok) {
        await fetchTemplates()
        setShowCreateModal(false)
        setEditingTemplate(null)
        resetForm()
        console.log('Template saved successfully!')
        alert('Template saved successfully!')
      } else {
        console.error('Error saving template:', responseData)
        alert(`Error: ${responseData.error || responseData.details?.[0]?.message || 'Failed to save template'}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error: Failed to save template. Please check the console for details.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/workflows/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleEdit = (template: ReminderTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      triggerEvent: template.triggerEvent,
      timingType: template.timingType,
      timingValue: template.timingValue || 7,
      messageTemplate: template.messageTemplate,
      inAppMessage: template.inAppMessage || '',
      recipientType: template.recipientType,
      priority: template.priority,
      channels: template.channels
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerEvent: '' as TriggerEvent,
      timingType: 'IMMEDIATE' as TimingType,
      timingValue: 7,
      messageTemplate: '',
      inAppMessage: '',
      recipientType: 'STUDENT' as RecipientType,
      priority: 'MEDIUM' as NotificationPriority,
      channels: ['IN_APP'] as NotificationChannel[]
    })
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesEvent = true
    if (selectedEvent) {
      // selectedEvent is a TriggerEvent here, not empty string
      matchesEvent = template.triggerEvent === selectedEvent
    }
    
    return matchesSearch && matchesEvent
  })

  const getTriggerEventLabel = (event: TriggerEvent) => {
    return event.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'IN_APP': return <MessageSquare className="h-3 w-3" />
      case 'EMAIL': return <Bell className="h-3 w-3" />
      case 'SMS': return <MessageSquare className="h-3 w-3" />
      default: return <Bell className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex">
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Workflow Management
                </h1>
                <p className="text-lg text-white/80 mb-6">
                  Manage automated reminders and notifications
                </p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                >
                  <Plus className="w-5 h-5" />
                  Create Template
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <div className="flex-1 min-w-[300px] relative border border-gray-200 rounded-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-5 py-3.5 bg-white/90 backdrop-blur-lg border border-white/30 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 cursor-pointer"
                value={selectedEvent || ''} 
                onChange={(e) => setSelectedEvent(e.target.value as TriggerEvent | '')}
              >
                <option value="">All Events</option>
                {Object.values(TriggerEvent).map(event => (
                  <option key={event} value={event}>
                    {getTriggerEventLabel(event)}
                  </option>
                ))}
              </select>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Zap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No templates found</h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedEvent ? 'Try adjusting your filters' : 'Create your first reminder template'}
                </p>
                {!searchTerm && !selectedEvent && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <Plus className="w-5 h-5" />
                    Create Template
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/20 hover:shadow-lg transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}>
                              {template.priority}
                            </span>
                            {template.isActive ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                            )}
                          </div>
                          
                          {template.description && (
                            <p className="text-gray-600 mb-4">{template.description}</p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Trigger:</span>
                              <span className="font-medium text-gray-900">{getTriggerEventLabel(template.triggerEvent)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Timing:</span>
                              <span className="font-medium text-gray-900">
                                {template.timingType === 'IMMEDIATE' ? 'Immediate' : 
                                 `${template.timingValue} ${template.timingType.toLowerCase().replace('_', ' ')}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Recipients:</span>
                              <span className="font-medium text-gray-900">{template.recipientType}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Channels:</span>
                              <div className="flex gap-1">
                                {template.channels.map(channel => (
                                  <div key={channel} className="flex items-center gap-1">
                                    {getChannelIcon(channel)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {template.inAppMessage || template.messageTemplate}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Reminder Template' : 'Create Reminder Template'}
              </h2>
              <p className="text-gray-600 mt-1">
                Configure automated reminders and notifications
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Document Upload Reminder"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Event</label>
                    <select
                      value={formData.triggerEvent}
                      onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value as TriggerEvent })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select trigger event</option>
                      {Object.values(TriggerEvent).map(event => (
                        <option key={event} value={event}>
                          {getTriggerEventLabel(event)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of this template"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timing</label>
                    <select
                      value={formData.timingType}
                      onChange={(e) => setFormData({ ...formData, timingType: e.target.value as TimingType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="DAYS_BEFORE">Days Before</option>
                      <option value="DAYS_AFTER">Days After</option>
                      <option value="HOURS_BEFORE">Hours Before</option>
                      <option value="HOURS_AFTER">Hours After</option>
                    </select>
                  </div>
                  
                  {formData.timingType !== 'IMMEDIATE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                      <input
                        type="number"
                        value={formData.timingValue}
                        onChange={(e) => setFormData({ ...formData, timingValue: parseInt(e.target.value) })}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <select
                      value={formData.recipientType}
                      onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as RecipientType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="COUNSELOR">Counselor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ALL_STUDENTS">All Students</option>
                      <option value="ALL_COUNSELORS">All Counselors</option>
                      <option value="ALL_ADMINS">All Admins</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Channels</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(NotificationChannel).map(channel => (
                      <div key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={channel}
                          checked={formData.channels.includes(channel)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            if (checked) {
                              setFormData({ ...formData, channels: [...formData.channels, channel] })
                            } else {
                              setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel) })
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={channel} className="text-sm text-gray-700">
                          {channel.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Message Template</label>
                  <textarea
                    value={formData.messageTemplate}
                    onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                    placeholder="Dear {{studentName}},&#10;&#10;This is a reminder about..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like {"{{studentName}}"}, {"{{documentType}}"}, {"{{dueDate}}"}, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">In-App Message (Optional)</label>
                  <textarea
                    value={formData.inAppMessage}
                    onChange={(e) => setFormData({ ...formData, inAppMessage: e.target.value })}
                    placeholder="Brief message for in-app notifications"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingTemplate(null)
                      resetForm()
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
