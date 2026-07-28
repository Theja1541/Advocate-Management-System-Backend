const { body, param } = require('express-validator');

const TITLE_STATUSES = ['clear', 'disputed', 'under_scrutiny'];

const createOpinionRules = [
  body('referenceNo')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Reference number must be at most 30 characters'),
  body('clientId')
    .notEmpty()
    .withMessage('Client is required')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('surveyNo')
    .trim()
    .notEmpty()
    .withMessage('Survey number is required')
    .isLength({ max: 50 })
    .withMessage('Survey number must be at most 50 characters'),
  body('village')
    .trim()
    .notEmpty()
    .withMessage('Village is required')
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('opinionType')
    .trim()
    .notEmpty()
    .withMessage('Opinion type is required')
    .isLength({ max: 100 })
    .withMessage('Opinion type must be at most 100 characters'),
  body('issueDate')
    .notEmpty()
    .withMessage('Issue date is required')
    .isISO8601()
    .withMessage('Issue date must be a valid date (YYYY-MM-DD)'),
  body('titleStatus')
    .optional({ values: 'falsy' })
    .isIn(TITLE_STATUSES)
    .withMessage(`Title status must be one of: ${TITLE_STATUSES.join(', ')}`),
  body('advocateId')
    .notEmpty()
    .withMessage('Advocate is required')
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('findingsNote')
    .trim()
    .notEmpty()
    .withMessage('Findings note is required'),
];

const updateOpinionRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid opinion ID is required'),
  body('referenceNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reference number cannot be empty')
    .isLength({ max: 30 })
    .withMessage('Reference number must be at most 30 characters'),
  body('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('surveyNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Survey number cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Survey number must be at most 50 characters'),
  body('village')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Village cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('opinionType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Opinion type cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Opinion type must be at most 100 characters'),
  body('issueDate')
    .optional()
    .isISO8601()
    .withMessage('Issue date must be a valid date (YYYY-MM-DD)'),
  body('titleStatus')
    .optional({ values: 'falsy' })
    .isIn(TITLE_STATUSES)
    .withMessage(`Title status must be one of: ${TITLE_STATUSES.join(', ')}`),
  body('advocateId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('findingsNote')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Findings note cannot be empty'),
];

const opinionIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid opinion ID is required'),
];

module.exports = {
  createOpinionRules,
  updateOpinionRules,
  opinionIdParamRules,
  TITLE_STATUSES,
};
