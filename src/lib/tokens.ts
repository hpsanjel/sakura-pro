import crypto from 'crypto'

// In-memory token storage (in production, use Redis or database)
const setupTokens = new Map<string, {
  userId: string
  email: string
  role: string
  consultancyId?: string
  expires: number
}>()

export function generateSetupToken(
  userId: string,
  email: string,
  role: string,
  consultancyId?: string
): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  
  setupTokens.set(token, {
    userId,
    email,
    role,
    consultancyId,
    expires
  })
  
  return token
}

export function validateSetupToken(token: string): {
  userId: string
  email: string
  role: string
  consultancyId?: string
} | null {
  const tokenData = setupTokens.get(token)
  
  if (!tokenData) {
    return null
  }
  
  if (Date.now() > tokenData.expires) {
    setupTokens.delete(token)
    return null
  }
  
  return {
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
    consultancyId: tokenData.consultancyId
  }
}

export function consumeSetupToken(token: string): void {
  setupTokens.delete(token)
}

export function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [token, data] of setupTokens.entries()) {
    if (now > data.expires) {
      setupTokens.delete(token)
    }
  }
}

// Clean up expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000)
