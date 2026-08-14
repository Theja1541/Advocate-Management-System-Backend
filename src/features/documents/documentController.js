const path = require('path');
const fs = require('fs');
const StorageService = require('../../services/StorageService');
const documentService = require('./documentService');
const logger = require('../../config/logger');
const AppError = require('../../utils/AppError');

exports.getAllDocuments = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const documents = await documentService.getAllDocuments(tenantId, req.user);
    res.status(200).json({
      status: 'success',
      data: { documents },
    });
  } catch (error) {
    logger.error('GetAllDocuments error:', error);
    next(error);
  }
};


exports.getDocumentById = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const document = await documentService.getDocumentById(req.params.id, tenantId);
    res.status(200).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    logger.error('GetDocumentById error:', error);
    next(error);
  }
};

exports.createDocument = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const document = await documentService.createDocument({
      name: req.body.name,
      documentCategoryId: req.body.documentCategoryId !== undefined ? Number(req.body.documentCategoryId) : undefined,
      caseId: req.body.caseId !== undefined ? Number(req.body.caseId) : undefined,
      landId: req.body.landId !== undefined ? Number(req.body.landId) : undefined,
      file: req.file,
      uploadedBy: req.user?.id,
      tenantId,
    });
    res.status(201).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // ignore cleanup errors
      }
    }
    logger.error('CreateDocument error:', error);
    next(error);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const document = await documentService.getDocumentById(req.params.id, tenantId);
    const filePath = document.filePath;
    const fsPathCandidates = [
      filePath,
      path.isAbsolute(filePath || '') ? filePath : path.resolve(process.cwd(), filePath || ''),
      path.resolve(__dirname, '../../../uploads/documents', path.basename(filePath || '')),
      path.resolve(__dirname, '../../../uploads', path.basename(filePath || '')),
    ].filter(Boolean);

    const existingPath = filePathCandidatesFind(fsPathCandidates);
    if (!existingPath) {
      return next(new AppError('File not found on server', 404));
    }

    const downloadName = `${document.documentCode}-${document.name}${path.extname(existingPath)}`;
    return res.download(existingPath, downloadName);
  } catch (error) {
    logger.error('DownloadDocument error:', error);
    next(error);
  }
};

function filePathCandidatesFind(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

exports.getDocumentText = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const content = await documentService.getDocumentTextContent(req.params.id, tenantId);
    res.status(200).json({
      status: 'success',
      data: { content },
    });
  } catch (error) {
    logger.error('GetDocumentText error:', error);
    next(error);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const document = await documentService.updateDocument(req.params.id, {
      name: req.body.name,
      documentCategoryId: req.body.documentCategoryId !== undefined ? Number(req.body.documentCategoryId) : undefined,
      caseId: req.body.caseId !== undefined ? Number(req.body.caseId) : undefined,
      landId: req.body.landId !== undefined ? Number(req.body.landId) : undefined,
      file: req.file,
      tenantId,
    });
    res.status(200).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // ignore
      }
    }
    logger.error('UpdateDocument error:', error);
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    await documentService.deleteDocument(req.params.id, tenantId);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteDocument error:', error);
    next(error);
  }
};
