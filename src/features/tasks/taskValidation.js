const { body, param } = require('express-validator');

const PRIORITIES = ['high', 'medium', 'low'];
const STATUSES = ['pending', 'completed'];

const createTaskRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Task title must be at most 200 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim(),
  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('assignedTo')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid assigned user ID is required'),
];

const updateTaskRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid task ID is required'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Task title must be at most 200 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim(),
  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('assignedTo')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Valid assigned user ID is required'),
];

const taskIdParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid task ID is required'),
];

module.exports = {
  createTaskRules,
  updateTaskRules,
  taskIdParamRules,
  PRIORITIES,
  STATUSES,
};
