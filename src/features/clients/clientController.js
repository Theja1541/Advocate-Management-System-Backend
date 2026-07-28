const clientService = require('./clientService');
const logger = require('../../config/logger');

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await clientService.getAllClients();
    res.status(200).json({
      status: 'success',
      data: { clients },
    });
  } catch (error) {
    logger.error('GetAllClients error:', error);
    next(error);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { client },
    });
  } catch (error) {
    logger.error('GetClientById error:', error);
    next(error);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const client = await clientService.createClient({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { client },
    });
  } catch (error) {
    logger.error('CreateClient error:', error);
    next(error);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const client = await clientService.updateClient(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { client },
    });
  } catch (error) {
    logger.error('UpdateClient error:', error);
    next(error);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    await clientService.deleteClient(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteClient error:', error);
    next(error);
  }
};
