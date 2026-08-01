const fs = require('fs').promises;
const path = require('path');
const logger = require('../../config/logger');

let mammoth;
try {
  // eslint-disable-next-line global-require
  mammoth = require('mammoth');
} catch (_error) {
  mammoth = null;
}

let WordExtractor;
try {
  // eslint-disable-next-line global-require
  WordExtractor = require('word-extractor');
} catch (_error) {
  WordExtractor = null;
}

let pdfParse;
try {
  // Use lib entry directly to avoid pdf-parse debug/test side-effects.
  // eslint-disable-next-line global-require, import/no-unresolved
  pdfParse = require('pdf-parse/lib/pdf-parse.js');
} catch (_error) {
  try {
    // eslint-disable-next-line global-require
    pdfParse = require('pdf-parse');
  } catch (_inner) {
    pdfParse = null;
  }
}

const normalizeExtractedText = (value = '') => value.replace(/\s+/g, ' ').trim();

const extractTextFromTxt = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8');
  return normalizeExtractedText(text);
};

const extractTextFromDocx = async (filePath) => {
  if (!mammoth) return '';
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeExtractedText(result?.value || '');
};

const extractTextFromDoc = async (filePath) => {
  if (!WordExtractor) return '';
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(filePath);
  return normalizeExtractedText(extracted?.getBody?.() || '');
};

const extractTextFromPdf = async (filePath) => {
  if (!pdfParse) {
    logger.warn('pdf-parse is not available; PDF text extraction skipped.');
    return '';
  }
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return normalizeExtractedText(result?.text || '');
};

const extractDocumentSearchContent = async (file) => {
  if (!file?.path) return '';

  const ext = path.extname(file.originalname || file.path).toLowerCase();
  try {
    if (ext === '.txt') return await extractTextFromTxt(file.path);
    if (ext === '.docx') return await extractTextFromDocx(file.path);
    if (ext === '.doc') return await extractTextFromDoc(file.path);
    if (ext === '.pdf') return await extractTextFromPdf(file.path);
    return '';
  } catch (error) {
    logger.warn(`Document text extraction failed for "${file.originalname || file.path}": ${error.message}`);
    return '';
  }
};

module.exports = {
  extractDocumentSearchContent,
};
