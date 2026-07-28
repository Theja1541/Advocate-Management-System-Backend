const advocateService = require('./advocateService');
const logger = require('../../config/logger');

exports.getAllAdvocates = async (req, res, next) => {
  try {
    const advocates = await advocateService.getAllAdvocates();
    res.status(200).json({
      status: 'success',
      data: { advocates },
    });
  } catch (error) {
    logger.error('GetAllAdvocates error:', error);
    next(error);
  }
};

exports.getAdvocateById = async (req, res, next) => {
  try {
    const advocate = await advocateService.getAdvocateById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { advocate },
    });
  } catch (error) {
    logger.error('GetAdvocateById error:', error);
    next(error);
  }
};

exports.createAdvocate = async (req, res, next) => {
  try {
    const advocate = await advocateService.createAdvocate(req.body);
    res.status(201).json({
      status: 'success',
      data: { advocate },
    });
  } catch (error) {
    logger.error('CreateAdvocate error:', error);
    next(error);
  }
};

exports.updateAdvocate = async (req, res, next) => {
  try {
    const advocate = await advocateService.updateAdvocate(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { advocate },
    });
  } catch (error) {
    logger.error('UpdateAdvocate error:', error);
    next(error);
  }
};

exports.deleteAdvocate = async (req, res, next) => {
  try {
    await advocateService.deleteAdvocate(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteAdvocate error:', error);
    next(error);
  }
};
