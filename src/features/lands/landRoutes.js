const express = require('express');
const landController = require('./landController');
const {
  createLandRules,
  updateLandRules,
  landIdParamRules,
} = require('./landValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('land', 'V'), landController.getAllLands)
  .post(
    authorizePermission('land', 'E'),
    ...createLandRules,
    validate,
    landController.createLand
  );

router
  .route('/:id')
  .get(
    authorizePermission('land', 'V'),
    ...landIdParamRules,
    validate,
    landController.getLandById
  )
  .put(
    authorizePermission('land', 'E'),
    ...updateLandRules,
    validate,
    landController.updateLand
  )
  .delete(
    authorizePermission('land', 'E'),
    ...landIdParamRules,
    validate,
    landController.deleteLand
  );

module.exports = router;
