const { param, query } = require('express-validator');
const { REPORT_TYPES } = require('./reportService');

const reportTypeParamRules = [
  param('reportType')
    .trim()
    .notEmpty()
    .withMessage('Report type is required')
    .customSanitizer((value) => String(value).toLowerCase().replace(/_/g, '-'))
    .isIn(REPORT_TYPES)
    .withMessage(`Report type must be one of: ${REPORT_TYPES.join(', ')}`),
];

const reportQueryRules = [
  query('date')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true })
    .withMessage('date must be YYYY-MM-DD'),
  query('month')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 12 })
    .withMessage('month must be between 1 and 12')
    .toInt(),
  query('year')
    .optional({ values: 'falsy' })
    .isInt({ min: 2000, max: 2100 })
    .withMessage('year must be a valid year')
    .toInt(),
];

const reportExportQueryRules = [
  ...reportQueryRules,
  query('format')
    .optional({ values: 'falsy' })
    .trim()
    .toLowerCase()
    .isIn(['xlsx', 'csv'])
    .withMessage('format must be xlsx or csv'),
];

module.exports = {
  reportTypeParamRules,
  reportQueryRules,
  reportExportQueryRules,
};
