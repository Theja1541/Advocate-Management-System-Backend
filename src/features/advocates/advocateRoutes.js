const express = require('express');
const advocateController = require('./advocateController');
const {
  createAdvocateRules,
  updateAdvocateRules,
  advocateIdParamRules,
} = require('./advocateValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/search', authorizePermission('advs', 'V'), advocateController.searchAdvocates);

router
  .route('/')
  .get(authorizePermission('advs', 'V'), advocateController.getAllAdvocates)
  .post(
    authorizePermission('advs', 'E'),
    ...createAdvocateRules,
    validate,
    advocateController.createAdvocate
  );


router
  .route('/:id')
  .get(
    authorizePermission('advs', 'V'),
    ...advocateIdParamRules,
    validate,
    advocateController.getAdvocateById
  )
  .put(
    authorizePermission('advs', 'E'),
    ...updateAdvocateRules,
    validate,
    advocateController.updateAdvocate
  )
  .delete(
    authorizePermission('advs', 'E'),
    ...advocateIdParamRules,
    validate,
    advocateController.deleteAdvocate
  );

module.exports = router;
