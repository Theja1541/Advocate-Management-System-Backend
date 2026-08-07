const express = require('express');
const mastersController = require('./mastersController');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');

const router = express.Router();

// Apply auth middleware
router.use(protect);

// Case Types CRUD Endpoints
router.route('/case-types')
  .get(mastersController.getAllCaseTypes)
  .post(authorizePermission('roles', 'E'), mastersController.createCaseType);

router.route('/case-types/:id')
  .get(mastersController.getCaseTypeById)
  .put(authorizePermission('roles', 'E'), mastersController.updateCaseType);

router.patch('/case-types/:id/activate', authorizePermission('roles', 'E'), mastersController.activateCaseType);
router.patch('/case-types/:id/deactivate', authorizePermission('roles', 'E'), mastersController.deactivateCaseType);

// Case Stages CRUD Endpoints
router.route('/case-stages')
  .get(mastersController.getAllCaseStages)
  .post(authorizePermission('roles', 'E'), mastersController.createCaseStage);

router.route('/case-stages/:id')
  .get(mastersController.getCaseStageById)
  .put(authorizePermission('roles', 'E'), mastersController.updateCaseStage);

router.patch('/case-stages/:id/activate', authorizePermission('roles', 'E'), mastersController.activateCaseStage);
router.patch('/case-stages/:id/deactivate', authorizePermission('roles', 'E'), mastersController.deactivateCaseStage);

// Courts CRUD Endpoints
router.route('/courts')
  .get(mastersController.getAllCourts)
  .post(authorizePermission('roles', 'E'), mastersController.createCourt);

router.route('/courts/:id')
  .get(mastersController.getCourtById)
  .put(authorizePermission('roles', 'E'), mastersController.updateCourt);

router.patch('/courts/:id/activate', authorizePermission('roles', 'E'), mastersController.activateCourt);
router.patch('/courts/:id/deactivate', authorizePermission('roles', 'E'), mastersController.deactivateCourt);

// Document Categories CRUD Endpoints
router.route('/document-categories')
  .get(mastersController.getAllDocumentCategories)
  .post(authorizePermission('roles', 'E'), mastersController.createDocumentCategory);

router.route('/document-categories/:id')
  .get(mastersController.getDocumentCategoryById)
  .put(authorizePermission('roles', 'E'), mastersController.updateDocumentCategory);

router.patch('/document-categories/:id/activate', authorizePermission('roles', 'E'), mastersController.activateDocumentCategory);

module.exports = router;
