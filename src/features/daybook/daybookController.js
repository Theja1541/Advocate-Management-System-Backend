const daybookService = require('./daybookService');
const logger = require('../../config/logger');

exports.getAllEntries = async (req, res, next) => {
  try {
    const entries = await daybookService.getAllEntries();
    res.status(200).json({
      status: 'success',
      data: { entries },
    });
  } catch (error) {
    logger.error('GetAllDaybookEntries error:', error);
    next(error);
  }
};

exports.getEntryById = async (req, res, next) => {
  try {
    const entry = await daybookService.getEntryById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { entry },
    });
  } catch (error) {
    logger.error('GetDaybookEntryById error:', error);
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ status: 'fail', message: 'Not authenticated' });
    }
    const entry = await daybookService.createEntry({
      ...req.body,
      recordedBy: req.user.id,
    });
    res.status(201).json({
      status: 'success',
      data: { entry },
    });
  } catch (error) {
    logger.error('CreateDaybookEntry error:', error);
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const entry = await daybookService.updateEntry(req.params.id, {
      ...req.body,
      recordedBy: req.body.recordedBy ?? req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { entry },
    });
  } catch (error) {
    logger.error('UpdateDaybookEntry error:', error);
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    await daybookService.deleteEntry(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteDaybookEntry error:', error);
    next(error);
  }
};
