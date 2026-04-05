import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching unread count for user:', session.user.id)
    
    // Count unread notifications (status = SENT)
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: session.user.id,
        status: 'SENT'
      }
    })
    
    console.log(`User ${session.user.id} has ${unreadCount} unread notifications`)
    
    return NextResponse.json({ unreadCount })
    
  } catch (error) {
    console.error('Error in unread count:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      unreadCount: 0 
    }, { status: 500 })
  }
}
