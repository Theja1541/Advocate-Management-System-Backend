const fs = require('fs');
const path = require('path');
const util = require('util');
const { tenantContext } = require('../config/database');
const AppError = require('../utils/AppError');

const mkdirAsync = util.promisify(fs.mkdir);
const unlinkAsync = util.promisify(fs.unlink);
const renameAsync = util.promisify(fs.rename);
const copyFileAsync = util.promisify(fs.copyFile);

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    
    if (this.provider === 'local') {
      if (!fs.existsSync(UPLOADS_ROOT)) {
        fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
      }
    }
  }

  getTenantId() {
    const store = tenantContext.getStore();
    if (!store || !store.tenantId) {
      throw new AppError('Storage operations require an active tenant context.', 500);
    }
    return store.tenantId;
  }

  async _ensureTenantDirectory(tenantId) {
    const tenantDir = path.join(UPLOADS_ROOT, String(tenantId));
    if (!fs.existsSync(tenantDir)) {
      await mkdirAsync(tenantDir, { recursive: true });
    }
    return tenantDir;
  }

  async saveFile(fileObj, destinationFolder = '') {
    const tenantId = this.getTenantId();
    if (this.provider === 'local') {
      const tenantDir = await this._ensureTenantDirectory(tenantId);
      const targetDir = path.join(tenantDir, destinationFolder);
      if (!fs.existsSync(targetDir)) {
        await mkdirAsync(targetDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${fileObj.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(targetDir, fileName);

      // Copy from multer's temp path to the target path
      await copyFileAsync(fileObj.path, filePath);
      // Remove temp file
      await unlinkAsync(fileObj.path).catch(() => {});

      // Return relative path to store in DB
      return path.join(String(tenantId), destinationFolder, fileName).replace(/\\/g, '/');
    }
    // S3/Azure implementations would go here
    throw new Error('Unsupported storage provider');
  }

  async deleteFile(relativePath) {
    const tenantId = this.getTenantId();
    // Validate path belongs to this tenant to prevent path traversal
    if (!relativePath.startsWith(`${tenantId}/`) && !relativePath.startsWith(`${tenantId}\\`)) {
      throw new AppError('Unauthorized access to file outside tenant scope.', 403);
    }

    if (this.provider === 'local') {
      const fullPath = path.join(UPLOADS_ROOT, relativePath);
      // Extra path traversal check
      if (!fullPath.startsWith(UPLOADS_ROOT)) {
        throw new AppError('Invalid path.', 400);
      }
      if (fs.existsSync(fullPath)) {
        await unlinkAsync(fullPath);
      }
      return true;
    }
    throw new Error('Unsupported storage provider');
  }

  async getFileStream(relativePath) {
    const tenantId = this.getTenantId();
    if (!relativePath.startsWith(`${tenantId}/`) && !relativePath.startsWith(`${tenantId}\\`)) {
      throw new AppError('Unauthorized access to file outside tenant scope.', 403);
    }

    if (this.provider === 'local') {
      const fullPath = path.join(UPLOADS_ROOT, relativePath);
      if (!fullPath.startsWith(UPLOADS_ROOT)) {
        throw new AppError('Invalid path.', 400);
      }
      if (!fs.existsSync(fullPath)) {
        throw new AppError('File not found.', 404);
      }
      return fs.createReadStream(fullPath);
    }
    throw new Error('Unsupported storage provider');
  }

  async getFilePath(relativePath) {
    const tenantId = this.getTenantId();
    if (!relativePath.startsWith(`${tenantId}/`) && !relativePath.startsWith(`${tenantId}\\`)) {
      throw new AppError('Unauthorized access to file outside tenant scope.', 403);
    }

    if (this.provider === 'local') {
      const fullPath = path.join(UPLOADS_ROOT, relativePath);
      if (!fullPath.startsWith(UPLOADS_ROOT)) {
        throw new AppError('Invalid path.', 400);
      }
      return fullPath;
    }
    throw new Error('Unsupported storage provider');
  }

  async createTempDir() {
    const tenantId = this.getTenantId();
    if (this.provider === 'local') {
      const tenantDir = await this._ensureTenantDirectory(tenantId);
      const tempDir = path.join(tenantDir, 'temp', `${Date.now()}`);
      await mkdirAsync(tempDir, { recursive: true });
      return tempDir;
    }
    throw new Error('Unsupported storage provider');
  }

  async cleanupTempDir(tempDirPath) {
    const tenantId = this.getTenantId();
    if (this.provider === 'local') {
      // Basic security check
      if (tempDirPath.includes(String(tenantId)) && tempDirPath.includes('temp')) {
         fs.rmSync(tempDirPath, { recursive: true, force: true });
      }
    }
  }
}

module.exports = new StorageService();
