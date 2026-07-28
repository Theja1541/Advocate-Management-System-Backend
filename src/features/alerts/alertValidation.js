const { body, param } = require('express-validator');

const SEVERITIES = ['tape', 'brass', 'ink'];

const createAlertRules = [
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Alert type is required')
    .isLength({ max: 50 })
    .withMessage('Alert type must be at most 50 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('severity')
    .trim()
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(SEVERITIES)
    .withMessage(`Severity must be one of: ${SEVERITIES.join(', ')}`),
  body('dueInfo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Due info must be at most 50 characters'),
  body('isResolved')
    .optional()
    .isBoolean()
    .withMessage('isResolved must be a boolean'),
];

const updateAlertRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid alert ID is required'),
  body('type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Alert type cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Alert type must be at most 50 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('severity')
    .optional({ values: 'falsy' })
    .isIn(SEVERITIES)
    .withMessage(`Severity must be one of: ${SEVERITIES.join(', ')}`),
  body('dueInfo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Due info must be at most 50 characters'),
  body('isResolved')
    .optional()
    .isBoolean()
    .withMessage('isResolved must be a boolean'),
];

const alertIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid alert ID is required'),
];

module.exports = {
  createAlertRules,
  updateAlertRules,
  alertIdParamRules,
  SEVERITIES,
};
