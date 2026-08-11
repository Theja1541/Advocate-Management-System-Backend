const { body, param } = require('express-validator');

const EC_STATUSES = ['clear', 'noted', 'pending'];

const createTitleSearchRules = [
  body('landId')
    .notEmpty()
    .withMessage('Land ID is required')
    .isInt({ min: 1 })
    .withMessage('Valid Land ID is required'),
  body('searchDate')
    .notEmpty()
    .withMessage('Search date is required')
    .isISO8601()
    .withMessage('Search date must be a valid date (YYYY-MM-DD)'),
  body('periodFrom')
    .notEmpty()
    .withMessage('Period from date is required')
    .isISO8601()
    .withMessage('Period from date must be a valid date (YYYY-MM-DD)'),
  body('periodTo')
    .notEmpty()
    .withMessage('Period to date is required')
    .isISO8601()
    .withMessage('Period to date must be a valid date (YYYY-MM-DD)'),
  body('ecStatus')
    .optional({ values: 'falsy' })
    .isIn(EC_STATUSES)
    .withMessage(`EC status must be one of: ${EC_STATUSES.join(', ')}`),
  body('ecReferenceNo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('EC reference number must be at most 100 characters'),
  body('revenueRecordsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Revenue records verified must be a boolean'),
  body('registrationRecordsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Registration records verified must be a boolean'),
  body('litigationChecked')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Litigation checked must be a boolean'),
  body('documentsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Documents verified must be a boolean'),
  body('remarks')
    .optional({ values: 'falsy' })
    .trim(),
  body('conductedBy')
    .notEmpty()
    .withMessage('Conducted by User ID is required')
    .isInt({ min: 1 })
    .withMessage('Valid User ID is required'),
];

const updateTitleSearchRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid Title Search ID is required'),
  body('landId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid Land ID is required'),
  body('searchDate')
    .optional()
    .isISO8601()
    .withMessage('Search date must be a valid date (YYYY-MM-DD)'),
  body('periodFrom')
    .optional()
    .isISO8601()
    .withMessage('Period from date must be a valid date (YYYY-MM-DD)'),
  body('periodTo')
    .optional()
    .isISO8601()
    .withMessage('Period to date must be a valid date (YYYY-MM-DD)'),
  body('ecStatus')
    .optional({ values: 'falsy' })
    .isIn(EC_STATUSES)
    .withMessage(`EC status must be one of: ${EC_STATUSES.join(', ')}`),
  body('ecReferenceNo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('EC reference number must be at most 100 characters'),
  body('revenueRecordsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Revenue records verified must be a boolean'),
  body('registrationRecordsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Registration records verified must be a boolean'),
  body('litigationChecked')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Litigation checked must be a boolean'),
  body('documentsVerified')
    .optional({ values: 'null' })
    .isBoolean()
    .withMessage('Documents verified must be a boolean'),
  body('remarks')
    .optional({ values: 'falsy' })
    .trim(),
  body('conductedBy')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid User ID is required'),
];

const titleSearchIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid Title Search ID is required'),
];

module.exports = {
  createTitleSearchRules,
  updateTitleSearchRules,
  titleSearchIdParamRules,
  EC_STATUSES,
};
