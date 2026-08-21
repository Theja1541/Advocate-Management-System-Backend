const express = require('express');
const { body } = require('express-validator');
const authController = require('./authController');
const validate = require('../../middleware/validate');
const { protect } = require('../../middleware/auth');

const router = express.Router();

const loginValidator = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password field cannot be empty'),
  validate
];

router.post('/login', loginValidator, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', protect, authController.getMe);

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
  validate
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  validate
];

router.post('/change-password', protect, changePasswordValidator, authController.changePassword);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);

const verifyMfaValidator = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
  validate
];

const resendMfaValidator = [
  body('userId').notEmpty().withMessage('User ID is required'),
  validate
];

router.post('/verify-mfa', verifyMfaValidator, authController.verifyMfa);
router.post('/resend-mfa', resendMfaValidator, authController.resendMfa);

const toggleMfaValidator = [
  body('password').notEmpty().withMessage('Password is required'),
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  validate
];

router.post('/toggle-mfa', protect, toggleMfaValidator, authController.toggleMfa);
module.exports = router;

