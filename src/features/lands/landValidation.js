const { body, param } = require('express-validator');

const ENCUMBRANCE_STATUSES = ['clear', 'noted', 'pending'];
const TITLE_STATUSES = ['clear', 'disputed', 'under_scrutiny'];

const createLandRules = [
  body('surveyNo')
    .trim()
    .notEmpty()
    .withMessage('Survey number is required')
    .isLength({ max: 50 })
    .withMessage('Survey number must be at most 50 characters'),
  body('clientId')
    .notEmpty()
    .withMessage('Client is required')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('village')
    .trim()
    .notEmpty()
    .withMessage('Village is required')
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('mandal')
    .trim()
    .notEmpty()
    .withMessage('Mandal is required')
    .isLength({ max: 100 })
    .withMessage('Mandal must be at most 100 characters'),
  body('district')
    .trim()
    .notEmpty()
    .withMessage('District is required')
    .isLength({ max: 100 })
    .withMessage('District must be at most 100 characters'),
  body('extent')
    .trim()
    .notEmpty()
    .withMessage('Extent is required')
    .isLength({ max: 50 })
    .withMessage('Extent must be at most 50 characters'),
  body('classification')
    .trim()
    .notEmpty()
    .withMessage('Classification is required')
    .isLength({ max: 50 })
    .withMessage('Classification must be at most 50 characters'),
  body('pattaNo')
    .trim()
    .notEmpty()
    .withMessage('Patta number is required')
    .isLength({ max: 50 })
    .withMessage('Patta number must be at most 50 characters'),
  body('encumbranceStatus')
    .optional({ values: 'falsy' })
    .isIn(ENCUMBRANCE_STATUSES)
    .withMessage(`Encumbrance status must be one of: ${ENCUMBRANCE_STATUSES.join(', ')}`),
  body('titleStatus')
    .optional({ values: 'falsy' })
    .isIn(TITLE_STATUSES)
    .withMessage(`Title status must be one of: ${TITLE_STATUSES.join(', ')}`),
  body('caseId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

const updateLandRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid land ID is required'),
  body('surveyNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Survey number cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Survey number must be at most 50 characters'),
  body('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('village')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Village cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('mandal')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mandal cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Mandal must be at most 100 characters'),
  body('district')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('District cannot be empty')
    .isLength({ max: 100 })
    .withMessage('District must be at most 100 characters'),
  body('extent')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Extent cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Extent must be at most 50 characters'),
  body('classification')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Classification cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Classification must be at most 50 characters'),
  body('pattaNo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Patta number cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Patta number must be at most 50 characters'),
  body('encumbranceStatus')
    .optional({ values: 'falsy' })
    .isIn(ENCUMBRANCE_STATUSES)
    .withMessage(`Encumbrance status must be one of: ${ENCUMBRANCE_STATUSES.join(', ')}`),
  body('titleStatus')
    .optional({ values: 'falsy' })
    .isIn(TITLE_STATUSES)
    .withMessage(`Title status must be one of: ${TITLE_STATUSES.join(', ')}`),
  body('caseId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid case ID is required'),
];

const landIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid land ID is required'),
];

module.exports = {
  createLandRules,
  updateLandRules,
  landIdParamRules,
  ENCUMBRANCE_STATUSES,
  TITLE_STATUSES,
};
