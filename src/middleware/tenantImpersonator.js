const { tenantContext } = require('../config/database');
const AppError = require('../utils/AppError');

const tenantImpersonator = (req, res, next) => {
  const targetTenantId = req.query?.targetTenantId || req.body?.targetTenantId;

  if (targetTenantId) {
    if (req.user.role !== 'Super Admin') {
      return next(new AppError('Only Super Admins can impersonate a tenant.', 403));
    }

    const contextData = {
      tenantId: parseInt(targetTenantId, 10),
      isSuperAdmin: true
    };

    return tenantContext.run(contextData, () => next());
  }

  next();
};

module.exports = { tenantImpersonator };
