const express = require('express');
const titleSearchController = require('./titleSearchController');
const {
  createTitleSearchRules,
  updateTitleSearchRules,
  titleSearchIdParamRules,
} = require('./titleSearchValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('land', 'V'), titleSearchController.getAllTitleSearches)
  .post(
    authorizePermission('land', 'E'),
    ...createTitleSearchRules,
    validate,
    titleSearchController.createTitleSearch
  );

router
  .route('/:id')
  .get(
    authorizePermission('land', 'V'),
    ...titleSearchIdParamRules,
    validate,
    titleSearchController.getTitleSearchById
  )
  .put(
    authorizePermission('land', 'E'),
    ...updateTitleSearchRules,
    validate,
    titleSearchController.updateTitleSearch
  )
  .delete(
    authorizePermission('land', 'E'),
    ...titleSearchIdParamRules,
    validate,
    titleSearchController.deleteTitleSearch
  );

module.exports = router;
