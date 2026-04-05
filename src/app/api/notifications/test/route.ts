import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TEST ENDPOINT CALLED ===')
  return NextResponse.json({ message: 'Test endpoint working' })
}

export async function PUT(request: NextRequest) {
  console.log('=== TEST PUT ENDPOINT CALLED ===')
  const body = await request.json()
  console.log('Request body:', body)
  return NextResponse.json({ message: 'Test PUT endpoint working', received: body })
}
