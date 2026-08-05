const path = require('path');
const fs = require('fs');
const { sequelize } = require('../../config/database');
const { Document, Case, User, DocumentCategory } = require('../associations');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const {
  MAX_DOCUMENT_SIZE_BYTES,
  ALLOWED_DOCUMENT_EXTENSIONS,
} = require('./documentUpload');
const { extractDocumentSearchContent } = require('./documentTextExtraction');

const SAFE_ATTRIBUTES = [
  'id',
  'documentCode',
  'name',
  'documentCategoryId',
  'caseId',
  'fileType',
  'fileSize',
  'filePath',
  'uploadedBy',
  'uploadDate',
  'created_at',
];

let hasSearchContentColumnCache = null;

const hasSearchContentColumn = async () => {
  if (typeof hasSearchContentColumnCache === 'boolean') {
    return hasSearchContentColumnCache;
  }
  const table = await sequelize.getQueryInterface().describeTable('documents');
  hasSearchContentColumnCache = Boolean(table?.search_content);
  return hasSearchContentColumnCache;
};

const getSafeAttributes = async () => {
  const hasColumn = await hasSearchContentColumn();
  return hasColumn ? [...SAFE_ATTRIBUTES, 'searchContent'] : SAFE_ATTRIBUTES;
};

const isMissingSearchContentColumnError = (error) => {
  const message = String(error?.message || '');
  return message.includes('search_content') && message.includes('Unknown column');
};

const resolveStoredFilePath = (filePath) => {
  if (!filePath) return null;
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) return filePath;

  const candidates = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(__dirname, '../../../', filePath),
    path.resolve(__dirname, '../../../uploads', path.basename(filePath)),
    path.resolve(__dirname, '../../../uploads/documents', path.basename(filePath)),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const caseInclude = {
  model: Case,
  as: 'case',
  attributes: ['id', 'caseNo', 'title'],
};

const uploaderInclude = {
  model: User,
  as: 'uploader',
  attributes: ['id', 'name'],
};

const categoryInclude = {
  model: DocumentCategory,
  as: 'documentCategory',
  attributes: ['id', 'name', 'code'],
};

const toPublicDocument = (doc) => {
  const plain = doc.get ? doc.get({ plain: true }) : { ...doc };
  return plain;
};

const assertCaseExists = async (caseId) => {
  const caseRecord = await Case.findByPk(caseId, { attributes: ['id'] });
  if (!caseRecord) {
    throw new AppError('Case not found', 400);
  }
};

const generateDocumentCode = async () => {
  const last = await Document.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
  });
  const nextNum = Number(last?.id || 0) + 101;
  return `DC-${String(nextNum).padStart(3, '0')}`;
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resolveFileType = (originalName = '', mimeType = '') => {
  const ext = path.extname(originalName).replace('.', '').toUpperCase();
  if (ext) return ext === 'JPEG' ? 'JPG' : ext;
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'DOC';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG';
  if (mimeType.includes('png')) return 'PNG';
  return 'FILE';
};

const validateDocumentFile = (file) => {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    throw new AppError('Invalid file format. Accepted types: PDF, DOC, DOCX, TXT.', 400);
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new AppError('File size must be less than or equal to 5MB.', 400);
  }
};

const getAllDocuments = async () => {
  const attributes = await getSafeAttributes();
  const documents = await Document.findAll({
    attributes,
    include: [caseInclude, uploaderInclude, categoryInclude],
    order: [['id', 'DESC']],
  });
  return documents.map(toPublicDocument);
};

const getDocumentById = async (id) => {
  const attributes = await getSafeAttributes();
  const document = await Document.findByPk(id, {
    attributes,
    include: [caseInclude, uploaderInclude, categoryInclude],
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return toPublicDocument(document);
};

const createDocument = async ({
  name,
  documentCategoryId,
  caseId,
  file,
  uploadedBy,
}) => {
  validateDocumentFile(file);

  const caseRecord = await Case.findByPk(caseId, { attributes: ['id', 'tenantId'] });
  if (!caseRecord) {
    throw new AppError('Case not found', 400);
  }

  // Check storage limit
  if (caseRecord.tenantId) {
    const tenantService = require('../tenants/tenantService');
    await tenantService.checkStorageLimit(caseRecord.tenantId, file.size);
  }

  const documentCode = await generateDocumentCode();
  const uploadDate = new Date().toISOString().slice(0, 10);
  const supportsSearchContent = await hasSearchContentColumn();
  // Always extract; persist only when the column exists.
  const searchContent = await extractDocumentSearchContent(file);
  let document;
  try {
    document = await Document.create({
      documentCode,
      name,
      documentCategoryId,
      caseId,
      fileType: resolveFileType(file.originalname, file.mimetype),
      fileSize: formatFileSize(file.size),
      filePath: file.path || path.join('uploads', file.filename),
      ...(supportsSearchContent ? { searchContent } : {}),
      uploadedBy: uploadedBy || null,
      uploadDate,
    });
  } catch (error) {
    if (!isMissingSearchContentColumnError(error)) throw error;
    hasSearchContentColumnCache = false;
    document = await Document.create({
      documentCode,
      name,
      documentCategoryId,
      caseId,
      fileType: resolveFileType(file.originalname, file.mimetype),
      fileSize: formatFileSize(file.size),
      filePath: file.path || path.join('uploads', file.filename),
      uploadedBy: uploadedBy || null,
      uploadDate,
    });
  }

  return getDocumentById(document.id);
};

const updateDocument = async (id, { name, documentCategoryId, caseId, file }) => {
  const attributes = await getSafeAttributes();
  const document = await Document.findByPk(id, { attributes });
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  if (caseId !== undefined) {
    await assertCaseExists(caseId);
    document.caseId = caseId;
  }
  if (name !== undefined) document.name = name;
  if (documentCategoryId !== undefined) document.documentCategoryId = documentCategoryId;

  if (file) {
    validateDocumentFile(file);
    const oldFilePath = document.filePath;
    if (oldFilePath && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch {
        // ignore
      }
    }
    document.fileType = resolveFileType(file.originalname, file.mimetype);
    document.fileSize = formatFileSize(file.size);
    document.filePath = file.path || path.join('uploads', file.filename);
    if (await hasSearchContentColumn()) {
      try {
        document.searchContent = await extractDocumentSearchContent(file);
      } catch {
        // best effort when extractor fails
      }
    }
  }
  try {
    await document.save();
  } catch (error) {
    if (!isMissingSearchContentColumnError(error)) throw error;
    hasSearchContentColumnCache = false;
    document.setDataValue('searchContent', null);
    document.changed('searchContent', false);
    await document.save();
  }
  return getDocumentById(document.id);
};

const deleteDocument = async (id) => {
  const attributes = await getSafeAttributes();
  const document = await Document.findByPk(id, {
    attributes,
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  const filePath = document.filePath;
  await document.destroy();

  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File cleanup is best-effort after DB delete
    }
  }

  return true;
};

const getDocumentTextContent = async (id) => {
  const attributes = await getSafeAttributes();
  const document = await Document.findByPk(id, { attributes });
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  const plain = toPublicDocument(document);
  let text = String(plain.searchContent || '').trim();
  const resolvedPath = resolveStoredFilePath(plain.filePath);

  if (!text && resolvedPath) {
    text = await extractDocumentSearchContent({
      path: resolvedPath,
      originalname: path.basename(resolvedPath),
    });

    if (text && (await hasSearchContentColumn())) {
      try {
        await Document.update({ searchContent: text }, { where: { id: plain.id } });
      } catch (error) {
        if (!isMissingSearchContentColumnError(error)) {
          logger.warn(`Failed to persist extracted search content: ${error.message}`);
        } else {
          hasSearchContentColumnCache = false;
        }
      }
    }
  }

  return {
    id: plain.id,
    name: plain.name,
    fileType: plain.fileType,
    text: text || '',
  };
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  getDocumentTextContent,
  createDocument,
  updateDocument,
  deleteDocument,
  formatFileSize,
  resolveFileType,
};
