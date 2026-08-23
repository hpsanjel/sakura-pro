import { NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getApiSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

export function requireRole(
  session: Session | null,
  allowedRoles: string[]
): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }
  return null
}

export function assertTenantMatch(
  session: Session,
  resourceConsultancyId: string | null | undefined
): NextResponse | null {
  if (session.user.role === "SUPERADMIN") {
    return null
  }
  if (!resourceConsultancyId || resourceConsultancyId !== session.user.consultancyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return null
}

export function tenantWhere(session: Session): { consultancyId?: string } {
  return session.user.role === "SUPERADMIN"
    ? {}
    : { consultancyId: session.user.consultancyId }
}
