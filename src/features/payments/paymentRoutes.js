const express = require('express');
const paymentController = require('./paymentController');
const {
  createPaymentRules,
  updatePaymentRules,
  paymentIdParamRules,
} = require('./paymentValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('pay', 'V'), paymentController.getAllPayments)
  .post(
    authorizePermission('pay', 'E'),
    ...createPaymentRules,
    validate,
    paymentController.createPayment
  );

router
  .route('/:id')
  .get(
    authorizePermission('pay', 'V'),
    ...paymentIdParamRules,
    validate,
    paymentController.getPaymentById
  )
  .put(
    authorizePermission('pay', 'E'),
    ...updatePaymentRules,
    validate,
    paymentController.updatePayment
  )
  .delete(
    authorizePermission('pay', 'E'),
    ...paymentIdParamRules,
    validate,
    paymentController.deletePayment
  );

module.exports = router;
