const { Tenant } = require('../features/associations');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

const checkTenantStatus = async (req, res, next) => {
  try {
    // If Super Admin, bypass tenant status check
    if (req.user && req.user.role === 'Super Admin') {
      return next();
    }

    if (!req.user || !req.user.tenantId) {
      return next(new AppError('Tenant identification missing.', 401));
    }

    const tenant = await Tenant.findByPk(req.user.tenantId, { bypassTenant: true });

    if (!tenant) {
      return next(new AppError('Tenant not found.', 404));
    }

    if (tenant.status === 'suspended') {
      return next(new AppError('Your organization account is suspended. Please contact support.', 403));
    }
    
    if (tenant.status === 'inactive') {
      return next(new AppError('Your organization account is inactive.', 403));
    }

    // Check subscription end date
    if (tenant.subscriptionEnd && new Date() > new Date(tenant.subscriptionEnd)) {
      return next(new AppError('Your organization subscription has expired. Please renew to continue using the system.', 402)); // 402 Payment Required
    }

    next();
  } catch (error) {
    logger.error('Tenant status check error:', error);
    next(new AppError('Internal server error during tenant validation', 500));
  }
};

module.exports = { checkTenantStatus };
