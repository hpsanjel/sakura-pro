import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

export async function saveFile(
  file: File,
  consultancyId: string,
  studentId: string,
  documentType: string
): Promise<{ fileName: string; filePath: string }> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "uploads", "documents", consultancyId)
  await ensureDirectoryExists(uploadsDir)

  // Generate unique filename
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()
  const sanitizedType = documentType.toLowerCase().replace(/\s+/g, '-')
  const fileName = `${studentId}-${sanitizedType}-${timestamp}.${fileExtension}`
  const filePath = join(uploadsDir, fileName)

  // Save file to disk
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  return { fileName, filePath }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath)
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    // Don't throw error - continue with database deletion
  }
}

// Helper function to import unlink dynamically to avoid issues with ES modules
async function unlink(filePath: string): Promise<void> {
  const fs = await import("fs/promises")
  await fs.unlink(filePath)
}
