const express = require('express');
const alertController = require('./alertController');
const { alertIdParamRules, resolveAlertRules } = require('./alertValidation');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(alertController.getAllAlerts);

router
  .route('/count')
  .get(alertController.getAlertCount);

router
  .route('/:id')
  .get(
    ...alertIdParamRules,
    validate,
    alertController.getAlertById
  );

router
  .route('/:id/resolve')
  .patch(
    ...alertIdParamRules,
    ...resolveAlertRules,
    validate,
    alertController.resolveAlertStatus
  );

router
  .route('/:id/read')
  .patch(
    ...alertIdParamRules,
    validate,
    alertController.markAlertAsRead
  );

router
  .route('/:id/unread')
  .patch(
    ...alertIdParamRules,
    validate,
    alertController.markAlertAsUnread
  );

module.exports = router;
