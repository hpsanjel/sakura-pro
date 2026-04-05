import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowEngine } from '@/lib/workflow-engine'

const prisma = new PrismaClient()

// GET /api/workflows/executions - Get workflow executions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    const where: any = {
      consultancyId: session.user.consultancyId
    }

    if (status) {
      where.status = status
    }

    if (studentId) {
      where.studentId = studentId
    }

    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              name: true,
              triggerEvent: true
            }
          },
          student: {
            select: {
              name: true,
              email: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          },
          notifications: {
            select: {
              id: true,
              status: true,
              type: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.workflowExecution.count({ where })
    ])

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching workflow executions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
