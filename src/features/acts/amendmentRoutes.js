const express = require('express');
const actController = require('./actController');
const { listAmendmentsQueryRules } = require('./actValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  authorizePermission('acts', 'V'),
  ...listAmendmentsQueryRules,
  validate,
  actController.getAllAmendments
);

module.exports = router;
