const path = require('path');
const fs = require('fs');
const { Document, Case, User } = require('../associations');
const AppError = require('../../utils/AppError');

const SAFE_ATTRIBUTES = [
  'id',
  'documentCode',
  'name',
  'category',
  'caseId',
  'fileType',
  'fileSize',
  'filePath',
  'uploadedBy',
  'uploadDate',
  'created_at',
];

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

const getAllDocuments = async () => {
  const documents = await Document.findAll({
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude, uploaderInclude],
    order: [['id', 'DESC']],
  });
  return documents.map(toPublicDocument);
};

const getDocumentById = async (id) => {
  const document = await Document.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [caseInclude, uploaderInclude],
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return toPublicDocument(document);
};

const createDocument = async ({
  name,
  category,
  caseId,
  file,
  uploadedBy,
}) => {
  if (!file) {
    throw new AppError('File is required', 400);
  }

  await assertCaseExists(caseId);

  const documentCode = await generateDocumentCode();
  const uploadDate = new Date().toISOString().slice(0, 10);

  const document = await Document.create({
    documentCode,
    name,
    category,
    caseId,
    fileType: resolveFileType(file.originalname, file.mimetype),
    fileSize: formatFileSize(file.size),
    filePath: file.path || path.join('uploads', file.filename),
    uploadedBy: uploadedBy || null,
    uploadDate,
  });

  return getDocumentById(document.id);
};

const updateDocument = async (id, { name, category, caseId, file }) => {
  const document = await Document.findByPk(id);
  if (!document) {
    throw new AppError('Document not found', 404);
  }

  if (caseId !== undefined) {
    await assertCaseExists(caseId);
    document.caseId = caseId;
  }
  if (name !== undefined) document.name = name;
  if (category !== undefined) document.category = category;

  if (file) {
    // Clean up old file first
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
  }

  await document.save();
  return getDocumentById(document.id);
};

const deleteDocument = async (id) => {
  const document = await Document.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
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

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  formatFileSize,
  resolveFileType,
};
