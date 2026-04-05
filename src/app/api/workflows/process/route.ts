import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowEngine } from '@/lib/workflow-engine'

// POST /api/workflows/process - Process scheduled workflows
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflowEngine = getWorkflowEngine(prisma)
    
    // Process scheduled workflows
    await workflowEngine.processScheduledWorkflows()

    return NextResponse.json({ 
      message: 'Scheduled workflows processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing scheduled workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
