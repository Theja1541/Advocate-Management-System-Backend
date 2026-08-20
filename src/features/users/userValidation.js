const { body, param } = require('express-validator');

const STATUSES = ['active', 'inactive'];

const createUserRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 120 })
    .withMessage('Name must be at most 120 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 160 })
    .withMessage('Email must be at most 160 characters')
    .normalizeEmail(),
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isInt({ min: 1 })
    .withMessage('Valid Role ID is required')
    .toInt(),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const updateUserRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Name must be at most 120 characters'),
  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 160 })
    .withMessage('Email must be at most 160 characters')
    .normalizeEmail(),
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Role ID is required')
    .toInt(),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const userIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
];

module.exports = {
  createUserRules,
  updateUserRules,
  userIdParamRules,
  STATUSES,
};
