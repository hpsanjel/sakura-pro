"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface PipelineStats {
  NEW_LEAD: number
  DOCS_PENDING: number
  DOCS_VERIFIED: number
  SENT_TO_JAPAN: number
  COE_APPLIED: number
  COE_APPROVED: number
  VISA_APPLIED: number
  VISA_APPROVED: number
  REJECTED: number
}

const STAGE_INFO = {
  NEW_LEAD: { label: "New Leads", color: "bg-gray-100 text-gray-800", emoji: "👋" },
  DOCS_PENDING: { label: "Docs Pending", color: "bg-yellow-100 text-yellow-800", emoji: "📋" },
  DOCS_VERIFIED: { label: "Docs Verified", color: "bg-blue-100 text-blue-800", emoji: "✅" },
  SENT_TO_JAPAN: { label: "Sent to Japan", color: "bg-purple-100 text-purple-800", emoji: "🇯🇵" },
  COE_APPLIED: { label: "COE Applied", color: "bg-indigo-100 text-indigo-800", emoji: "📝" },
  COE_APPROVED: { label: "COE Approved", color: "bg-green-100 text-green-800", emoji: "✅" },
  VISA_APPLIED: { label: "Visa Applied", color: "bg-orange-100 text-orange-800", emoji: "🛂" },
  VISA_APPROVED: { label: "Visa Approved", color: "bg-emerald-100 text-emerald-800", emoji: "🎉" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", emoji: "❌" },
}

export default function PipelineSummary() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    
    if (status === "authenticated" && session?.user.consultancyId && session?.user.role !== 'STUDENT') {
      fetchPipelineStats()
    } else if (status === "authenticated" && session?.user.role === 'STUDENT') {
      // Students don't see pipeline data
      setLoading(false)
    } else {
      // No session or missing required data
      setLoading(false)
    }
  }, [session, status])

  const fetchPipelineStats = async () => {
    try {
      const response = await fetch("/api/pipeline")
      if (!response.ok) {
        throw new Error(`Failed to fetch pipeline stats: ${response.status}`)
      }
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching pipeline stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pipeline Summary</h2>
        {status === "unauthenticated" ? (
          <p className="text-gray-500">Please sign in to view pipeline statistics.</p>
        ) : session?.user?.role === 'STUDENT' ? (
          <p className="text-gray-500">Pipeline statistics are not available for student accounts.</p>
        ) : (
          <p className="text-gray-500">Unable to load pipeline statistics.</p>
        )}
      </div>
    )
  }

  const totalStudents = Object.values(stats).reduce((sum, count) => sum + count, 0)
  const approvedStudents = stats.VISA_APPROVED
  const rejectedStudents = stats.REJECTED
  const successRate = totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0
  const rejectionRate = totalStudents > 0 ? Math.round((rejectedStudents / totalStudents) * 100) : 0

  // Calculate conversion rates between key stages
  const docsVerifiedRate = (stats.DOCS_PENDING + stats.DOCS_VERIFIED) > 0 
    ? Math.round((stats.DOCS_VERIFIED / (stats.DOCS_PENDING + stats.DOCS_VERIFIED)) * 100)
    : 0
  
  const coeApprovalRate = (stats.COE_APPLIED + stats.COE_APPROVED) > 0
    ? Math.round((stats.COE_APPROVED / (stats.COE_APPLIED + stats.COE_APPROVED)) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            {totalStudents}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>Total Students</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Active pipeline</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          borderRadius: '16px', 
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
            {approvedStudents}
          </div>
          <div style={{ fontSize: '16px', color: '#15803d', fontWeight: '500' }}>Visa Approved</div>
          <div style={{ fontSize: '14px', color: '#86efac', marginTop: '4px' }}>Success stories</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
          borderRadius: '16px', 
          border: '1px solid #fecaca'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            {rejectedStudents}
          </div>
          <div style={{ fontSize: '16px', color: '#b91c1c', fontWeight: '500' }}>Rejected</div>
          <div style={{ fontSize: '14px', color: '#fca5a5', marginTop: '4px' }}>Need attention</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
          borderRadius: '16px', 
          border: '1px solid #fed7aa'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#d97706', marginBottom: '8px' }}>
            {successRate}%
          </div>
          <div style={{ fontSize: '16px', color: '#92400e', fontWeight: '500' }}>Success Rate</div>
          <div style={{ fontSize: '14px', color: '#fbbf24', marginTop: '4px' }}>Approval ratio</div>
        </div>
      </div>

      {/* Pipeline Stages Grid */}
      <div>
        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>Students by Visa Stage</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {Object.entries(stats).map(([stage, count]) => {
            const stageInfo = STAGE_INFO[stage as keyof typeof STAGE_INFO]
            const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
            
            return (
              <div
                key={stage}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#475569',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {stageInfo.label}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {percentage}% of total
                    </div>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    background: stageInfo.color.replace('text-', 'bg-').replace('800', '100'),
                    color: stageInfo.color.replace('text-', '').replace('-800', '')
                  }}>
                    {stageInfo.emoji}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: stageInfo.color.replace('text-', '#').replace('-800', ''),
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                
                {/* Stage Description */}
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                  {stage === 'NEW_LEAD' && 'Initial contact and information gathering'}
                  {stage === 'DOCS_PENDING' && 'Document collection in progress'}
                  {stage === 'DOCS_VERIFIED' && 'All documents verified and complete'}
                  {stage === 'SENT_TO_JAPAN' && 'Application submitted to Japan'}
                  {stage === 'COE_APPLIED' && 'Certificate of Eligibility requested'}
                  {stage === 'COE_APPROVED' && 'COE received and verified'}
                  {stage === 'VISA_APPLIED' && 'Visa application submitted'}
                  {stage === 'VISA_APPROVED' && 'Visa approved - ready to travel'}
                  {stage === 'REJECTED' && 'Application rejected - needs review'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        borderRadius: '16px', 
        padding: '24px', 
        border: '1px solid #e2e8f0' 
      }}>
        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>📊 Pipeline Insights</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981' 
            }}></div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{stats.DOCS_VERIFIED + stats.SENT_TO_JAPAN}</strong> students ready for Japan submission
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#f59e0b' 
            }}></div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{stats?.DOCS_PENDING || 0}</strong> students need document completion
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#6366f1' 
            }}></div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{stats?.COE_APPLIED || 0}</strong> awaiting Certificate of Eligibility
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
