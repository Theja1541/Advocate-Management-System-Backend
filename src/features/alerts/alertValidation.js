const { param, body } = require('express-validator');

const alertIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid alert ID is required'),
];

const resolveAlertRules = [
  body('status')
    .isIn(['active', 'resolved'])
    .withMessage('Status must be active or resolved'),
];

module.exports = {
  alertIdParamRules,
  resolveAlertRules,
};
