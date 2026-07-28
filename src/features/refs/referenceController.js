const referenceService = require('./referenceService');
const logger = require('../../config/logger');

exports.getAllReferences = async (req, res, next) => {
  try {
    const references = await referenceService.getAllReferences();
    res.status(200).json({
      status: 'success',
      data: { references },
    });
  } catch (error) {
    logger.error('GetAllReferences error:', error);
    next(error);
  }
};

exports.getReferenceById = async (req, res, next) => {
  try {
    const reference = await referenceService.getReferenceById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { reference },
    });
  } catch (error) {
    logger.error('GetReferenceById error:', error);
    next(error);
  }
};

exports.createReference = async (req, res, next) => {
  try {
    const reference = await referenceService.createReference({
      ...req.body,
      createdBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { reference },
    });
  } catch (error) {
    logger.error('CreateReference error:', error);
    next(error);
  }
};

exports.updateReference = async (req, res, next) => {
  try {
    const reference = await referenceService.updateReference(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { reference },
    });
  } catch (error) {
    logger.error('UpdateReference error:', error);
    next(error);
  }
};

exports.deleteReference = async (req, res, next) => {
  try {
    await referenceService.deleteReference(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteReference error:', error);
    next(error);
  }
};
