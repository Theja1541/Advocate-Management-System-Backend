const express = require('express');
const tenantController = require('./tenantController');
const { protect } = require('../../middleware/auth');
const checkRole = require('../../middleware/checkRole');
const logoUpload = require('../../middleware/logoUpload');

const router = express.Router();

router.use(protect);

// Allow Tenant Admins (or anyone with right tenantId, handled in controller) to upload logo
router.put('/:id/logo', logoUpload.single('logo'), tenantController.uploadLogo);

// Only Super Admins can access the rest of tenant management routes
router.use(checkRole('Super Admin'));

router
  .route('/')
  .get(tenantController.getAllTenants)
  .post(tenantController.createTenant);

router
  .route('/stats')
  .get(tenantController.getDashboardStats);

router
  .route('/:id')
  .get(tenantController.getTenantById)
  .put(tenantController.updateTenant)
  .delete(tenantController.deleteTenant);

router
  .route('/:id/reset-password')
  .post(tenantController.resetAdminPassword);

module.exports = router;
