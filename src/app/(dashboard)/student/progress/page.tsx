"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  TrendingUp, Award, Calendar, BookOpen, Activity, Star, 
  CheckCircle, AlertCircle, BarChart3, Target
} from "lucide-react"
import { ProgressCharts, prepareProgressData } from "@/components/ProgressCharts"

interface Progress {
  id: string
  assessmentDate: string
  speakingScore?: number
  listeningScore?: number
  readingScore?: number
  writingScore?: number
  overallScore?: number
  notes?: string
  attendanceRate?: number
}

interface ClassEnrollment {
  id: string
  class: {
    id: string
    name: string
    level: string
  }
  progress: Progress[]
}

interface StudentData {
  id: string
  name: string
  passportNumber?: string
  japaneseLanguageLevel?: string
  enrollments: ClassEnrollment[]
}

export default function StudentProgressPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session.user.role !== "STUDENT") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchStudentProgress()
    }
  }, [status, session, router])

  const fetchStudentProgress = async () => {
    try {
      const response = await fetch("/api/student/progress")
      if (response.ok) {
        const data = await response.json()
        setStudentData(data)
      }
    } catch (error) {
      console.error("Error fetching student progress:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-800'
      case 'N4': return 'bg-blue-100 text-blue-800'
      case 'N3': return 'bg-purple-100 text-purple-800'
      case 'N2': return 'bg-yellow-100 text-yellow-800'
      case 'N1': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate statistics
  const totalAssessments = studentData?.enrollments.reduce((sum, e) => sum + e.progress.length, 0) || 0
  const latestOverallScore = studentData?.enrollments
    .flatMap(e => e.progress)
    .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())[0]?.overallScore
  const averageScore = studentData?.enrollments
    .flatMap(e => e.progress)
    .filter(p => p.overallScore)
    .reduce((sum, p, _, arr) => sum + (p.overallScore || 0) / arr.length, 0) || 0

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Progress</h1>
              <p className="text-blue-100 mb-4">Track your Japanese language learning journey</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <Award className="w-4 h-4" />
                  <span className="text-sm">{studentData?.enrollments.length || 0} Classes</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">{totalAssessments} Assessments</span>
                </div>
                {latestOverallScore && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Latest: {latestOverallScore}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!studentData ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Progress Data</h2>
            <p className="text-gray-600">You haven't been enrolled in any classes yet.</p>
          </div>
        ) : (
          <>
            {/* Overall Progress Overview */}
            {totalAssessments > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Overall Learning Journey</h2>
                </div>
                
                {/* Combine all progress data from all classes */}
                <ProgressCharts 
                  data={prepareProgressData(
                    studentData.enrollments
                      .flatMap(e => e.progress)
                      .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime())
                  )}
                  title="Your Complete Progress Across All Classes"
                  showRadar={true}
                  showComparison={true}
                />
              </div>
            )}

            {/* Student Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{studentData.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {studentData.passportNumber && (
                      <span>Passport: {studentData.passportNumber}</span>
                    )}
                    {studentData.japaneseLanguageLevel && (
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(studentData.japaneseLanguageLevel)}`}>
                        {studentData.japaneseLanguageLevel}
                      </span>
                    )}
                  </div>
                </div>
                {averageScore > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Average Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(Math.round(averageScore))}`}>
                      {Math.round(averageScore)}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Classes Progress */}
            <div className="space-y-8">
              {studentData.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{enrollment.class.name}</h3>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(enrollment.class.level)}`}>
                        {enrollment.class.level}
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {enrollment.progress.length} assessment{enrollment.progress.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {enrollment.progress.length > 0 ? (
                    <div className="space-y-6">
                      {/* Progress Charts */}
                      <ProgressCharts 
                        data={prepareProgressData(enrollment.progress)}
                        title={`${enrollment.class.name} Performance Charts`}
                      />

                      {/* Latest Assessment */}
                      {enrollment.progress[0] && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Latest Assessment
                            </h4>
                            <span className="text-sm text-gray-600">
                              {new Date(enrollment.progress[0].assessmentDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {enrollment.progress[0].overallScore && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Score</span>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const ScoreIcon = getScoreIcon(enrollment.progress[0].overallScore)
                                    return <ScoreIcon className={`w-5 h-5 ${getScoreColor(enrollment.progress[0].overallScore)}`} />
                                  })()}
                                  <span className={`text-2xl font-bold ${getScoreColor(enrollment.progress[0].overallScore)}`}>
                                    {enrollment.progress[0].overallScore}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all ${
                                    enrollment.progress[0].overallScore >= 80 ? 'bg-green-500' :
                                    enrollment.progress[0].overallScore >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${enrollment.progress[0].overallScore}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {enrollment.progress[0].speakingScore && (
                              <div className="bg-white rounded-lg p-3 text-center">
                                <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-xs text-gray-500 mb-1">Speaking</div>
                                <div className="text-lg font-semibold">{enrollment.progress[0].speakingScore}%</div>
                              </div>
                            )}
                            {enrollment.progress[0].listeningScore && (
                              <div className="bg-white rounded-lg p-3 text-center">
                                <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                <div className="text-xs text-gray-500 mb-1">Listening</div>
                                <div className="text-lg font-semibold">{enrollment.progress[0].listeningScore}%</div>
                              </div>
                            )}
                            {enrollment.progress[0].readingScore && (
                              <div className="bg-white rounded-lg p-3 text-center">
                                <BookOpen className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                <div className="text-xs text-gray-500 mb-1">Reading</div>
                                <div className="text-lg font-semibold">{enrollment.progress[0].readingScore}%</div>
                              </div>
                            )}
                            {enrollment.progress[0].writingScore && (
                              <div className="bg-white rounded-lg p-3 text-center">
                                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                <div className="text-xs text-gray-500 mb-1">Writing</div>
                                <div className="text-lg font-semibold">{enrollment.progress[0].writingScore}%</div>
                              </div>
                            )}
                            {enrollment.progress[0].attendanceRate && (
                              <div className="bg-white rounded-lg p-3 text-center">
                                <CheckCircle className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                <div className="text-xs text-gray-500 mb-1">Attendance</div>
                                <div className="text-lg font-semibold">{enrollment.progress[0].attendanceRate}%</div>
                              </div>
                            )}
                          </div>

                          {enrollment.progress[0].notes && (
                            <div className="mt-4 p-3 bg-white rounded-lg">
                              <p className="text-sm text-gray-600 italic">"{enrollment.progress[0].notes}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress History */}
                      {enrollment.progress.length > 1 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Progress History
                          </h4>
                          <div className="space-y-3">
                            {enrollment.progress.slice(1).map((progress) => (
                              <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(progress.assessmentDate).toLocaleDateString()}
                                  </span>
                                  {progress.overallScore && (
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const ScoreIcon = getScoreIcon(progress.overallScore)
                                        return <ScoreIcon className={`w-4 h-4 ${getScoreColor(progress.overallScore)}`} />
                                      })()}
                                      <span className={`text-sm font-bold ${getScoreColor(progress.overallScore)}`}>
                                        {progress.overallScore}%
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                                  {progress.speakingScore && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <BookOpen className="w-3 h-3" />
                                      Speaking: {progress.speakingScore}%
                                    </div>
                                  )}
                                  {progress.listeningScore && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Activity className="w-3 h-3" />
                                      Listening: {progress.listeningScore}%
                                    </div>
                                  )}
                                  {progress.readingScore && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <BookOpen className="w-3 h-3" />
                                      Reading: {progress.readingScore}%
                                    </div>
                                  )}
                                  {progress.writingScore && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <Star className="w-3 h-3" />
                                      Writing: {progress.writingScore}%
                                    </div>
                                  )}
                                  {progress.attendanceRate && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <CheckCircle className="w-3 h-3" />
                                      Attendance: {progress.attendanceRate}%
                                    </div>
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
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h4>
                      <p className="text-gray-600">Your teacher hasn't assessed your progress in this class yet.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
