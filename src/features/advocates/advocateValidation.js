const { body, param } = require('express-validator');

const STATUSES = ['active', 'inactive'];

const createAdvocateRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 140 })
    .withMessage('Name must be at most 140 characters'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile is required')
    .isLength({ max: 30 })
    .withMessage('Mobile must be at most 30 characters'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 160 })
    .withMessage('Email must be at most 160 characters')
    .normalizeEmail(),
  body('specialization')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 140 })
    .withMessage('Specialization must be at most 140 characters'),
  body('enrolment')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Enrolment must be at most 80 characters'),
  body('experience')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Experience must be at most 40 characters'),
  body('relation')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Relation cannot be empty')
    .isLength({ max: 80 })
    .withMessage('Relation must be at most 80 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters'),
  body('createLogin')
    .optional()
    .isBoolean()
    .withMessage('createLogin must be a boolean')
    .toBoolean(),
];

const updateAdvocateRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 140 })
    .withMessage('Name must be at most 140 characters'),
  body('mobile')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mobile cannot be empty')
    .isLength({ max: 30 })
    .withMessage('Mobile must be at most 30 characters'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 160 })
    .withMessage('Email must be at most 160 characters')
    .normalizeEmail(),
  body('specialization')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 140 })
    .withMessage('Specialization must be at most 140 characters'),
  body('enrolment')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Enrolment must be at most 80 characters'),
  body('experience')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Experience must be at most 40 characters'),
  body('relation')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Relation cannot be empty')
    .isLength({ max: 80 })
    .withMessage('Relation must be at most 80 characters'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters'),
  body('createLogin')
    .optional()
    .isBoolean()
    .withMessage('createLogin must be a boolean')
    .toBoolean(),
];

const advocateIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid advocate ID is required'),
];

module.exports = {
  createAdvocateRules,
  updateAdvocateRules,
  advocateIdParamRules,
  STATUSES,
};
