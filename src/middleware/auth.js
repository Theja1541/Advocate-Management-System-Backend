const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { tenantContext } = require('../config/database');
const { checkTenantStatus } = require('./tenantStatus');

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

    req.user = {
      id: decoded.id,
      name: decoded.name,
      roleId: decoded.roleId,
      role: decoded.role,
      advocateId: decoded.advocateId ?? null,
      tenantId: decoded.tenantId ?? null,
    };

    const isSuperAdmin = decoded.role === 'Super Admin';
    const contextData = { tenantId: decoded.tenantId, isSuperAdmin };

    tenantContext.run(contextData, () => {
      checkTenantStatus(req, res, next);
    });
  } catch (error) {
    logger.error('JWT Verification Error:', error);
    return next(new AppError('Invalid or expired security token. Please log in again.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied: Insufficient privileges for this operation.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
