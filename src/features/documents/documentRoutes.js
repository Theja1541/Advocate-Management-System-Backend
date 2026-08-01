const express = require('express');
const documentController = require('./documentController');
const {
  createDocumentRules,
  documentIdParamRules,
  updateDocumentRules,
} = require('./documentValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { uploadDocumentFile } = require('./documentUpload');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('docs', 'V'), documentController.getAllDocuments)
  .post(
    authorizePermission('docs', 'E'),
    uploadDocumentFile,
    ...createDocumentRules,
    validate,
    documentController.createDocument
  );

router
  .route('/:id/download')
  .get(
    authorizePermission('docs', 'V'),
    ...documentIdParamRules,
    validate,
    documentController.downloadDocument
  );

router
  .route('/:id/text')
  .get(
    authorizePermission('docs', 'V'),
    ...documentIdParamRules,
    validate,
    documentController.getDocumentText
  );

router
  .route('/:id')
  .get(
    authorizePermission('docs', 'V'),
    ...documentIdParamRules,
    validate,
    documentController.getDocumentById
  )
  .put(
    authorizePermission('docs', 'E'),
    uploadDocumentFile,
    ...updateDocumentRules,
    validate,
    documentController.updateDocument
  )
  .delete(
    authorizePermission('docs', 'E'),
    ...documentIdParamRules,
    validate,
    documentController.deleteDocument
  );

module.exports = router;
