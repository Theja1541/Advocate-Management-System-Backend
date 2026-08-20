const { body } = require('express-validator');

const updateSmtpRules = [
  body('provider')
    .optional()
    .isIn(['custom', 'gmail', 'sendgrid', 'mailgun', 'amazon_ses', 'office365'])
    .withMessage('Invalid provider'),
  body('sender_name')
    .notEmpty()
    .withMessage('Sender name is required'),
  body('from_email')
    .isEmail()
    .withMessage('Valid from_email is required'),
  body('reply_to_email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Valid reply_to_email is required'),
  body('smtp_host')
    .notEmpty()
    .withMessage('SMTP host is required'),
  body('smtp_port')
    .isInt({ min: 1, max: 65535 })
    .withMessage('Valid SMTP port is required'),
  body('encryption_type')
    .isIn(['none', 'ssl', 'tls'])
    .withMessage('Invalid encryption_type'),
  body('smtp_auth_enabled')
    .isBoolean()
    .withMessage('smtp_auth_enabled must be a boolean'),
  body('smtp_username')
    .optional({ checkFalsy: true })
    .isString(),
  body('smtp_password')
    .optional({ checkFalsy: true })
    .isString(),
  body('is_active')
    .optional()
    .isBoolean(),
];

const testSmtpRules = [
  body('test_email')
    .isEmail()
    .withMessage('Valid test_email is required'),
];

module.exports = {
  updateSmtpRules,
  testSmtpRules,
};
