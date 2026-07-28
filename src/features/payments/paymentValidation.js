const { body, param } = require('express-validator');

const STATUSES = ['paid', 'part', 'pending'];
const PARTY_TYPES = ['Client', 'Advocate'];

const createPaymentRules = [
  body('receiptNo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Receipt number must be at most 20 characters'),
  body('caseId')
    .notEmpty()
    .withMessage('Case is required')
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
  body('partyType')
    .trim()
    .notEmpty()
    .withMessage('Party type is required')
    .isIn(PARTY_TYPES)
    .withMessage(`Party type must be one of: ${PARTY_TYPES.join(', ')}`),
  body('partyId')
    .notEmpty()
    .withMessage('Party is required')
    .isInt({ min: 1 })
    .withMessage('Valid party ID is required'),
  body('amountReceived')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Amount received must be a non-negative number'),
  body('amountOutstanding')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Outstanding amount must be a non-negative number'),
  body('transactionDate')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const updatePaymentRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid payment ID is required'),
  body('receiptNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Receipt number cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Receipt number must be at most 20 characters'),
  body('caseId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
  body('partyType')
    .optional()
    .trim()
    .isIn(PARTY_TYPES)
    .withMessage(`Party type must be one of: ${PARTY_TYPES.join(', ')}`),
  body('partyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid party ID is required'),
  body('amountReceived')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Amount received must be a non-negative number'),
  body('amountOutstanding')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Outstanding amount must be a non-negative number'),
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const paymentIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid payment ID is required'),
];

module.exports = {
  createPaymentRules,
  updatePaymentRules,
  paymentIdParamRules,
  STATUSES,
  PARTY_TYPES,
};
