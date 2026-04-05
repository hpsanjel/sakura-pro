import { v2 as cloudinary } from 'cloudinary'

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

// Configure Cloudinary only if environment variables are available
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export const cloudinaryConfigured = isCloudinaryConfigured()

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  resource_type: string
  created_at: string
}

export interface CloudinaryDeleteResult {
  result: string
  public_id: string
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'documents'
): Promise<CloudinaryUploadResult> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Please check your environment variables.')
  }

  return new Promise((resolve, reject) => {
    // Convert file to buffer
    const arrayBuffer = file.arrayBuffer()
    const bufferPromise = arrayBuffer.then((buffer) => Buffer.from(buffer))

    bufferPromise.then((buffer) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes,
              resource_type: result.resource_type,
              created_at: result.created_at,
            })
          } else {
            reject(new Error('Unknown error during Cloudinary upload'))
          }
        }
      )

      uploadStream.end(buffer)
    }).catch(reject)
  })
}

/**
 * Delete a file from Cloudinary by public_id
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<CloudinaryDeleteResult> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return {
      result: result.result,
      public_id: result.public_id,
    }
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Replace a file in Cloudinary (delete old and upload new)
 */
export async function replaceInCloudinary(
  oldPublicId: string,
  newFile: File,
  folder: string = 'documents'
): Promise<CloudinaryUploadResult> {
  try {
    // Delete old file first
    await deleteFromCloudinary(oldPublicId)
    
    // Upload new file
    return await uploadToCloudinary(newFile, folder)
  } catch (error) {
    throw new Error(`Cloudinary replacement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload a teacher document to Cloudinary with proper folder structure
 * Format: consultancy-name/teachers/teacher-name/document-type
 */
export async function uploadTeacherDocument(
  file: File,
  consultancyName: string,
  teacherName: string,
  documentType: string
): Promise<CloudinaryUploadResult> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Please check your environment variables.')
  }

  // Create folder structure: consultancy-name/teachers/teacher-name/document-type
  const folder = `${consultancyName.toLowerCase().replace(/\s+/g, '-')}/teachers/${teacherName.toLowerCase().replace(/\s+/g, '-')}/${documentType.toLowerCase().replace(/\s+/g, '-')}`

  return new Promise((resolve, reject) => {
    // Convert file to buffer
    const arrayBuffer = file.arrayBuffer()
    const bufferPromise = arrayBuffer.then((buffer) => Buffer.from(buffer))

    bufferPromise.then((buffer) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          // Add tags for better organization
          tags: [`teacher-document`, documentType.toLowerCase(), consultancyName.toLowerCase().replace(/\s+/g, '-')],
        },
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes,
              resource_type: result.resource_type,
              created_at: result.created_at,
            })
          } else {
            reject(new Error('Unknown error during Cloudinary upload'))
          }
        }
      )

      uploadStream.end(buffer)
    }).catch(reject)
  })
}

/**
 * Delete all documents for a specific teacher
 */
export async function deleteTeacherDocuments(
  consultancyName: string,
  teacherName: string
): Promise<{ deleted: number; failed: number }> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured')
  }

  try {
    const folder = `${consultancyName.toLowerCase().replace(/\s+/g, '-')}/teachers/${teacherName.toLowerCase().replace(/\s+/g, '-')}`
    return await deleteFolderFromCloudinary(folder)
  } catch (error) {
    throw new Error(`Failed to delete teacher documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const uploadIndex = pathParts.indexOf('upload')
    
    if (uploadIndex === -1) return null
    
    // Remove version if present and get public_id
    let publicId = pathParts.slice(uploadIndex + 2).join('/')
    if (publicId.includes('/')) {
      const parts = publicId.split('/')
      const lastPart = parts[parts.length - 1]
      publicId = parts.slice(0, -1).join('/') + '/' + lastPart.split('.')[0]
    } else {
      publicId = publicId.split('.')[0]
    }
    
    return publicId
  } catch (error) {
    return null
  }
}

/**
 * Delete all files in a specific folder (useful for cleanup)
 */
export async function deleteFolderFromCloudinary(
  folder: string
): Promise<{ deleted: number; failed: number }> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured')
  }

  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folder)
    return {
      deleted: result.deleted?.length || 0,
      failed: result.failed?.length || 0
    }
  } catch (error) {
    throw new Error(`Failed to delete folder ${folder}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
