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
  query('sourceAct')
    .optional()
    .trim(),
  query('targetAct')
    .optional()
    .trim(),
  query('effectiveDate')
    .optional({ values: 'falsy' })
    .trim()
    .isISO8601()
    .withMessage('Effective date must be a valid YYYY-MM-DD date'),
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
    .isIn(['Central', 'State'])
    .withMessage('Jurisdiction type must be Central or State'),
  body('state')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be at most 100 characters')
    .custom((value, { req }) => {
      if (req.body.type === 'State' && !value) {
        throw new Error('State name is required when jurisdiction type is State');
      }
      return true;
    }),
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
    .isIn(['Central', 'State'])
    .withMessage('Jurisdiction type must be Central or State'),
  body('state')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be at most 100 characters')
    .custom((value, { req }) => {
      if (req.body.type === 'State' && !value) {
        throw new Error('State name is required when jurisdiction type is State');
      }
      return true;
    }),
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

const createAmendmentRules = [
  body('sourceAct')
    .trim()
    .notEmpty()
    .withMessage('Source Act is required')
    .isLength({ max: 255 }),
  body('targetAct')
    .trim()
    .notEmpty()
    .withMessage('Target Act is required')
    .isLength({ max: 255 }),
  body('oldSection')
    .trim()
    .notEmpty()
    .withMessage('Old Section is required')
    .isLength({ max: 40 }),
  body('oldTitle')
    .trim()
    .notEmpty()
    .withMessage('Old Title is required')
    .isLength({ max: 255 }),
  body('newSection')
    .trim()
    .notEmpty()
    .withMessage('New Section is required')
    .isLength({ max: 40 }),
  body('newTitle')
    .trim()
    .notEmpty()
    .withMessage('New Title is required')
    .isLength({ max: 255 }),
  body('effectiveDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Effective date must be YYYY-MM-DD'),
  body('newSection').custom(async (value, { req }) => {
    const { Amendment } = require('../associations');
    const { Op } = require('sequelize');
    const { sourceAct, targetAct, oldSection, newSection } = req.body;
    const match = await Amendment.findOne({
      where: {
        sourceAct: (sourceAct || '').trim(),
        targetAct: (targetAct || '').trim(),
        oldSection: (oldSection || '').trim(),
        newSection: (newSection || '').trim(),
      }
    });
    if (match) {
      throw new Error('An amendment mapping with these exact section relationships already exists.');
    }
    return true;
  }),
];

const updateAmendmentRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  body('sourceAct').optional().trim().notEmpty().isLength({ max: 255 }),
  body('targetAct').optional().trim().notEmpty().isLength({ max: 255 }),
  body('oldSection').optional().trim().notEmpty().isLength({ max: 40 }),
  body('oldTitle').optional().trim().notEmpty().isLength({ max: 255 }),
  body('newSection').optional().trim().notEmpty().isLength({ max: 40 }),
  body('newTitle').optional().trim().notEmpty().isLength({ max: 255 }),
  body('effectiveDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Effective date must be YYYY-MM-DD'),
  body('newSection').custom(async (value, { req }) => {
    const { Amendment } = require('../associations');
    const { Op } = require('sequelize');
    const { id } = req.params;
    const { sourceAct, targetAct, oldSection, newSection } = req.body;
    
    // Check if duplicate target exists, excluding current row ID
    const match = await Amendment.findOne({
      where: {
        sourceAct: (sourceAct || '').trim(),
        targetAct: (targetAct || '').trim(),
        oldSection: (oldSection || '').trim(),
        newSection: (newSection || '').trim(),
        id: { [Op.ne]: id }
      }
    });
    if (match) {
      throw new Error('An amendment mapping with these exact section relationships already exists.');
    }
    return true;
  }),
];

const amendmentIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid amendment ID is required'),
];

module.exports = {
  listActsQueryRules,
  listAmendmentsQueryRules,
  actIdParamRules,
  bookmarkActRules,
  createActRules,
  updateActRules,
  createAmendmentRules,
  updateAmendmentRules,
  amendmentIdParamRules,
};
