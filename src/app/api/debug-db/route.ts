import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// Test endpoint to debug database issues
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Test simple query
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    // Test if notification table exists
    try {
      const notificationCount = await prisma.notification.count()
      console.log('Notification count:', notificationCount)
      
      return NextResponse.json({ 
        message: 'Database working correctly',
        userCount,
        notificationCount
      })
    } catch (notificationError) {
      console.error('Notification table error:', notificationError)
      return NextResponse.json({ 
        error: 'Notification table issue',
        details: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
