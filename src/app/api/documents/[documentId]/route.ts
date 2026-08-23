import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getWorkflowEngine } from "@/lib/workflow-engine"
import { getApiSession, requireRole, assertTenantMatch } from "@/lib/api-auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getApiSession()

    // Only ADMIN, COUNSELOR, TEACHER, and SUPERADMIN can verify/reject documents
    const denied = requireRole(session, ["ADMIN", "COUNSELOR", "TEACHER", "SUPERADMIN"])
    if (denied) return denied
    const user = session!.user

    const { documentId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!action || !['verify', 'reject', 'reset'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get request body for rejection reason
    let requestBody = {}
    try {
      requestBody = await request.json()
    } catch (e) {
      // No body provided, which is fine for verification
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { student: true }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const tenantDenied = assertTenantMatch(session!, document.student.consultancyId)
    if (tenantDenied) return tenantDenied

    // Update document status
    let updateData: any
    if (action === 'verify') {
      updateData = { 
        status: "VERIFIED" as const, 
        verifiedAt: new Date(),
        verifiedBy: user.name || user.email || "Unknown",
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null
      }
    } else if (action === 'reject') {
      updateData = { 
        status: "REJECTED" as const, 
        rejectedAt: new Date(),
        rejectedBy: user.name || user.email || "Unknown",
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: (requestBody as any)?.reason || null
      }
    } else if (action === 'reset') {
      updateData = { 
        status: "UPLOADED" as const, 
        verifiedAt: null,
        verifiedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData
    })

    console.log(`Document ${documentId} ${action}d by ${user.email} for student ${document.student.name}`)

    // Trigger workflow events
    try {
      const workflowEngine = getWorkflowEngine(prisma)
      
      if (action === 'verify') {
        console.log('Triggering DOCUMENT_VERIFIED event')
        await workflowEngine.triggerEvent('DOCUMENT_VERIFIED', {
          consultancyId: user.consultancyId,
          studentId: document.studentId,
          documentType: document.type,
          documentId: document.id,
          verifiedBy: user.name || user.email,
          verifiedAt: new Date()
        })
      } else if (action === 'reject') {
        console.log('Triggering DOCUMENT_REJECTED event')
        await workflowEngine.triggerEvent('DOCUMENT_REJECTED', {
          consultancyId: user.consultancyId,
          studentId: document.studentId,
          documentType: document.type,
          documentId: document.id,
          rejectedBy: user.name || user.email,
          rejectedAt: new Date(),
          rejectionReason: (requestBody as any)?.reason || 'No reason provided'
        })
      }
    } catch (workflowError) {
      console.error('Error triggering workflow event:', workflowError)
      // Don't fail the document update if workflow fails
    }

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error(`Error in document action:`, error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
