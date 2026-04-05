"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { TrendingUp, BarChart3, Target, Calendar } from "lucide-react"

interface ProgressData {
  date: string
  overall?: number
  speaking?: number
  listening?: number
  reading?: number
  writing?: number
  attendance?: number
}

interface ProgressChartsProps {
  data: ProgressData[]
  title?: string
  showRadar?: boolean
  showComparison?: boolean
}

export function ProgressCharts({ data, title = "Progress Overview", showRadar = true, showComparison = true }: ProgressChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No progress data available for charts</p>
      </div>
    )
  }

  // Prepare data for different chart types
  const chartData = data.map(item => ({
    ...item,
    displayName: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  // Get latest data for radar chart
  const latestData = data[0]
  const radarData = [
    { subject: 'Speaking', value: latestData?.speaking || 0, fullMark: 100 },
    { subject: 'Listening', value: latestData?.listening || 0, fullMark: 100 },
    { subject: 'Reading', value: latestData?.reading || 0, fullMark: 100 },
    { subject: 'Writing', value: latestData?.writing || 0, fullMark: 100 },
    { subject: 'Attendance', value: latestData?.attendance || 0, fullMark: 100 }
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Overall Progress Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Progress Trend Over Time</h4>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayName" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="overall"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Overall Score"
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Attendance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Subject-wise Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-medium text-gray-900">Subject Performance</h4>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayName" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="speaking"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              name="Speaking"
            />
            <Line
              type="monotone"
              dataKey="listening"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="Listening"
            />
            <Line
              type="monotone"
              dataKey="reading"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              name="Reading"
            />
            <Line
              type="monotone"
              dataKey="writing"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              name="Writing"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart for Current Performance */}
      {showRadar && radarData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-medium text-gray-900">Current Performance Overview</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="subject" 
                stroke="#6b7280"
                fontSize={12}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={10}
              />
              <Radar
                name="Current Score"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Chart */}
      {showComparison && data.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-medium text-gray-900">Score Comparison</h4>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.slice(0, 5)}> {/* Show last 5 assessments */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="displayName" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="speaking" fill="#ef4444" name="Speaking" />
              <Bar dataKey="listening" fill="#10b981" name="Listening" />
              <Bar dataKey="reading" fill="#f59e0b" name="Reading" />
              <Bar dataKey="writing" fill="#8b5cf6" name="Writing" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// Helper function to prepare progress data for charts
export function prepareProgressData(progress: any[]): ProgressData[] {
  return progress
    .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime())
    .map(item => ({
      date: item.assessmentDate,
      overall: item.overallScore || 0,
      speaking: item.speakingScore || 0,
      listening: item.listeningScore || 0,
      reading: item.readingScore || 0,
      writing: item.writingScore || 0,
      attendance: item.attendanceRate || 0
    }))
    .filter(item => item.overall > 0 || item.speaking > 0 || item.listening > 0 || item.reading > 0 || item.writing > 0)
}
