"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Plus, Search, Filter, CheckCircle2, Circle, Clock, 
  AlertTriangle, Calendar, User, MoreVertical, ChevronDown,
  ListTodo, Target, Zap, Archive, CheckSquare, AlertCircle,
  Users, BarChart3, TrendingUp, Eye, Edit, Trash2, Copy,
  FileText, Download, Send, MessageSquare, Sparkles
} from "lucide-react"
import CreateTodoModal from "@/components/CreateTodoModal"
import EditTodoModal from "@/components/EditTodoModal"
import TemplateManagerModal from "@/components/TemplateManagerModal"
import { TASK_CATEGORIES } from "@/lib/taskTemplates"

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
  student: {
    id: string
    name: string
    email: string
  }
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

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  intake?: string
  category?: string
  createdAt?: string
  _count?: {
    todos?: number
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

export default function CounselorTodosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [todos, setTodos] = useState<StudentTodo[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  // Debug students state changes
  useEffect(() => {
    console.log("Students state changed:", students.length, students)
  }, [students])
  const [categories, setCategories] = useState<TodoCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("ALL")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [selectedPriority, setSelectedPriority] = useState("ALL")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"list" | "student">("student")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [editingTodo, setEditingTodo] = useState<StudentTodo | null>(null)

  useEffect(() => {
    console.log("=== Session useEffect called ===")
    console.log("Session status:", status)
    console.log("Session user:", session?.user)
    console.log("User role:", session?.user?.role)
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && ['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '') && !categoriesInitialized) {
      console.log("Fetching initial data...")
      Promise.all([
        fetchTodos(),
        fetchStudents(),
        fetchCategories()
      ]).then(() => {
        setCategoriesInitialized(true)
      })
    }
  }, [status, session?.user?.role, router])

  useEffect(() => {
    console.log("=== Filter useEffect called ===")
    if (status === "authenticated" && ['ADMIN', 'COUNSELOR'].includes(session?.user?.role || '')) {
      fetchTodos()
    }
  }, [selectedStudent, selectedCategory, selectedStatus, selectedPriority, searchQuery])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError("")
      
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      })
      
      if (selectedStudent !== "ALL") params.append("studentId", selectedStudent)
      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory)
      if (selectedStatus !== "ALL") params.append("status", selectedStatus)
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority)
      if (searchQuery) params.append("search", searchQuery)
      
      const response = await fetch(`/api/student-todos?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch todos")
      }
      
      const data = await response.json()
      setTodos(data.todos)
    } catch (error) {
      console.error("Error fetching todos:", error)
      setError(error instanceof Error ? error.message : "Failed to load todos")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    console.log("=== fetchStudents called ===")
    try {
      // Use simple API call without parameters
      console.log("Making API call to /api/students")
      const response = await fetch("/api/students")
      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log("Error response:", errorText)
        throw new Error("Failed to fetch students")
      }
      
      const data = await response.json()
      console.log("Students data:", data)
      console.log("Data.students:", data.students)
      console.log("Data directly:", data)
      // The API returns students directly, not under a students property
      const studentsData = data.students || data || []
      console.log("Setting students to:", studentsData)
      setStudents(studentsData)
      console.log("Students state updated")
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log("=== Fetching Categories ===")
      const response = await fetch("/api/student-todos/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      
      const data = await response.json()
      let categories = data.categories || []
      console.log("Initial categories count:", categories.length)
      
      // If no categories exist, create them from template categories
      if (categories.length === 0) {
        console.log("No categories found, creating template categories...")
        console.log("Template categories to create:", TASK_CATEGORIES.length)
        
        for (const templateCategory of TASK_CATEGORIES) {
          console.log(`Creating category: ${templateCategory.name}`)
          const createResponse = await fetch("/api/student-todos/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: templateCategory.name,
              description: `${templateCategory.name} tasks`,
              color: templateCategory.color,
              icon: templateCategory.icon,
              order: TASK_CATEGORIES.indexOf(templateCategory),
            }),
          })
          
          if (createResponse.ok) {
            const createdCategory = await createResponse.json()
            console.log(`✅ Created category: ${templateCategory.name} with ID: ${createdCategory.id}`)
          } else {
            const errorText = await createResponse.text()
            console.error(`❌ Failed to create category ${templateCategory.name}:`, errorText)
          }
        }
        
        // Fetch categories again after creating them
        console.log("Fetching categories after creation...")
        const refetchResponse = await fetch("/api/student-todos/categories")
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json()
          categories = refetchData.categories || []
          console.log("✅ Refetched categories count:", categories.length)
          console.log("✅ Final categories:", categories.map((c: any) => ({ id: c.id, name: c.name })))
        } else {
          console.error("❌ Failed to refetch categories")
        }
      } else {
        console.log("✅ Using existing categories:", categories.map((c: any) => ({ id: c.id, name: c.name })))
      }
      
      console.log("✅ Setting categories state with", categories.length, "categories")
      setCategories(categories)
    } catch (error) {
      console.error("❌ Error fetching categories:", error)
    }
  }

  // Prevent duplicate category creation by adding a flag
  const [categoriesInitialized, setCategoriesInitialized] = useState(false)

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

  const deleteTodo = async (todoId: string) => {
    if (!confirm("Are you sure you want to delete this to-do item?")) return

    try {
      const response = await fetch(`/api/student-todos/${todoId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete todo")
      }

      await fetchTodos() // Refresh todos
    } catch (error) {
      console.error("Error deleting todo:", error)
      alert("Failed to delete todo")
    }
  }

  const handleEditTodo = (todo: StudentTodo) => {
    setEditingTodo(todo)
    setShowEditModal(true)
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

  // Group todos by student for student view
  const todosByStudent = todos.reduce((groups, todo) => {
    const studentId = todo.student.id
    if (!groups[studentId]) {
      groups[studentId] = {
        student: todo.student,
        todos: [],
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0
        }
      }
    }
    groups[studentId].todos.push(todo)
    groups[studentId].stats.total++
    
    if (todo.status === "COMPLETED") groups[studentId].stats.completed++
    else if (todo.status === "IN_PROGRESS") groups[studentId].stats.inProgress++
    else if (isTodoOverdue(todo)) groups[studentId].stats.overdue++
    
    return groups
  }, {} as Record<string, { student: Student; todos: StudentTodo[]; stats: any }>)

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student to-do lists...</p>
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

  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.status === "COMPLETED").length
  const inProgressTodos = todos.filter(todo => todo.status === "IN_PROGRESS").length
  const overdueTodos = todos.filter(todo => isTodoOverdue(todo)).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student To-Do Management</h1>
            <p className="text-purple-100">Manage and track student progress through personalized tasks</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{students.length}</div>
              <div className="text-sm text-purple-100">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTodos}</div>
              <div className="text-sm text-purple-100">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round((completedTodos / totalTodos) * 100) || 0}%</div>
              <div className="text-sm text-purple-100">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Task
        </button>
        
        <button
          onClick={() => setShowTemplateManager(true)}
          className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Manage Templates
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("student")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "student" 
                ? "bg-purple-500 text-white" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" />
            By Student
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "list" 
                ? "bg-purple-500 text-white" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            List View
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{students.length}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Active Students</h3>
          <p className="text-sm text-gray-500">Students with assigned tasks</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <ListTodo className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{totalTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Tasks</h3>
          <p className="text-sm text-gray-500">All student to-do items</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{completedTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Completed</h3>
          <p className="text-sm text-gray-500">Tasks finished by students</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-gray-900">{overdueTodos}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Overdue</h3>
          <p className="text-sm text-gray-500">Tasks requiring attention</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
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
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Students</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          
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
      )}

      {/* Content */}
      {viewMode === "student" ? (
        // Student View
        <div className="space-y-6">
          {Object.values(todosByStudent).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No student tasks yet</h3>
              <p className="text-gray-600 mb-4">Start by creating tasks for your students</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Task
              </button>
            </div>
          ) : (
            Object.values(todosByStudent).map(({ student, todos: studentTodos, stats }) => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        <div className="text-xs text-gray-500">In Progress</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                        <div className="text-xs text-gray-500">Overdue</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Todos */}
                <div className="p-6 space-y-4">
                  {studentTodos.length === 0 ? (
                    <div className="text-center py-8">
                      <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No tasks assigned to this student</p>
                    </div>
                  ) : (
                    studentTodos.map((todo) => {
                      const progress = calculateProgress(todo)
                      const daysUntilDue = getDaysUntilDue(todo.dueDate)
                      const isOverdue = isTodoOverdue(todo)
                      const isExpanded = expandedTodos.has(todo.id)

                      return (
                        <div
                          key={todo.id}
                          className={`bg-gray-50 rounded-lg border ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'} overflow-hidden transition-all duration-200`}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  onClick={() => updateTodoStatus(todo.id, todo.status === "COMPLETED" ? "PENDING" : "COMPLETED")}
                                  className={`mt-1 ${todo.status === "COMPLETED" ? "text-green-600" : "text-gray-400"} hover:text-green-600 transition-colors`}
                                >
                                  {STATUS_ICONS[todo.status]}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className={`text-base font-semibold ${todo.status === "COMPLETED" ? "text-gray-500 line-through" : "text-gray-900"}`}>
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
                                    <p className="text-gray-600 text-sm mb-2">{todo.description}</p>
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
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleTodoExpansion(todo.id)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                                <button
                                  onClick={() => handleEditTodo(todo)}
                                  className="text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteTodo(todo.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {todo.checklistItems.length > 0 && (
                            <div className="px-4 pb-3">
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
                            <div className="border-t border-gray-200 p-4 pt-3">
                              {/* Notes */}
                              {todo.counselorNotes && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Counselor Notes</h4>
                                  <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{todo.counselorNotes}</p>
                                </div>
                              )}

                              {/* Student Notes */}
                              {todo.notes && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Student Notes</h4>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{todo.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No to-do items found</h3>
              <p className="text-gray-600 mb-4">Create tasks for your students to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
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
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{todo.student.name}</span>
                            </div>
                            
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
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTodoExpansion(todo.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                        {/* Notes */}
                        {(todo.notes || todo.counselorNotes) && (
                          <div className="space-y-3">
                            {todo.counselorNotes && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Counselor Notes</h4>
                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{todo.counselorNotes}</p>
                              </div>
                            )}
                            {todo.notes && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Student Notes</h4>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{todo.notes}</p>
                              </div>
                            )}
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
      )}

      {/* Create Task Modal */}
      <CreateTodoModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log("Modal closing, students count:", students.length)
          setShowCreateModal(false)
        }}
        onSuccess={() => {
          fetchTodos()
          setShowCreateModal(false)
        }}
        students={students}
        categories={categories}
      />

      {/* Edit Task Modal */}
      <EditTodoModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingTodo(null)
        }}
        onSuccess={() => {
          fetchTodos()
          setShowEditModal(false)
          setEditingTodo(null)
        }}
        todo={editingTodo}
        students={students}
        categories={categories}
      />

      {/* Template Manager Modal */}
      <TemplateManagerModal
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onSuccess={() => setShowTemplateManager(false)}
      />
    </div>
  )
}
