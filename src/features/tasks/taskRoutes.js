const express = require('express');
const taskController = require('./taskController');
const {
  createTaskRules,
  updateTaskRules,
  taskIdParamRules,
} = require('./taskValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('cases', 'V'), taskController.getAllTasks) // Let's use the cases key permission or simple V, or just cases for tasks
  .post(
    authorizePermission('cases', 'E'),
    ...createTaskRules,
    validate,
    taskController.createTask
  );

router
  .route('/:id')
  .get(
    authorizePermission('cases', 'V'),
    ...taskIdParamRules,
    validate,
    taskController.getTaskById
  )
  .put(
    authorizePermission('cases', 'E'),
    ...updateTaskRules,
    validate,
    taskController.updateTask
  )
  .delete(
    authorizePermission('cases', 'E'),
    ...taskIdParamRules,
    validate,
    taskController.deleteTask
  );

module.exports = router;
