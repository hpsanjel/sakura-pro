import { TriggerEvent, TimingType, RecipientType, NotificationChannel, NotificationPriority } from '@/generated/prisma'

export interface ReminderTemplateData {
  name: string
  description?: string
  triggerEvent: TriggerEvent
  triggerCondition?: any
  timingType: TimingType
  timingValue?: number
  messageTemplate: string
  inAppMessage?: string
  recipientType: RecipientType
  priority: NotificationPriority
  channels: NotificationChannel[]
}

export const defaultReminderTemplates: ReminderTemplateData[] = [
  // Document Reminders
  {
    name: 'Document Upload Reminder',
    description: 'Remind students to upload missing documents',
    triggerEvent: 'DOCUMENT_UPLOADED',
    timingType: 'DAYS_AFTER',
    timingValue: 3,
    messageTemplate: `Dear {{studentName}},

This is a reminder to upload your {{documentType}} document. This document is required for your {{programType}} application.

Please upload it as soon as possible to avoid delays in your application process.

Documents needed:
- {{documentType}}
- Due date: {{dueDate}}

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '📄 Please upload your {{documentType}} document',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },
  {
    name: 'Document Verification Reminder',
    description: 'Notify counselors when documents need verification',
    triggerEvent: 'DOCUMENT_UPLOADED',
    timingType: 'IMMEDIATE',
    messageTemplate: `New document uploaded for verification:

Student: {{studentName}}
Document: {{documentType}}
Uploaded: {{uploadDate}}
Notes: {{notes}}

Please review and verify the document in the system.`,
    inAppMessage: '📋 New document requires verification: {{documentType}} for {{studentName}}',
    recipientType: 'COUNSELOR',
    priority: 'MEDIUM',
    channels: ['IN_APP']
  },
  {
    name: 'Document Rejection Follow-up',
    description: 'Follow up on rejected documents',
    triggerEvent: 'DOCUMENT_REJECTED',
    timingType: 'HOURS_AFTER',
    timingValue: 2,
    messageTemplate: `Dear {{studentName}},

Your {{documentType}} document has been rejected for the following reason:
{{rejectionReason}}

Please upload the corrected document as soon as possible. If you have questions, contact your counselor.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '❌ Your {{documentType}} document was rejected. Please re-upload.',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },

  // Payment Reminders
  {
    name: 'Payment Due Reminder',
    description: 'Remind students about upcoming payments',
    triggerEvent: 'PAYMENT_DUE',
    timingType: 'DAYS_BEFORE',
    timingValue: 7,
    messageTemplate: `Dear {{studentName}},

This is a reminder that your {{feeType}} payment of {{amount}} {{currency}} is due on {{dueDate}}.

Payment details:
- Type: {{feeType}}
- Amount: {{amount}} {{currency}}
- Due date: {{dueDate}}
- Status: {{status}}

Please make the payment before the due date to avoid late fees.

Payment methods available:
- Bank Transfer
- Credit Card
- Online Payment

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '💰 Payment reminder: {{feeType}} payment due in 7 days',
    recipientType: 'STUDENT',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL']
  },
  {
    name: 'Payment Overdue Notice',
    description: 'Notify about overdue payments',
    triggerEvent: 'PAYMENT_OVERDUE',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName},

Your {{feeType}} payment of {{amount}} {{currency}} was due on {{dueDate}} and is now overdue.

Overdue payment details:
- Type: {{feeType}}
- Amount: {{amount}} {{currency}}
- Due date: {{dueDate}}
- Days overdue: {{daysOverdue}}
- Late fee: {{lateFee}} {{currency}}

Please make the payment immediately to avoid additional charges and service disruption.

Contact us immediately if you're facing any issues.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '⚠️ URGENT: Your {{feeType}} payment is overdue!',
    recipientType: 'STUDENT',
    priority: 'URGENT',
    channels: ['IN_APP', 'EMAIL', 'SMS']
  },
  {
    name: 'Payment Confirmation',
    description: 'Confirm received payments',
    triggerEvent: 'PAYMENT_RECEIVED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

Thank you for your payment!

Payment details:
- Type: {{feeType}}
- Amount: {{amount}} {{currency}}
- Payment method: {{paymentMethod}}
- Transaction ID: {{transactionId}}
- Received date: {{receivedDate}}

Your payment has been processed and your account updated.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '✅ Payment received: {{amount}} {{currency}} for {{feeType}}',
    recipientType: 'STUDENT',
    priority: 'LOW',
    channels: ['IN_APP', 'EMAIL']
  },

  // Interview Reminders
  {
    name: 'Interview Scheduled',
    description: 'Notify about scheduled interviews',
    triggerEvent: 'INTERVIEW_SCHEDULED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

Your {{interviewType}} interview has been scheduled:

Interview details:
- Type: {{interviewType}}
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Duration: {{duration}} minutes
- Location: {{location}}
- Interviewer: {{interviewerName}}

Please prepare accordingly and be available at the scheduled time.

Interview preparation tips:
- Review your application materials
- Practice common interview questions
- Test your technical setup (if online)

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '🗓️ {{interviewType}} interview scheduled on {{interviewDate}} at {{interviewTime}}',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },
  {
    name: 'Interview Reminder (24 hours)',
    description: 'Remind students 24 hours before interview',
    triggerEvent: 'INTERVIEW_SCHEDULED',
    timingType: 'HOURS_BEFORE',
    timingValue: 24,
    messageTemplate: `Dear {{studentName}},

This is a reminder that you have a {{interviewType}} interview tomorrow:

Interview details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Duration: {{duration}} minutes
- Location: {{location}}
- Interviewer: {{interviewerName}}

Please ensure you're prepared and available on time.

Good luck!
{{consultancyName}} Team`,
    inAppMessage: '⏰ Reminder: {{interviewType}} interview tomorrow at {{interviewTime}}',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },

  // Visa Status Updates
  {
    name: 'Visa Status Change',
    description: 'Notify about visa status changes',
    triggerEvent: 'VISA_STATUS_CHANGED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

Your visa application status has been updated:

Status update:
- Previous status: {{previousStatus}}
- Current status: {{newStatus}}
- Update date: {{updateDate}}

{{#if isApproved}}
Congratulations! Your visa has been approved. Please contact us for next steps.
{{/if}}

{{#if isRejected}}
We're sorry to inform you that your visa was rejected. Please contact us to discuss options.
{{/if}}

{{#if needsAction}}
Additional action is required. Please contact your counselor immediately.
{{/if}}

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '📋 Visa status updated: {{newStatus}}',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },

  // Application Updates
  {
    name: 'Application Submitted',
    description: 'Confirm application submission',
    triggerEvent: 'APPLICATION_SUBMITTED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

Your application to {{schoolName}} has been successfully submitted!

Application details:
- School: {{schoolName}}
- Program: {{programName}}
- Submitted date: {{submissionDate}}
- Application ID: {{applicationId}}

What happens next:
1. School will review your application
2. We'll notify you of any updates
3. Additional documents may be requested

Track your application status in your dashboard.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '📤 Application submitted to {{schoolName}}',
    recipientType: 'STUDENT',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL']
  },
  {
    name: 'Application Accepted',
    description: 'Celebrate application acceptance',
    triggerEvent: 'APPLICATION_ACCEPTED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

🎉 Congratulations! Your application to {{schoolName}} has been accepted!

Acceptance details:
- School: {{schoolName}}
- Program: {{programName}}
- Acceptance date: {{acceptanceDate}}
- Response deadline: {{responseDeadline}}

Next steps:
1. Review the acceptance letter
2. Accept or decline the offer
3. Complete any remaining requirements
4. Prepare for visa application

Contact your counselor to discuss the next steps.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '🎉 Congratulations! Accepted to {{schoolName}}!',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },

  // Class Management
  {
    name: 'Class Enrollment Confirmation',
    description: 'Confirm class enrollment',
    triggerEvent: 'CLASS_ENROLLED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName},

You have been successfully enrolled in {{className}}!

Class details:
- Class: {{className}}
- Level: {{classLevel}}
- Schedule: {{classSchedule}}
- Start date: {{startDate}}
- Teacher: {{teacherName}}
- Classroom: {{classroom}}

Class materials and schedule will be available in your dashboard.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '📚 Enrolled in {{className}} - {{classLevel}}',
    recipientType: 'STUDENT',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL']
  },

  // Todo/Task Management
  {
    name: 'Todo Assignment',
    description: 'Notify about new todo assignments',
    triggerEvent: 'TODO_ASSIGNED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

A new task has been assigned to you:

Task details:
- Task: {{todoTitle}}
- Category: {{todoCategory}}
- Priority: {{todoPriority}}
- Due date: {{dueDate}}
- Estimated time: {{estimatedDays}} days

Description:
{{todoDescription}}

Please complete this task before the due date. Track your progress in your dashboard.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '📝 New task assigned: {{todoTitle}} (due {{dueDate}})',
    recipientType: 'STUDENT',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL']
  },
  {
    name: 'Todo Overdue Reminder',
    description: 'Remind about overdue todos',
    triggerEvent: 'TODO_OVERDUE',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

The following task is now overdue:

Task details:
- Task: {{todoTitle}}
- Category: {{todoCategory}}
- Priority: {{todoPriority}}
- Due date: {{dueDate}} ({{daysOverdue}} days overdue)
- Progress: {{progress}}%

Please complete this task as soon as possible to avoid delays in your application process.

Contact your counselor if you need help or an extension.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '⚠️ Task overdue: {{todoTitle}} was due {{daysOverdue}} days ago',
    recipientType: 'STUDENT',
    priority: 'HIGH',
    channels: ['IN_APP', 'EMAIL']
  },

  // Student Lifecycle
  {
    name: 'Student Welcome',
    description: 'Welcome new students',
    triggerEvent: 'STUDENT_CREATED',
    timingType: 'IMMEDIATE',
    messageTemplate: `Dear {{studentName}},

Welcome to {{consultancyName}}! We're excited to help you on your journey to study in Japan.

Your student account has been created:
- Student ID: {{studentId}}
- Email: {{email}}
- Assigned counselor: {{counselorName}}

Next steps:
1. Complete your profile information
2. Upload required documents
3. Schedule a consultation with your counselor

We'll guide you through every step of the application process.

Best regards,
{{consultancyName}} Team`,
    inAppMessage: '👋 Welcome to {{consultancyName}}! Your journey to Japan starts here.',
    recipientType: 'STUDENT',
    priority: 'MEDIUM',
    channels: ['IN_APP', 'EMAIL']
  }
]

export const templateVariables = {
  student: ['studentName', 'studentId', 'email', 'phone'],
  consultancy: ['consultancyName', 'consultancyEmail', 'consultancyPhone'],
  document: ['documentType', 'uploadDate', 'dueDate', 'notes', 'rejectionReason'],
  payment: ['feeType', 'amount', 'currency', 'dueDate', 'status', 'daysOverdue', 'lateFee', 'paymentMethod', 'transactionId', 'receivedDate'],
  interview: ['interviewType', 'interviewDate', 'interviewTime', 'duration', 'location', 'interviewerName'],
  visa: ['previousStatus', 'newStatus', 'updateDate', 'isApproved', 'isRejected', 'needsAction'],
  application: ['schoolName', 'programName', 'submissionDate', 'applicationId', 'acceptanceDate', 'responseDeadline'],
  class: ['className', 'classLevel', 'classSchedule', 'startDate', 'teacherName', 'classroom'],
  todo: ['todoTitle', 'todoCategory', 'todoPriority', 'dueDate', 'estimatedDays', 'todoDescription', 'daysOverdue', 'progress'],
  user: ['counselorName', 'adminName', 'teacherName'],
  dates: ['currentDate', 'currentMonth', 'currentYear']
}

export function getTemplateVariables(event: TriggerEvent): string[] {
  const baseVars = ['studentName', 'consultancyName', 'currentDate']
  
  switch (event) {
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_VERIFIED':
    case 'DOCUMENT_REJECTED':
      return [...baseVars, ...templateVariables.document]
    
    case 'PAYMENT_DUE':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_RECEIVED':
      return [...baseVars, ...templateVariables.payment]
    
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_COMPLETED':
      return [...baseVars, ...templateVariables.interview]
    
    case 'VISA_STATUS_CHANGED':
      return [...baseVars, ...templateVariables.visa]
    
    case 'APPLICATION_SUBMITTED':
    case 'APPLICATION_ACCEPTED':
    case 'APPLICATION_REJECTED':
      return [...baseVars, ...templateVariables.application]
    
    case 'CLASS_ENROLLED':
    case 'CLASS_COMPLETED':
      return [...baseVars, ...templateVariables.class]
    
    case 'TODO_ASSIGNED':
    case 'TODO_COMPLETED':
    case 'TODO_OVERDUE':
      return [...baseVars, ...templateVariables.todo]
    
    case 'STUDENT_CREATED':
    case 'STUDENT_STATUS_CHANGED':
      return [...baseVars, ...templateVariables.student, ...templateVariables.user]
    
    default:
      return baseVars
  }
}

export function validateTemplate(template: string, variables: string[]): string[] {
  const usedVars = template.match(/\{\{(\w+)\}\}/g)?.map(v => v.slice(2, -2)) || []
  return usedVars.filter(v => !variables.includes(v))
}

export function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return data[varName] || match
  })
}
