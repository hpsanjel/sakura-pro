import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowEngine } from '@/lib/workflow-engine'
import { TriggerEvent, TimingType, RecipientType, NotificationChannel, NotificationPriority } from '@/generated/prisma'

// GET /api/workflows/templates - List reminder templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const triggerEvent = searchParams.get('triggerEvent') as TriggerEvent | null

    const where: any = {
      consultancyId: session.user.consultancyId,
      isActive: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (triggerEvent) {
      where.triggerEvent = triggerEvent
    }

    console.log('Fetching templates with where clause:', where)

    const [templates, total] = await Promise.all([
      prisma.reminderTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.reminderTemplate.count({ where })
    ])

    console.log('Found templates:', templates.length)

    const response = {
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    console.log('Returning response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching reminder templates:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      templates: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    }, { status: 500 })
  }
}

// POST /api/workflows/templates - Create reminder template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId || !['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clone the request to avoid body stream issues
    const clonedRequest = request.clone()
    const body = await clonedRequest.json()
    console.log('Received request body:', body)
    
    const createTemplateSchema = z.object({
      name: z.string().min(1, 'Template name is required'),
      description: z.string().optional(),
      triggerEvent: z.nativeEnum(TriggerEvent),
      triggerCondition: z.any().optional(),
      timingType: z.nativeEnum(TimingType),
      timingValue: z.number().optional(),
      messageTemplate: z.string().min(1, 'Message template is required'),
      inAppMessage: z.string().optional(),
      recipientType: z.nativeEnum(RecipientType),
      priority: z.nativeEnum(NotificationPriority),
      channels: z.array(z.nativeEnum(NotificationChannel)).min(1, 'At least one channel is required')
    })

    const validatedData = createTemplateSchema.parse(body)
    console.log('Validated data:', validatedData)

    const template = await prisma.reminderTemplate.create({
      data: {
        ...validatedData,
        consultancyId: session.user.consultancyId
      }
    })

    console.log('Template created successfully:', template)
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating reminder template:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
