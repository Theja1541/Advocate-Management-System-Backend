const express = require('express');
const legalTextController = require('./legalTextController');
const {
  createLegalTextRules,
  updateLegalTextRules,
  legalTextIdParamRules,
} = require('./legalTextValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('legalTexts', 'V'), legalTextController.getAllTexts)
  .post(
    authorizePermission('legalTexts', 'E'),
    ...createLegalTextRules,
    validate,
    legalTextController.createText
  );

router
  .route('/suggestions')
  .get(authorizePermission('legalTexts', 'V'), legalTextController.getSuggestions);

router
  .route('/:id')
  .get(
    authorizePermission('legalTexts', 'V'),
    ...legalTextIdParamRules,
    validate,
    legalTextController.getTextById
  )
  .put(
    authorizePermission('legalTexts', 'E'),
    ...legalTextIdParamRules,
    ...updateLegalTextRules,
    validate,
    legalTextController.updateText
  )
  .delete(
    authorizePermission('legalTexts', 'E'),
    ...legalTextIdParamRules,
    validate,
    legalTextController.deleteText
  );

module.exports = router;
