import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowEngine } from '@/lib/workflow-engine'
import { TriggerEvent } from '@/generated/prisma'

const prisma = new PrismaClient()

// POST /api/workflows/trigger - Trigger workflow event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const triggerSchema = {
      event: 'string',
      consultancyId: 'string',
      studentId: 'string?',
      userId: 'string?',
      data: 'object'
    }

    // Basic validation
    if (!body.event || !body.consultancyId) {
      return NextResponse.json({ 
        error: 'Missing required fields: event and consultancyId' 
      }, { status: 400 })
    }

    // Validate consultancyId matches session
    if (body.consultancyId !== session.user.consultancyId) {
      return NextResponse.json({ error: 'Invalid consultancyId' }, { status: 403 })
    }

    // Validate trigger event
    if (!Object.values(TriggerEvent).includes(body.event)) {
      return NextResponse.json({ 
        error: 'Invalid trigger event',
        validEvents: Object.values(TriggerEvent)
      }, { status: 400 })
    }

    const workflowEngine = getWorkflowEngine(prisma)
    
    // Initialize templates if needed
    await workflowEngine.initializeTemplates(session.user.consultancyId)

    // Trigger the event
    await workflowEngine.triggerEvent(body.event as TriggerEvent, {
      consultancyId: body.consultancyId,
      studentId: body.studentId,
      userId: body.userId,
      ...body.data
    })

    return NextResponse.json({ 
      message: 'Workflow event triggered successfully',
      event: body.event,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
