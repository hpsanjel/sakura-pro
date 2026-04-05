import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWorkflowEngine } from '@/lib/workflow-engine'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    console.log('Fetching notifications for user:', session.user.id, 'unreadOnly:', unreadOnly)
    
    // Build where clause
    const where: any = {
      recipientId: session.user.id
    }
    
    if (unreadOnly) {
      where.status = 'SENT'
    }

    // Fetch notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          execution: {
            include: {
              student: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error in notifications:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    }, { status: 500 })
  }
}
