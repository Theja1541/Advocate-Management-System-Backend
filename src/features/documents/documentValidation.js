const { body, param } = require('express-validator');

const createDocumentRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Document name is required')
    .isLength({ max: 200 })
    .withMessage('Document name must be at most 200 characters'),
  body('documentCategoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isInt({ min: 1 })
    .withMessage('Valid Category ID is required')
    .custom(async (value) => {
      const { DocumentCategory } = require('../associations');
      const cat = await DocumentCategory.findOne({ where: { id: value, isActive: true } });
      if (!cat) {
        throw new Error('Selected category is invalid or inactive');
      }
      return true;
    }),
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
  body('documentCategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Category ID is required')
    .custom(async (value) => {
      const { DocumentCategory } = require('../associations');
      const cat = await DocumentCategory.findOne({ where: { id: value, isActive: true } });
      if (!cat) {
        throw new Error('Selected category is invalid or inactive');
      }
      return true;
    }),
  body('caseId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

module.exports = {
  createDocumentRules,
  documentIdParamRules,
  updateDocumentRules,
};
