/**
 * PDF Generation Utility for MMU FCI Meeting Logs
 *
 * NOTE: This utility requires jspdf and html2canvas packages.
 * Install with: npm install jspdf html2canvas
 *
 * @see https://github.com/parallax/jsPDF
 * @see https://github.com/niklasvh/html2canvas
 */

import type { MeetingLog } from '@/types/meetingLog'
import { MEETING_LOG_TASKS } from '@/types/meetingLog'

// Check if jspdf is available
let jsPDF: any = null
let html2canvas: any = null

async function loadDependencies() {
  if (!jsPDF) {
    try {
      const jspdfModule = await import('jspdf')
      jsPDF = jspdfModule.default || jspdfModule.jsPDF
    } catch (e) {
      console.error('jsPDF not installed. Run: npm install jspdf')
      throw new Error('jsPDF is required for PDF generation. Please install it with: npm install jspdf')
    }
  }
  if (!html2canvas) {
    try {
      const h2cModule = await import('html2canvas')
      html2canvas = h2cModule.default
    } catch (e) {
      console.error('html2canvas not installed. Run: npm install html2canvas')
      throw new Error('html2canvas is required for PDF generation. Please install it with: npm install html2canvas')
    }
  }
}

/**
 * Generate PDF for a Meeting Log
 */
export async function generateMeetingLogPdf(log: MeetingLog): Promise<Blob> {
  await loadDependencies()

  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let yPos = margin

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5) => {
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return y + lines.length * lineHeight
  }

  // Helper to check and add new page if needed
  const checkNewPage = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin) {
      doc.addPage()
      yPos = margin
    }
  }

  // ==================== PAGE 1: Header & Metadata ====================

  // MMU Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MULTIMEDIA UNIVERSITY', pageWidth / 2, yPos, { align: 'center' })
  yPos += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Faculty of Computing and Informatics', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('MEETING LOG', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(log.fypPhase, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 8

  // Meeting metadata grid
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Meeting No:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(String(log.meetingNumber), margin + 30, yPos)

  doc.setFont('helvetica', 'bold')
  doc.text('Date:', pageWidth / 2, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(log.meetingDate).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }), pageWidth / 2 + 15, yPos)
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Mode:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(log.meetingMode === 'PHYSICAL' ? 'Physical' : 'Online', margin + 30, yPos)
  yPos += 10

  // Project Title
  doc.setFont('helvetica', 'bold')
  doc.text('Project Title:', margin, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  yPos = addWrappedText(log.projectTitle, margin, yPos, contentWidth)
  yPos += 5

  // Student Info
  doc.setFont('helvetica', 'bold')
  doc.text('Student:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(log.student.fullName, margin + 25, yPos)
  yPos += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Matric No:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(log.student.matricNo, margin + 25, yPos)
  yPos += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Programme:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(log.student.programme, margin + 25, yPos)
  yPos += 8

  // Supervisor Info
  doc.setFont('helvetica', 'bold')
  doc.text('Supervisor:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  const supervisorName = log.supervisor.title
    ? `${log.supervisor.title} ${log.supervisor.fullName}`
    : log.supervisor.fullName
  doc.text(supervisorName, margin + 25, yPos)
  yPos += 5

  if (log.coSupervisor) {
    doc.setFont('helvetica', 'bold')
    doc.text('Co-Supervisor:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(log.coSupervisor.name, margin + 30, yPos)
    yPos += 5
  }
  yPos += 8

  // ==================== SECTION 1: Tasks ====================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SECTION 1: TASKS CARRIED OUT', margin, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Task checkboxes
  const taskCodes = Object.keys(MEETING_LOG_TASKS) as Array<keyof typeof MEETING_LOG_TASKS>
  for (const code of taskCodes) {
    const task = log.tasks.find((t) => t.taskCode === code)
    const isSelected = task?.isSelected ?? false
    const label = MEETING_LOG_TASKS[code]

    // Draw checkbox
    doc.rect(margin, yPos - 3, 4, 4)
    if (isSelected) {
      doc.setFont('helvetica', 'bold')
      doc.text('X', margin + 0.8, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin + 8, yPos)
    } else {
      // Strike-through for unselected
      doc.setTextColor(150, 150, 150)
      doc.text(label, margin + 8, yPos)
      doc.setLineWidth(0.3)
      const textWidth = doc.getTextWidth(label)
      doc.line(margin + 8, yPos - 1.5, margin + 8 + textWidth, yPos - 1.5)
      doc.setTextColor(0, 0, 0)
    }
    yPos += 6
  }
  yPos += 4

  // Work done details
  if (log.workDoneDetails) {
    checkNewPage(30)
    doc.setFont('helvetica', 'bold')
    doc.text('Details of Work Done:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    yPos = addWrappedText(log.workDoneDetails, margin, yPos, contentWidth)
    yPos += 8
  }

  // ==================== SECTION 2: Work To Be Done ====================
  checkNewPage(25)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SECTION 2: WORK TO BE DONE', margin, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (log.workToBeDone) {
    yPos = addWrappedText(log.workToBeDone, margin, yPos, contentWidth)
  } else {
    doc.text('None specified', margin, yPos)
    yPos += 5
  }
  yPos += 8

  // ==================== SECTION 3: Problems & Solutions ====================
  checkNewPage(25)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SECTION 3: PROBLEMS FACED & SOLUTIONS', margin, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (log.problemsAndSolutions) {
    yPos = addWrappedText(log.problemsAndSolutions, margin, yPos, contentWidth)
  } else {
    doc.text('None reported', margin, yPos)
    yPos += 5
  }
  yPos += 8

  // ==================== SECTION 4: Supervisor Comments ====================
  checkNewPage(25)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SECTION 4: SUPERVISOR COMMENTS', margin, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (log.supervisorComments) {
    yPos = addWrappedText(log.supervisorComments, margin, yPos, contentWidth)
  } else {
    doc.text('None provided', margin, yPos)
    yPos += 5
  }
  yPos += 10

  // ==================== SIGNATURES ====================
  checkNewPage(50)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SIGNATURES', margin, yPos)
  yPos += 8

  const sigBoxWidth = (contentWidth - 10) / 2
  const sigBoxHeight = 35
  const leftBoxX = margin
  const rightBoxX = margin + sigBoxWidth + 10

  // Supervisor signature box
  doc.setLineWidth(0.3)
  doc.rect(leftBoxX, yPos, sigBoxWidth, sigBoxHeight)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Supervisor', leftBoxX + sigBoxWidth / 2, yPos + 5, { align: 'center' })

  const supervisorSig = log.signatures.find((s) => s.signerRole === 'SUPERVISOR')
  if (supervisorSig) {
    // Add signature image if available
    if (supervisorSig.signatureImageUrl) {
      try {
        doc.addImage(supervisorSig.signatureImageUrl, 'PNG', leftBoxX + 5, yPos + 8, sigBoxWidth - 10, 15)
      } catch (e) {
        console.error('Failed to add supervisor signature image:', e)
      }
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(supervisorSig.signerName, leftBoxX + sigBoxWidth / 2, yPos + 28, { align: 'center' })
    doc.text(
      new Date(supervisorSig.signedAt).toLocaleDateString('en-MY'),
      leftBoxX + sigBoxWidth / 2,
      yPos + 32,
      { align: 'center' }
    )
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('Pending signature', leftBoxX + sigBoxWidth / 2, yPos + 20, { align: 'center' })
  }

  // Student signature box
  doc.rect(rightBoxX, yPos, sigBoxWidth, sigBoxHeight)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Student', rightBoxX + sigBoxWidth / 2, yPos + 5, { align: 'center' })

  const studentSig = log.signatures.find((s) => s.signerRole === 'STUDENT')
  if (studentSig) {
    // Add signature image if available
    if (studentSig.signatureImageUrl) {
      try {
        doc.addImage(studentSig.signatureImageUrl, 'PNG', rightBoxX + 5, yPos + 8, sigBoxWidth - 10, 15)
      } catch (e) {
        console.error('Failed to add student signature image:', e)
      }
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(studentSig.signerName, rightBoxX + sigBoxWidth / 2, yPos + 28, { align: 'center' })
    doc.text(
      new Date(studentSig.signedAt).toLocaleDateString('en-MY'),
      rightBoxX + sigBoxWidth / 2,
      yPos + 32,
      { align: 'center' }
    )
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('Pending signature', rightBoxX + sigBoxWidth / 2, yPos + 20, { align: 'center' })
  }

  // Footer
  yPos = pageHeight - margin - 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-MY')} by FYP Supervision System`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  // Return as Blob
  return doc.output('blob')
}

/**
 * Download Meeting Log as PDF
 */
export async function downloadMeetingLogPdf(log: MeetingLog, filename?: string): Promise<void> {
  const blob = await generateMeetingLogPdf(log)
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `meeting-log-${log.meetingNumber}-${log.meetingDate}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Open Meeting Log PDF in new tab
 */
export async function openMeetingLogPdfInNewTab(log: MeetingLog): Promise<void> {
  const blob = await generateMeetingLogPdf(log)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
