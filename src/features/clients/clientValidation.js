const { body, param } = require('express-validator');

const mobileRegex = /^(\+?91)?[6-9]\d{9}$/;
const aadhaarRegex = /^\d{4}\s\d{4}\s\d{4}$/;
const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;

const normalizeMobile = (value) => String(value).replace(/[\s\-()]/g, '');

const formatAadhaar = (value) => {
  if (!value || value === '—') return value;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  return String(value).trim();
};

const formatPan = (value) => {
  if (!value || value === '—') return value;
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

const formatMobile = (value) => {
  if (!value) return value;
  const normalized = normalizeMobile(value);
  const digits = normalized.replace(/^\+?91/, '');
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return String(value).trim();
};

const createClientRules = [
  body('clientCode')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Client code must be at most 20 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile is required')
    .customSanitizer(formatMobile)
    .custom((value) => {
      if (!mobileRegex.test(normalizeMobile(value))) {
        throw new Error(
          'Please enter a valid mobile number (10 digits, optionally prefixed with +91)'
        );
      }
      return true;
    }),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .normalizeEmail(),
  body('village')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('aadhaarMasked')
    .optional({ values: 'falsy' })
    .trim()
    .customSanitizer(formatAadhaar)
    .custom((value) => {
      if (!value || value === '—') return true;
      if (!aadhaarRegex.test(value)) {
        throw new Error('Aadhaar must be 12 digits (e.g. 1234 5678 9012)');
      }
      return true;
    }),
  body('panMasked')
    .optional({ values: 'falsy' })
    .trim()
    .customSanitizer(formatPan)
    .custom((value) => {
      if (!value || value === '—') return true;
      if (!panRegex.test(value)) {
        throw new Error('PAN must be in format ABCDE1234F');
      }
      return true;
    }),
  body('docsCount')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Docs count must be a non-negative integer'),
];

const updateClientRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
  body('clientCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client code cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Client code must be at most 20 characters'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('mobile')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Mobile cannot be empty')
    .customSanitizer(formatMobile)
    .custom((value) => {
      if (!mobileRegex.test(normalizeMobile(value))) {
        throw new Error(
          'Please enter a valid mobile number (10 digits, optionally prefixed with +91)'
        );
      }
      return true;
    }),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be at most 100 characters')
    .normalizeEmail(),
  body('village')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Village must be at most 100 characters'),
  body('aadhaarMasked')
    .optional({ values: 'falsy' })
    .trim()
    .customSanitizer(formatAadhaar)
    .custom((value) => {
      if (!value || value === '—') return true;
      if (!aadhaarRegex.test(value)) {
        throw new Error('Aadhaar must be 12 digits (e.g. 1234 5678 9012)');
      }
      return true;
    }),
  body('panMasked')
    .optional({ values: 'falsy' })
    .trim()
    .customSanitizer(formatPan)
    .custom((value) => {
      if (!value || value === '—') return true;
      if (!panRegex.test(value)) {
        throw new Error('PAN must be in format ABCDE1234F');
      }
      return true;
    }),
  body('docsCount')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Docs count must be a non-negative integer'),
];

const clientIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid client ID is required'),
];

module.exports = {
  createClientRules,
  updateClientRules,
  clientIdParamRules,
};
