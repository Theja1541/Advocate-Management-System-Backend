const { body, param } = require('express-validator');

const createLegalTextRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }).withMessage('Title cannot exceed 255 characters'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
];

const updateLegalTextRules = [
  ...createLegalTextRules,
];

const legalTextIdParamRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid Legal Text ID is required'),
];

module.exports = {
  createLegalTextRules,
  updateLegalTextRules,
  legalTextIdParamRules,
};
