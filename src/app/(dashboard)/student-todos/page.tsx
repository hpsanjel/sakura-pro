"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Plus, Search, Filter, CheckCircle2, Circle, Clock, 
  AlertTriangle, Calendar, User, MoreVertical, ChevronDown,
  ListTodo, Target, Zap, Archive, CheckSquare, AlertCircle
} from "lucide-react"

interface StudentTodo {
  id: string
  title: string
  description?: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE" | "BLOCKED"
  dueDate?: string
  assignedDate: string
  completedDate?: string
  notes?: string
  counselorNotes?: string
  estimatedDays?: number
  actualDays?: number
  isOverdue: boolean
  helpfulLinks?: string[]
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  checklistItems: {
    id: string
    title: string
    isCompleted: boolean
    completedAt?: string
  }[]
  _count: {
    checklistItems: number
  }
}

interface TodoCategory {
  id: string
  name: string
  color: string
  icon: string
  _count: {
    todos: number
  }
}

const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-800 border-gray-300",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  URGENT: "bg-red-100 text-red-800 border-red-300",
}

const PRIORITY_ICONS = {
  LOW: <Circle className="w-4 h-4" />,
  MEDIUM: <Clock className="w-4 h-4" />,
  HIGH: <AlertTriangle className="w-4 h-4" />,
  URGENT: <Zap className="w-4 h-4" />,
}

const STATUS_COLORS = {
  PENDING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  OVERDUE: "bg-red-200 text-red-900",
  BLOCKED: "bg-yellow-100 text-yellow-800",
}

const STATUS_ICONS = {
  PENDING: <Circle className="w-4 h-4" />,
  IN_PROGRESS: <Clock className="w-4 h-4" />,
  COMPLETED: <CheckCircle2 className="w-4 h-4" />,
  CANCELLED: <Archive className="w-4 h-4" />,
  OVERDUE: <AlertTriangle className="w-4 h-4" />,
  BLOCKED: <AlertTriangle className="w-4 h-4" />,
}

export default function StudentTodosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [todos, setTodos] = useState<StudentTodo[]>([])
  const [categories, setCategories] = useState<TodoCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedPriority, setSelectedPriority] = useState("ALL")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchTodos()
      fetchCategories()
    }
  }, [status, router, selectedCategory, selectedStatus, selectedPriority, searchQuery])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError("")
      
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      })
      
      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority)
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`/api/student-todos?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch todos")
      }

      const data = await response.json()
      setTodos(data.todos || [])
      
      // Expand all todos by default
      const allTodoIds = new Set<string>((data.todos || []).map((todo: StudentTodo) => todo.id))
      setExpandedTodos(allTodoIds)
      
    } catch (error) {
      console.error("Error fetching todos:", error)
      setError("Failed to load todos. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/student-todos/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const toggleTodoExpansion = (todoId: string) => {
    const newExpanded = new Set(expandedTodos)
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId)
    } else {
      newExpanded.add(todoId)
    }
    setExpandedTodos(newExpanded)
  }

  const updateTodoStatus = async (todoId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/student-todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo")
      }

      await fetchTodos() // Refresh todos
    } catch (error) {
      console.error("Error updating todo:", error)
      alert("Failed to update todo status")
    }
  }

  const updateTodoNotes = async (todoId: string, notes: string) => {
    try {
      const response = await fetch(`/api/student-todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error("Failed to update notes")
      }

      await fetchTodos() // Refresh todos
      setEditingNotes(null)
      setNotesText("")
    } catch (error) {
      console.error("Error updating notes:", error)
      alert("Failed to update notes")
    }
  }

  const toggleChecklistItem = async (todoId: string, checklistItemId: string) => {
    try {
      const response = await fetch(`/api/student-todos/${todoId}/checklist/${checklistItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to toggle checklist item")
      }

      await fetchTodos() // Refresh todos to get updated status
    } catch (error) {
      console.error("Error toggling checklist item:", error)
      alert("Failed to update checklist item")
    }
  }

  const calculateProgress = (todo: StudentTodo) => {
    if (todo.checklistItems.length === 0) return todo.status === "COMPLETED" ? 100 : 0
    const completed = todo.checklistItems.filter(item => item.isCompleted).length
    return Math.round((completed / todo.checklistItems.length) * 100)
  }

  const isTodoOverdue = (todo: StudentTodo) => {
    if (!todo.dueDate || todo.status === "COMPLETED") return false
    return new Date(todo.dueDate) < new Date()
  }

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your to-do list...</p>
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
            onClick={fetchTodos}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const completedTodos = todos.filter(todo => todo.status === "COMPLETED").length
  const pendingTodos = todos.filter(todo => todo.status === "PENDING").length
  const inProgressTodos = todos.filter(todo => todo.status === "IN_PROGRESS").length
  const overdueTodos = todos.filter(todo => isTodoOverdue(todo)).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">My To-Do List</h1>
            <p className="text-blue-100">Track your journey to study in Japan</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{completedTodos}</div>
              <div className="text-sm text-blue-100">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{pendingTodos}</div>
              <div className="text-sm text-blue-100">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overdueTodos}</div>
              <div className="text-sm text-blue-100">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <ListTodo className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{todos.length}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Tasks</h3>
          <p className="text-sm text-gray-500">All your to-do items</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{completedTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Completed</h3>
          <p className="text-sm text-gray-500">Tasks you've finished</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{inProgressTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">In Progress</h3>
          <p className="text-sm text-gray-500">Tasks you're working on</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-gray-900">{overdueTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Overdue</h3>
          <p className="text-sm text-gray-500">Tasks that need attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search to-do items..."
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
            <option value="ALL">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* To-Do List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No to-do items yet</h3>
            <p className="text-gray-600 mb-4">Your counselor will add tasks to help you track your journey</p>
          </div>
        ) : (
          todos.map((todo) => {
            const progress = calculateProgress(todo)
            const daysUntilDue = getDaysUntilDue(todo.dueDate)
            const isOverdue = isTodoOverdue(todo)
            const isExpanded = expandedTodos.has(todo.id)

            return (
              <div
                key={todo.id}
                className={`bg-white rounded-xl border ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'} overflow-hidden transition-all duration-200`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => updateTodoStatus(todo.id, todo.status === "COMPLETED" ? "PENDING" : "COMPLETED")}
                        className={`mt-1 ${todo.status === "COMPLETED" ? "text-green-600" : "text-gray-400"} hover:text-green-600 transition-colors`}
                      >
                        {STATUS_ICONS[todo.status]}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${todo.status === "COMPLETED" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                            {todo.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${PRIORITY_COLORS[todo.priority]}`}>
                            {PRIORITY_ICONS[todo.priority]}
                            {todo.priority}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[todo.status]}`}>
                            {todo.status.replace("_", " ")}
                          </span>
                        </div>
                        
                        {todo.description && (
                          <p className="text-gray-600 mb-3">{todo.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{todo.category.icon}</span>
                            <span>{todo.category.name}</span>
                          </div>
                          
                          {todo.dueDate && (
                            <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(todo.dueDate).toLocaleDateString()}
                                {daysUntilDue !== null && (
                                  <span className="ml-1">
                                    ({isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `in ${daysUntilDue} days`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {todo.estimatedDays && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>~{todo.estimatedDays} days</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTodoExpansion(todo.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {todo.checklistItems.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      {/* Checklist Items */}
                      {todo.checklistItems.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Checklist Items</h4>
                          <div className="space-y-2">
                            {todo.checklistItems.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleChecklistItem(todo.id, item.id)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    item.isCompleted
                                      ? "bg-green-500 border-green-500 text-white"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  {item.isCompleted && <CheckSquare className="w-3 h-3" />}
                                </button>
                                <span className={`text-sm ${item.isCompleted ? "text-gray-500 line-through" : "text-gray-700"}`}>
                                  {item.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {(todo.notes || todo.counselorNotes) && (
                        <div className="space-y-3">
                          {todo.notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Your Notes</h4>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{todo.notes}</p>
                            </div>
                          )}
                          {todo.counselorNotes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Counselor Notes</h4>
                              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{todo.counselorNotes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Helpful Links */}
                      {todo.helpfulLinks && todo.helpfulLinks.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Helpful Links</h4>
                          <div className="space-y-1">
                            {todo.helpfulLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline block"
                              >
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
