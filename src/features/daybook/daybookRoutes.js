const express = require('express');
const daybookController = require('./daybookController');
const {
  createDaybookRules,
  updateDaybookRules,
  daybookIdParamRules,
} = require('./daybookValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('daybook', 'V'), daybookController.getAllEntries)
  .post(
    authorizePermission('daybook', 'E'),
    ...createDaybookRules,
    validate,
    daybookController.createEntry
  );

router
  .route('/:id')
  .get(
    authorizePermission('daybook', 'V'),
    ...daybookIdParamRules,
    validate,
    daybookController.getEntryById
  )
  .put(
    authorizePermission('daybook', 'E'),
    ...updateDaybookRules,
    validate,
    daybookController.updateEntry
  )
  .delete(
    authorizePermission('daybook', 'E'),
    ...daybookIdParamRules,
    validate,
    daybookController.deleteEntry
  );

module.exports = router;
