const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { tenantContext } = require('../config/database');
const { checkTenantStatus } = require('./tenantStatus');
const { normalizeRole, isSuperAdmin } = require('../utils/roleHelper');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please sign in to access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

    // Access tokens must carry both role id and role name for authorization middleware
    if (!decoded?.id || decoded.roleId == null || !decoded.role) {
      return next(new AppError('Invalid security token payload. Please log in again.', 401));
    }

    const normalizedRole = normalizeRole(decoded.role);

    req.user = {
      id: decoded.id,
      name: decoded.name,
      roleId: decoded.roleId,
      role: normalizedRole,
      rawRole: decoded.role,
      advocateId: decoded.advocateId ?? null,
      tenantId: decoded.tenantId ?? null,
    };

    const superAdminFlag = isSuperAdmin(normalizedRole);
    const contextData = { tenantId: decoded.tenantId, isSuperAdmin: superAdminFlag };

    tenantContext.run(contextData, () => {
      checkTenantStatus(req, res, (err) => {
        if (err) return next(err);
        const { validateAdminContext } = require('./contextValidator');
        validateAdminContext(req, res, next);
      });
    });
  } catch (error) {
    logger.error('JWT Verification Error:', error);
    return next(new AppError('Invalid or expired security token. Please log in again.', 401));
  }
};

const restrictTo = (...roles) => {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!allowed.includes(normalizeRole(req.user?.role))) {
      return next(new AppError('Access denied: Insufficient privileges for this operation.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };

