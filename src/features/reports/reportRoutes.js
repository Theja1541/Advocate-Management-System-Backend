const express = require('express');
const reportController = require('./reportController');
const {
  reportTypeParamRules,
  reportQueryRules,
  reportExportQueryRules,
} = require('./reportValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  authorizePermission('reports', 'V'),
  reportController.listReportTypes
);

router.get(
  '/:reportType/export',
  authorizePermission('reports', 'V'),
  ...reportTypeParamRules,
  ...reportExportQueryRules,
  validate,
  reportController.exportReport
);

router.get(
  '/:reportType',
  authorizePermission('reports', 'V'),
  ...reportTypeParamRules,
  ...reportQueryRules,
  validate,
  reportController.getReport
);

module.exports = router;
