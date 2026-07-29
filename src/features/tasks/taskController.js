const taskService = require('./taskService');
const logger = require('../../config/logger');

exports.getAllTasks = async (req, res, next) => {
  try {
    const { query, status, priority } = req.query;
    const tasks = await taskService.getAllTasks({ query, status, priority });
    res.status(200).json({
      status: 'success',
      data: { tasks },
    });
  } catch (error) {
    logger.error('GetAllTasks error:', error);
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    logger.error('GetTaskById error:', error);
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask({
      ...req.body,
      createdBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    logger.error('CreateTask error:', error);
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { task },
    });
  } catch (error) {
    logger.error('UpdateTask error:', error);
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteTask error:', error);
    next(error);
  }
};
