const express = require('express');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const searchController = require('./searchController');
const { searchRules } = require('./searchValidation');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  authorizePermission('docs', 'V'),
  ...searchRules,
  validate,
  searchController.search
);

module.exports = router;
