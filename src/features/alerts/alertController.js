const alertService = require('./alertService');
const logger = require('../../config/logger');

exports.getAllAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getAllAlerts();
    res.status(200).json({
      status: 'success',
      data: { alerts },
    });
  } catch (error) {
    logger.error('GetAllAlerts error:', error);
    next(error);
  }
};

exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('GetAlertById error:', error);
    next(error);
  }
};

exports.createAlert = async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('CreateAlert error:', error);
    next(error);
  }
};

exports.updateAlert = async (req, res, next) => {
  try {
    const alert = await alertService.updateAlert(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('UpdateAlert error:', error);
    next(error);
  }
};

exports.deleteAlert = async (req, res, next) => {
  try {
    await alertService.deleteAlert(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteAlert error:', error);
    next(error);
  }
};
