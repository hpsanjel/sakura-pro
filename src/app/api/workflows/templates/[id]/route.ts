import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TriggerEvent, TimingType, RecipientType, NotificationChannel, NotificationPriority } from '@/generated/prisma'

// PUT /api/workflows/templates/[id] - Update reminder template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId || !['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if template exists and belongs to consultancy
    const existingTemplate = await prisma.reminderTemplate.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Clone the request to avoid body stream issues
    const clonedRequest = request.clone()
    const body = await clonedRequest.json()
    console.log('Received update body for template', id, ':', body)
    
    const updateTemplateSchema = z.object({
      name: z.string().min(1, 'Template name is required').optional(),
      description: z.string().optional(),
      triggerEvent: z.nativeEnum(TriggerEvent).optional(),
      triggerCondition: z.any().optional(),
      timingType: z.nativeEnum(TimingType).optional(),
      timingValue: z.number().optional(),
      messageTemplate: z.string().min(1, 'Message template is required').optional(),
      inAppMessage: z.string().optional(),
      recipientType: z.nativeEnum(RecipientType).optional(),
      priority: z.nativeEnum(NotificationPriority).optional(),
      channels: z.array(z.nativeEnum(NotificationChannel)).min(1, 'At least one channel is required').optional(),
      isActive: z.boolean().optional()
    })

    const validatedData = updateTemplateSchema.parse(body)
    console.log('Validated update data:', validatedData)

    const template = await prisma.reminderTemplate.update({
      where: { id },
      data: validatedData
    })

    console.log('Template updated successfully:', template)
    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error updating reminder template:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// DELETE /api/workflows/templates/[id] - Delete reminder template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId || !['ADMIN', 'COUNSELOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if template exists and belongs to consultancy
    const existingTemplate = await prisma.reminderTemplate.findFirst({
      where: {
        id,
        consultancyId: session.user.consultancyId
      },
      include: {
        executions: {
          take: 1
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Don't allow deletion if template has executions
    if (existingTemplate.executions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete template that has been used. Consider deactivating it instead.' 
      }, { status: 400 })
    }

    await prisma.reminderTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting reminder template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
