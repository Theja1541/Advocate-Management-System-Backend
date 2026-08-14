const { Task, User } = require('../associations');
const AppError = require('../../utils/AppError');
const { Op } = require('sequelize');
const { resolveAlert, resolveAllAlertsForRecord } = require('../alerts/alertEngine');

const SAFE_ATTRIBUTES = [
  'id',
  'title',
  'description',
  'priority',
  'dueDate',
  'status',
  'assignedTo',
  'createdBy',
  'updatedBy',
  'created_at',
  'updated_at',
];

const userInclude = {
  model: User,
  as: 'assignedUser',
  attributes: ['id', 'name', 'email'],
};

const creatorInclude = {
  model: User,
  as: 'creator',
  attributes: ['id', 'name'],
};

const toPublicTask = (task) => {
  return task.get ? task.get({ plain: true }) : { ...task };
};

const assertUserExists = async (userId, fieldLabel) => {
  if (userId == null) return;
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    throw new AppError(`${fieldLabel} user not found`, 400);
  }
};

const { isGroupAdmin } = require('../../utils/roleHelper');

const getAllTasks = async ({ query, status, priority } = {}, currentUser = null) => {
  const where = {};

  if (currentUser && isGroupAdmin(currentUser.role)) {
    where[Op.or] = [
      { createdBy: currentUser.id },
      { assignedTo: currentUser.id },
    ];
  }

  if (status) {
    where.status = status;
  }
  if (priority) {
    where.priority = priority;
  }
  if (query && !where[Op.or]) {
    where[Op.or] = [
      { title: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } },
    ];
  }


  if (currentUser && currentUser.adminContext) {
    where.contextType = currentUser.adminContext.type;
    where.contextId = currentUser.adminContext.id;
  }

  const tasks = await Task.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    include: [userInclude, creatorInclude],
    order: [
      ['dueDate', 'ASC'],
      ['id', 'DESC'],
    ],
  });

  return tasks.map(toPublicTask);
};

const getTaskById = async (id, currentUser = null) => {
  const task = await Task.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
    include: [userInclude, creatorInclude],
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (currentUser && currentUser.adminContext) {
    if (task.contextType && (task.contextType !== currentUser.adminContext.type || String(task.contextId) !== String(currentUser.adminContext.id))) {
      throw new AppError('Access denied: Task belongs to a different Admin Context', 403);
    }
  }

  return toPublicTask(task);
};

const createTask = async ({
  title,
  description,
  priority,
  dueDate,
  status,
  assignedTo,
  createdBy,
}, currentUser = null) => {
  if (assignedTo) await assertUserExists(assignedTo, 'Assigned');
  if (createdBy) await assertUserExists(createdBy, 'Creator');

  const task = await Task.create({
    title,
    description,
    priority: priority || 'medium',
    dueDate: dueDate || null,
    status: status || 'pending',
    assignedTo: assignedTo || null,
    createdBy: createdBy || null,
    updatedBy: createdBy || null,
    contextType: currentUser?.adminContext?.type || null,
    contextId: currentUser?.adminContext?.id || null,
  });

  return getTaskById(task.id, currentUser);
};

const updateTask = async (
  id,
  { title, description, priority, dueDate, status, assignedTo, updatedBy },
  currentUser = null
) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (currentUser && currentUser.adminContext) {
    if (task.contextType && (task.contextType !== currentUser.adminContext.type || String(task.contextId) !== String(currentUser.adminContext.id))) {
      throw new AppError('Access denied: Task belongs to a different Admin Context', 403);
    }
  }

  if (assignedTo !== undefined) {
    if (assignedTo !== null) await assertUserExists(assignedTo, 'Assigned');
    task.assignedTo = assignedTo;
  }
  if (updatedBy !== undefined) {
    if (updatedBy !== null) await assertUserExists(updatedBy, 'Updater');
    task.updatedBy = updatedBy;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (status !== undefined) task.status = status;

  await task.save();
  
  if (task.status === 'Completed' || task.status === 'Cancelled') {
    await resolveAlert('Task', task.id, 'TASK_OVERDUE');
    await resolveAlert('Task', task.id, 'TASK_DUE_TODAY');
  }

  return getTaskById(task.id, currentUser);
};

const deleteTask = async (id, currentUser = null) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (currentUser && currentUser.adminContext) {
    if (task.contextType && (task.contextType !== currentUser.adminContext.type || String(task.contextId) !== String(currentUser.adminContext.id))) {
      throw new AppError('Access denied: Task belongs to a different Admin Context', 403);
    }
  }

  await task.destroy();
  await resolveAllAlertsForRecord('Task', id);
  return true;
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
