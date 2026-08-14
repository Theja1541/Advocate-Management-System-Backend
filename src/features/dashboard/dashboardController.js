const dashboardService = require('./dashboardService');
const { requireAdvocateScope } = require('../../utils/advocateScope');
const logger = require('../../config/logger');

exports.getDashboard = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const dashboard = await dashboardService.getDashboard({ advocateId }, req.user);

    res.status(200).json({
      status: 'success',
      data: { dashboard },
    });
  } catch (error) {
    logger.error('GetDashboard error:', error);
    next(error);
  }
};

