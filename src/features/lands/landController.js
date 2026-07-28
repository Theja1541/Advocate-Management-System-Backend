const landService = require('./landService');
const logger = require('../../config/logger');

exports.getAllLands = async (req, res, next) => {
  try {
    const lands = await landService.getAllLands();
    res.status(200).json({
      status: 'success',
      data: { lands },
    });
  } catch (error) {
    logger.error('GetAllLands error:', error);
    next(error);
  }
};

exports.getLandById = async (req, res, next) => {
  try {
    const land = await landService.getLandById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { land },
    });
  } catch (error) {
    logger.error('GetLandById error:', error);
    next(error);
  }
};

exports.createLand = async (req, res, next) => {
  try {
    const land = await landService.createLand({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { land },
    });
  } catch (error) {
    logger.error('CreateLand error:', error);
    next(error);
  }
};

exports.updateLand = async (req, res, next) => {
  try {
    const land = await landService.updateLand(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { land },
    });
  } catch (error) {
    logger.error('UpdateLand error:', error);
    next(error);
  }
};

exports.deleteLand = async (req, res, next) => {
  try {
    await landService.deleteLand(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteLand error:', error);
    next(error);
  }
};
