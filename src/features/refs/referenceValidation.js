const { body, param } = require('express-validator');

const createReferenceRules = [
  body('citation')
    .trim()
    .notEmpty()
    .withMessage('Citation is required')
    .isLength({ max: 100 })
    .withMessage('Citation must be at most 100 characters'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('court')
    .trim()
    .notEmpty()
    .withMessage('Court is required')
    .isLength({ max: 100 })
    .withMessage('Court must be at most 100 characters'),
  body('judge')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Judge must be at most 100 characters'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isLength({ max: 50 })
    .withMessage('Type must be at most 50 characters'),
  body('tag')
    .trim()
    .notEmpty()
    .withMessage('Tag is required')
    .isLength({ max: 100 })
    .withMessage('Tag must be at most 100 characters'),
  body('note')
    .trim()
    .notEmpty()
    .withMessage('Note is required'),
];

const updateReferenceRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid reference ID is required'),
  body('citation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Citation cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Citation must be at most 100 characters'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('court')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Court cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Court must be at most 100 characters'),
  body('judge')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Judge must be at most 100 characters'),
  body('type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Type cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Type must be at most 50 characters'),
  body('tag')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tag cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Tag must be at most 100 characters'),
  body('note')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Note cannot be empty'),
];

const referenceIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid reference ID is required'),
];

module.exports = {
  createReferenceRules,
  updateReferenceRules,
  referenceIdParamRules,
};
