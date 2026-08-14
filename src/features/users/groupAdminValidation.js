const { body, param } = require('express-validator');

exports.createGroupAdminRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

exports.updateGroupAdminRules = [
  param('id').isInt().withMessage('Invalid Group Admin ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

exports.groupAdminIdParamRules = [
  param('id').isInt().withMessage('Invalid Group Admin ID'),
];

exports.assignAdvocateParamRules = [
  param('id').isInt().withMessage('Invalid Group Admin ID'),
  param('advocateId').isInt().withMessage('Invalid Advocate ID'),
];
