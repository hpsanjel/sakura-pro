import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database with consultancy
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              consultancy: true,
            },
          })

          if (!user || !user.password) {
            return null
          }

          // Check if consultancy is approved (except for SUPERADMIN)
          if (user.role !== "SUPERADMIN") {
            if (user.consultancy.status === "PENDING") {
              console.error("Login blocked: Consultancy pending approval")
              return null
            }
            if (user.consultancy.status === "REJECTED") {
              console.error("Login blocked: Consultancy rejected")
              return null
            }
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            consultancyId: user.consultancyId,
            selectedYear: user.selectedYear
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
    error: "/auth/error",
    newUser: "/auth/register"
  },
  theme: {
    brandColor: "#fbbf24", // Yellow color to match our theme
    logo: "/favicon.ico",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.consultancyId = user.consultancyId
        token.email = user.email
        token.selectedYear = user.selectedYear
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.consultancyId = token.consultancyId as string
        session.user.email = token.email as string
        session.user.selectedYear = token.selectedYear as number
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return url
    }
  }
}
