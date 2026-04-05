"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users, Plus, Search, Eye, BookOpen, Activity,
  Calendar, MapPin, Users2, Target, Award, BarChart3,
  Star, Timer, AlertCircle, CheckCircle, XCircle, Clock, X
} from "lucide-react"

interface JapaneseClass {
  id: string
  name: string
  level: string
  description?: string
  maxStudents: number
  isActive: boolean
  createdAt: string
  schedules: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    room?: string
  }[]
  enrollments: {
    id: string
    student: { id: string; name: string; passportNumber: string }
  }[]
  _count: { enrollments: number }
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const levelConfig: Record<string, { color: string; accent: string; label: string; Icon: React.ElementType }> = {
  N5: { color: "#f59e0b", accent: "#fef3c7", label: "Beginner",          Icon: Star      },
  N4: { color: "#3b82f6", accent: "#dbeafe", label: "Elementary",        Icon: BookOpen  },
  N3: { color: "#6366f1", accent: "#e0e7ff", label: "Intermediate",      Icon: Target    },
  N2: { color: "#8b5cf6", accent: "#ede9fe", label: "Upper-Intermediate",Icon: Award     },
  N1: { color: "#ef4444", accent: "#fee2e2", label: "Advanced",          Icon: BarChart3 },
}

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`
}

export default function TeacherClassesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState<JapaneseClass[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [showWeeklyRoutineForm, setShowWeeklyRoutineForm] = useState(false)
  const [weeklyRoutineData, setWeeklyRoutineData] = useState({
    className: "",
    level: "N5",
    description: "",
    maxStudents: 20,
    room: "",
    schedules: {
      0: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Sunday
      1: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Monday
      2: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Tuesday
      3: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Wednesday
      4: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Thursday
      5: [{ enabled: false, startTime: "", endTime: "", room: "" }], // Friday
      6: [{ enabled: false, startTime: "", endTime: "", room: "" }]  // Saturday
    }
  })

  useEffect(() => {
    if (status === "unauthenticated") { 
      router.push("/auth/signin"); 
      return 
    }
    if (status === "authenticated" && session.user.role !== "TEACHER") { 
      router.push("/dashboard"); 
      return 
    }
    if (status === "authenticated") fetchClasses()
  }, [status, session, router])

  const fetchClasses = async () => {
    console.log('=== FETCH CLASSES START ===')
    try {
      const res = await fetch("/api/teacher/classes")
      console.log('Fetch classes response status:', res.status)
      console.log('Fetch classes response ok:', res.ok)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Fetched classes data:', data)
        console.log('Number of classes:', data.length)
        setClasses(data)
        console.log('Classes state updated')
      } else {
        console.error('Failed to fetch classes:', res.status)
      }
      console.log('=== FETCH CLASSES END ===')
    } catch (e) { 
      console.error("Error fetching classes:", e) 
    }
    finally { 
      setLoading(false) 
    }
  }

  // Helper functions for managing multiple slots
  const addTimeSlot = (dayOfWeek: number) => {
    setWeeklyRoutineData(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [dayOfWeek]: [
          ...prev.schedules[dayOfWeek as keyof typeof prev.schedules],
          { enabled: false, startTime: "", endTime: "", room: "" }
        ]
      }
    }))
  }

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setWeeklyRoutineData(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [dayOfWeek as keyof typeof prev.schedules]: prev.schedules[dayOfWeek as keyof typeof prev.schedules].filter((_, index) => index !== slotIndex)
      }
    }))
  }

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, field: string, value: any) => {
    setWeeklyRoutineData(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [dayOfWeek as keyof typeof prev.schedules]: prev.schedules[dayOfWeek as keyof typeof prev.schedules].map((slot, index) => 
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const handleWeeklyRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== WEEKLY ROUTINE START ===')
    console.log('Weekly routine data:', weeklyRoutineData)
    
    try {
      // Prepare schedules for enabled slots only
      const enabledSchedules: any[] = []
      
      Object.entries(weeklyRoutineData.schedules).forEach(([dayOfWeek, slots]) => {
        slots.forEach((slot: any, slotIndex: number) => {
          if (slot.enabled && slot.startTime && slot.endTime) {
            // Validate time format
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
              throw new Error(`Invalid time format for ${dayNames[parseInt(dayOfWeek)]} slot ${slotIndex + 1}. Use 24-hour format (e.g., 08:30, 14:00)`)
            }
            
            // Validate that end time is after start time
            const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1])
            const endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1])
            
            if (endMinutes <= startMinutes) {
              throw new Error(`End time must be after start time for ${dayNames[parseInt(dayOfWeek)]} slot ${slotIndex + 1}`)
            }
            
            enabledSchedules.push({
              dayOfWeek: parseInt(dayOfWeek),
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room || weeklyRoutineData.room || undefined
            })
          }
        })
      })

      console.log('Enabled schedules:', enabledSchedules)

      if (enabledSchedules.length === 0) {
        alert('Please select at least one time slot.')
        return
      }

      // Create a separate class for each enabled time slot
      const classPromises = enabledSchedules.map((schedule, index) => {
        const classData = {
          name: `${weeklyRoutineData.className} - ${dayNames[schedule.dayOfWeek]} ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`,
          level: weeklyRoutineData.level,
          description: weeklyRoutineData.description,
          maxStudents: weeklyRoutineData.maxStudents,
          schedules: [schedule]
        }
        
        console.log('Creating class for slot:', schedule.dayOfWeek, schedule.startTime, classData)
        
        return fetch("/api/teacher/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(classData)
        })
      })

      console.log('Creating', classPromises.length, 'classes...')
      
      const results = await Promise.all(classPromises)
      console.log('All classes created:', results)

      // Check if all were successful
      const allSuccessful = results.every(res => res.ok)
      
      if (allSuccessful) {
        setShowWeeklyRoutineForm(false)
        setWeeklyRoutineData({
          className: "",
          level: "N5",
          description: "",
          maxStudents: 20,
          room: "",
          schedules: {
            0: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            1: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            2: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            3: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            4: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            5: [{ enabled: false, startTime: "", endTime: "", room: "" }],
            6: [{ enabled: false, startTime: "", endTime: "", room: "" }]
          }
        })
        fetchClasses()
        alert(`Successfully created ${results.length} language classes!`)
        console.log('=== WEEKLY ROUTINE SUCCESS ===')
      } else {
        console.error('Some classes failed to create')
        alert('Some classes failed to create. Please check console for details.')
      }
    } catch (e) {
      console.error('=== WEEKLY ROUTINE ERROR ===')
      console.error("Error creating weekly routine:", e)
      alert(`Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`)
    }
  }

  const filteredClasses = classes.filter(cls => {
    const matchSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchLevel = levelFilter === "ALL" || cls.level === levelFilter
    return matchSearch && matchLevel
  })

  const totalStudents = classes.reduce((sum, cls) => sum + cls._count.enrollments, 0)
  const activeCount = classes.filter(cls => cls.isActive).length

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Classes</h1>
            <p className="text-blue-100 mb-4">Schedule, enrol students, and track progress</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">{classes.length} {classes.length === 1 ? "class" : "classes"}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">{totalStudents} students</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">{activeCount} active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowWeeklyRoutineForm(v => !v)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-5 h-5" />
              Create Language Class
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Classes",   val: classes.length,  bg: "bg-indigo-500", Icon: BookOpen },
          { label: "Total Students",  val: totalStudents,   bg: "bg-green-500", Icon: Users   },
          { label: "Active Classes",  val: activeCount,     bg: "bg-yellow-500", Icon: Activity },
          { label: "Avg. Class Size", val: classes.length ? Math.round(totalStudents / classes.length) : 0, bg: "bg-purple-500", Icon: BarChart3 },
        ].map(({ label, val, bg, Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{val}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Routine Form */}
      {showWeeklyRoutineForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Language Class</h2>
            <button
              onClick={() => setShowWeeklyRoutineForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleWeeklyRoutineSubmit} className="space-y-6">
            {/* Basic Class Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={weeklyRoutineData.className}
                  onChange={(e) => setWeeklyRoutineData(prev => ({ ...prev, className: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., N5 Morning Batch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={weeklyRoutineData.level}
                  onChange={(e) => setWeeklyRoutineData(prev => ({ ...prev, level: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="N5">N5 - Beginner</option>
                  <option value="N4">N4 - Elementary</option>
                  <option value="N3">N3 - Intermediate</option>
                  <option value="N2">N2 - Upper-Intermediate</option>
                  <option value="N1">N1 - Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={weeklyRoutineData.description}
                onChange={(e) => setWeeklyRoutineData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Optional description for the class..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={weeklyRoutineData.maxStudents}
                  onChange={(e) => setWeeklyRoutineData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 20 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room (Optional)
                </label>
                <input
                  type="text"
                  value={weeklyRoutineData.room}
                  onChange={(e) => setWeeklyRoutineData(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Room 301"
                />
              </div>
            </div>

            {/* Weekly Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">Select days and time slots for your language classes. You can add multiple time slots per day. Use 24-hour format (e.g., 08:30, 14:00, 19:30).</p>
              
              <div className="space-y-4">
                {Object.entries(weeklyRoutineData.schedules).map(([dayOfWeek, slots]) => (
                  <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{dayNames[parseInt(dayOfWeek)]}</h4>
                      <button
                        type="button"
                        onClick={() => addTimeSlot(parseInt(dayOfWeek))}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Slot
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {slots.map((slot: any, slotIndex: number) => (
                        <div key={slotIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={slot.enabled}
                              onChange={(e) => updateTimeSlot(parseInt(dayOfWeek), slotIndex, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </div>
                          
                          {slot.enabled && (
                            <div className="flex items-center gap-3 flex-1 flex-wrap">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">From:</label>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(parseInt(dayOfWeek), slotIndex, 'startTime', e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  step="60"
                                  required
                                />
                                <span className="text-xs text-gray-500">(24h format)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">To:</label>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(parseInt(dayOfWeek), slotIndex, 'endTime', e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  step="60"
                                  required
                                />
                                <span className="text-xs text-gray-500">(24h format)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Room:</label>
                                <input
                                  type="text"
                                  value={slot.room}
                                  onChange={(e) => updateTimeSlot(parseInt(dayOfWeek), slotIndex, 'room', e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Room 301"
                                />
                              </div>
                              
                              {slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTimeSlot(parseInt(dayOfWeek), slotIndex)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                          
                          {!slot.enabled && (
                            <div className="flex-1 text-sm text-gray-500">
                              Click checkbox to enable this time slot
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {slots.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No time slots for this day. Click "Add Slot" to add one.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowWeeklyRoutineForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Create Language Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ALL">All Levels</option>
            {Object.entries(levelConfig).map(([level, config]) => (
              <option key={level} value={level}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600">
                {searchTerm || levelFilter !== "ALL" ? "No classes match your search criteria." : "You haven't created any classes yet."}
              </p>
            </div>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const config = levelConfig[cls.level]
            const Icon = config.Icon
            
            return (
              <div key={cls.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className={`p-6 border-b border-gray-200`} style={{ backgroundColor: `${config.accent}20` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: config.color }}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium`} style={{ backgroundColor: config.color, color: "white" }}>
                            {config.label}
                          </span>
                          {cls.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {cls.description && (
                    <p className="text-gray-600 text-sm">{cls.description}</p>
                  )}
                </div>
                
                {/* Schedule */}
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </h4>
                  <div className="space-y-2">
                    {cls.schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">
                          {dayNames[schedule.dayOfWeek]}
                        </span>
                        <span className="text-gray-600">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </span>
                        {schedule.room && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            <MapPin className="w-3 h-3" />
                            {schedule.room}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Students */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Students
                    </h4>
                    <span className="text-sm text-gray-600">
                      {cls._count.enrollments}/{cls.maxStudents}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${(cls._count.enrollments / cls.maxStudents) * 100}%` }}
                    />
                  </div>
                  
                  {/* Student List */}
                  {cls.enrollments.length > 0 ? (
                    <div className="space-y-2">
                      {cls.enrollments.slice(0, 3).map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <Users2 className="w-4 h-4" />
                          {enrollment.student.name}
                        </div>
                      ))}
                      {cls._count.enrollments > 3 && (
                        <div className="text-sm text-gray-500">
                          +{cls._count.enrollments - 3} more students
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No students enrolled yet</p>
                  )}
                  
                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/teacher/classes/${cls.id}`}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
