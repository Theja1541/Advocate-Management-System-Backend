const opinionService = require('./opinionService');
const logger = require('../../config/logger');

exports.getAllOpinions = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const opinions = await opinionService.getAllOpinions(tenantId, req.user);
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
    const tenantId = req.user?.tenantId;
    const opinion = await opinionService.getOpinionById(req.params.id, tenantId);
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
    const tenantId = req.user?.tenantId;
    const opinion = await opinionService.createOpinion({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      tenantId,
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
    const tenantId = req.user?.tenantId;
    const opinion = await opinionService.updateOpinion(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    }, tenantId);
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
    const tenantId = req.user?.tenantId;
    await opinionService.deleteOpinion(req.params.id, tenantId);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteOpinion error:', error);
    next(error);
  }
};

// Workflow transitions
exports.submitForReview = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const opinion = await opinionService.submitForReview(req.params.id, tenantId);
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('SubmitForReview error:', error);
    next(error);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const approvedBy = req.user?.id; // Authenticated user approving it
    const opinion = await opinionService.approve(req.params.id, approvedBy, tenantId);
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('ApproveOpinion error:', error);
    next(error);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const { rejectReason } = req.body;
    const opinion = await opinionService.reject(req.params.id, rejectReason, tenantId);
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('RejectOpinion error:', error);
    next(error);
  }
};

exports.issue = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const issuedBy = req.user?.id; // Authenticated user issuing it
    const opinion = await opinionService.issue(req.params.id, issuedBy, tenantId);
    res.status(200).json({
      status: 'success',
      data: { opinion },
    });
  } catch (error) {
    logger.error('IssueOpinion error:', error);
    next(error);
  }
};
