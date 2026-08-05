const crypto = require('crypto');
const fsClassic = require('fs');
const AppError = require('../../utils/AppError');
const globalStorageService = require('../../services/StorageService');

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
    await globalStorageService.deleteFile(filePath);
  } catch (error) {
    // best-effort cleanup
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
    const savedPath = await globalStorageService.saveFile(file, 'bare-acts');
    return {
      pdfOriginalName: file.originalname,
      pdfStorageName: file.filename, // temp name if needed
      pdfStoragePath: savedPath,
      pdfSize: file.size,
      mimeType: file.mimetype,
      fileHash,
    };
  } catch (error) {
    throw new AppError('Failed to process uploaded PDF file.', 500);
  }
};

module.exports = {
  calculateHash,
  deleteFile,
  processUploadedFile,
};
