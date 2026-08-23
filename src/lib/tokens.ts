import crypto from 'crypto'
import { prisma } from './prisma'

export async function generateSetupToken(
  userId: string,
  email: string,
  role: string,
  consultancyId?: string
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.setupToken.deleteMany({ where: { userId } })

  await prisma.setupToken.create({
    data: {
      token: hashedToken,
      userId,
      email,
      role,
      consultancyId,
      expires,
    },
  })

  return rawToken
}

export async function validateSetupToken(token: string): Promise<{
  userId: string
  email: string
  role: string
  consultancyId?: string
} | null> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const tokenData = await prisma.setupToken.findUnique({
    where: { token: hashedToken },
  })

  if (!tokenData) {
    return null
  }

  if (tokenData.expires < new Date()) {
    await prisma.setupToken.delete({ where: { id: tokenData.id } })
    return null
  }

  return {
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
    consultancyId: tokenData.consultancyId ?? undefined,
  }
}

export async function consumeSetupToken(token: string): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  await prisma.setupToken.deleteMany({ where: { token: hashedToken } })
}
