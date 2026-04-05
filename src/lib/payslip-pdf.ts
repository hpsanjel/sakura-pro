import jsPDF from 'jspdf'

export interface PayslipData {
  teacherName: string
  teacherEmail: string
  employeeId?: string
  payPeriod: string
  basicSalary: number
  housingAllow: number
  transportAllow: number
  mealAllow: number
  otherAllow: number
  grossSalary: number
  taxDeduction: number
  insuranceDed: number
  otherDed: number
  totalDeductions: number
  netSalary: number
  currency: string
  consultancyName: string
  consultancyAddress?: string
  generatedDate: string
  // YTD values for the year
  ytdBasicSalary?: number
  ytdHousingAllow?: number
  ytdTransportAllow?: number
  ytdMealAllow?: number
  ytdOtherAllow?: number
  ytdGrossSalary?: number
  ytdTaxDeduction?: number
  ytdInsuranceDed?: number
  ytdOtherDed?: number
  ytdTotalDeductions?: number
  ytdNetSalary?: number
}

export function generatePayslipPDF(data: PayslipData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  // Colors
  const primaryColor = [0, 0, 0] // Black for professional look
  const headerColor = [50, 50, 50]
  const tableBorderColor = [200, 200, 200]

  // Helper functions
  const setTextStyle = (size: number, weight: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', weight)
  }

  const addText = (text: string, x: number, y: number, size: number, weight: 'normal' | 'bold' = 'normal') => {
    setTextStyle(size, weight)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(text, x, y)
  }

  const addTableHeader = (text: string, x: number, y: number, width: number) => {
    setTextStyle(9, 'bold')
    doc.setFillColor(240, 240, 240)
    doc.rect(x, y - 5, width, 8, 'F')
    doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
    doc.rect(x, y - 5, width, 8)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(text, x + 2, y)
  }

  const addTableRow = (desc: string, ytd: string, amount: string, x: number, y: number, width1: number, width2: number, width3: number) => {
    setTextStyle(8, 'normal')
    doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
    // Draw three columns
    doc.rect(x, y - 4, width1, 7)
    doc.rect(x + width1, y - 4, width2, 7)
    doc.rect(x + width1 + width2, y - 4, width3, 7)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    // Add text to each column
    doc.text(desc, x + 2, y)
    doc.text(ytd, x + width1 + 2, y)
    doc.text(amount, x + width1 + width2 + 2, y)
  }

  let currentY = margin + 10

  // Company Header
  setTextStyle(16, 'bold')
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2])
  doc.text(data.consultancyName, margin, currentY)
  
  setTextStyle(10, 'normal')
  doc.text('Payslip for the month of ' + data.payPeriod, margin, currentY + 8)
  
  // Employee Details Box
  currentY += 25
  doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
  doc.rect(margin, currentY - 5, contentWidth, 35)
  
  // Left column - Employee Info
  addText('Employee ID: ' + (data.employeeId || 'N/A'), margin, currentY + 2, 9)
  addText('Employee Name: ' + data.teacherName, margin, currentY + 10, 9)
  addText('Department: Teaching', margin, currentY + 18, 9)
  addText('Designation: Teacher', margin, currentY + 26, 9)
  
  // Right column - Pay Period Info
  const rightColX = margin + contentWidth / 2
  addText('Pay Period: ' + data.payPeriod, rightColX, currentY + 2, 9)
  addText('Days Worked: 22', rightColX, currentY + 10, 9)
  addText('Leave Days: 0', rightColX, currentY + 18, 9)
  addText('OT Hours: 0', rightColX, currentY + 26, 9)

  currentY += 45

  // EARNINGS Section
  addText('EARNINGS', margin, currentY, 12, 'bold')
  currentY += 8

  // Earnings Table Header
  const earningsColWidth = contentWidth / 3
  addTableHeader('Description', margin, currentY, earningsColWidth * 1.2)
  addTableHeader('YTD', margin + earningsColWidth * 1.2, currentY, earningsColWidth * 0.4)
  addTableHeader('Amount', margin + earningsColWidth * 1.6, currentY, earningsColWidth * 0.4)
  currentY += 8

  // Earnings Rows
  const earnings = [
    { label: 'Basic Pay', amount: data.basicSalary, ytd: data.ytdBasicSalary || (data.basicSalary * 5) },
    { label: 'Medical Allowance', amount: data.housingAllow, ytd: data.ytdHousingAllow || (data.housingAllow * 5) },
    { label: 'Housing Allowance', amount: data.transportAllow, ytd: data.ytdTransportAllow || (data.transportAllow * 5) },
    { label: 'Conveyance Allowance', amount: data.mealAllow, ytd: data.ytdMealAllow || (data.mealAllow * 5) },
    { label: 'Food Allowance', amount: data.otherAllow, ytd: data.ytdOtherAllow || (data.otherAllow * 5) },
    { label: 'Overtime Allowance', amount: 0, ytd: 0 },
  ]

  earnings.forEach((earning) => {
    addTableRow(
      earning.label,
      earning.ytd.toFixed(2) + ' ' + data.currency,
      earning.amount.toFixed(2) + ' ' + data.currency,
      margin,
      currentY,
      earningsColWidth * 1.2,
      earningsColWidth * 0.4,
      earningsColWidth * 0.4
    )
    currentY += 7
  })

  // Total Earnings
  currentY += 2
  setTextStyle(9, 'bold')
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, currentY - 4, contentWidth, 7, 'F')
  doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
  doc.rect(margin, currentY - 4, contentWidth, 7)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('Total Earnings (Rounded)', margin + 2, currentY)
  doc.text((data.ytdGrossSalary || data.grossSalary * 5).toFixed(2), margin + earningsColWidth * 1.2 + 2, currentY)
  doc.text(data.grossSalary.toFixed(2), margin + earningsColWidth * 1.6 + 2, currentY)

  currentY += 15

  // DEDUCTIONS Section
  addText('DEDUCTIONS', margin, currentY, 12, 'bold')
  currentY += 8

  // Deductions Table Header
  addTableHeader('Description', margin, currentY, earningsColWidth * 1.2)
  addTableHeader('YTD', margin + earningsColWidth * 1.2, currentY, earningsColWidth * 0.4)
  addTableHeader('Amount', margin + earningsColWidth * 1.6, currentY, earningsColWidth * 0.4)
  currentY += 8

  // Deductions Rows
  const deductions = [
    { label: 'National Insurance', amount: data.taxDeduction, ytd: data.ytdTaxDeduction || (data.taxDeduction * 5) },
    { label: 'Loss of Pay', amount: 0, ytd: 0 },
    { label: 'Loan Repayment', amount: data.insuranceDed, ytd: data.ytdInsuranceDed || (data.insuranceDed * 5) },
    { label: 'Advance Repayment', amount: data.otherDed, ytd: data.ytdOtherDed || (data.otherDed * 5) },
  ]

  deductions.forEach((deduction) => {
    addTableRow(
      deduction.label,
      deduction.ytd.toFixed(2) + ' ' + data.currency,
      deduction.amount.toFixed(2) + ' ' + data.currency,
      margin,
      currentY,
      earningsColWidth * 1.2,
      earningsColWidth * 0.4,
      earningsColWidth * 0.4
    )
    currentY += 7
  })

  // Total Deductions
  currentY += 2
  setTextStyle(9, 'bold')
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, currentY - 4, contentWidth, 7, 'F')
  doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
  doc.rect(margin, currentY - 4, contentWidth, 7)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('Total Deductions (Rounded)', margin + 2, currentY)
  doc.text((data.ytdTotalDeductions || data.totalDeductions * 5).toFixed(2), margin + earningsColWidth * 1.2 + 2, currentY)
  doc.text(data.totalDeductions.toFixed(2), margin + earningsColWidth * 1.6 + 2, currentY)

  currentY += 15

  // NET PAY
  setTextStyle(12, 'bold')
  doc.setFillColor(220, 220, 220)
  doc.rect(margin, currentY - 6, contentWidth, 10, 'F')
  doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
  doc.rect(margin, currentY - 6, contentWidth, 10)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('Net Pay (Rounded)', margin + 2, currentY)
  doc.text((data.ytdNetSalary || data.netSalary * 5).toFixed(2), margin + earningsColWidth * 1.2 + 2, currentY)
  doc.text(data.netSalary.toFixed(2) + ' ' + data.currency, margin + earningsColWidth * 1.6 + 2, currentY)

  // Signatures
  currentY += 30
  addText('Employer\'s Signature', margin, currentY, 10, 'normal')
  addText('Employee\'s Signature', margin + earningsColWidth * 2, currentY, 10, 'normal')

  // Signature lines
  currentY += 20
  doc.setDrawColor(tableBorderColor[0], tableBorderColor[1], tableBorderColor[2])
  doc.line(margin, currentY, margin + 60, currentY)
  doc.line(margin + earningsColWidth * 2, currentY, margin + earningsColWidth * 2 + 60, currentY)

  // Footer
  currentY += 15
  setTextStyle(8, 'normal')
  doc.text('This is a computer generated payslip and does not require signature', margin, currentY)
  doc.text('Generated on: ' + data.generatedDate, pageWidth - margin - 40, currentY)

  return Buffer.from(doc.output('arraybuffer'))
}
