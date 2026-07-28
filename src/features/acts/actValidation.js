const { body, query, param } = require('express-validator');

const listActsQueryRules = [
  query('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  query('abbreviation')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Abbreviation must be at most 40 characters'),
  query('section')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Section must be at most 40 characters'),
  query('q')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be at most 255 characters'),
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be at most 255 characters'),
];

const listAmendmentsQueryRules = [
  query('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  query('abbreviation')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Abbreviation must be at most 40 characters'),
  query('section')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Section must be at most 40 characters'),
  query('q')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be at most 255 characters'),
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be at most 255 characters'),
];

const actIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid act ID is required'),
];

const bookmarkActRules = [
  body('actId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid actId is required'),
  body('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid id is required'),
  body()
    .custom((_, { req }) => {
      if (req.body.actId == null && req.body.id == null) {
        throw new Error('actId is required');
      }
      return true;
    }),
  body('bookmarked')
    .optional()
    .isBoolean()
    .withMessage('bookmarked must be a boolean')
    .toBoolean(),
];

const createActRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Act name is required')
    .isLength({ max: 255 })
    .withMessage('Act name must be at most 255 characters'),
  body('abbreviation')
    .trim()
    .notEmpty()
    .withMessage('Abbreviation is required')
    .isLength({ max: 40 })
    .withMessage('Abbreviation must be at most 40 characters'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Jurisdiction type is required')
    .isLength({ max: 80 })
    .withMessage('Jurisdiction type must be at most 80 characters'),
  body('effectiveDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Effective date must be a valid ISO8601 date (YYYY-MM-DD)'),
  body('sectionsCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sections count must be a non-negative integer')
    .toInt(),
];

const updateActRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Act name must be at most 255 characters'),
  body('abbreviation')
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage('Abbreviation must be at most 40 characters'),
  body('type')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Jurisdiction type must be at most 80 characters'),
  body('effectiveDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Effective date must be a valid ISO8601 date (YYYY-MM-DD)'),
  body('sectionsCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sections count must be a non-negative integer')
    .toInt(),
];

module.exports = {
  listActsQueryRules,
  listAmendmentsQueryRules,
  actIdParamRules,
  bookmarkActRules,
  createActRules,
  updateActRules,
};
