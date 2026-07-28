const { body, param } = require('express-validator');

const STATUSES = ['active', 'expiring', 'expired'];

const createMembershipRules = [
  body('advocateId')
    .notEmpty()
    .withMessage('Advocate is required')
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('planName')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ max: 50 })
    .withMessage('Plan name must be at most 50 characters'),
  body('feeAmount')
    .notEmpty()
    .withMessage('Fee amount is required')
    .isFloat({ min: 0 })
    .withMessage('Fee amount must be a non-negative number'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const updateMembershipRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid membership ID is required'),
  body('advocateId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('planName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Plan name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Plan name must be at most 50 characters'),
  body('feeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fee amount must be a non-negative number'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
];

const membershipIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid membership ID is required'),
];

module.exports = {
  createMembershipRules,
  updateMembershipRules,
  membershipIdParamRules,
  STATUSES,
};
