const { body, param } = require('express-validator');

const CATEGORIES = [
  'Petitions',
  'Affidavits',
  'Orders',
  'Judgments',
  'Evidence',
  'Client Documents',
  'Agreements',
];

const createDocumentRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Document name is required')
    .isLength({ max: 200 })
    .withMessage('Document name must be at most 200 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('caseId')
    .notEmpty()
    .withMessage('Case is required')
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

const documentIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid document ID is required'),
];

const updateDocumentRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid document ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Document name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Document name must be at most 200 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('caseId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

module.exports = {
  createDocumentRules,
  documentIdParamRules,
  updateDocumentRules,
  CATEGORIES,
};
