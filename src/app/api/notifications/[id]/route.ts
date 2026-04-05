import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationStatus } from '@/generated/prisma'

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== PUT /api/notifications/[id] START ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.id ? 'Authenticated' : 'Not authenticated')
    
    if (!session?.user?.id) {
      console.log('ERROR: No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('Notification ID:', id)
    console.log('User ID:', session.user.id)
    
    // First verify the notification exists and belongs to the user
    console.log('Looking up notification...')
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: session.user.id
      }
    })

    console.log('Notification lookup result:', notification ? 'Found' : 'Not found')

    if (!notification) {
      console.log('ERROR: Notification not found or does not belong to user')
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    console.log('Found notification:', notification.id, 'status:', notification.status)

    // Update the notification directly
    console.log('Updating notification...')
    const result = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        status: NotificationStatus.READ
      }
    })

    console.log('Updated notification:', result)
    console.log('=== PUT /api/notifications/[id] SUCCESS ===')

    return NextResponse.json({ message: 'Notification marked as read', result })
  } catch (error) {
    console.error('=== PUT /api/notifications/[id] ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Full error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
