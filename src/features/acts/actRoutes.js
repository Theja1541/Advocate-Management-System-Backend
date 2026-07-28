const express = require('express');
const actController = require('./actController');
const {
  listActsQueryRules,
  bookmarkActRules,
  actIdParamRules,
  createActRules,
  updateActRules,
} = require('./actValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const actUpload = require('../../middleware/actUpload');

const router = express.Router();

router.use(protect);

// 1. Advocate/Admin Public-Facing endpoints (V permission)
router.get(
  '/',
  authorizePermission('acts', 'V'),
  ...listActsQueryRules,
  validate,
  actController.getAllActs
);

router.post(
  '/bookmark',
  authorizePermission('acts', 'V'),
  ...bookmarkActRules,
  validate,
  actController.toggleBookmark
);

router.get(
  '/:id',
  authorizePermission('acts', 'V'),
  ...actIdParamRules,
  validate,
  actController.getActById
);

router.get(
  '/:id/open',
  authorizePermission('acts', 'V'),
  ...actIdParamRules,
  validate,
  actController.openActPdf
);

router.get(
  '/:id/pdf',
  authorizePermission('acts', 'V'),
  ...actIdParamRules,
  validate,
  actController.downloadActPdf
);

router.get(
  '/:id/download',
  authorizePermission('acts', 'V'),
  ...actIdParamRules,
  validate,
  actController.downloadActPdf
);

// 2. Admin Document Management Endpoints (E permission)
router.post(
  '/',
  authorizePermission('acts', 'E'),
  actUpload.single('pdf'),
  ...createActRules,
  validate,
  actController.createAct
);

router.put(
  '/:id',
  authorizePermission('acts', 'E'),
  ...actIdParamRules,
  ...updateActRules,
  validate,
  actController.updateAct
);

router.put(
  '/:id/upload',
  authorizePermission('acts', 'E'),
  ...actIdParamRules,
  actUpload.single('pdf'),
  validate,
  actController.replacePdf
);

router.put(
  '/:id/replace',
  authorizePermission('acts', 'E'),
  ...actIdParamRules,
  actUpload.single('pdf'),
  validate,
  actController.replacePdf
);

router.delete(
  '/:id',
  authorizePermission('acts', 'E'),
  ...actIdParamRules,
  validate,
  actController.deleteAct
);

router.post(
  '/:id/restore',
  authorizePermission('acts', 'E'),
  ...actIdParamRules,
  validate,
  actController.restoreAct
);

module.exports = router;
