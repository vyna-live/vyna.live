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
const ensureUploadDir = async () => {
  if (!await existsAsync(UPLOAD_DIR)) {
    await mkdirAsync(UPLOAD_DIR, { recursive: true });
  }
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

// Process an uploaded file (can be extended based on file type)
export const processUploadedFile = async (fileId: number) => {
  try {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, fileId));
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Implement different processing logic based on file type
    let processingResult: any = { success: true };
    
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
    throw new Error('Failed to process file');
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