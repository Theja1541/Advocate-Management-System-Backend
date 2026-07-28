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

module.exports = router;
