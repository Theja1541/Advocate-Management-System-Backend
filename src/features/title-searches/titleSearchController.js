const titleSearchService = require('./titleSearchService');
const logger = require('../../config/logger');

exports.getAllTitleSearches = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const titleSearches = await titleSearchService.getAllTitleSearches(tenantId, req.user);
    res.status(200).json({
      status: 'success',
      data: { titleSearches },
    });
  } catch (error) {
    logger.error('GetAllTitleSearches error:', error);
    next(error);
  }
};


exports.getTitleSearchById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const titleSearch = await titleSearchService.getTitleSearchById(req.params.id, tenantId);
    res.status(200).json({
      status: 'success',
      data: { titleSearch },
    });
  } catch (error) {
    logger.error('GetTitleSearchById error:', error);
    next(error);
  }
};

exports.createTitleSearch = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const titleSearch = await titleSearchService.createTitleSearch(req.body, tenantId);
    res.status(201).json({
      status: 'success',
      data: { titleSearch },
    });
  } catch (error) {
    logger.error('CreateTitleSearch error:', error);
    next(error);
  }
};

exports.updateTitleSearch = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const titleSearch = await titleSearchService.updateTitleSearch(req.params.id, req.body, tenantId);
    res.status(200).json({
      status: 'success',
      data: { titleSearch },
    });
  } catch (error) {
    logger.error('UpdateTitleSearch error:', error);
    next(error);
  }
};

exports.deleteTitleSearch = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    await titleSearchService.deleteTitleSearch(req.params.id, tenantId);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteTitleSearch error:', error);
    next(error);
  }
};
