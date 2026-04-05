import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN and COUNSELOR can upload receipts
    if (!['ADMIN', 'COUNSELOR'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const feeId = formData.get('feeId') as string
    const studentName = formData.get('studentName') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!feeId) {
      return NextResponse.json({ error: "Fee ID required" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed types: images, PDF, Word documents" }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size: 10MB" }, { status: 400 })
    }

    // Check if Cloudinary credentials are available
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary configuration missing" }, { status: 500 })
    }

    // Create unique folder structure
    const folderName = `payments/${feeId}/${studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`
    const timestamp = Date.now()
    const publicId = `${folderName}/receipt_${timestamp}`

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', 'payment_receipts') // You need to create this preset
    cloudinaryFormData.append('folder', folderName)
    cloudinaryFormData.append('public_id', publicId)
    cloudinaryFormData.append('resource_type', 'auto') // Auto-detect file type

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.text()
      console.error('Cloudinary upload error:', errorData)
      return NextResponse.json({ error: "Failed to upload to Cloudinary" }, { status: 500 })
    }

    const cloudinaryData = await cloudinaryResponse.json()

    return NextResponse.json({ 
      success: true, 
      url: cloudinaryData.secure_url,
      publicId: cloudinaryData.public_id,
      fileName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
