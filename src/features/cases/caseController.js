const caseService = require('./caseService');
const logger = require('../../config/logger');
const { requireAdvocateScope } = require('../../utils/advocateScope');

exports.getAllCases = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const cases = await caseService.getAllCases({ advocateId });
    res.status(200).json({
      status: 'success',
      data: { cases },
    });
  } catch (error) {
    logger.error('GetAllCases error:', error);
    next(error);
  }
};

exports.getCaseById = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const caseRecord = await caseService.getCaseById(req.params.id, { advocateId });
    res.status(200).json({
      status: 'success',
      data: { case: caseRecord },
    });
  } catch (error) {
    logger.error('GetCaseById error:', error);
    next(error);
  }
};

exports.createCase = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const caseRecord = await caseService.createCase(req.body, { advocateId, user: req.user });
    res.status(201).json({
      status: 'success',
      data: { case: caseRecord },
    });
  } catch (error) {
    logger.error('CreateCase error:', error);
    next(error);
  }
};

exports.updateCase = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const caseRecord = await caseService.updateCase(req.params.id, req.body, {
      advocateId,
      user: req.user,
    });
    res.status(200).json({
      status: 'success',
      data: { case: caseRecord },
    });
  } catch (error) {
    logger.error('UpdateCase error:', error);
    next(error);
  }
};

exports.deleteCase = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    await caseService.deleteCase(req.params.id, { advocateId });
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteCase error:', error);
    next(error);
  }
};
