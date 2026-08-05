const express = require('express');
const router = express.Router();
const settingsController = require('./settingsController');
const { protect, restrictTo } = require('../../middleware/auth');
const logoUpload = require('../../middleware/logoUpload');

// Public route for login page
router.get('/public', settingsController.getPublicSettings);

// Protected routes for Super Admin
router.put(
  '/logo',
  protect,
  restrictTo('Super Admin'),
  logoUpload.single('logo'),
  settingsController.uploadSuperAdminLogo
);

module.exports = router;
