const { query } = require('express-validator');

const searchRules = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search keyword is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Search keyword must be between 2 and 120 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  searchRules,
};
