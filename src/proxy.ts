import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Top-level dashboard route segments that require an authenticated session.
const PROTECTED_SEGMENTS = [
  "admin",
  "applications",
  "counselor-todos",
  "dashboard",
  "documents",
  "financial",
  "inventory",
  "messages",
  "notifications",
  "pipeline",
  "profile",
  "reports",
  "schools",
  "settings",
  "student",
  "student-todos",
  "students",
  "superadmin",
  "teacher",
  "users",
  "workflows",
]

// Segments exclusive to specific roles. Mixed-role areas (documents,
// students, financial, messages, etc.) are intentionally left out here and
// rely on their existing page/API-level checks, since several roles
// legitimately access them with different scopes.
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: string[] }[] = [
  { prefix: "/superadmin", roles: ["SUPERADMIN"] },
  { prefix: "/users", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/reports", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/employees", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/consultancies", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/admin/year-management", roles: ["ADMIN", "SUPERADMIN"] },
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const topSegment = pathname.split("/")[1]
  if (!PROTECTED_SEGMENTS.includes(topSegment)) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const restriction = ROLE_RESTRICTED_PREFIXES.find(({ prefix }) =>
    pathname.startsWith(prefix)
  )
  if (restriction && !restriction.roles.includes(token.role as string)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/applications/:path*",
    "/counselor-todos/:path*",
    "/dashboard/:path*",
    "/documents/:path*",
    "/financial/:path*",
    "/inventory/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/pipeline/:path*",
    "/profile/:path*",
    "/reports/:path*",
    "/schools/:path*",
    "/settings/:path*",
    "/student/:path*",
    "/student-todos/:path*",
    "/students/:path*",
    "/superadmin/:path*",
    "/teacher/:path*",
    "/users/:path*",
    "/workflows/:path*",
  ],
}
