"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Users, Plus, Activity, TrendingUp, Award, Calendar, 
  Search, Filter, BarChart3, Target, Star, BookOpen,
  AlertCircle, CheckCircle
} from "lucide-react"
import { ProgressCharts, prepareProgressData } from "@/components/ProgressCharts"

interface Student {
  id: string
  name: string
  passportNumber: string
  japaneseLanguageLevel: string
}

interface ClassEnrollment {
  id: string
  student: Student
  class: {
    id: string
    name: string
    level: string
  }
  progress: {
    id: string
    assessmentDate: string
    speakingScore?: number
    listeningScore?: number
    readingScore?: number
    writingScore?: number
    overallScore?: number
    notes?: string
    attendanceRate?: number
  }[]
}

export default function TeacherProgressPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnrollment, setSelectedEnrollment] = useState<ClassEnrollment | null>(null)
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "TEACHER") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchEnrollments()
    }
  }, [status, session, router])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/teacher/progress")
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data)
        // Auto-select first enrollment if none selected
        if (data.length > 0 && !selectedEnrollment) {
          setSelectedEnrollment(data[0])
        }
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort enrollments
  const filteredEnrollments = enrollments
    .filter(enrollment => {
      const matchSearch = enrollment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        enrollment.student.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        enrollment.class.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchLevel = levelFilter === "ALL" || enrollment.class.level === levelFilter
      return matchSearch && matchLevel
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.student.name.localeCompare(b.student.name)
        case "class":
          return a.class.name.localeCompare(b.class.name)
        case "level":
          return a.class.level.localeCompare(b.class.level)
        case "recent":
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
        default:
          return 0
      }
    })

  // Calculate statistics
  const totalStudents = enrollments.length
  const studentsWithProgress = enrollments.filter(e => e.progress.length > 0).length
  const averageScore = enrollments
    .filter(e => e.progress.length > 0 && e.progress[0].overallScore)
    .reduce((sum, e) => sum + (e.progress[0].overallScore || 0), 0) / 
    (studentsWithProgress || 1)

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score?: number) => {
    if (!score) return AlertCircle
    if (score >= 80) return Award
    if (score >= 60) return Target
    return AlertCircle
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Progress</h1>
            <p className="text-blue-100 mb-4">Track and update student learning progress across all your classes</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">{totalStudents} Students</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{studentsWithProgress} With Progress</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Avg Score: {Math.round(averageScore)}%</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => selectedEnrollment && setShowProgressForm(true)}
            disabled={!selectedEnrollment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Update Progress
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students, passport numbers, or classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Levels</option>
              <option value="N5">N5 - Beginner</option>
              <option value="N4">N4 - Elementary</option>
              <option value="N3">N3 - Intermediate</option>
              <option value="N2">N2 - Upper-Intermediate</option>
              <option value="N1">N1 - Advanced</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Sort by Name</option>
              <option value="class">Sort by Class</option>
              <option value="level">Sort by Level</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Students ({filteredEnrollments.length})</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              {filteredEnrollments.length} of {totalStudents}
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredEnrollments.map((enrollment) => {
                const latestProgress = enrollment.progress[0]
                const ScoreIcon = getScoreIcon(latestProgress?.overallScore)
                
                return (
                  <div
                    key={enrollment.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedEnrollment?.id === enrollment.id
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    onClick={() => setSelectedEnrollment(enrollment)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{enrollment.student.name}</h4>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            enrollment.class.level === 'N5' ? 'bg-green-100 text-green-800' :
                            enrollment.class.level === 'N4' ? 'bg-blue-100 text-blue-800' :
                            enrollment.class.level === 'N3' ? 'bg-purple-100 text-purple-800' :
                            enrollment.class.level === 'N2' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {enrollment.class.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{enrollment.student.passportNumber}</p>
                        <p className="text-sm text-gray-600">{enrollment.class.name}</p>
                      </div>
                      
                      <div className="text-right ml-4">
                        {latestProgress?.overallScore ? (
                          <div className="flex items-center gap-1">
                            <ScoreIcon className={`w-4 h-4 ${getScoreColor(latestProgress.overallScore)}`} />
                            <span className={`text-sm font-bold ${getScoreColor(latestProgress.overallScore)}`}>
                              {latestProgress.overallScore}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">No score</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {latestProgress ? 
                            new Date(latestProgress.assessmentDate).toLocaleDateString() : 
                            "No assessment"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Selected Student Progress */}
        {selectedEnrollment && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEnrollment.student.name}'s Progress
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEnrollment.class.level === 'N5' ? 'bg-green-100 text-green-800' :
                    selectedEnrollment.class.level === 'N4' ? 'bg-blue-100 text-blue-800' :
                    selectedEnrollment.class.level === 'N3' ? 'bg-purple-100 text-purple-800' :
                    selectedEnrollment.class.level === 'N2' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedEnrollment.class.level}
                  </span>
                  <span className="text-sm text-gray-500">{selectedEnrollment.class.name}</span>
                </div>
              </div>
              <button
                onClick={() => setShowProgressForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Update Progress
              </button>
            </div>

            {selectedEnrollment.progress.length > 0 ? (
              <div className="space-y-6">
                {/* Progress Charts */}
                <ProgressCharts 
                  data={prepareProgressData(selectedEnrollment.progress)}
                  title={`${selectedEnrollment.student.name}'s Performance Charts`}
                />

                {/* Latest Assessment Summary */}
                {selectedEnrollment.progress[0] && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Latest Assessment
                      </h4>
                      <span className="text-sm text-gray-600">
                        {new Date(selectedEnrollment.progress[0].assessmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {selectedEnrollment.progress[0].overallScore && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Overall Score</span>
                          <span className={`text-lg font-bold ${getScoreColor(selectedEnrollment.progress[0].overallScore)}`}>
                            {selectedEnrollment.progress[0].overallScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              selectedEnrollment.progress[0].overallScore >= 80 ? 'bg-green-500' :
                              selectedEnrollment.progress[0].overallScore >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${selectedEnrollment.progress[0].overallScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedEnrollment.progress[0].speakingScore && (
                        <div className="flex justify-between items-center py-2 bg-white rounded px-3">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            Speaking
                          </span>
                          <span className="font-medium">{selectedEnrollment.progress[0].speakingScore}%</span>
                        </div>
                      )}
                      {selectedEnrollment.progress[0].listeningScore && (
                        <div className="flex justify-between items-center py-2 bg-white rounded px-3">
                          <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Listening
                          </span>
                          <span className="font-medium">{selectedEnrollment.progress[0].listeningScore}%</span>
                        </div>
                      )}
                      {selectedEnrollment.progress[0].readingScore && (
                        <div className="flex justify-between items-center py-2 bg-white rounded px-3">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            Reading
                          </span>
                          <span className="font-medium">{selectedEnrollment.progress[0].readingScore}%</span>
                        </div>
                      )}
                      {selectedEnrollment.progress[0].writingScore && (
                        <div className="flex justify-between items-center py-2 bg-white rounded px-3">
                          <span className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Writing
                          </span>
                          <span className="font-medium">{selectedEnrollment.progress[0].writingScore}%</span>
                        </div>
                      )}
                      {selectedEnrollment.progress[0].attendanceRate && (
                        <div className="flex justify-between items-center py-2 bg-white rounded px-3">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-500" />
                            Attendance
                          </span>
                          <span className="font-medium">{selectedEnrollment.progress[0].attendanceRate}%</span>
                        </div>
                      )}
                    </div>

                    {selectedEnrollment.progress[0].notes && (
                      <div className="mt-4 p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-600 italic">"{selectedEnrollment.progress[0].notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress History */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Progress History
                  </h4>
                  <div className="space-y-3">
                    {selectedEnrollment.progress.slice(1).map((progress, index) => (
                      <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(progress.assessmentDate).toLocaleDateString()}
                          </span>
                          {progress.overallScore && (
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-bold ${getScoreColor(progress.overallScore)}`}>
                                {progress.overallScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {progress.speakingScore && (
                            <div>Speaking: {progress.speakingScore}%</div>
                          )}
                          {progress.listeningScore && (
                            <div>Listening: {progress.listeningScore}%</div>
                          )}
                          {progress.readingScore && (
                            <div>Reading: {progress.readingScore}%</div>
                          )}
                          {progress.writingScore && (
                            <div>Writing: {progress.writingScore}%</div>
                          )}
                          {progress.attendanceRate && (
                            <div>Attendance: {progress.attendanceRate}%</div>
                          )}
                        </div>

                        {progress.notes && (
                          <div className="mt-2 text-xs text-gray-500 italic">
                            "{progress.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Progress Records</h4>
                <p className="text-gray-600 mb-4">This student hasn't been assessed yet</p>
                <button
                  onClick={() => setShowProgressForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Assessment
                </button>
              </div>
            )}
          </div>
        )}
      </div>

            {/* Progress Form Modal */}
            {showProgressForm && selectedEnrollment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Update Progress</h3>
                  <UpdateProgressForm
                    enrollment={selectedEnrollment}
                    onSuccess={() => {
                      setShowProgressForm(false)
                      fetchEnrollments()
                    }}
                    onCancel={() => setShowProgressForm(false)}
                  />
                </div>
              </div>
            )}
          </div>
     
  )
}

function UpdateProgressForm({ 
  enrollment, 
  onSuccess, 
  onCancel 
}: { 
  enrollment: ClassEnrollment
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    speakingScore: "",
    listeningScore: "",
    readingScore: "",
    writingScore: "",
    attendanceRate: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const calculateOverallScore = () => {
    const scores = [
      formData.speakingScore,
      formData.listeningScore,
      formData.readingScore,
      formData.writingScore
    ].filter(score => score && Number(score) > 0)
    
    if (scores.length === 0) return 0
    
    const total = scores.reduce((sum, score) => sum + Number(score), 0)
    return Math.round(total / scores.length)
  }

  const overallScore = calculateOverallScore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Validate at least one score is provided
    const hasAnyScore = Object.entries(formData).some(([key, value]) => 
      key !== 'notes' && value && Number(value) > 0
    )

    if (!hasAnyScore) {
      setError("Please provide at least one assessment score")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/teacher/progress/${enrollment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakingScore: formData.speakingScore ? Number(formData.speakingScore) : undefined,
          listeningScore: formData.listeningScore ? Number(formData.listeningScore) : undefined,
          readingScore: formData.readingScore ? Number(formData.readingScore) : undefined,
          writingScore: formData.writingScore ? Number(formData.writingScore) : undefined,
          attendanceRate: formData.attendanceRate ? Number(formData.attendanceRate) : undefined,
          notes: formData.notes || undefined
        })
      })

      if (!response.ok) throw new Error("Failed to update progress")

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getScoreColor = (score: string) => {
    if (!score) return "border-gray-300"
    const num = Number(score)
    if (num >= 80) return "border-green-500 bg-green-50"
    if (num >= 60) return "border-yellow-500 bg-yellow-50"
    return "border-red-500 bg-red-50"
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Update Progress</h3>
        <p className="text-sm text-gray-600">
          {enrollment.student.name} - {enrollment.class.name}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Overall Score Preview */}
      {overallScore > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Predicted Overall Score</span>
            <span className={`text-lg font-bold ${
              overallScore >= 80 ? 'text-green-600' :
              overallScore >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {overallScore}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                overallScore >= 80 ? 'bg-green-500' :
                overallScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Speaking Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.speakingScore}
              onChange={(e) => setFormData(prev => ({ ...prev, speakingScore: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getScoreColor(formData.speakingScore)}`}
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Activity className="w-4 h-4 inline mr-1" />
              Listening Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.listeningScore}
              onChange={(e) => setFormData(prev => ({ ...prev, listeningScore: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getScoreColor(formData.listeningScore)}`}
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Reading Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.readingScore}
              onChange={(e) => setFormData(prev => ({ ...prev, readingScore: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getScoreColor(formData.readingScore)}`}
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Writing Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.writingScore}
              onChange={(e) => setFormData(prev => ({ ...prev, writingScore: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getScoreColor(formData.writingScore)}`}
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Attendance Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.attendanceRate}
              onChange={(e) => setFormData(prev => ({ ...prev, attendanceRate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Student performance notes, areas for improvement, strengths, etc."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Updating..." : "Update Progress"}
          </button>
        </div>
      </form>
    </div>
  )
}
