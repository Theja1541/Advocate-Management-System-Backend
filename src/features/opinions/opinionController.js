const opinionService = require('./opinionService');
const logger = require('../../config/logger');

exports.getAllOpinions = async (req, res, next) => {
  try {
    const opinions = await opinionService.getAllOpinions();
    res.status(200).json({
      status: 'success',
      data: { opinions },
    });
  } catch (error) {
    logger.error('GetAllOpinions error:', error);
    next(error);
  }
};

exports.getOpinionById = async (req, res, next) => {
  try {
    const opinion = await opinionService.getOpinionById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('GetOpinionById error:', error);
    next(error);
  }
};

exports.createOpinion = async (req, res, next) => {
  try {
    const opinion = await opinionService.createOpinion({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('CreateOpinion error:', error);
    next(error);
  }
};

exports.updateOpinion = async (req, res, next) => {
  try {
    const opinion = await opinionService.updateOpinion(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('UpdateOpinion error:', error);
    next(error);
  }
};

exports.deleteOpinion = async (req, res, next) => {
  try {
    await opinionService.deleteOpinion(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteOpinion error:', error);
    next(error);
  }
};
