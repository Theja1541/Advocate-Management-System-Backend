const groupAdminService = require('./groupAdminService');
const logger = require('../../config/logger');

exports.createGroupAdmin = async (req, res, next) => {
  try {
    const groupAdmin = await groupAdminService.createGroupAdmin(req.body, req.user);
    res.status(201).json({
      status: 'success',
      data: { groupAdmin },
    });
  } catch (error) {
    logger.error('CreateGroupAdmin error:', error);
    next(error);
  }
};

exports.getGroupAdmins = async (req, res, next) => {
  try {
    const groupAdmins = await groupAdminService.getGroupAdmins(req.user, req.query.tenantId);
    res.status(200).json({
      status: 'success',
      data: { groupAdmins },
    });
  } catch (error) {
    logger.error('GetGroupAdmins error:', error);
    next(error);
  }
};

exports.getGroupAdminById = async (req, res, next) => {
  try {
    const groupAdmin = await groupAdminService.getGroupAdminById(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { groupAdmin },
    });
  } catch (error) {
    logger.error('GetGroupAdminById error:', error);
    next(error);
  }
};

exports.updateGroupAdmin = async (req, res, next) => {
  try {
    const groupAdmin = await groupAdminService.updateGroupAdmin(req.params.id, req.body, req.user);
    res.status(200).json({
      status: 'success',
      data: { groupAdmin },
    });
  } catch (error) {
    logger.error('UpdateGroupAdmin error:', error);
    next(error);
  }
};

exports.assignAdvocate = async (req, res, next) => {
  try {
    const { id, advocateId } = req.params;
    const result = await groupAdminService.assignAdvocateToGroupAdmin(id, advocateId, req.user);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    logger.error('AssignAdvocate error:', error);
    next(error);
  }
};

exports.removeAdvocate = async (req, res, next) => {
  try {
    const { id, advocateId } = req.params;
    const result = await groupAdminService.removeAdvocateFromGroupAdmin(id, advocateId, req.user);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    logger.error('RemoveAdvocate error:', error);
    next(error);
  }
};

exports.getAssignedAdvocates = async (req, res, next) => {
  try {
    const advocates = await groupAdminService.getAssignedAdvocates(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { advocates },
    });
  } catch (error) {
    logger.error('GetAssignedAdvocates error:', error);
    next(error);
  }
};
