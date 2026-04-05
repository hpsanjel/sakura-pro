"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface DocumentStats {
  totalStudents: number
  totalDocuments: number
  missingDocuments: number
  uploadedDocuments: number
  verifiedDocuments: number
  rejectedDocuments: number
}

export default function DocumentsSummary() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.consultancyId) {
      fetchDocumentStats()
    }
  }, [session])

  const fetchDocumentStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/documents-stats`)
      if (!response.ok) {
        throw new Error("Failed to fetch document stats")
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching document stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Unable to load document statistics.</p>
      </div>
    )
  }

  const completionRate = stats.totalDocuments > 0 
    ? Math.round((stats.verifiedDocuments / stats.totalDocuments) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            {stats.totalStudents}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>Total Students</div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Active in system</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
          borderRadius: '16px', 
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#2563eb', marginBottom: '8px' }}>
            {stats.uploadedDocuments}
          </div>
          <div style={{ fontSize: '16px', color: '#1d4ed8', fontWeight: '500' }}>Uploaded</div>
          <div style={{ fontSize: '14px', color: '#93c5fd', marginTop: '4px' }}>Documents received</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          borderRadius: '16px', 
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
            {stats.verifiedDocuments}
          </div>
          <div style={{ fontSize: '16px', color: '#15803d', fontWeight: '500' }}>Verified</div>
          <div style={{ fontSize: '14px', color: '#86efac', marginTop: '4px' }}>Approved documents</div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
          borderRadius: '16px', 
          border: '1px solid #fecaca'
        }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            {stats.missingDocuments}
          </div>
          <div style={{ fontSize: '16px', color: '#b91c1c', fontWeight: '500' }}>Missing</div>
          <div style={{ fontSize: '14px', color: '#fca5a5', marginTop: '4px' }}>Need attention</div>
        </div>
      </div>

      {/* Document Status Breakdown */}
      <div>
        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>Document Status Overview</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Completion Rate */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              margin: '0 auto 16px',
              position: 'relative'
            }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                {completionRate}%
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Completion Rate
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {stats.verifiedDocuments} of {stats.totalDocuments} documents verified
            </div>
          </div>

          {/* Status Breakdown */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
              Status Breakdown
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                  <span style={{ fontSize: '14px', color: '#475569' }}>Uploaded</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{stats.uploadedDocuments}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span style={{ fontSize: '14px', color: '#475569' }}>Verified</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{stats.verifiedDocuments}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626' }}></div>
                  <span style={{ fontSize: '14px', color: '#475569' }}>Missing</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{stats.missingDocuments}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                  <span style={{ fontSize: '14px', color: '#475569' }}>Rejected</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{stats.rejectedDocuments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Insights */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        borderRadius: '16px', 
        padding: '24px', 
        border: '1px solid #e2e8f0' 
      }}>
        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>📋 Document Insights</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981' 
            }}></div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{completionRate}%</strong> overall completion rate
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
              <strong>{stats.missingDocuments}</strong> documents still needed
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#dc2626' 
            }}></div>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{stats.rejectedDocuments}</strong> documents need resubmission
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
