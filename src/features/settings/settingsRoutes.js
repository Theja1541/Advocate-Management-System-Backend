const express = require('express');
const router = express.Router();
const settingsController = require('./settingsController');
const { protect, restrictTo } = require('../../middleware/auth');
const logoUpload = require('../../middleware/logoUpload');
const validate = require('../../middleware/validate');
const { updateSmtpRules, testSmtpRules } = require('./smtpValidation');

// Public route for login page
router.get('/public', settingsController.getPublicSettings);

// Protected routes for Super Admin (Logo)
router.put(
  '/logo',
  protect,
  restrictTo('Super Admin'),
  logoUpload.single('logo'),
  settingsController.uploadSuperAdminLogo
);

// Protected routes for Super Admin (SMTP)
router.get(
  '/smtp',
  protect,
  restrictTo('Super Admin'),
  settingsController.getSmtpSettings
);

router.put(
  '/smtp',
  protect,
  restrictTo('Super Admin'),
  updateSmtpRules,
  validate,
  settingsController.updateSmtpSettings
);

router.post(
  '/smtp/test',
  protect,
  restrictTo('Super Admin'),
  testSmtpRules,
  validate,
  settingsController.testSmtpSettings
);

module.exports = router;
