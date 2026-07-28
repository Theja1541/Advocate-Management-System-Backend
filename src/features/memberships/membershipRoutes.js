const express = require('express');
const membershipController = require('./membershipController');
const {
  createMembershipRules,
  updateMembershipRules,
  membershipIdParamRules,
} = require('./membershipValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('member', 'V'), membershipController.getAllMemberships)
  .post(
    authorizePermission('member', 'E'),
    ...createMembershipRules,
    validate,
    membershipController.createMembership
  );

router
  .route('/:id/renew')
  .post(
    authorizePermission('member', 'E'),
    ...membershipIdParamRules,
    validate,
    membershipController.renewMembership
  );

router
  .route('/:id')
  .get(
    authorizePermission('member', 'V'),
    ...membershipIdParamRules,
    validate,
    membershipController.getMembershipById
  )
  .put(
    authorizePermission('member', 'E'),
    ...updateMembershipRules,
    validate,
    membershipController.updateMembership
  )
  .delete(
    authorizePermission('member', 'E'),
    ...membershipIdParamRules,
    validate,
    membershipController.deleteMembership
  );

module.exports = router;
