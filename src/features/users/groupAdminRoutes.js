const express = require('express');
const groupAdminController = require('./groupAdminController');
const {
  createGroupAdminRules,
  updateGroupAdminRules,
  groupAdminIdParamRules,
  assignAdvocateParamRules,
} = require('./groupAdminValidation');
const { protect, restrictTo } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

// Group Admin CRUD (Super Admin & Tenant Admin only)
router
  .route('/')
  .get(restrictTo('Super Admin', 'Tenant Admin', 'Admin', 'Group Admin'), groupAdminController.getGroupAdmins)
  .post(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin'),
    createGroupAdminRules,
    validate,
    groupAdminController.createGroupAdmin
  );

router
  .route('/:id')
  .get(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin', 'Group Admin'),
    groupAdminIdParamRules,
    validate,
    groupAdminController.getGroupAdminById
  )
  .put(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin'),
    updateGroupAdminRules,
    validate,
    groupAdminController.updateGroupAdmin
  );

// Advocate ↔ Group Admin Assignment Endpoints
router
  .route('/:id/advocates')
  .get(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin', 'Group Admin'),
    groupAdminIdParamRules,
    validate,
    groupAdminController.getAssignedAdvocates
  );

router
  .route('/:id/advocates/:advocateId')
  .post(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin', 'Group Admin'),
    assignAdvocateParamRules,
    validate,
    groupAdminController.assignAdvocate
  )
  .delete(
    restrictTo('Super Admin', 'Tenant Admin', 'Admin', 'Group Admin'),
    assignAdvocateParamRules,
    validate,
    groupAdminController.removeAdvocate
  );

module.exports = router;
