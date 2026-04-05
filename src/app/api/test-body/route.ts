import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Test endpoint to debug body parsing issues
export async function POST(request: NextRequest) {
  try {
    console.log('Test endpoint called')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Try to get the body in different ways
    let body
    try {
      body = await request.json()
      console.log('Body parsed with request.json():', body)
    } catch (error) {
      console.error('Failed to parse with request.json():', error)
      
      try {
        const clonedRequest = request.clone()
        body = await clonedRequest.json()
        console.log('Body parsed with cloned request.json():', body)
      } catch (cloneError) {
        console.error('Failed to parse with cloned request.json():', cloneError)
        
        try {
          const text = await request.text()
          console.log('Raw body text:', text)
          body = { rawText: text }
        } catch (textError) {
          console.error('Failed to get raw text:', textError)
          body = { error: 'Could not read body' }
        }
      }
    }

    return NextResponse.json({
      success: true,
      body: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  })
}
