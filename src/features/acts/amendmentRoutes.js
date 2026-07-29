const express = require('express');
const actController = require('./actController');
const {
  listAmendmentsQueryRules,
  createAmendmentRules,
  updateAmendmentRules,
  amendmentIdParamRules,
} = require('./actValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const multer = require('multer');

// Configure local memory storage for CSV and Excel imports
const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV (.csv) and Excel (.xlsx) files are allowed.'), false);
    }
  }
});

const router = express.Router();

router.use(protect);

router.post(
  '/import',
  authorizePermission('acts', 'E'),
  uploadImport.single('file'),
  actController.importAmendments
);

router
  .route('/')
  .get(
    authorizePermission('acts', 'V'),
    ...listAmendmentsQueryRules,
    validate,
    actController.getAllAmendments
  )
  .post(
    authorizePermission('acts', 'E'),
    ...createAmendmentRules,
    validate,
    actController.createAmendment
  );

router
  .route('/:id')
  .get(
    authorizePermission('acts', 'V'),
    ...amendmentIdParamRules,
    validate,
    actController.getAmendmentById
  )
  .put(
    authorizePermission('acts', 'E'),
    ...updateAmendmentRules,
    validate,
    actController.updateAmendment
  )
  .delete(
    authorizePermission('acts', 'E'),
    ...amendmentIdParamRules,
    validate,
    actController.deleteAmendment
  );

module.exports = router;
