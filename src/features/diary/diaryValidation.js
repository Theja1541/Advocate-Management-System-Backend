const { body, param } = require('express-validator');

const createDiaryRules = [
  body('caseId')
    .notEmpty()
    .withMessage('Case is required')
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
  body('hearingDate')
    .notEmpty()
    .withMessage('Hearing date is required')
    .isISO8601()
    .withMessage('Hearing date must be a valid date (YYYY-MM-DD)'),
  body('hearingTime')
    .trim()
    .notEmpty()
    .withMessage('Hearing time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Hearing time must be HH:MM or HH:MM:SS (24-hour)'),
  body('advocateId')
    .notEmpty()
    .withMessage('Advocate is required')
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('courtIndex')
    .notEmpty()
    .withMessage('Court is required')
    .isInt({ min: 0 })
    .withMessage('Valid court index is required'),
  body('note')
    .trim()
    .notEmpty()
    .withMessage('Hearing note is required'),
  body('nextHearingDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Next hearing date must be a valid date (YYYY-MM-DD)'),
  body('attachmentsCount')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Attachments count must be a non-negative integer'),
];

const updateDiaryRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid diary ID is required'),
  body('caseId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
  body('hearingDate')
    .optional()
    .isISO8601()
    .withMessage('Hearing date must be a valid date (YYYY-MM-DD)'),
  body('hearingTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Hearing time cannot be empty')
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('Hearing time must be HH:MM or HH:MM:SS (24-hour)'),
  body('advocateId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('courtIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Valid court index is required'),
  body('note')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Hearing note cannot be empty'),
  body('nextHearingDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Next hearing date must be a valid date (YYYY-MM-DD)'),
  body('attachmentsCount')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Attachments count must be a non-negative integer'),
];

const diaryIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid diary ID is required'),
];

module.exports = {
  createDiaryRules,
  updateDiaryRules,
  diaryIdParamRules,
};
