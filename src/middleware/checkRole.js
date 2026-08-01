const AppError = require('../utils/AppError');

/**
 * Middleware to restrict access based strictly on user roles.
 * Use this when you need role-based access instead of module-based permissions.
 * 
 * @param {...string} allowedRoles - Spread of allowed role strings.
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the 'protect' middleware
    if (!req.user || !req.user.role) {
      return next(new AppError('Forbidden: User role is missing', 403));
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Access Denied: You do not have the required role to perform this action', 403)
      );
    }

    next();
  };
};

module.exports = checkRole;
