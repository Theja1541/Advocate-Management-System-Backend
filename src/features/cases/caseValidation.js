const { body, param } = require('express-validator');

const STATUSES = ['Active', 'Pending Approval', 'Closed'];

const createCaseRules = [
  body('caseNo')
    .trim()
    .notEmpty()
    .withMessage('Case number is required')
    .isLength({ max: 80 })
    .withMessage('Case number must be at most 80 characters'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('caseTypeId')
    .isInt({ min: 1 })
    .withMessage('A valid Case Type is required'),
  body('caseStageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('A valid Case Stage ID is required'),
  body('courtId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('A valid Court ID is required'),
  body('court')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 180 })
    .withMessage('Court must be at most 180 characters'),

  body('nextHearing')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Next hearing must be a valid date (YYYY-MM-DD)'),
  body('advocateId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('clientId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('approvalLevel')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 127 })
    .withMessage('Approval level must be a valid integer'),
  body('suitValue')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Suit value must be a positive number'),
  body('feePercentage')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Fee percentage must be between 0 and 100'),
  body('processFee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Process fee must be a positive number'),
  body('filingFee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Filing fee must be a positive number'),
  body('miscCharges')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Misc charges must be a positive number'),
];

const updateCaseRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
  body('caseNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Case number cannot be empty')
    .isLength({ max: 80 })
    .withMessage('Case number must be at most 80 characters'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('caseTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Case Type ID is required'),
  body('caseStageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Case Stage ID is required'),
  body('courtId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Court ID is required'),
  body('court')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 180 })
    .withMessage('Court must be at most 180 characters'),

  body('nextHearing')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Next hearing must be a valid date (YYYY-MM-DD)'),
  body('advocateId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('clientId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('approvalLevel')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 127 })
    .withMessage('Approval level must be a valid integer'),
  body('suitValue')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Suit value must be a positive number'),
  body('feePercentage')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Fee percentage must be between 0 and 100'),
  body('processFee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Process fee must be a positive number'),
  body('filingFee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Filing fee must be a positive number'),
  body('miscCharges')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Misc charges must be a positive number'),
];

const caseIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

module.exports = {
  createCaseRules,
  updateCaseRules,
  caseIdParamRules,
  STATUSES,
};
