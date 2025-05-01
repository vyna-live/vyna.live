import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import { db } from './db';
import { uploadedFiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Directory where uploaded files will be stored
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure the uploads directory exists
const ensureUploadDir = async (subDir = '') => {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!await existsAsync(dir)) {
    await mkdirAsync(dir, { recursive: true });
  }
  return dir;
};

// Generate a secure, unique filename
const generateSecureFilename = (originalFilename: string): string => {
  const fileExt = path.extname(originalFilename);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${fileExt}`;
};

// Save an uploaded file and register it in the database
export const saveUploadedFile = async (
  file: any, // Fix for multer file type
  userId: number,
  sessionId: number | null = null
) => {
  try {
    await ensureUploadDir();
    
    const secureFilename = generateSecureFilename(file.originalname);
    const filePath = path.join(UPLOAD_DIR, secureFilename);
    
    // Save the file
    await writeFileAsync(filePath, file.buffer);
    
    // Register in database
    const [savedFile] = await db.insert(uploadedFiles).values({
      userId,
      sessionId,
      filename: secureFilename,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      path: filePath,
      isProcessed: false
    }).returning();
    
    return savedFile;
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    throw new Error('Failed to save uploaded file');
  }
};

// Get a file by its ID
export const getFileById = async (fileId: number) => {
  try {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));
    
    if (!file) {
      throw new Error('File not found');
    }
    
    return {
      ...file,
      buffer: await readFileAsync(file.path)
    };
  } catch (error) {
    console.error('Error getting file:', error);
    throw new Error('Failed to get file');
  }
};

// Process an uploaded file with AI analysis based on file type
export const processUploadedFile = async (fileId: number) => {
  try {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Read the file content
    const fileBuffer = await readFileAsync(file.path);
    
    // Implement different processing logic based on file type
    let processingResult: any = { success: true };
    
    if (file.fileType.startsWith('image/')) {
      // For images, we would use AI vision capabilities here
      processingResult = await processImageFile(fileBuffer, file);
    } else if (file.fileType.startsWith('application/pdf') || 
               file.fileType.startsWith('text/') ||
               file.originalName.endsWith('.docx') ||
               file.originalName.endsWith('.doc')) {
      // For documents, extract text and analyze
      processingResult = await processDocumentFile(fileBuffer, file);
    } else {
      // For other files, just return metadata
      processingResult = {
        success: true,
        analysis: {
          type: 'metadata',
          filename: file.originalName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          message: "File type not supported for detailed analysis"
        }
      };
    }
    
    // Mark as processed with results
    await db.update(uploadedFiles)
      .set({ 
        isProcessed: true,
        processingResult
      })
      .where(eq(uploadedFiles.id, fileId));
    
    return processingResult;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file: ' + (error as Error).message);
  }
};

// Process image files using available AI service
async function processImageFile(fileBuffer: Buffer, file: any) {
  try {
    // In a real implementation, this would call the Gemini Vision API to analyze the image
    // For now, we'll return structured results with key metadata
    
    return {
      success: true,
      analysis: {
        type: 'image',
        filename: file.originalName,
        fileType: file.fileType,
        fileSize: formatFileSize(file.fileSize),
        dimensions: "Not available without image processing",
        contentType: getContentTypeDescription(file.fileType),
        aiStatus: "AI image analysis will be performed when user requests with proper prompt"
      }
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Image processing failed: ' + (error as Error).message);
  }
}

// Process document files
async function processDocumentFile(fileBuffer: Buffer, file: any) {
  try {
    // In a real implementation, this would extract text and analyze with AI
    // For now, return structured metadata
    
    // Get a snippet if it's a text file
    let textPreview = "";
    if (file.fileType.startsWith("text/")) {
      textPreview = fileBuffer.toString().substring(0, 200) + "...";
    }
    
    return {
      success: true,
      analysis: {
        type: 'document',
        filename: file.originalName,
        fileType: file.fileType,
        fileSize: formatFileSize(file.fileSize),
        contentType: getContentTypeDescription(file.fileType),
        textPreview: textPreview || "Document text extraction requires content processing",
        aiStatus: "AI document analysis will be performed when user requests with proper prompt"
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Document processing failed: ' + (error as Error).message);
  }
}

// Helper functions
function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

function getContentTypeDescription(mimeType: string): string {
  if (mimeType.startsWith('image/jpeg')) return 'JPEG Image';
  if (mimeType.startsWith('image/png')) return 'PNG Image';
  if (mimeType.startsWith('image/gif')) return 'GIF Image';
  if (mimeType.startsWith('image/webp')) return 'WebP Image';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('application/pdf')) return 'PDF Document';
  if (mimeType.startsWith('text/plain')) return 'Text Document';
  if (mimeType.includes('wordprocessingml')) return 'Word Document';
  if (mimeType.includes('spreadsheetml')) return 'Spreadsheet';
  if (mimeType.includes('presentationml')) return 'Presentation';
  return mimeType;
}

// Save a cover image for stream sessions
export const saveCoverImage = async (file: any, userId: number): Promise<string> => {
  try {
    // Create covers directory if it doesn't exist
    const coversDir = await ensureUploadDir('covers');
    
    // Generate a secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    const filePath = path.join(coversDir, secureFilename);
    
    // Save the file
    await writeFileAsync(filePath, file.buffer);
    
    // Return the relative path to use in the database
    return `/uploads/covers/${secureFilename}`;
  } catch (error) {
    console.error('Error saving cover image:', error);
    throw new Error('Failed to save cover image');
  }
};

// Delete a file
export const deleteFile = async (fileId: number) => {
  try {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Delete the actual file
    if (await existsAsync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Remove from database
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, fileId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};