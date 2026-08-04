const { body, param } = require('express-validator');

const TYPES = ['in', 'out'];
const MODES = ['Cash', 'Bank', 'UPI', 'Cheque'];
const CATEGORIES = [
  'Party Meeting',
  'Court Visit',
  'Office Visit',
  'Field Visit',
  'Client Payment',
  'Advocate Payment',
  'Office Expense',
  'Misc.',
  'Opening',
];

const createDaybookRules = [
  body('daybookCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Day book code must be at most 20 characters'),
  body('transactionDate')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Activity is required')
    .isIn(CATEGORIES)
    .withMessage(`Activity must be one of: ${CATEGORIES.join(', ')}`),
  body('particulars')
    .trim()
    .notEmpty()
    .withMessage('Particulars are required'),
  body('paymentMode')
    .trim()
    .notEmpty()
    .withMessage('Mode is required')
    .isIn(MODES)
    .withMessage(`Mode must be one of: ${MODES.join(', ')}`),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('In/Out type is required')
    .isIn(TYPES)
    .withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero'),
];

const updateDaybookRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid day book entry ID is required'),
  body('daybookCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Day book code cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Day book code must be at most 20 characters'),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('category')
    .optional()
    .trim()
    .isIn(CATEGORIES)
    .withMessage(`Activity must be one of: ${CATEGORIES.join(', ')}`),
  body('particulars')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Particulars cannot be empty'),
  body('paymentMode')
    .optional()
    .trim()
    .isIn(MODES)
    .withMessage(`Mode must be one of: ${MODES.join(', ')}`),
  body('type')
    .optional()
    .trim()
    .isIn(TYPES)
    .withMessage(`Type must be one of: ${TYPES.join(', ')}`),
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero'),
];

const daybookIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid day book entry ID is required'),
];

module.exports = {
  createDaybookRules,
  updateDaybookRules,
  daybookIdParamRules,
  CATEGORIES,
  MODES,
  TYPES,
};
