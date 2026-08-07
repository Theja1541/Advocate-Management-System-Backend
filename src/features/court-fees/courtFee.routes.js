const express = require('express');
const router = express.Router();
const courtFeeController = require('./courtFee.controller');

// Calculate statutory court fee
router.post('/calculate', courtFeeController.calculate);

module.exports = router;
