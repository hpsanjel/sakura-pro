import NextAuth from "next-auth"
import { UserRole } from "../generated/prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email: string
      image?: string | null
      role: string
      consultancyId: string
      selectedYear: number
    }
  }

  interface User {
    id: string
    name?: string | null
    email: string
    image?: string | null
    role: string
    consultancyId: string
    selectedYear: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    consultancyId: string
    email: string
    selectedYear: number
  }
}
