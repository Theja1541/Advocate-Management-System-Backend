const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../../utils/AppError');

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.doc', '.docx', '.txt', '.pdf']);

const uploadDir = path.resolve(__dirname, '../../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    return cb(
      new AppError('Invalid file format. Accepted types: PDF, DOC, DOCX, TXT.', 400),
      false
    );
  }
  return cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
});

const uploadDocumentFile = (req, res, next) => {
  uploader.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size must be less than or equal to 5MB.', 400));
    }

    return next(err);
  });
};

module.exports = {
  uploadDocumentFile,
  MAX_DOCUMENT_SIZE_BYTES,
  ALLOWED_DOCUMENT_EXTENSIONS,
};
