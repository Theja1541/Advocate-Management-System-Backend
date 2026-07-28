const fs = require('fs').promises;
const fsClassic = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../config/logger');
const AppError = require('../../utils/AppError');

/**
 * Calculates SHA-256 hash of a file on disk
 */
const calculateHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fsClassic.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Deletes a file from the server filesystem asynchronously
 */
const deleteFile = async (filePath) => {
  if (!filePath) return;
  try {
    const resolvedPath = path.resolve(filePath);
    
    // Safety check: ensure file is within allowed upload directory
    const uploadDir = path.resolve(process.env.BARE_ACT_UPLOAD_DIR || 'uploads/bare-acts');
    if (!resolvedPath.startsWith(uploadDir)) {
      logger.warn(`StorageService block: Prevented deletion outside allowed directory: ${resolvedPath}`);
      return;
    }

    try {
      await fs.access(resolvedPath);
      await fs.unlink(resolvedPath);
      logger.info(`StorageService: Successfully deleted file asynchronously: ${resolvedPath}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.error(`StorageService error deleting file asynchronously: ${resolvedPath}`, err);
      }
    }
  } catch (error) {
    logger.error(`StorageService error deleting file: ${filePath}`, error);
  }
};

/**
 * Processes a newly uploaded file: calculates hash, size, and returns metadata
 */
const processUploadedFile = async (file) => {
  if (!file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    const fileHash = await calculateHash(file.path);
    return {
      pdfOriginalName: file.originalname,
      pdfStorageName: file.filename,
      pdfStoragePath: file.path,
      pdfSize: file.size,
      mimeType: file.mimetype,
      fileHash,
    };
  } catch (error) {
    // Clean up file if processing failed
    await deleteFile(file.path);
    throw new AppError('Failed to process uploaded PDF file.', 500);
  }
};

module.exports = {
  calculateHash,
  deleteFile,
  processUploadedFile,
};
