const express = require('express');
const dashboardController = require('./dashboardController');
const { protect } = require('../../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(dashboardController.getDashboard);

module.exports = router;
