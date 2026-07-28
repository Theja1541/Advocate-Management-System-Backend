const express = require('express');
const referenceController = require('./referenceController');
const {
  createReferenceRules,
  updateReferenceRules,
  referenceIdParamRules,
} = require('./referenceValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('docs', 'V'), referenceController.getAllReferences)
  .post(
    authorizePermission('docs', 'E'),
    ...createReferenceRules,
    validate,
    referenceController.createReference
  );

router
  .route('/:id')
  .get(
    authorizePermission('docs', 'V'),
    ...referenceIdParamRules,
    validate,
    referenceController.getReferenceById
  )
  .put(
    authorizePermission('docs', 'E'),
    ...updateReferenceRules,
    validate,
    referenceController.updateReference
  )
  .delete(
    authorizePermission('docs', 'E'),
    ...referenceIdParamRules,
    validate,
    referenceController.deleteReference
  );

module.exports = router;
