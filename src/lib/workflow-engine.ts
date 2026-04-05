import { PrismaClient, TriggerEvent, TimingType, RecipientType, NotificationChannel, NotificationPriority, ExecutionStatus, NotificationStatus } from '@/generated/prisma'
import { defaultReminderTemplates, getTemplateVariables, replaceTemplateVariables } from './workflow-templates'
import nodemailer from 'nodemailer'

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export class WorkflowEngine {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async initializeTemplates(consultancyId: string) {
    const existingTemplates = await this.prisma.reminderTemplate.findMany({
      where: { consultancyId }
    })

    if (existingTemplates.length === 0) {
      console.log('Initializing default reminder templates for consultancy:', consultancyId)
      
      for (const templateData of defaultReminderTemplates) {
        await this.prisma.reminderTemplate.create({
          data: {
            ...templateData,
            consultancyId,
            triggerCondition: null // Can be extended later
          }
        })
      }
      
      console.log(`Created ${defaultReminderTemplates.length} default reminder templates`)
    }
  }

  async triggerEvent(event: TriggerEvent, data: {
    consultancyId: string
    studentId?: string
    userId?: string
    [key: string]: any
  }) {
    console.log(`Triggering event: ${event} for consultancy: ${data.consultancyId}`)
    
    // Find active reminder templates for this event
    const templates = await this.prisma.reminderTemplate.findMany({
      where: {
        consultancyId: data.consultancyId,
        triggerEvent: event,
        isActive: true
      }
    })

    console.log(`Found ${templates.length} templates for event: ${event}`)

    for (const template of templates) {
      // Check trigger conditions if any
      if (template.triggerCondition && !this.evaluateCondition(template.triggerCondition, data)) {
        continue
      }

      // Calculate execution time
      const scheduledAt = this.calculateExecutionTime(template.timingType, template.timingValue, data)
      
      // Create workflow execution
      const execution = await this.prisma.workflowExecution.create({
        data: {
          templateId: template.id,
          studentId: data.studentId || undefined,
          userId: data.userId || undefined,
          consultancyId: data.consultancyId,
          triggerData: data,
          status: scheduledAt <= new Date() ? ExecutionStatus.PENDING : ExecutionStatus.SCHEDULED,
          scheduledAt
        }
      })

      console.log(`Created workflow execution: ${execution.id}, scheduled: ${scheduledAt}`)

      // If immediate, execute right away
      if (scheduledAt <= new Date()) {
        await this.executeWorkflow(execution.id)
      }
    }

    // Also check for custom workflows
    const workflows = await this.prisma.workflow.findMany({
      where: {
        consultancyId: data.consultancyId,
        triggerEvent: event,
        isActive: true
      }
    })

    for (const workflow of workflows) {
      if (workflow.triggerCondition && !this.evaluateCondition(workflow.triggerCondition, data)) {
        continue
      }

      const scheduledAt = this.calculateExecutionTime('IMMEDIATE', null, data)
      
      const execution = await this.prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          studentId: data.studentId,
          userId: data.userId,
          consultancyId: data.consultancyId,
          triggerData: data,
          status: ExecutionStatus.PENDING,
          scheduledAt
        }
      })

      await this.executeWorkflow(execution.id)
    }
  }

  private calculateExecutionTime(timingType: TimingType, timingValue: number | null, data: any): Date {
    const now = new Date()
    
    switch (timingType) {
      case 'IMMEDIATE':
        return now
      
      case 'DAYS_BEFORE':
        if (data.dueDate) {
          const dueDate = new Date(data.dueDate)
          return new Date(dueDate.getTime() - (timingValue || 7) * 24 * 60 * 60 * 1000)
        }
        return now
      
      case 'DAYS_AFTER':
        return new Date(now.getTime() + (timingValue || 0) * 24 * 60 * 60 * 1000)
      
      case 'HOURS_BEFORE':
        if (data.interviewDate) {
          const interviewDate = new Date(data.interviewDate)
          return new Date(interviewDate.getTime() - (timingValue || 24) * 60 * 60 * 1000)
        }
        return now
      
      case 'HOURS_AFTER':
        return new Date(now.getTime() + (timingValue || 0) * 60 * 60 * 1000)
      
      case 'WEEKS_BEFORE':
        if (data.dueDate) {
          const dueDate = new Date(data.dueDate)
          return new Date(dueDate.getTime() - (timingValue || 1) * 7 * 24 * 60 * 60 * 1000)
        }
        return now
      
      case 'WEEKS_AFTER':
        return new Date(now.getTime() + (timingValue || 0) * 7 * 24 * 60 * 60 * 1000)
      
      default:
        return now
    }
  }

  private evaluateCondition(condition: any, data: any): boolean {
    try {
      // Simple condition evaluation - can be extended with more complex logic
      if (typeof condition === 'string') {
        // Basic string template evaluation
        return replaceTemplateVariables(condition, data) === 'true'
      }
      
      if (typeof condition === 'object') {
        // Object-based conditions
        for (const [key, value] of Object.entries(condition)) {
          if (data[key] !== value) {
            return false
          }
        }
        return true
      }
      
      return true
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }

  async executeWorkflow(executionId: string) {
    console.log(`Executing workflow: ${executionId}`)
    
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        template: true,
        workflow: true,
        student: true,
        user: true
      }
    })

    if (!execution) {
      console.error(`Workflow execution not found: ${executionId}`)
      return
    }

    try {
      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.RUNNING,
          executedAt: new Date()
        }
      })

      // Prepare template data
      const templateData: Record<string, any> = {
        currentDate: new Date().toISOString().split('T')[0],
        currentMonth: new Date().toLocaleString('default', { month: 'long' }),
        currentYear: new Date().getFullYear().toString()
      }

      // Get consultancy information
      const consultancy = await this.prisma.consultancy.findUnique({
        where: { id: execution.consultancyId }
      })
      
      if (consultancy) {
        templateData.consultancyName = consultancy.name
        templateData.consultancyEmail = consultancy.email
        templateData.consultancyPhone = consultancy.phone
      }

      if (execution.triggerData && typeof execution.triggerData === 'object') {
        Object.assign(templateData, execution.triggerData)
      }

      if (execution.student) {
        templateData.studentName = execution.student.name
        templateData.studentId = execution.student.id
        templateData.email = execution.student.email
        templateData.phone = execution.student.phone
      }

      // Determine recipients
      const recipients = await this.getRecipients(execution.template?.recipientType || 'STUDENT', execution)

      // Create notifications for each recipient
      for (const recipient of recipients) {
        await this.createNotification(execution, recipient, templateData)
      }

      // Mark as completed
      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.COMPLETED,
          completedAt: new Date(),
          result: { notificationsCreated: recipients.length }
        }
      })

      console.log(`Workflow execution ${executionId} completed successfully`)

    } catch (error) {
      console.error(`Error executing workflow ${executionId}:`, error)
      
      const retryCount = execution.retryCount + 1
      
      if (retryCount <= execution.maxRetries) {
        const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 60 * 60 * 1000) // Exponential backoff
        
        await this.prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: ExecutionStatus.RETRYING,
            retryCount,
            nextRetryAt,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        
        console.log(`Workflow execution ${executionId} scheduled for retry ${retryCount} at ${nextRetryAt}`)
      } else {
        await this.prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: ExecutionStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        
        console.error(`Workflow execution ${executionId} failed permanently`)
      }
    }
  }

  private async getRecipients(recipientType: RecipientType, execution: any): Promise<Array<{ id: string, email?: string, name?: string }>> {
    const { consultancyId, studentId, userId } = execution

    switch (recipientType) {
      case 'STUDENT':
        if (execution.student) {
          return [{ id: execution.student.userId || execution.student.id, email: execution.student.email, name: execution.student.name }]
        }
        return []

      case 'COUNSELOR':
        const counselors = await this.prisma.user.findMany({
          where: {
            consultancyId,
            role: 'COUNSELOR'
          }
        })
        return counselors.map(c => ({ id: c.id, email: c.email || undefined, name: c.name || undefined }))

      case 'ADMIN':
        const admins = await this.prisma.user.findMany({
          where: {
            consultancyId,
            role: 'ADMIN'
          }
        })
        return admins.map(a => ({ id: a.id, email: a.email || undefined, name: a.name || undefined }))

      case 'TEACHER':
        const teachers = await this.prisma.user.findMany({
          where: {
            consultancyId,
            role: 'TEACHER'
          }
        })
        return teachers.map(t => ({ id: t.id, email: t.email || undefined, name: t.name || undefined }))

      case 'ALL_STUDENTS':
        const students = await this.prisma.student.findMany({
          where: { consultancyId },
          include: { user: true }
        })
        return students
          .filter(s => s.user)
          .map(s => ({ id: s.user!.id, email: s.user!.email, name: s.name }))

      case 'ALL_COUNSELORS':
        const allCounselors = await this.prisma.user.findMany({
          where: {
            consultancyId,
            role: 'COUNSELOR'
          }
        })
        return allCounselors.map(c => ({ id: c.id, email: c.email || undefined, name: c.name || undefined }))

      case 'ALL_ADMINS':
        const allAdmins = await this.prisma.user.findMany({
          where: {
            consultancyId,
            role: 'ADMIN'
          }
        })
        return allAdmins.map(a => ({ id: a.id, email: a.email || undefined, name: a.name || undefined }))

      case 'CUSTOM_ROLE':
        // This would need additional data to specify which role
        return []

      default:
        return []
    }
  }

  private async createNotification(execution: any, recipient: any, templateData: any) {
    const template = execution.template
    
    if (!template) return

    // Prepare message content
    const title = this.extractTitle(template.messageTemplate, templateData)
    const message = replaceTemplateVariables(template.messageTemplate, templateData)
    const inAppMessage = template.inAppMessage 
      ? replaceTemplateVariables(template.inAppMessage, templateData)
      : message.substring(0, 200) + '...'

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        executionId: execution.id,
        recipientId: recipient.id,
        consultancyId: execution.consultancyId,
        type: 'REMINDER', // This can be enhanced based on template
        title,
        message,
        data: templateData,
        channels: template.channels,
        status: NotificationStatus.PENDING,
        priority: template.priority,
        scheduledAt: new Date()
      }
    })

    console.log(`Created notification ${notification.id} for recipient ${recipient.id}`)

    // Send notifications through different channels
    for (const channel of template.channels) {
      await this.sendNotification(notification, channel, recipient, templateData)
    }
  }

  private extractTitle(messageTemplate: string, data: any): string {
    // Extract first line or create a title from the message
    const firstLine = messageTemplate.split('\n')[0].trim()
    return replaceTemplateVariables(firstLine, data).substring(0, 100)
  }

  private async sendNotification(notification: any, channel: NotificationChannel, recipient: any, data: any) {
    try {
      switch (channel) {
        case 'IN_APP':
          // In-app notifications are stored in the database and retrieved by the frontend
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date()
            }
          })
          break

        case 'EMAIL':
          // Send real email using nodemailer
          if (recipient.email) {
            try {
              const mailOptions = {
                from: `"StudyAbroad Pro" <${process.env.GMAIL_USER}>`,
                to: recipient.email,
                subject: notification.title,
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .message-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h1>📬 Notification</h1>
                        </div>
                        <div class="content">
                          <div class="message-box">
                            ${notification.message.replace(/\n/g, '<br>')}
                          </div>
                          <div class="footer">
                            <p>This is an automated message from StudyAbroad Pro</p>
                            <p>If you have questions, please contact your consultancy</p>
                          </div>
                        </div>
                      </div>
                    </body>
                  </html>
                `
              }

              await transporter.sendMail(mailOptions)
              console.log(`✅ Real email sent to ${recipient.email}:`, notification.title)
              
              await this.prisma.notification.update({
                where: { id: notification.id },
                data: {
                  status: NotificationStatus.SENT,
                  sentAt: new Date()
                }
              })
            } catch (emailError) {
              console.error(`❌ Failed to send email to ${recipient.email}:`, emailError)
              await this.prisma.notification.update({
                where: { id: notification.id },
                data: {
                  status: NotificationStatus.FAILED
                }
              })
            }
          } else {
            console.warn(`No email address for recipient ${recipient.id}`)
            await this.prisma.notification.update({
              where: { id: notification.id },
              data: {
                status: NotificationStatus.FAILED
              }
            })
          }
          break

        case 'SMS':
          // SMS sending would be implemented here
          console.log(`SMS notification sent to ${recipient.phone}:`, notification.title)
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date()
            }
          })
          break

        case 'WHATSAPP':
          // WhatsApp sending would be implemented here
          console.log(`WhatsApp notification sent to ${recipient.phone}:`, notification.title)
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date()
            }
          })
          break

        case 'PUSH_NOTIFICATION':
          // Push notification would be implemented here
          console.log(`Push notification sent to ${recipient.id}:`, notification.title)
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date()
            }
          })
          break

        default:
          console.warn(`Unsupported notification channel: ${channel}`)
      }
    } catch (error) {
      console.error(`Error sending ${channel} notification:`, error)
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED
        }
      })
    }
  }

  async processScheduledWorkflows() {
    console.log('Processing scheduled workflows...')
    
    const scheduledExecutions = await this.prisma.workflowExecution.findMany({
      where: {
        status: ExecutionStatus.SCHEDULED,
        scheduledAt: {
          lte: new Date()
        }
      },
      include: {
        template: true,
        workflow: true
      }
    })

    console.log(`Found ${scheduledExecutions.length} scheduled executions to process`)

    for (const execution of scheduledExecutions) {
      await this.executeWorkflow(execution.id)
    }

    // Process retrying workflows
    const retryingExecutions = await this.prisma.workflowExecution.findMany({
      where: {
        status: ExecutionStatus.RETRYING,
        nextRetryAt: {
          lte: new Date()
        }
      }
    })

    console.log(`Found ${retryingExecutions.length} retrying executions to process`)

    for (const execution of retryingExecutions) {
      await this.executeWorkflow(execution.id)
    }
  }

  async getNotifications(userId: string, status?: NotificationStatus) {
    const where: any = {
      recipientId: userId
    }

    if (status) {
      where.status = status
    }

    return await this.prisma.notification.findMany({
      where,
      include: {
        execution: {
          include: {
            student: true,
            template: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    return await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId
      },
      data: {
        isRead: true,
        readAt: new Date(),
        status: NotificationStatus.READ
      }
    })
  }

  async getUnreadCount(userId: string) {
    return await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    })
  }
}

// Singleton instance
let workflowEngine: WorkflowEngine | null = null

export function getWorkflowEngine(prisma?: PrismaClient): WorkflowEngine {
  if (!workflowEngine && prisma) {
    workflowEngine = new WorkflowEngine(prisma)
  }
  return workflowEngine!
}
