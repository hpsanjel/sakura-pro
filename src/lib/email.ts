import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendNewConsultancyNotification(
  consultancyName: string,
  consultancyEmail: string,
  consultancyPhone: string | null,
  consultancyAddress: string | null
) {
  const mailOptions = {
    from: `"StudyAbroad Pro" <${process.env.GMAIL_USER}>`,
    to: process.env.SUPERADMIN_EMAIL || 'hari.junkemails@gmail.com',
    subject: `🏢 New Consultancy Registration - ${consultancyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #1f2937; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Consultancy Registration 🏢</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">A new consultancy has registered on StudyAbroad Pro</p>
            </div>
            <div class="content">
              <h2>Consultancy Details</h2>
              <p>A new consultancy has submitted their registration and is awaiting your approval.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Registration Information</h3>
                <div class="info-row">
                  <span class="label">Consultancy Name:</span>
                  <span class="value">${consultancyName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${consultancyEmail}</span>
                </div>
                ${consultancyPhone ? `
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${consultancyPhone}</span>
                </div>
                ` : ''}
                ${consultancyAddress ? `
                <div class="info-row">
                  <span class="label">Address:</span>
                  <span class="value">${consultancyAddress}</span>
                </div>
                ` : ''}
              </div>
              
              <p>Please review this consultancy registration and approve or reject it at your earliest convenience.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" class="button">
                Review Registration
              </a>
            </div>
          </div>
        </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Failed to send consultancy notification:', error)
    throw error
  }
}

export async function sendConsultancyApprovalEmail(
  consultancyEmail: string,
  consultancyName: string,
  adminEmail: string,
  adminPassword: string
) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: consultancyEmail,
    subject: '🎉 Your Consultancy Has Been Approved - StudyAbroad Pro',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .credential-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; }
            .value { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to StudyAbroad Pro! 🎉</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${consultancyName}!</h2>
              <p>Your consultancy registration has been approved by our team. You can now access the full StudyAbroad Pro platform to manage your students and visa applications.</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #667eea;">Your Login Credentials</h3>
                <div class="credential-row">
                  <span class="label">Email:</span>
                  <span class="value">${adminEmail}</span>
                </div>
                <div class="credential-row">
                  <span class="label">Password:</span>
                  <span class="value">${adminPassword}</span>
                </div>
                <div class="credential-row">
                  <span class="label">Role:</span>
                  <span class="value">Admin</span>
                </div>
              </div>

              <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signin" class="button">
                Login to Dashboard →
              </a>

              <h3>What's Next?</h3>
              <ul>
                <li>Log in to your dashboard</li>
                <li>Set up your team (add counselors)</li>
                <li>Start managing student applications</li>
                <li>Configure your consultancy settings</li>
              </ul>

              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 StudyAbroad Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendConsultancyRejectionEmail(
  consultancyEmail: string,
  consultancyName: string,
  reason?: string
) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: consultancyEmail,
    subject: 'Consultancy Registration Update - StudyAbroad Pro',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f5576c 0%, #fa709a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reason-box { background: white; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Registration Update</h1>
            </div>
            <div class="content">
              <h2>Dear ${consultancyName},</h2>
              <p>Thank you for your interest in StudyAbroad Pro. After careful review, we are unable to approve your consultancy registration at this time.</p>
              
              ${reason ? `
                <div class="reason-box">
                  <strong>Reason:</strong><br>
                  ${reason}
                </div>
              ` : ''}

              <p>If you believe this is an error or would like to discuss this decision, please contact our support team.</p>

              <p>We appreciate your understanding.</p>
            </div>
            <div class="footer">
              <p>© 2024 StudyAbroad Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendStudentWelcomeEmail(
  studentEmail: string,
  studentName: string,
  setupLink: string,
  consultancy?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
) {
  const consultancyName = consultancy?.name || 'Your Consultancy'
  const consultancyPhone = consultancy?.phone || 'your consultation'
  const consultancyEmail = consultancy?.email || 'our email'
  
  const mailOptions = {
    from: `"StudyAbroad Pro" <${process.env.GMAIL_USER}>`,
    to: studentEmail,
    subject: `🎓 Welcome to ${consultancyName} - Set Up Your Student Account`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .consultancy-info { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .steps { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .step { display: flex; align-items: center; margin: 15px 0; }
            .step-number { background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .signature { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to ${consultancyName}! 🎓</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Your Japan Study Journey Begins Here</p>
            </div>
            <div class="content">
              <h2>Dear ${studentName},</h2>
              <p>The entire team at <strong>${consultancyName}</strong> wants to extend a warm welcome to you! We're thrilled to be part of your journey to study in Japan.</p>
              
        
              
              
              <div class="welcome-box">
                <h3 style="margin-top: 0; color: #667eea;">🚀 Your Student Portal is Ready!</h3>
                <p>You now have access to your personal dashboard where you can:</p>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>📄 Upload required documents securely</li>
                  <li>📊 Track your application status in real-time</li>
                  <li>📚 View class schedules and study materials</li>
                  <li>💬 Message your counselor directly</li>
                  <li>📈 Monitor your visa application progress</li>
                </ul>
              </div>

              <h3>🔐 Set Up Your Account Password</h3>
              <p>To get started, you'll need to create a secure password for your account within 24 hours. Click the button below to set up your password:</p>

              <a href="${setupLink}" class="button">
                Set Up My Password →
              </a>

        

        

              <p><strong>Need Help?</strong> Our team at ${consultancyName} is here to support you every step of the way. Feel free to reach out to us anytime!</p>

              <p>We're excited to help you achieve your dream of studying in Japan! 🇯🇵</p>

              <div class="signature">
                <p>Warm regards,</p>
                <p><strong>The ${consultancyName} Team</strong></p>
                ${consultancyPhone ? `<p>📞 ${consultancyPhone}</p>` : ''}
                ${consultancyEmail ? `<p>✉️ ${consultancyEmail}</p>` : ''}
              </div>
            </div>
            <div class="footer">
              <p>© 2024 ${consultancyName}. All rights reserved.</p>
              <p style="margin-top: 10px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendPayslipEmail(
  teacherEmail: string,
  teacherName: string,
  payslipData: {
    payPeriod: string
    netSalary: number
    currency: string
  },
  pdfBuffer: Buffer,
  consultancyName: string
) {
  const mailOptions = {
    from: `"${consultancyName} HR" <${process.env.GMAIL_USER}>`,
    to: teacherEmail,
    subject: `📄 Your Payslip for ${payslipData.payPeriod} - ${consultancyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .payslip-info { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; }
            .value { font-weight: 600; color: #059669; font-size: 18px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .attachment-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📄 Your Payslip is Ready!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">${consultancyName}</p>
            </div>
            <div class="content">
              <h2>Dear ${teacherName},</h2>
              <p>Your payslip for <strong>${payslipData.payPeriod}</strong> has been generated and is attached to this email.</p>
              
              <div class="payslip-info">
                <h3 style="margin-top: 0; color: #667eea;">Payslip Summary</h3>
                <div class="info-row">
                  <span class="label">Pay Period:</span>
                  <span class="value">${payslipData.payPeriod}</span>
                </div>
                <div class="info-row">
                  <span class="label">Net Salary:</span>
                  <span class="value">${payslipData.netSalary.toLocaleString()} ${payslipData.currency}</span>
                </div>
              </div>

              <div class="attachment-notice">
                <strong>📎 Attachment:</strong> Your detailed payslip PDF is attached to this email. Please review it carefully and save it for your records.
              </div>

              <h3>Important Information</h3>
              <ul>
                <li>This is a computer-generated payslip and is valid for all official purposes</li>
                <li>If you have any questions about your payslip, please contact the HR department</li>
                <li>Keep your payslips secure and confidential</li>
                <li>You can access all your payslips through the employee portal</li>
              </ul>

              <p>If you have any questions or concerns about your payslip, please don't hesitate to contact our HR department.</p>

              <div class="footer">
                <p>© 2024 ${consultancyName}. All rights reserved.</p>
                <p style="margin-top: 10px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: `payslip-${payslipData.payPeriod.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  }

  await transporter.sendMail(mailOptions)
}

export async function sendConsultancyWelcomeEmail(
  consultancyEmail: string,
  consultancyName: string,
  adminEmail: string,
  adminName: string,
  setupToken: string
) {
  const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/setup-password?token=${setupToken}`
  
  const mailOptions = {
    from: `"StudyAbroad Pro" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `🎉 Welcome to StudyAbroad Pro - ${consultancyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .credentials { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .credential-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #1f2937; }
            .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none !important; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .steps { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .step { display: flex; align-items: center; margin: 15px 0; }
            .step-number { background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to StudyAbroad Pro! 🎉</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Your Consultancy Management Journey Begins</p>
            </div>
            <div class="content">
              <h2>Dear ${adminName},</h2>
              <p>Congratulations! <strong>${consultancyName}</strong> has been successfully registered on StudyAbroad Pro. Your consultancy is now ready to help students achieve their dream of studying in Japan.</p>
              
              <div class="welcome-box">
                <h3 style="margin-top: 0; color: #667eea;">🚀 Your Admin Portal is Ready!</h3>
                <p>You now have access to a comprehensive platform to:</p>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>👥 Manage students and applications</li>
                  <li>📋 Track document submissions</li>
                  <li>📊 Monitor visa progress</li>
                  <li>💬 Communicate with students</li>
                  <li>📈 Generate reports and analytics</li>
                </ul>
              </div>

              <div class="credentials">
                <h3 style="margin-top: 0; color: #667eea;">Your Account Information</h3>
                <div class="credential-row">
                  <span class="label">Consultancy:</span>
                  <span class="value">${consultancyName}</span>
                </div>
                <div class="credential-row">
                  <span class="label">Email:</span>
                  <span class="value">${adminEmail}</span>
                </div>
                <div class="credential-row">
                  <span class="label">Role:</span>
                  <span class="value">Administrator</span>
                </div>
              </div>

              <h3>🔐 Set Up Your Password</h3>
              <p>To get started, you need to create a secure password for your admin account. Click the button below to set up your password:</p>

              <a href="${setupLink}" class="button">
                Set Up My Password →
              </a>

              <p><strong>⚠️ Important:</strong> This setup link will expire in 24 hours for security reasons. Please set up your password as soon as possible.</p>

              <div class="steps">
                <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
                <div class="step">
                  <div class="step-number">1</div>
                  <div>Set up your password using the button above</div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div>Log in to your admin dashboard</div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div>Add counselors and team members</div>
                </div>
                <div class="step">
                  <div class="step-number">4</div>
                  <div>Start managing student applications</div>
                </div>
              </div>

              <p>If you have any questions or need assistance, our support team is here to help you every step of the way.</p>

              <p>We're excited to partner with you in helping students achieve their Japanese education dreams! 🇯🇵</p>
            </div>
            <div class="footer">
              <p>© 2024 StudyAbroad Pro. All rights reserved.</p>
              <p style="margin-top: 10px; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Failed to send consultancy welcome email:', error)
    throw error
  }
}
