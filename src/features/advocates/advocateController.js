const advocateService = require('./advocateService');
const logger = require('../../config/logger');

exports.getAllAdvocates = async (req, res, next) => {
  try {
    const advocates = await advocateService.getAllAdvocates(req.user);
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
    const advocate = await advocateService.getAdvocateById(req.params.id, req.user);
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
    const advocate = await advocateService.createAdvocate(req.body, req.user);
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
    const advocate = await advocateService.updateAdvocate(req.params.id, req.body, req.user);
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
    await advocateService.deleteAdvocate(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteAdvocate error:', error);
    next(error);
  }
};

exports.searchAdvocates = async (req, res, next) => {
  try {
    const queryStr = req.query.q || '';
    const advocates = await advocateService.searchTenantAdvocates(queryStr, req.user);
    res.status(200).json({
      status: 'success',
      data: { advocates },
    });
  } catch (error) {
    logger.error('SearchAdvocates error:', error);
    next(error);
  }
};
