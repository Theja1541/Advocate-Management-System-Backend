const express = require('express');
const { body } = require('express-validator');
const roleController = require('./roleController');
const { protect, restrictTo } = require('../../middleware/auth');
const { tenantImpersonator } = require('../../middleware/tenantImpersonator');
const validate = require('../../middleware/validate');

const router = express.Router();

// All roles & permissions routes require active authorization
router.use(protect);

// Apply tenant impersonation for Super Admins
router.use(tenantImpersonator);

// Read-only modules and roles accessible by authenticated users
router.get('/roles', roleController.getAllRoles);
router.get('/roles/:id', roleController.getRoleById);
router.get('/modules', roleController.getAllModules);

// Modification actions strictly reserved for Super Admin
router.use(restrictTo('Super Admin'));

router.post(
  '/roles',
  [
    body('name').notEmpty().withMessage('Role name cannot be empty'),
    validate
  ],
  roleController.createRole
);

router.put('/roles/:id', roleController.updateRole);
router.delete('/roles/:id', roleController.deleteRole);

router.put(
  '/permissions',
  [
    body().custom((_, { req }) => {
      const { roleId, moduleId, accessLevel, permissions } = req.body || {};
      if (Array.isArray(permissions)) {
        if (!permissions.length) {
          throw new Error('permissions array cannot be empty');
        }
        return true;
      }
      if (roleId == null || moduleId == null || accessLevel == null) {
        throw new Error('Provide roleId, moduleId and accessLevel (or a permissions array)');
      }
      return true;
    }),
    body('roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid Role ID is required'),
    body('moduleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid Module ID is required'),
    body('accessLevel')
      .optional()
      .isIn(['---', 'V', 'VE', 'VA', 'VEA'])
      .withMessage('Invalid access level specified'),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('permissions must be an array'),
    body('permissions.*.roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid Role ID is required'),
    body('permissions.*.moduleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Valid Module ID is required'),
    body('permissions.*.accessLevel')
      .optional()
      .isIn(['---', 'V', 'VE', 'VA', 'VEA'])
      .withMessage('Invalid access level specified'),
    validate,
  ],
  roleController.updatePermission
);

module.exports = router;
