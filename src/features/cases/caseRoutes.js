const express = require('express');
const caseController = require('./caseController');
const {
  createCaseRules,
  updateCaseRules,
  caseIdParamRules,
} = require('./caseValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('cases', 'V'), caseController.getAllCases)
  .post(
    authorizePermission('cases', 'E'),
    ...createCaseRules,
    validate,
    caseController.createCase
  );

router
  .route('/:id')
  .get(
    authorizePermission('cases', 'V'),
    ...caseIdParamRules,
    validate,
    caseController.getCaseById
  )
  .put(
    authorizePermission('cases', 'E'),
    ...updateCaseRules,
    validate,
    caseController.updateCase
  )
  .delete(
    authorizePermission('cases', 'E'),
    ...caseIdParamRules,
    validate,
    caseController.deleteCase
  );

module.exports = router;
