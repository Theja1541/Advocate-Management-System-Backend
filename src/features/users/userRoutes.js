const express = require('express');
const userController = require('./userController');
const {
  createUserRules,
  updateUserRules,
  userIdParamRules,
} = require('./userValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('roles', 'V'), userController.getAllUsers)
  .post(
    authorizePermission('roles', 'E'),
    ...createUserRules,
    validate,
    userController.createUser
  );

router
  .route('/:id')
  .get(
    authorizePermission('roles', 'V'),
    ...userIdParamRules,
    validate,
    userController.getUserById
  )
  .put(
    authorizePermission('roles', 'E'),
    ...updateUserRules,
    validate,
    userController.updateUser
  )
  .delete(
    authorizePermission('roles', 'E'),
    ...userIdParamRules,
    validate,
    userController.deleteUser
  );

module.exports = router;
