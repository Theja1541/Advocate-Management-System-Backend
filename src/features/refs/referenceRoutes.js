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
  .get(authorizePermission('refs', 'V'), referenceController.getAllReferences)
  .post(
    authorizePermission('refs', 'E'),
    ...createReferenceRules,
    validate,
    referenceController.createReference
  );

router
  .route('/:id')
  .get(
    authorizePermission('refs', 'V'),
    ...referenceIdParamRules,
    validate,
    referenceController.getReferenceById
  )
  .put(
    authorizePermission('refs', 'E'),
    ...updateReferenceRules,
    validate,
    referenceController.updateReference
  )
  .delete(
    authorizePermission('refs', 'E'),
    ...referenceIdParamRules,
    validate,
    referenceController.deleteReference
  );

module.exports = router;
