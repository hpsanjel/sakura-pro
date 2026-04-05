import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWorkflowEngine } from '@/lib/workflow-engine'

const prisma = new PrismaClient()

// Example middleware to trigger events based on system actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.consultancyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const workflowEngine = getWorkflowEngine(prisma)
    
    // Initialize templates if needed
    await workflowEngine.initializeTemplates(session.user.consultancyId)

    // Trigger events based on actions
    switch (action) {
      case 'student_created':
        await workflowEngine.triggerEvent('STUDENT_CREATED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          ...data
        })
        break

      case 'document_uploaded':
        await workflowEngine.triggerEvent('DOCUMENT_UPLOADED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          documentType: data.documentType,
          uploadDate: data.uploadDate,
          ...data
        })
        break

      case 'document_verified':
        await workflowEngine.triggerEvent('DOCUMENT_VERIFIED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          documentType: data.documentType,
          verifiedDate: data.verifiedDate,
          ...data
        })
        break

      case 'document_rejected':
        await workflowEngine.triggerEvent('DOCUMENT_REJECTED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          documentType: data.documentType,
          rejectionReason: data.rejectionReason,
          rejectedDate: data.rejectedDate,
          ...data
        })
        break

      case 'payment_due':
        await workflowEngine.triggerEvent('PAYMENT_DUE', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          feeType: data.feeType,
          amount: data.amount,
          dueDate: data.dueDate,
          ...data
        })
        break

      case 'payment_overdue':
        await workflowEngine.triggerEvent('PAYMENT_OVERDUE', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          feeType: data.feeType,
          amount: data.amount,
          dueDate: data.dueDate,
          daysOverdue: data.daysOverdue,
          ...data
        })
        break

      case 'payment_received':
        await workflowEngine.triggerEvent('PAYMENT_RECEIVED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          feeType: data.feeType,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
          receivedDate: data.receivedDate,
          ...data
        })
        break

      case 'interview_scheduled':
        await workflowEngine.triggerEvent('INTERVIEW_SCHEDULED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          interviewType: data.interviewType,
          interviewDate: data.interviewDate,
          interviewTime: data.interviewTime,
          duration: data.duration,
          location: data.location,
          interviewerName: data.interviewerName,
          ...data
        })
        break

      case 'visa_status_changed':
        await workflowEngine.triggerEvent('VISA_STATUS_CHANGED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          updateDate: data.updateDate,
          ...data
        })
        break

      case 'application_submitted':
        await workflowEngine.triggerEvent('APPLICATION_SUBMITTED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          schoolName: data.schoolName,
          programName: data.programName,
          submissionDate: data.submissionDate,
          applicationId: data.applicationId,
          ...data
        })
        break

      case 'application_accepted':
        await workflowEngine.triggerEvent('APPLICATION_ACCEPTED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          schoolName: data.schoolName,
          programName: data.programName,
          acceptanceDate: data.acceptanceDate,
          responseDeadline: data.responseDeadline,
          ...data
        })
        break

      case 'class_enrolled':
        await workflowEngine.triggerEvent('CLASS_ENROLLED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          className: data.className,
          classLevel: data.classLevel,
          classSchedule: data.classSchedule,
          startDate: data.startDate,
          teacherName: data.teacherName,
          classroom: data.classroom,
          ...data
        })
        break

      case 'todo_assigned':
        await workflowEngine.triggerEvent('TODO_ASSIGNED', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          todoTitle: data.todoTitle,
          todoCategory: data.todoCategory,
          todoPriority: data.todoPriority,
          dueDate: data.dueDate,
          estimatedDays: data.estimatedDays,
          todoDescription: data.todoDescription,
          ...data
        })
        break

      case 'todo_overdue':
        await workflowEngine.triggerEvent('TODO_OVERDUE', {
          consultancyId: session.user.consultancyId,
          studentId: data.studentId,
          todoTitle: data.todoTitle,
          todoCategory: data.todoCategory,
          todoPriority: data.todoPriority,
          dueDate: data.dueDate,
          daysOverdue: data.daysOverdue,
          progress: data.progress,
          ...data
        })
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Event triggered successfully',
      action,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
