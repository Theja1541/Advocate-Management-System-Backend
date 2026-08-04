const alertService = require('./alertService');
const logger = require('../../config/logger');

exports.getAllAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getAllAlerts(req.query, req);
    res.status(200).json({
      status: 'success',
      data: { alerts },
    });
  } catch (error) {
    logger.error('GetAllAlerts error:', error);
    next(error);
  }
};

exports.getAlertCount = async (req, res, next) => {
  try {
    const count = await alertService.getAlertCount(req.query, req);
    res.status(200).json({
      status: 'success',
      data: { count },
    });
  } catch (error) {
    logger.error('GetAlertCount error:', error);
    next(error);
  }
};

exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.params.id, req);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('GetAlertById error:', error);
    next(error);
  }
};

exports.resolveAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' or 'resolved'
    const alert = await alertService.resolveAlertStatus(req.params.id, status, req);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('ResolveAlertStatus error:', error);
    next(error);
  }
};

exports.markAlertAsRead = async (req, res, next) => {
  try {
    const alert = await alertService.markAlertAsRead(req.params.id, req);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('MarkAlertAsRead error:', error);
    next(error);
  }
};

exports.markAlertAsUnread = async (req, res, next) => {
  try {
    const alert = await alertService.markAlertAsUnread(req.params.id, req);
    res.status(200).json({
      status: 'success',
      data: { alert },
    });
  } catch (error) {
    logger.error('MarkAlertAsUnread error:', error);
    next(error);
  }
};
