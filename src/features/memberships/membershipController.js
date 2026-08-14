const membershipService = require('./membershipService');
const logger = require('../../config/logger');

exports.getAllMemberships = async (req, res, next) => {
  try {
    const memberships = await membershipService.getAllMemberships(req.user);
    res.status(200).json({
      status: 'success',
      data: { memberships },
    });
  } catch (error) {
    logger.error('GetAllMemberships error:', error);
    next(error);
  }
};


exports.getMembershipById = async (req, res, next) => {
  try {
    const membership = await membershipService.getMembershipById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { membership },
    });
  } catch (error) {
    logger.error('GetMembershipById error:', error);
    next(error);
  }
};

exports.createMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.createMembership({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { membership },
    });
  } catch (error) {
    logger.error('CreateMembership error:', error);
    next(error);
  }
};

exports.updateMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.updateMembership(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { membership },
    });
  } catch (error) {
    logger.error('UpdateMembership error:', error);
    next(error);
  }
};

exports.renewMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.renewMembership(req.params.id, {
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { membership },
    });
  } catch (error) {
    logger.error('RenewMembership error:', error);
    next(error);
  }
};

exports.deleteMembership = async (req, res, next) => {
  try {
    await membershipService.deleteMembership(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteMembership error:', error);
    next(error);
  }
};
