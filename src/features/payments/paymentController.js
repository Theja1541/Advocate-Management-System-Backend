const paymentService = require('./paymentService');
const logger = require('../../config/logger');

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.status(200).json({
      status: 'success',
      data: { payments },
    });
  } catch (error) {
    logger.error('GetAllPayments error:', error);
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { payment },
    });
  } catch (error) {
    logger.error('GetPaymentById error:', error);
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment({
      ...req.body,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });
    res.status(201).json({
      status: 'success',
      data: { payment },
    });
  } catch (error) {
    logger.error('CreatePayment error:', error);
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id,
    });
    res.status(200).json({
      status: 'success',
      data: { payment },
    });
  } catch (error) {
    logger.error('UpdatePayment error:', error);
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeletePayment error:', error);
    next(error);
  }
};
