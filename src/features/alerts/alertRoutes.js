const express = require('express');
const alertController = require('./alertController');
const {
  createAlertRules,
  updateAlertRules,
  alertIdParamRules,
} = require('./alertValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('cases', 'V'), alertController.getAllAlerts)
  .post(
    authorizePermission('cases', 'E'),
    ...createAlertRules,
    validate,
    alertController.createAlert
  );

router
  .route('/:id')
  .get(
    authorizePermission('cases', 'V'),
    ...alertIdParamRules,
    validate,
    alertController.getAlertById
  )
  .put(
    authorizePermission('cases', 'E'),
    ...updateAlertRules,
    validate,
    alertController.updateAlert
  )
  .delete(
    authorizePermission('cases', 'E'),
    ...alertIdParamRules,
    validate,
    alertController.deleteAlert
  );

module.exports = router;
